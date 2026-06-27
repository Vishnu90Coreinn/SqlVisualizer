import { parser } from './astHelpers';
import { buildRelationshipGraph } from './relationshipGraph';
import { buildFlowGraph } from './flowGraph';
import { buildWriteImpactGraph } from './writeImpactGraph';
import type { ParseResult } from './types';

/**
 * Strip T-SQL syntax that node-sql-parser can't handle but is semantically
 * irrelevant for visualization (hints, bare NULL aliases, etc.).
 */
function preprocessSql(sql: string): string {
  return sql
    // Remove table hints: WITH(NOLOCK), WITH (READUNCOMMITTED), etc.
    .replace(/\bWITH\s*\(\s*\w+(?:\s*,\s*\w+)*\s*\)/gi, '')
    // Normalize bare NULL alias: `NULL ColumnName` → `NULL AS ColumnName`
    .replace(/\bNULL\s+(?!AS\b)([A-Za-z_]\w*)/g, 'NULL AS $1');
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
