import type { FlowGraph, FlowNode } from '../sql/types';

export const FLOW_NODE_WIDTH = 240;
const X_SPACING = 296;
const LANE_HEIGHT = 190;

export function layoutFlowGraph(graph: FlowGraph) {
  const positions = new Map<string, { x: number; y: number }>();
  const laneIndex = new Map(graph.lanes.map((l, i) => [l, i]));

  const byLane = new Map<string, FlowNode[]>();
  for (const n of graph.nodes) {
    if (!byLane.has(n.lane)) byLane.set(n.lane, []);
    byLane.get(n.lane)!.push(n);
  }

  for (const [lane, list] of byLane) {
    list.sort((a, b) => a.order - b.order);
    const y = (laneIndex.get(lane) ?? 0) * LANE_HEIGHT;
    list.forEach((n, idx) => {
      positions.set(n.id, { x: idx * X_SPACING, y });
    });
  }

  let maxX = 0;
  positions.forEach((p) => {
    maxX = Math.max(maxX, p.x);
  });
  const maxY = Math.max(graph.lanes.length - 1, 0) * LANE_HEIGHT;

  return {
    positions,
    width: maxX + FLOW_NODE_WIDTH + 100,
    height: maxY + 160,
    laneIndex,
    laneHeight: LANE_HEIGHT,
  };
}
