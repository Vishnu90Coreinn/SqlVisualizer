import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Table2, GitMerge, Brackets, PenLine } from 'lucide-react';
import type { RelNode } from '../../sql/types';
import { KIND_COLOR, KIND_LABEL, ROLE_COLOR } from '../../lib/theme';
import { REL_NODE_WIDTH } from '../../layout/dagreLayout';

const ICONS = { table: Table2, cte: GitMerge, subquery: Brackets, 'write-target': PenLine } as const;

export default function RelationNode({ data, selected }: NodeProps & { data: RelNode }) {
  const color = KIND_COLOR[data.kind];
  const Icon = ICONS[data.kind];
  const dashed = data.kind === 'subquery';

  return (
    <div
      style={{ width: REL_NODE_WIDTH, borderColor: selected ? color : 'var(--color-border)' }}
      className="rounded-lg border bg-(--color-surface) shadow-lg overflow-hidden transition-shadow"
    >
      <Handle type="target" position={Position.Left} style={{ background: color, border: 'none', width: 7, height: 7 }} />
      <Handle type="source" position={Position.Right} style={{ background: color, border: 'none', width: 7, height: 7 }} />

      <div
        className="flex items-center gap-1.5 px-2.5 py-2 border-b"
        style={{ borderColor: 'var(--color-border-soft)', borderLeft: `3px solid ${color}`, borderStyle: dashed ? 'dashed' : 'solid', borderLeftStyle: 'solid' }}
      >
        <Icon size={13} color={color} strokeWidth={2.25} />
        <span className="text-[12.5px] font-semibold truncate flex-1" style={{ color: 'var(--color-text)' }} title={data.label}>
          {data.label}
        </span>
        <span
          className="text-[8.5px] font-bold tracking-wider px-1 py-0.5 rounded"
          style={{ color, background: `${color}1f` }}
        >
          {KIND_LABEL[data.kind]}
        </span>
      </div>

      <div className="py-1">
        {data.columns.length === 0 && (
          <div className="px-2.5 py-1.5 text-[10.5px] italic" style={{ color: 'var(--color-text-faint)' }}>
            no columns referenced
          </div>
        )}
        {data.columns.map((col) => {
          const primaryRole = [...col.roles][0];
          const roleColor = primaryRole ? ROLE_COLOR[primaryRole] : 'var(--color-text-faint)';
          return (
            <div key={col.name} className="flex items-center gap-1.5 px-2.5 py-[3px]" title={[...col.roles].join(', ')}>
              <span className="rounded-full shrink-0" style={{ width: 5, height: 5, background: roleColor }} />
              <span className="text-[11px] truncate flex-1" style={{ color: 'var(--color-text-dim)' }}>
                {col.name}
              </span>
            </div>
          );
        })}
      </div>

      {data.detail && (
        <div
          className="px-2.5 py-1.5 text-[9.5px] italic truncate border-t"
          style={{ color: 'var(--color-text-faint)', borderColor: 'var(--color-border-soft)' }}
          title={data.detail}
        >
          {data.detail}
        </div>
      )}
    </div>
  );
}
