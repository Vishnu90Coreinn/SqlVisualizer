import { Handle, Position, type NodeProps } from '@xyflow/react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface LaneLabelData {
  label: string;
  isMain: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function LaneLabelNode({ data }: NodeProps & { data: LaneLabelData }) {
  return (
    <div className="flex items-center h-full pr-3">
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider whitespace-nowrap"
        style={{
          color: data.isMain ? '#090c12' : 'var(--color-amber)',
          background: data.isMain ? 'var(--color-amber)' : 'transparent',
          border: data.isMain ? 'none' : '1px dashed var(--color-amber-dim)',
          cursor: data.isMain ? 'default' : 'pointer',
        }}
        onClick={data.isMain ? undefined : data.onToggle}
        title={data.isMain ? undefined : (data.collapsed ? 'Expand CTE' : 'Collapse CTE')}
      >
        {!data.isMain && (
          data.collapsed
            ? <ChevronRight size={10} strokeWidth={2.5} />
            : <ChevronDown size={10} strokeWidth={2.5} />
        )}
        {data.isMain ? 'MAIN QUERY' : `CTE · ${data.label}`}
        {data.collapsed && (
          <span className="text-[8px] opacity-60 font-normal ml-1">collapsed</span>
        )}
      </div>
    </div>
  );
}
