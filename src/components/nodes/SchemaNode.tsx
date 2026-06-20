import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { SchemaNode, SchemaColumn } from '../../sql/types';
import { SCHEMA_NODE_ROLE_COLOR } from '../../lib/theme';
import { SCHEMA_NODE_WIDTH, schemaNodeHeight } from '../../layout/schemaLayout';

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="text-[7.5px] font-bold px-[3px] py-[1px] rounded shrink-0"
      style={{ color, background: `${color}22` }}
    >
      {label}
    </span>
  );
}

function ColumnRow({ col }: { col: SchemaColumn }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-[3px]">
      <span className="text-[11px] truncate flex-1" style={{ color: 'var(--color-text-dim)' }}>
        {col.name}
      </span>
      {col.dataType && (
        <span className="text-[9px] shrink-0 font-mono" style={{ color: 'var(--color-text-faint)' }}>
          {col.dataType}
        </span>
      )}
      <span className="flex gap-0.5 shrink-0">
        {col.isPrimaryKey && <Chip label="PK" color="#f0a93f" />}
        {col.isForeignKey && <Chip label="FK" color="#4fd6e0" />}
        {col.isUnique && !col.isPrimaryKey && <Chip label="UQ" color="#b08af0" />}
        {col.isIndexed && <Chip label="IDX" color="#5fd896" />}
        {col.isNotNull && !col.isPrimaryKey && <Chip label="NN" color="#7c879f" />}
      </span>
    </div>
  );
}

export default function SchemaNodeComponent({ data, selected }: NodeProps & { data: SchemaNode }) {
  const color = SCHEMA_NODE_ROLE_COLOR[data.role];
  const height = schemaNodeHeight(data.columns.length);

  return (
    <div
      style={{ width: SCHEMA_NODE_WIDTH, minHeight: height, borderColor: selected ? color : 'var(--color-border)' }}
      className="rounded-lg border bg-(--color-surface) shadow-lg overflow-hidden transition-shadow"
    >
      <Handle type="target" position={Position.Left} style={{ background: color, border: 'none', width: 7, height: 7 }} />
      <Handle type="source" position={Position.Right} style={{ background: color, border: 'none', width: 7, height: 7 }} />

      <div
        className="flex items-center gap-1.5 px-2.5 py-2 border-b"
        style={{ borderColor: 'var(--color-border-soft)', borderLeft: `3px solid ${color}`, borderLeftStyle: 'solid' }}
      >
        <span className="text-[12.5px] font-semibold truncate flex-1" style={{ color: 'var(--color-text)' }} title={data.tableName}>
          {data.tableName}
        </span>
        <span className="text-[8px] font-bold tracking-wider px-1 py-0.5 rounded shrink-0" style={{ color, background: `${color}1f` }}>
          {data.role.toUpperCase()}
        </span>
      </div>

      <div className="py-1">
        {data.columns.length === 0 && (
          <div className="px-2.5 py-1.5 text-[10.5px] italic" style={{ color: 'var(--color-text-faint)' }}>
            no columns
          </div>
        )}
        {data.columns.map((col) => (
          <ColumnRow key={col.name} col={col} />
        ))}
      </div>

      {data.compositePK && (
        <div
          className="px-2.5 py-1.5 text-[9.5px] italic border-t truncate"
          style={{ color: 'var(--color-text-faint)', borderColor: 'var(--color-border-soft)' }}
          title={`Composite PK: ${data.compositePK.join(', ')}`}
        >
          PK: {data.compositePK.join(', ')}
        </div>
      )}
    </div>
  );
}
