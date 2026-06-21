import { useState } from 'react';
import { parseDDL } from '../sql/ddlParser';
import { diffSchemas, type SchemaDiffResult } from '../lib/schemaDiff';

const DIFF_COLOR = {
  added: '#5fd896',
  removed: '#f0708c',
  modified: '#f0a93f',
  unchanged: 'var(--color-text-faint)',
};

export default function SchemaDiffPanel({
  database,
  onDiffResult,
}: {
  database: string;
  onDiffResult: (result: SchemaDiffResult | null) => void;
}) {
  const [beforeSql, setBeforeSql] = useState('');
  const [afterSql, setAfterSql] = useState('');
  const [diffResult, setDiffResult] = useState<SchemaDiffResult | null>(null);

  function runDiff() {
    if (!beforeSql.trim() || !afterSql.trim()) return;
    const before = parseDDL(beforeSql, database);
    const after = parseDDL(afterSql, database);
    const result = diffSchemas(before, after);
    setDiffResult(result);
    onDiffResult(result);
  }

  const textareaStyle = {
    background: 'var(--color-bg-raised)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-text-dim)',
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    lineHeight: '18px',
    resize: 'none' as const,
    outline: 'none',
  };

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex gap-2 flex-1 min-h-0">
        {/* Before */}
        <div className="flex-1 flex flex-col gap-1">
          <div className="text-[9.5px] font-bold tracking-wider px-1" style={{ color: '#f0708c' }}>
            BEFORE
          </div>
          <textarea
            value={beforeSql}
            onChange={(e) => setBeforeSql(e.target.value)}
            placeholder="Paste the original DDL..."
            className="flex-1 rounded-lg border p-2.5"
            style={textareaStyle}
          />
        </div>
        {/* After */}
        <div className="flex-1 flex flex-col gap-1">
          <div className="text-[9.5px] font-bold tracking-wider px-1" style={{ color: '#5fd896' }}>
            AFTER
          </div>
          <textarea
            value={afterSql}
            onChange={(e) => setAfterSql(e.target.value)}
            placeholder="Paste the updated DDL..."
            className="flex-1 rounded-lg border p-2.5"
            style={textareaStyle}
          />
        </div>
      </div>

      <button
        onClick={runDiff}
        disabled={!beforeSql.trim() || !afterSql.trim()}
        className="w-full py-2 rounded-lg text-[11.5px] font-semibold transition-colors disabled:opacity-40"
        style={{ background: 'var(--color-amber)', color: '#0a0e16' }}
      >
        Compare Schemas
      </button>

      {diffResult && (
        <div className="text-[10px] flex flex-col gap-0.5 max-h-24 overflow-y-auto">
          {diffResult.tableDiffs
            .filter((t) => t.kind !== 'unchanged')
            .map((t) => (
              <div key={t.tableName} className="flex items-center gap-1.5">
                <span style={{ color: DIFF_COLOR[t.kind] }}>
                  {t.kind === 'added' ? '+' : t.kind === 'removed' ? '−' : '~'}
                </span>
                <span style={{ color: 'var(--color-text-dim)' }}>{t.tableName}</span>
                <span className="text-[9px]" style={{ color: DIFF_COLOR[t.kind] }}>
                  {t.kind}
                </span>
              </div>
            ))}
          {!diffResult.hasChanges && (
            <span style={{ color: 'var(--color-text-faint)' }}>No schema changes detected.</span>
          )}
        </div>
      )}
    </div>
  );
}
