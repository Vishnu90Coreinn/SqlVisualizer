import type { DDLParseResult } from './ddlParser';
import type { SchemaGraph, SchemaNode, SchemaEdge, SchemaNodeRole } from './types';
import { uid, resetUidCounter } from './astHelpers';

export function buildSchemaGraph(ddl: DDLParseResult): SchemaGraph {
  resetUidCounter();
  const nodes: SchemaNode[] = [];
  const edges: SchemaEdge[] = [];
  const tableToId = new Map<string, string>();

  const parentTableKeys = new Set<string>();
  const fkOutCount = new Map<string, number>();

  for (const table of ddl.tables.values()) {
    for (const fk of table.foreignKeys) {
      parentTableKeys.add(fk.refTable.toLowerCase());
      const key = table.name.toLowerCase();
      fkOutCount.set(key, (fkOutCount.get(key) ?? 0) + 1);
    }
  }

  for (const table of ddl.tables.values()) {
    const id = uid('schema');
    tableToId.set(table.name.toLowerCase(), id);

    const isParent = parentTableKeys.has(table.name.toLowerCase());
    const outboundFKCount = fkOutCount.get(table.name.toLowerCase()) ?? 0;
    const role: SchemaNodeRole =
      outboundFKCount >= 2 ? 'junction' : isParent ? 'parent' : 'standalone';

    nodes.push({
      id,
      tableName: table.name,
      columns: table.columns.map((c) => ({ ...c })),
      compositePK: table.compositePK,
      role,
    });
  }

  for (const table of ddl.tables.values()) {
    const sourceId = tableToId.get(table.name.toLowerCase());
    if (!sourceId) continue;
    for (const fk of table.foreignKeys) {
      const targetId = tableToId.get(fk.refTable.toLowerCase());
      if (!targetId || targetId === sourceId) continue;
      const srcCol = fk.columns[0] ?? '';
      const tgtCol = fk.refColumns[0] ?? 'id';
      edges.push({
        id: uid('sedge'),
        source: sourceId,
        target: targetId,
        sourceColumn: srcCol,
        targetColumn: tgtCol,
        label: `${srcCol} → ${tgtCol}`,
      });
    }
  }

  return { nodes, edges };
}
