import dagre from 'dagre';
import type { SchemaGraph } from '../sql/types';

export const SCHEMA_NODE_WIDTH = 280;
const SCHEMA_HEADER_HEIGHT = 40;
const SCHEMA_ROW_HEIGHT = 22;
const SCHEMA_FOOTER_PAD = 16;

export function schemaNodeHeight(columnCount: number, hasCompositePK = false): number {
  const footerExtra = hasCompositePK ? 32 : 0;
  return SCHEMA_HEADER_HEIGHT + Math.max(columnCount, 1) * SCHEMA_ROW_HEIGHT + SCHEMA_FOOTER_PAD + footerExtra;
}

export function layoutSchemaGraph(graph: SchemaGraph) {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'LR', nodesep: 64, ranksep: 140, marginx: 48, marginy: 48 });
  g.setDefaultEdgeLabel(() => ({}));

  for (const node of graph.nodes) {
    g.setNode(node.id, {
      width: SCHEMA_NODE_WIDTH,
      height: schemaNodeHeight(node.columns.length, node.compositePK != null),
    });
  }

  const nodeIds = new Set(graph.nodes.map((n) => n.id));
  for (const edge of graph.edges) {
    if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
      g.setEdge(edge.source, edge.target);
    }
  }

  dagre.layout(g);

  const positions = new Map<string, { x: number; y: number }>();
  g.nodes().forEach((id) => {
    const n = g.node(id);
    positions.set(id, { x: n.x - n.width / 2, y: n.y - n.height / 2 });
  });

  return { positions };
}
