import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Table2, GitMerge, Brackets, PenLine, ArrowRightToLine } from 'lucide-react';
import type { RelNode } from '../../sql/types';
import { KIND_COLOR, KIND_LABEL, ROLE_COLOR } from '../../lib/theme';
import { REL_NODE_WIDTH } from '../../layout/dagreLayout';

const ICONS = { table: Table2, cte: GitMerge, subquery: Brackets, 'write-target': PenLine, result: ArrowRightToLine } as const;

interface RelNodeData extends RelNode {
  _activeColumn?: { nodeId: string; col: string } | null;
  _onColumnClick?: (nodeId: string, col: string) => void;
  _kindColor?: Record<string, string>;
}

export default function RelationNode({ data, selected }: NodeProps & { data: RelNodeData }) {
  const color = (data._kindColor ?? KIND_COLOR)[data.kind] ?? KIND_COLOR[data.kind];
  const Icon = ICONS[data.kind];
  const dashed = data.kind === 'subquery';
  const activeCol = data._activeColumn;
  const isThisNodeActive = activeCol?.nodeId === data.id;
  const activeColName = activeCol?.col ?? null;
  const isNodeLevelActive = isThisNodeActive && activeColName === '__node__';

  return (
    <div
      style={{
        width: REL_NODE_WIDTH,
        borderColor: selected || isNodeLevelActive ? color : activeCol && !isThisNodeActive ? 'var(--color-border-soft)' : 'var(--color-border)',
        opacity: activeCol && !isThisNodeActive ? 0.4 : 1,
        boxShadow: isNodeLevelActive ? `0 0 0 2px ${color}55` : undefined,
      }}
      className="rounded-lg border bg-(--color-surface) shadow-lg overflow-hidden transition-all cursor-pointer"
      title={isNodeLevelActive ? 'Click to clear' : 'Click to trace all connections'}
      onClick={() => data._onColumnClick?.(data.id, '__node__')}
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
          const isActive = isThisNodeActive && activeColName === col.name;
          const isDimmed = isThisNodeActive && activeColName !== null && activeColName !== '__node__' && activeColName !== col.name;

          return (
            <div
              key={col.name}
              className="flex items-center gap-1.5 px-2.5 py-[3px] cursor-pointer transition-all"
              title={isActive ? 'Click to clear' : `Click to trace lineage of "${col.name}"`}
              style={{
                background: isActive ? `${roleColor}18` : 'transparent',
                opacity: isDimmed ? 0.3 : 1,
              }}
              onClick={(e) => {
                e.stopPropagation();
                data._onColumnClick?.(data.id, col.name);
              }}
            >
              <span
                className="rounded-full shrink-0 transition-all"
                style={{ width: isActive ? 7 : 5, height: isActive ? 7 : 5, background: roleColor, boxShadow: isActive ? `0 0 6px ${roleColor}` : 'none' }}
              />
              <span className="text-[11px] truncate flex-1" style={{ color: isActive ? 'var(--color-text)' : 'var(--color-text-dim)', fontWeight: isActive ? 700 : 400 }}>
                {col.name}
              </span>
              {(col.roles.has('join') || col.roles.has('filter')) && (
                <span className="text-[8px] shrink-0" style={{ color: '#f0a93f', opacity: 0.7 }} title="Consider adding an index">⚡</span>
              )}
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
