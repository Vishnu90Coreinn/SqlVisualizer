import dagre from 'dagre';
import type { RelationshipGraph } from '../sql/types';

export const REL_NODE_WIDTH = 248;
const HEADER_HEIGHT = 44;
const ROW_HEIGHT = 24;
const FOOTER_PAD = 14;

export function relNodeHeight(columnCount: number): number {
  return HEADER_HEIGHT + Math.max(columnCount, 1) * ROW_HEIGHT + FOOTER_PAD;
}

export function layoutRelationshipGraph(graph: RelationshipGraph) {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'LR', nodesep: 56, ranksep: 110, marginx: 40, marginy: 40 });
  g.setDefaultEdgeLabel(() => ({}));

  for (const node of graph.nodes) {
    g.setNode(node.id, {
      width: REL_NODE_WIDTH,
      height: relNodeHeight(node.columns.length),
    });
  }
  for (const edge of graph.edges) {
    if (graph.nodes.some((n) => n.id === edge.source) && graph.nodes.some((n) => n.id === edge.target)) {
      g.setEdge(edge.source, edge.target);
    }
  }

  dagre.layout(g);

  const positions = new Map<string, { x: number; y: number; width: number; height: number }>();
  let maxX = 0;
  let maxY = 0;
  g.nodes().forEach((id) => {
    const n = g.node(id);
    const x = n.x - n.width / 2;
    const y = n.y - n.height / 2;
    positions.set(id, { x, y, width: n.width, height: n.height });
    maxX = Math.max(maxX, x + n.width);
    maxY = Math.max(maxY, y + n.height);
  });

  return { positions, width: maxX + 40, height: maxY + 40 };
}
