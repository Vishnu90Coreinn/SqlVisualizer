import { parser } from './astHelpers';

export interface DDLColumn {
  name: string;
  dataType: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isNotNull: boolean;
  isUnique: boolean;
  isIndexed: boolean;
  references?: { table: string; column: string };
}

export interface DDLTable {
  name: string;
  columns: DDLColumn[];
  compositePK?: string[];
  foreignKeys: { columns: string[]; refTable: string; refColumns: string[] }[];
}

export interface DDLParseResult {
  tables: Map<string, DDLTable>;
  indexedColumns: Map<string, Set<string>>;
  errors: string[];
}

function extractTableName(entry: any): string | null {
  if (typeof entry?.table === 'string') return entry.table;
  if (typeof entry?.table?.table === 'string') return entry.table.table;
  return null;
}

function extractColumnName(col: any): string | null {
  if (typeof col?.column === 'string') return col.column;
  if (typeof col?.column?.column === 'string') return col.column.column;
  if (typeof col?.column?.expr?.value === 'string') return col.column.expr.value;
  return null;
}

function extractDataType(def: any): string {
  if (!def) return '';
  const base = (def.dataType ?? def.data_type ?? '').toUpperCase();
  const len = def.length ?? def.expr?.value;
  return len !== undefined && len !== null ? `${base}(${len})` : base;
}

function applyIndexedColumns(result: DDLParseResult): void {
  for (const [tableName, colSet] of result.indexedColumns) {
    const table = result.tables.get(tableName.toLowerCase());
    if (!table) continue;
    for (const col of table.columns) {
      if (colSet.has(col.name.toLowerCase())) col.isIndexed = true;
    }
  }
}

function parseCreateTable(ast: any, result: DDLParseResult): void {
  const rawName = ast.table?.[0];
  const tableName = extractTableName(rawName) ?? rawName?.table;
  if (!tableName || typeof tableName !== 'string') return;

  const table: DDLTable = { name: tableName, columns: [], foreignKeys: [] };
  const pkColumns = new Set<string>();
  const defs: any[] = ast.create_definitions ?? ast.columns ?? [];

  for (const def of defs) {
    const ctype = def.constraint_type ?? def.constraint;

    if (ctype === 'PRIMARY KEY') {
      const cols = (def.definition ?? def.columns ?? [])
        .map((c: any) => extractColumnName(c) ?? c?.column)
        .filter((c: any): c is string => typeof c === 'string');
      cols.forEach((c: string) => pkColumns.add(c.toLowerCase()));
      if (cols.length > 1) table.compositePK = cols;
      continue;
    }

    if (ctype === 'FOREIGN KEY' || ctype === 'foreign key') {
      const fkCols = (def.definition ?? def.columns ?? [])
        .map((c: any) => extractColumnName(c) ?? c?.column)
        .filter((c: any): c is string => typeof c === 'string');
      const refDef = def.reference_definition ?? def.references;
      const refTable = extractTableName(refDef?.table?.[0]) ?? refDef?.table?.[0]?.table;
      const refCols = (refDef?.columns ?? [])
        .map((c: any) => extractColumnName(c) ?? c?.column)
        .filter((c: any): c is string => typeof c === 'string');
      if (fkCols.length && typeof refTable === 'string') {
        table.foreignKeys.push({ columns: fkCols, refTable, refColumns: refCols });
      }
      continue;
    }

    const colName = extractColumnName(def.column) ?? def.column?.column;
    if (!colName || typeof colName !== 'string') continue;

    const isPK = !!(def.primary_key || def.primary_key_token);
    const nullableType: string = def.nullable?.type ?? '';
    const isNotNull = isPK || nullableType.toLowerCase().includes('not null');
    const isUnique = !!(def.unique || def.unique_or_primary === 'unique');
    const dataType = extractDataType(def.definition ?? def.data_type_obj);

    let references: DDLColumn['references'];
    const refDef = def.reference_definition ?? def.references;
    if (refDef) {
      const refTable = extractTableName(refDef.table?.[0]) ?? refDef.table?.[0]?.table;
      const refCol = extractColumnName(refDef.columns?.[0]) ?? refDef.columns?.[0]?.column;
      if (typeof refTable === 'string') {
        references = { table: refTable, column: typeof refCol === 'string' ? refCol : 'id' };
      }
    }

    if (isPK) pkColumns.add(colName.toLowerCase());

    table.columns.push({
      name: colName,
      dataType,
      isPrimaryKey: isPK,
      isForeignKey: !!references,
      isNotNull,
      isUnique,
      isIndexed: false,
      references,
    });
  }

  for (const col of table.columns) {
    if (pkColumns.has(col.name.toLowerCase())) col.isPrimaryKey = true;
  }

  for (const fk of table.foreignKeys) {
    for (const fkColName of fk.columns) {
      const col = table.columns.find((c) => c.name.toLowerCase() === fkColName.toLowerCase());
      if (col) {
        col.isForeignKey = true;
        if (!col.references) {
          col.references = { table: fk.refTable, column: fk.refColumns[0] ?? 'id' };
        }
      }
    }
  }

  result.tables.set(tableName.toLowerCase(), table);
}

