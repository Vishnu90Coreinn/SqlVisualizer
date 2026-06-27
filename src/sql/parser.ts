import { parser } from './astHelpers';
import { buildRelationshipGraph } from './relationshipGraph';
import { buildFlowGraph } from './flowGraph';
import { buildWriteImpactGraph } from './writeImpactGraph';
import type { ParseResult } from './types';

const SQL_KEYWORDS = new Set([
  'AS','FROM','WHERE','AND','OR','ON','IN','NOT','IS','THEN','ELSE','END','WHEN','CASE',
  'JOIN','LEFT','RIGHT','INNER','OUTER','CROSS','FULL','GROUP','ORDER','BY','HAVING',
  'UNION','ALL','DISTINCT','SELECT','INTO','SET','VALUES','UPDATE','DELETE','INSERT',
  'DESC','ASC','LIMIT','OFFSET','TOP','FETCH','NEXT','ROWS','ONLY','WITH','OVER',
  'PARTITION','ROW_NUMBER','RANK','DENSE_RANK','DAY','MONTH','YEAR','HOUR','MINUTE',
  'SECOND','GETDATE','DATEADD','DATEDIFF','BETWEEN','LIKE','EXISTS','NULL','TRUE','FALSE',
]);

/**
 * Strip T-SQL syntax that node-sql-parser can't handle but is semantically
 * irrelevant for visualization: table hints, bare aliases (no AS keyword).
 */
function preprocessSql(sql: string): string {
  return sql
    // Remove table hints: WITH(NOLOCK), WITH (READUNCOMMITTED), etc.
    .replace(/\bWITH\s*\(\s*\w+(?:\s*,\s*\w+)*\s*\)/gi, '')
    // Bare alias after NULL: `NULL ColName` → `NULL AS ColName`
    .replace(/\bNULL\s+(?!AS\s)([A-Za-z_]\w*)/gi, (_, alias) =>
      SQL_KEYWORDS.has(alias.toUpperCase()) ? `NULL ${alias}` : `NULL AS ${alias}`
    )
    // Bare alias after string literal: `'...' ColName` → `'...' AS ColName`
    .replace(/'([^']*)'\s+([A-Za-z_]\w*)/g, (match, str, alias) =>
      SQL_KEYWORDS.has(alias.toUpperCase()) ? match : `'${str}' AS ${alias}`
    )
    // Bare alias after integer (e.g. `90000413 FieldLibraryID`, `1 FieldTypeId`)
    .replace(/\b(\d+)\s+([A-Za-z_]\w*)/g, (match, num, alias) =>
      SQL_KEYWORDS.has(alias.toUpperCase()) ? match : `${num} AS ${alias}`
    )
    // Bare alias after column ref: `tbl.col Alias` → `tbl.col AS Alias`
    .replace(/\b(\w+\.\w+)\s+([A-Za-z_]\w*)/g, (match, col, alias) =>
      SQL_KEYWORDS.has(alias.toUpperCase()) ? match : `${col} AS ${alias}`
    )
    // Bare alias after closing paren: `) Alias` → `) AS Alias` (e.g. window func result)
    .replace(/\)\s+([A-Za-z_]\w*)/g, (match, alias) =>
      SQL_KEYWORDS.has(alias.toUpperCase()) ? match : `) AS ${alias}`
    );
}

export function parseSql(sql: string, database: string): ParseResult {
  const trimmed = sql.trim();
  if (!trimmed) {
    return { ok: false, error: 'Paste a SQL query to get started.' };
  }

  const preprocessed = preprocessSql(trimmed);

  let ast: any;
  try {
    ast = parser.astify(preprocessed, { database } as any);
  } catch (e: any) {
    const message: string = e?.message || 'Could not parse this SQL.';
    const lineMatch = message.match(/line (\d+)/i);
    const colMatch = message.match(/column (\d+)/i);
    return {
      ok: false,
      error: cleanErrorMessage(message),
      errorPosition: lineMatch && colMatch ? { line: Number(lineMatch[1]), column: Number(colMatch[1]) } : undefined,
    };
  }

  const statement = Array.isArray(ast) ? ast[0] : ast;

  if (!statement) {
    return { ok: false, error: 'Could not parse this SQL.' };
  }

  if (statement.type !== 'select') {
    const dmlTypes = ['insert', 'update', 'delete'];
    if (dmlTypes.includes(statement.type)) {
      try {
        const relationship = buildWriteImpactGraph(statement, database);
        return { ok: true, relationship };
      } catch (e: any) {
        return {
          ok: false,
          error: `Parsed ${statement.type.toUpperCase()}, but failed to build diagram: ${e?.message ?? 'unknown error'}`,
        };
      }
    }
    return {
      ok: false,
      error: 'Only SELECT, INSERT, UPDATE, and DELETE statements can be visualized right now.',
    };
  }

  try {
    const relationship = buildRelationshipGraph(statement, database);
    const flow = buildFlowGraph(statement, database);
    return { ok: true, relationship, flow };
  } catch (e: any) {
    return { ok: false, error: `Parsed the SQL, but failed to build the diagram: ${e?.message || 'unknown error'}` };
  }
}

function cleanErrorMessage(message: string): string {
  return message.split('\n')[0].replace(/^Expected\s+/, 'Expected ');
}

export function parseMultiStatement(sql: string, database: string): ParseResult[] {
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (statements.length <= 1) {
    return [parseSql(sql, database)];
  }

  return statements.map((stmt) => parseSql(stmt + ';', database));
}
