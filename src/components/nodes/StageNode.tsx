import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { FlowNode, FlowStageKind } from '../../sql/types';
import { STAGE_COLOR } from '../../lib/theme';
import { FLOW_NODE_WIDTH } from '../../layout/flowLayout';

const EXEC_ORDER: Partial<Record<FlowStageKind, number>> = {
  cte: 0,
  from: 1,
  join: 2,
  where: 3,
  subquery: 3,
  groupby: 4,
  having: 5,
  window: 6,
  select: 7,
  orderby: 8,
  limit: 9,
};

const ORDER_GLYPHS = ['⓪', '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨'];

export default function StageNode({ data, selected }: NodeProps & { data: FlowNode }) {
  const color = (data as any).joinColor ?? STAGE_COLOR[data.kind];
  const dashed = data.kind === 'subquery' || data.kind === 'union';
  const execStep = EXEC_ORDER[data.kind];
  const glyph = execStep !== undefined ? (ORDER_GLYPHS[execStep] ?? String(execStep)) : null;

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

      <div className="px-2.5 pt-2 pb-1 flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold tracking-wider" style={{ color }}>
          {data.title}
        </span>
        {glyph && (
          <span
            className="text-[11px] shrink-0"
            style={{ color, opacity: 0.7 }}
            title={`SQL execution step ${execStep}`}
          >
            {glyph}
          </span>
        )}
      </div>

      <div
        className="px-2.5 pb-2 text-[10.5px] leading-snug whitespace-pre-wrap break-words"
        style={{ color: 'var(--color-text-dim)', maxHeight: 96, overflow: 'hidden' }}
        title={data.snippet}
      >
        {data.snippet}
      </div>

      {data.warnings && data.warnings.length > 0 && (
        <div className="border-t px-2.5 py-1.5 flex flex-col gap-0.5" style={{ borderColor: 'var(--color-border-soft)' }}>
          {data.warnings.map((w, i) => (
            <span key={i} className="text-[9.5px] flex items-center gap-1" style={{ color: '#f0a93f' }}>
              ⚠ {w}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
