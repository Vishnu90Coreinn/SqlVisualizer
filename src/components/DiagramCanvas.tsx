import { useMemo, forwardRef, useImperativeHandle, useRef, useState, useCallback, useEffect } from 'react';
import {
  ReactFlow, Background, Controls, MiniMap, BackgroundVariant,
  MarkerType, type Node, type Edge, type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { ParseResult } from '../sql/types';
import { layoutRelationshipGraph } from '../layout/dagreLayout';
import { layoutFlowGraph } from '../layout/flowLayout';
import { EDGE_COLOR, STAGE_COLOR, KIND_COLOR, SCHEMA_NODE_ROLE_COLOR, FK_EDGE_COLOR, JOIN_TYPE_COLOR } from '../lib/theme';
import RelationNode from './nodes/RelationNode';
import StageNode from './nodes/StageNode';
import LaneLabelNode from './nodes/LaneLabelNode';
import SchemaNodeComponent from './nodes/SchemaNode';
import { exportDiagramAsPng, exportDiagramAsSvg, exportDiagramAsCard } from '../lib/exportPng';
import { layoutSchemaGraph } from '../layout/schemaLayout';
import { getCostColor, type ExplainResult } from '../lib/explainParser';

export type ViewMode = 'relationship' | 'flow' | 'schema';

const nodeTypes = { relation: RelationNode, stage: StageNode, laneLabel: LaneLabelNode, schemaNode: SchemaNodeComponent };

export interface DiagramCanvasHandle {
  fitView: () => void;
  exportPng: () => Promise<void>;
  exportSvg: () => Promise<void>;
  exportCard: (sql: string, mode: 'query' | 'schema') => Promise<void>;
  startAnimation: () => void;
  stopAnimation: () => void;
}

const DiagramCanvas = forwardRef<DiagramCanvasHandle, { result: ParseResult; view: ViewMode; onNodeClick?: (nodeId: string, nodeData: any) => void; explainResult?: ExplainResult | null }>(
  ({ result, view, onNodeClick, explainResult }, ref) => {
    const [collapsedLanes, setCollapsedLanes] = useState<Set<string>>(new Set());
    const [isAnimating, setIsAnimating] = useState(false);
    const [activeStageId, setActiveStageId] = useState<string | null>(null);
    const animationRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const rfInstance = useRef<ReactFlowInstance | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Reset collapsed state when the parsed result changes (new query)
    useEffect(() => {
      setCollapsedLanes(new Set());
    }, [result]);

    const toggleLane = useCallback((lane: string) => {
      setCollapsedLanes((prev) => {
        const next = new Set(prev);
        if (next.has(lane)) next.delete(lane);
        else next.add(lane);
        return next;
      });
    }, []);

    const { nodes, edges } = useMemo(
      () => buildGraph(result, view, collapsedLanes, toggleLane),
      [result, view, collapsedLanes, toggleLane]
    );

    // Reset animation when result or view changes
    useEffect(() => {
      setIsAnimating(false);
      setActiveStageId(null);
      if (animationRef.current) clearTimeout(animationRef.current);
    }, [result, view]);

    // Step through flow nodes in execution order while animating
    useEffect(() => {
      if (!isAnimating || view !== 'flow') return;

      const flowNodes = nodes
        .filter((n) => n.type === 'stage')
        .sort((a, b) => ((a.data as any).order ?? 0) - ((b.data as any).order ?? 0));

      if (flowNodes.length === 0) return;

      let idx = 0;
      function step() {
        if (idx >= flowNodes.length) {
          idx = 0; // loop
        }
        setActiveStageId(flowNodes[idx].id);
        idx++;
        animationRef.current = setTimeout(step, 600);
      }
      step();

      return () => {
        if (animationRef.current) clearTimeout(animationRef.current);
        setActiveStageId(null);
      };
    }, [isAnimating, nodes, view]);

    // Post-process nodes/edges for animation display
    const displayNodes = useMemo(() => {
      if (!isAnimating || view !== 'flow') return nodes;
      return nodes.map((n) =>
        n.type === 'stage' && n.id === activeStageId
          ? { ...n, style: { ...n.style, filter: 'brightness(1.4)', transition: 'filter 0.3s' } }
          : n
      );
    }, [nodes, isAnimating, activeStageId, view]);

    const displayEdges = useMemo(() => {
      if (!isAnimating || view !== 'flow') return edges;
      return edges.map((e) => ({ ...e, animated: true }));
    }, [edges, isAnimating, view]);

    // Apply EXPLAIN cost overlay on flow stage nodes
    const explainNodes = useMemo(() => {
      if (!explainResult || view !== 'flow') return displayNodes;
      return displayNodes.map((n) => {
        if (n.type !== 'stage') return n;
        const stageData = n.data as any;

        // Try to match by relation name (for FROM/JOIN nodes) or node type
        const match = explainResult.nodes.find((en) => {
          if (!en.relation) return false;
          return stageData.snippet?.toLowerCase().includes(en.relation.toLowerCase());
        }) ?? explainResult.nodes.find((en) => {
          const nt = en.nodeType.toLowerCase();
          const kind = stageData.kind;
          return (
            (kind === 'from' && (nt.includes('scan') || nt.includes('seq'))) ||
            (kind === 'join' && nt.includes('join')) ||
            (kind === 'groupby' && nt.includes('group')) ||
            (kind === 'orderby' && nt.includes('sort'))
          );
        });

        if (!match) return n;

        const cost = match.cost ?? match.actualTime ?? 0;
        const costColor = getCostColor(cost, explainResult.maxCost);
        const rows = match.actualRows ?? match.rows;

        return {
          ...n,
          data: {
            ...stageData,
            explainCost: cost.toFixed(2),
            explainRows: rows,
            explainColor: costColor,
          },
        };
      });
    }, [displayNodes, explainResult, view]);

    useImperativeHandle(ref, () => ({
      fitView: () => rfInstance.current?.fitView({ padding: 0.18, maxZoom: 1.1 }),
      exportPng: async () => {
        if (wrapperRef.current) await exportDiagramAsPng(wrapperRef.current);
      },
      exportSvg: async () => {
        if (wrapperRef.current) await exportDiagramAsSvg(wrapperRef.current);
      },
      exportCard: async (sql, mode) => {
        if (wrapperRef.current) await exportDiagramAsCard(wrapperRef.current, sql, mode);
      },
      startAnimation: () => setIsAnimating(true),
      stopAnimation: () => {
        setIsAnimating(false);
        setActiveStageId(null);
        if (animationRef.current) clearTimeout(animationRef.current);
      },
    }));

    if (nodes.length === 0) return null;

    return (
      <div ref={wrapperRef} style={{ width: '100%', height: '100%' }}>
        <ReactFlow
          key={view}
          nodes={explainNodes}
          edges={displayEdges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.18, maxZoom: 1.1 }}
          minZoom={0.15}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{ type: 'smoothstep' }}
          onInit={(instance) => { rfInstance.current = instance; }}
          onNodeClick={onNodeClick ? (_, node) => onNodeClick(node.id, node.data) : undefined}
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="#1c2436" />
          <Controls showInteractive={false} />
          <MiniMap
            pannable
            zoomable
            maskColor="rgba(9,12,18,0.75)"
            nodeColor={(n: Node) => {
              const data = n.data as any;
              if (n.type === 'schemaNode') return SCHEMA_NODE_ROLE_COLOR[data.role as keyof typeof SCHEMA_NODE_ROLE_COLOR] ?? '#4fd6e0';
              return n.type === 'relation'
                ? KIND_COLOR[data.kind as keyof typeof KIND_COLOR]
                : STAGE_COLOR[data.kind as keyof typeof STAGE_COLOR] || '#3a4560';
            }}
          />
        </ReactFlow>
      </div>
    );
  }
);

