import { parser } from './astHelpers';
import { buildRelationshipGraph } from './relationshipGraph';
import { buildFlowGraph } from './flowGraph';
import type { ParseResult } from './types';

export function parseSql(sql: string, database: string): ParseResult {
  const trimmed = sql.trim();
  if (!trimmed) {
    return { ok: false, error: 'Paste a SQL query to get started.' };
  }

  let ast: any;
  try {
    ast = parser.astify(trimmed, { database } as any);
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

  if (!statement || statement.type !== 'select') {
    return {
      ok: false,
      error: 'Only SELECT statements (including CTEs and subqueries) can be visualized right now.',
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
