import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { FlowNode } from '../../sql/types';
import { STAGE_COLOR } from '../../lib/theme';
import { FLOW_NODE_WIDTH } from '../../layout/flowLayout';

export default function StageNode({ data, selected }: NodeProps & { data: FlowNode }) {
  const color = STAGE_COLOR[data.kind];
  const dashed = data.kind === 'subquery' || data.kind === 'union';

  return (
    <div
      style={{
        width: FLOW_NODE_WIDTH,
        borderColor: selected ? color : 'var(--color-border)',
        borderStyle: dashed ? 'dashed' : 'solid',
        borderLeft: `3px solid ${color}`,
        borderLeftStyle: 'solid',
      }}
      className="rounded-lg border bg-(--color-surface) shadow-lg overflow-hidden"
    >
      <Handle type="target" position={Position.Left} id="left" style={{ background: color, border: 'none', width: 7, height: 7 }} />
      <Handle type="source" position={Position.Right} id="right" style={{ background: color, border: 'none', width: 7, height: 7 }} />
      <Handle type="target" position={Position.Top} id="top" style={{ background: color, border: 'none', width: 7, height: 7 }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ background: color, border: 'none', width: 7, height: 7 }} />

      <div className="px-2.5 pt-2 pb-1 flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-wider" style={{ color }}>
          {data.title}
        </span>
      </div>
      <div
        className="px-2.5 pb-2.5 text-[10.5px] leading-snug whitespace-pre-wrap break-words"
        style={{ color: 'var(--color-text-dim)', maxHeight: 96, overflow: 'hidden' }}
        title={data.snippet}
      >
        {data.snippet}
      </div>
    </div>
  );
}