export default DiagramCanvas;

function buildGraph(
  result: ParseResult,
  view: ViewMode,
  collapsedLanes: Set<string> = new Set(),
  toggleLane: (lane: string) => void = () => {},
): { nodes: Node[]; edges: Edge[] } {
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

    const allStageNodes: Node[] = graph.nodes.map((n) => ({
      id: n.id,
      type: 'stage',
      position: positions.get(n.id) ?? { x: 0, y: 0 },
      data: n.kind === 'join'
        ? { ...n, joinColor: JOIN_TYPE_COLOR[n.title.toUpperCase()] ?? STAGE_COLOR.join }
        : (n as any),
      draggable: true,
    }));

    // Filter out stage nodes belonging to collapsed lanes
    const visibleStageNodes = allStageNodes.filter(
      (n) => !collapsedLanes.has((n.data as any).lane)
    );

    const visibleIds = new Set(visibleStageNodes.map((n) => n.id));

    const laneLabelNodes: Node[] = graph.lanes.map((lane) => ({
      id: `lane_${lane}`,
      type: 'laneLabel',
      position: { x: -190, y: (laneIndex.get(lane) ?? 0) * laneHeight + 18 },
      data: {
        label: lane,
        isMain: lane === 'main',
        collapsed: collapsedLanes.has(lane),
        onToggle: lane === 'main' ? undefined : () => toggleLane(lane),
      },
      draggable: false,
      selectable: false,
    }));

    const allEdges: Edge[] = graph.edges.map((e) => {
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

    // Hide edges where either endpoint is a collapsed (hidden) stage node
    const visibleEdges = allEdges.filter(
      (e) => visibleIds.has(e.source) && visibleIds.has(e.target)
    );

    return { nodes: [...laneLabelNodes, ...visibleStageNodes], edges: visibleEdges };
  }

  if (view === 'schema' && result.schema) {
    const graph = result.schema;
    const { positions } = layoutSchemaGraph(graph);

    const nodes: Node[] = graph.nodes.map((n) => ({
      id: n.id,
      type: 'schemaNode',
      position: positions.get(n.id) ?? { x: 0, y: 0 },
      data: n as any,
      draggable: true,
    }));

    const edges: Edge[] = graph.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      labelStyle: { fill: FK_EDGE_COLOR, fontSize: 9.5, fontWeight: 700, fontFamily: 'var(--font-mono)' },
      labelBgStyle: { fill: '#0f1420', fillOpacity: 0.9 },
      labelBgPadding: [4, 2] as [number, number],
      style: { stroke: FK_EDGE_COLOR, strokeWidth: 1.75 },
      markerEnd: { type: MarkerType.ArrowClosed, color: FK_EDGE_COLOR, width: 14, height: 14 },
      markerStart: { type: MarkerType.Arrow, color: FK_EDGE_COLOR, width: 10, height: 10 },
    }));

    return { nodes, edges };
  }

  return { nodes: [], edges: [] };
}
