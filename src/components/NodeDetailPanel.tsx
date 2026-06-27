import { X } from 'lucide-react';
import type { RelNode, SchemaNode } from '../sql/types';
import { ROLE_COLOR, ROLE_LABEL, KIND_COLOR, KIND_LABEL, SCHEMA_NODE_ROLE_COLOR } from '../lib/theme';

type PanelData =
  | { type: 'relation'; node: RelNode }
  | { type: 'schema'; node: SchemaNode };

export default function NodeDetailPanel({
  data,
  onClose,
}: {
  data: PanelData;
  onClose: () => void;
}) {
  return (
    <div
      className="w-72 shrink-0 border-l flex flex-col shadow-2xl"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b shrink-0"
        style={{ borderColor: 'var(--color-border-soft)' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {data.type === 'relation' ? (
            <>
              <span
                className="text-[8.5px] font-bold tracking-wider px-1.5 py-0.5 rounded shrink-0"
                style={{
                  color: KIND_COLOR[data.node.kind],
                  background: `${KIND_COLOR[data.node.kind]}1f`,
                }}
              >
                {KIND_LABEL[data.node.kind]}
              </span>
              <span className="text-[13px] font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                {data.node.label}
              </span>
            </>
          ) : (
            <>
              <span
                className="text-[8.5px] font-bold tracking-wider px-1.5 py-0.5 rounded shrink-0"
                style={{
                  color: SCHEMA_NODE_ROLE_COLOR[data.node.role],
                  background: `${SCHEMA_NODE_ROLE_COLOR[data.node.role]}1f`,
                }}
              >
                {data.node.role.toUpperCase()}
              </span>
              <span className="text-[13px] font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                {data.node.tableName}
              </span>
            </>
          )}
        </div>
        <button
          onClick={onClose}
          className="shrink-0 ml-2"
          style={{ color: 'var(--color-text-faint)' }}
        >
          <X size={14} strokeWidth={2} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {data.type === 'relation' && (
          <RelationDetail node={data.node} />
        )}
        {data.type === 'schema' && (
          <SchemaDetail node={data.node} />
        )}
      </div>
    </div>
  );
}

function RelationDetail({ node }: { node: RelNode }) {
  if (node.columns.length === 0) {
    return (
      <div className="px-4 py-3 text-[11px] italic" style={{ color: 'var(--color-text-faint)' }}>
        No columns referenced in this query.
      </div>
    );
  }

  return (
    <div className="divide-y" style={{ borderColor: 'var(--color-border-soft)' }}>
      {/* All columns */}
      <div className="px-4 py-3">
        <div className="text-[9.5px] font-bold tracking-wider mb-2" style={{ color: 'var(--color-text-faint)' }}>
          COLUMNS ({node.columns.length})
        </div>
        {node.columns.map((col) => {
          const primaryRole = [...col.roles][0];
          const roleColor = primaryRole ? ROLE_COLOR[primaryRole] : 'var(--color-text-faint)';
          return (
            <div key={col.name} className="flex items-center gap-2 py-1">
              <span className="rounded-full shrink-0" style={{ width: 6, height: 6, background: roleColor }} />
              <span className="text-[11.5px] flex-1 font-mono" style={{ color: 'var(--color-text-dim)' }}>
                {col.name}
              </span>
              <span className="flex gap-1">
                {[...col.roles].map((role) => (
                  <span
                    key={role}
                    className="text-[8px] font-bold px-1 py-0.5 rounded"
                    style={{ color: ROLE_COLOR[role], background: `${ROLE_COLOR[role]}18` }}
                  >
                    {ROLE_LABEL[role]}
                  </span>
                ))}
              </span>
            </div>
          );
        })}
      </div>
      {/* Alias */}
      {node.alias && (
        <div className="px-4 py-2.5">
          <div className="text-[9.5px] font-bold tracking-wider mb-1" style={{ color: 'var(--color-text-faint)' }}>
            ALIAS
          </div>
          <code className="text-[11px]" style={{ color: 'var(--color-amber)' }}>{node.alias}</code>
        </div>
      )}
      {/* Detail */}
      {node.detail && (
        <div className="px-4 py-2.5">
          <div className="text-[9.5px] font-bold tracking-wider mb-1" style={{ color: 'var(--color-text-faint)' }}>
            SUMMARY
          </div>
          <p className="text-[10.5px] italic" style={{ color: 'var(--color-text-dim)' }}>{node.detail}</p>
        </div>
      )}
    </div>
  );
}

function SchemaDetail({ node }: { node: SchemaNode }) {
  return (
    <div className="divide-y" style={{ borderColor: 'var(--color-border-soft)' }}>
      <div className="px-4 py-3">
        <div className="text-[9.5px] font-bold tracking-wider mb-2" style={{ color: 'var(--color-text-faint)' }}>
          COLUMNS ({node.columns.length})
        </div>
        {node.columns.map((col) => (
          <div key={col.name} className="py-1.5 border-b last:border-0" style={{ borderColor: 'var(--color-border-soft)' }}>
            <div className="flex items-center gap-2">
              <span className="text-[11.5px] font-mono flex-1" style={{ color: 'var(--color-text-dim)' }}>
                {col.name}
              </span>
              <span className="text-[9.5px]" style={{ color: 'var(--color-text-faint)' }}>{col.dataType}</span>
            </div>
            <div className="flex gap-1 mt-0.5 flex-wrap">
              {col.isPrimaryKey && <Chip label="PK" color="#f0a93f" />}
              {col.isForeignKey && <Chip label="FK" color="#4fd6e0" />}
              {col.isUnique && !col.isPrimaryKey && <Chip label="UNIQUE" color="#b08af0" />}
              {col.isIndexed && <Chip label="INDEX" color="#5fd896" />}
              {col.isNotNull && !col.isPrimaryKey && <Chip label="NOT NULL" color="#7c879f" />}
              {col.references && (
                <span className="text-[8.5px] italic" style={{ color: 'var(--color-text-faint)' }}>
                  → {col.references.table}.{col.references.column}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      {node.compositePK && (
        <div className="px-4 py-2.5">
          <div className="text-[9.5px] font-bold tracking-wider mb-1" style={{ color: 'var(--color-text-faint)' }}>
            COMPOSITE PRIMARY KEY
          </div>
          <code className="text-[10.5px]" style={{ color: 'var(--color-amber)' }}>
            ({node.compositePK.join(', ')})
          </code>
        </div>
      )}
    </div>
  );
}

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span className="text-[7.5px] font-bold px-1 py-0.5 rounded" style={{ color, background: `${color}22` }}>
      {label}
    </span>
  );
}
