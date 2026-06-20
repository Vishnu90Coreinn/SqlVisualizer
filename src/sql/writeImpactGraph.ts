import type { RelationshipGraph, RelNode, RelEdge } from './types';
import { uid, resetUidCounter, fromEntryName, exprToSql } from './astHelpers';

function makeNode(id: string, label: string, kind: RelNode['kind'], depth: number): RelNode {
  return { id, kind, label, columns: [], depth };
}

function extractWrittenColumns(ast: any): string[] {
  if (ast.type === 'insert' && Array.isArray(ast.columns)) {
    return ast.columns.map((c: any) => (typeof c === 'string' ? c : (c?.column ?? String(c))));
  }
  if (ast.type === 'update' && Array.isArray(ast.set)) {
    return ast.set.map((s: any) => s.column ?? s.table_column ?? '').filter(Boolean);
  }
  return [];
}

export function buildWriteImpactGraph(ast: any, database: string): RelationshipGraph {
  resetUidCounter();
  const nodes = new Map<string, RelNode>();
  const edges: RelEdge[] = [];

  const targetName: string =
    ast.table?.[0]?.table ??
    ast.into?.table ??
    (typeof ast.table === 'string' ? ast.table : null) ??
    'target';

  const targetId = uid('wt');
  const targetNode = makeNode(targetId, targetName, 'write-target', 0);

  const writtenCols = extractWrittenColumns(ast);
  for (const col of writtenCols) {
    targetNode.columns.push({ name: col, roles: new Set(['select' as const]) });
  }
  nodes.set(targetId, targetNode);

  const fromList: any[] = ast.from ?? [];
  for (const entry of fromList) {
    const tname = fromEntryName(entry);
    if (!tname || tname.toLowerCase() === targetName.toLowerCase()) continue;
    const srcId = uid('src');
    const srcNode = makeNode(srcId, tname, 'table', 1);
    nodes.set(srcId, srcNode);
    edges.push({
      id: uid('edge'),
      source: srcId,
      target: targetId,
      kind: 'from',
      label: entry.join ?? 'FROM',
      condition: entry.on ? exprToSql(entry.on, database) : undefined,
    });
  }

  if (ast.where) {
    const whereStr = exprToSql(ast.where, database);
    if (whereStr) {
      targetNode.columns.push({
        name: `WHERE: ${whereStr.slice(0, 50)}`,
        roles: new Set(['filter' as const]),
      });
    }
  }

  return { nodes: [...nodes.values()], edges };
}