function parseCreateIndex(ast: any, result: DDLParseResult): void {
  const tableName = extractTableName(ast.on) ?? ast.on?.table;
  if (!tableName || typeof tableName !== 'string') return;
  const cols = (ast.definition ?? ast.columns ?? [])
    .map((c: any) => extractColumnName(c) ?? c?.column)
    .filter((c: any): c is string => typeof c === 'string');
  const key = tableName.toLowerCase();
  if (!result.indexedColumns.has(key)) result.indexedColumns.set(key, new Set());
  cols.forEach((c: string) => result.indexedColumns.get(key)!.add(c.toLowerCase()));
}

function parseAlterTable(ast: any, result: DDLParseResult): void {
  const tableName = extractTableName(ast.table?.[0]) ?? ast.table?.[0]?.table;
  if (!tableName || typeof tableName !== 'string') return;
  const table = result.tables.get(tableName.toLowerCase());
  if (!table) return;

  const exprs: any[] = ast.expr ?? [];
  for (const expr of exprs) {
    const constraint = expr.constraint ?? expr.add ?? expr;
    const ctype = constraint?.constraint_type ?? constraint?.constraint;
    if (ctype === 'FOREIGN KEY' || ctype === 'foreign key') {
      const fkCols = (constraint.definition ?? constraint.columns ?? [])
        .map((c: any) => extractColumnName(c) ?? c?.column)
        .filter((c: any): c is string => typeof c === 'string');
      const refDef = constraint.reference_definition ?? constraint.references;
      const refTable = extractTableName(refDef?.table?.[0]) ?? refDef?.table?.[0]?.table;
      const refCols = (refDef?.columns ?? [])
        .map((c: any) => extractColumnName(c) ?? c?.column)
        .filter((c: any): c is string => typeof c === 'string');
      if (fkCols.length && typeof refTable === 'string') {
        table.foreignKeys.push({ columns: fkCols, refTable, refColumns: refCols });
        for (const fkColName of fkCols) {
          const col = table.columns.find((c) => c.name.toLowerCase() === fkColName.toLowerCase());
          if (col) {
            col.isForeignKey = true;
            if (!col.references) col.references = { table: refTable, column: refCols[0] ?? 'id' };
          }
        }
      }
    }
  }
}

export function parseDDL(ddlSql: string, database: string): DDLParseResult {
  const result: DDLParseResult = { tables: new Map(), indexedColumns: new Map(), errors: [] };

  let stmts: any[];
  try {
    const ast = parser.astify(ddlSql.trim(), { database } as any);
    stmts = Array.isArray(ast) ? ast : [ast];
  } catch (e: any) {
    result.errors.push(e?.message?.split('\n')[0] ?? 'Could not parse DDL.');
    return result;
  }

  for (const stmt of stmts) {
    if (!stmt) continue;
    if (stmt.type === 'create') {
      if (stmt.keyword === 'table') parseCreateTable(stmt, result);
      else if (stmt.keyword === 'index') parseCreateIndex(stmt, result);
    } else if (stmt.type === 'alter') {
      parseAlterTable(stmt, result);
    }
  }

  applyIndexedColumns(result);
  return result;
}
