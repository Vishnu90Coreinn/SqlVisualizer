import { useMemo } from 'react';
import { ReactFlow, Background, Controls, MiniMap, BackgroundVariant, MarkerType, type Node, type Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { ParseResult } from '../sql/types';
import { layoutRelationshipGraph } from '../layout/dagreLayout';
import { layoutFlowGraph } from '../layout/flowLayout';
import { EDGE_COLOR, STAGE_COLOR, KIND_COLOR } from '../lib/theme';
import RelationNode from './nodes/RelationNode';
import StageNode from './nodes/StageNode';
import LaneLabelNode from './nodes/LaneLabelNode';

export type ViewMode = 'relationship' | 'flow';

const nodeTypes = { relation: RelationNode, stage: StageNode, laneLabel: LaneLabelNode };

export default function DiagramCanvas({ result, view }: { result: ParseResult; view: ViewMode }) {
  const { nodes, edges } = useMemo(() => buildGraph(result, view), [result, view]);

  if (nodes.length === 0) {
    return null;
  }

  return (
    <ReactFlow
      key={view}
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.18, maxZoom: 1.1 }}
      minZoom={0.15}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
      defaultEdgeOptions={{ type: 'smoothstep' }}
    >
      <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="#1c2436" />
      <Controls showInteractive={false} />
      <MiniMap
        pannable
        zoomable
        maskColor="rgba(9,12,18,0.75)"
        nodeColor={(n: Node) => {
          const data = n.data as any;
          return n.type === 'relation' ? KIND_COLOR[data.kind as keyof typeof KIND_COLOR] : STAGE_COLOR[data.kind as keyof typeof STAGE_COLOR] || '#3a4560';
        }}
      />
    </ReactFlow>
  );
}

function buildGraph(result: ParseResult, view: ViewMode): { nodes: Node[]; edges: Edge[] } {
  if (!result.ok) return { nodes: [], edges: [] };

  if (view === 'relationship' && result.relationship) {
    const graph = result.relationship;
    const { positions } = layoutRelationshipGraph(graph);

    const nodes: Node[] = graph.nodes.map((n) => ({
      id: n.id,
      type: 'relation',
      position: positions.get(n.id) ?? { x: 0, y: 0 },
      data: n as any,
      draggable: true,
    }));

    const edges: Edge[] = graph.edges.map((e) => {
      const color = EDGE_COLOR[e.kind];
      const isLineage = e.kind === 'from';
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        label: isLineage ? undefined : e.label,
        labelStyle: { fill: color, fontSize: 9.5, fontWeight: 700, fontFamily: 'var(--font-mono)' },
        labelBgStyle: { fill: '#0f1420', fillOpacity: 0.9 },
        labelBgPadding: [4, 2] as [number, number],
        style: { stroke: color, strokeWidth: isLineage ? 1.25 : 1.75, strokeDasharray: isLineage ? '3 3' : undefined },
        markerEnd: { type: MarkerType.ArrowClosed, color, width: 14, height: 14 },
      };
    });

    return { nodes, edges };
  }

  if (view === 'flow' && result.flow) {
    const graph = result.flow;
    const { positions, laneIndex, laneHeight } = layoutFlowGraph(graph);

    const stageNodes: Node[] = graph.nodes.map((n) => ({
      id: n.id,
      type: 'stage',
      position: positions.get(n.id) ?? { x: 0, y: 0 },
      data: n as any,
      draggable: true,
    }));

    const laneLabelNodes: Node[] = graph.lanes.map((lane) => ({
      id: `lane_${lane}`,
      type: 'laneLabel',
      position: { x: -190, y: (laneIndex.get(lane) ?? 0) * laneHeight + 18 },
      data: { label: lane, isMain: lane === 'main' },
      draggable: false,
      selectable: false,
    }));

    const edges: Edge[] = graph.edges.map((e) => {
      const sourceNode = graph.nodes.find((n) => n.id === e.source);
      const color = e.isReference ? '#f0a93f' : sourceNode ? STAGE_COLOR[sourceNode.kind] : '#5a6480';
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.isReference ? 'bottom' : 'right',
        targetHandle: e.isReference ? 'top' : 'left',
        label: e.label,
        labelStyle: { fill: color, fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-mono)' },
        labelBgStyle: { fill: '#0f1420', fillOpacity: 0.9 },
        labelBgPadding: [4, 2] as [number, number],
        style: { stroke: color, strokeWidth: e.isReference ? 1.5 : 1.5, strokeDasharray: e.isReference ? '4 3' : undefined },
        markerEnd: { type: MarkerType.ArrowClosed, color, width: 13, height: 13 },
      };
    });

    return { nodes: [...laneLabelNodes, ...stageNodes], edges };
  }

  return { nodes: [], edges: [] };
}
