import { Handle, Position, type NodeProps } from '@xyflow/react';

interface LaneLabelData {
  label: string;
  isMain: boolean;
}

export default function LaneLabelNode({ data }: NodeProps & { data: LaneLabelData }) {
  return (
    <div className="flex items-center h-full pr-3">
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
      <div
        className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider whitespace-nowrap"
        style={{
          color: data.isMain ? '#090c12' : 'var(--color-amber)',
          background: data.isMain ? 'var(--color-amber)' : 'transparent',
          border: data.isMain ? 'none' : '1px dashed var(--color-amber-dim)',
        }}
      >
        {data.isMain ? 'MAIN QUERY' : `CTE · ${data.label}`}
      </div>
    </div>
  );
}
