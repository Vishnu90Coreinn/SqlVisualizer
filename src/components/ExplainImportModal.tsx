import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { parseExplainJson, type ExplainResult } from '../lib/explainParser';

export default function ExplainImportModal({
  onImport,
  onClose,
}: {
  onImport: (result: ExplainResult) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleImport() {
    if (!text.trim()) return;
    const result = parseExplainJson(text);
    if (!result) {
      setError('Could not parse EXPLAIN JSON. Make sure to use EXPLAIN (FORMAT JSON) for PostgreSQL or EXPLAIN FORMAT=JSON for MySQL.');
      return;
    }
    onImport(result);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg rounded-xl border shadow-2xl"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
      >
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: 'var(--color-border-soft)' }}
        >
          <span className="text-[12px] font-semibold" style={{ color: 'var(--color-text)' }}>
            Import EXPLAIN output
          </span>
          <button onClick={onClose} style={{ color: 'var(--color-text-faint)' }}>
            <X size={15} strokeWidth={2} />
          </button>
        </div>
        <div className="p-4 flex flex-col gap-3">
          {/* Step 1 */}
          <div className="rounded-lg border px-3 py-2.5 flex flex-col gap-1.5" style={{ borderColor: 'var(--color-border-soft)', background: 'var(--color-bg-raised)' }}>
            <span className="text-[9.5px] font-bold tracking-wider" style={{ color: 'var(--color-amber)' }}>STEP 1 — Run this in your database</span>
            <div className="flex flex-col gap-1">
              <span className="text-[9px]" style={{ color: 'var(--color-text-faint)' }}>PostgreSQL:</span>
              <code className="text-[10px] px-2 py-1 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-dim)' }}>
                EXPLAIN (FORMAT JSON, ANALYZE) SELECT ...
              </code>
              <span className="text-[9px] mt-1" style={{ color: 'var(--color-text-faint)' }}>MySQL:</span>
              <code className="text-[10px] px-2 py-1 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-dim)' }}>
                EXPLAIN FORMAT=JSON SELECT ...
              </code>
            </div>
          </div>

          {/* Step 2 */}
          <div>
            <span className="text-[9.5px] font-bold tracking-wider block mb-1.5" style={{ color: 'var(--color-amber)' }}>STEP 2 — Paste the JSON output below (not your SQL)</span>
            <p className="text-[10.5px] mb-2" style={{ color: 'var(--color-text-faint)' }}>
              The output starts with <code className="px-1 rounded" style={{ background: 'rgba(255,255,255,0.06)' }}>[{`{`}</code> or <code className="px-1 rounded" style={{ background: 'rgba(255,255,255,0.06)' }}>{`{`}</code> — it is <strong style={{ color: 'var(--color-rose)' }}>not</strong> your SQL query.
            </p>
            <textarea
              value={text}
              onChange={(e) => { setText(e.target.value); setError(null); }}
              placeholder={'[\n  {\n    "Plan": {\n      "Node Type": "Hash Join",\n      "Total Cost": 145.23,\n      ...\n    }\n  }\n]'}
              rows={7}
              className="w-full rounded-lg px-3 py-2 text-[10.5px] font-mono resize-none outline-none border"
              style={{
                borderColor: error ? 'var(--color-rose)' : 'var(--color-border)',
                background: 'var(--color-bg-raised)',
                color: 'var(--color-text-dim)',
              }}
            />
          </div>
          {error && (
            <div className="rounded-lg border px-3 py-2 text-[10.5px]" style={{ borderColor: 'var(--color-rose)', background: 'rgba(240,112,140,0.08)', color: 'var(--color-rose)' }}>
              ⚠ {error} Make sure you're pasting the JSON output from your database, not the SQL query itself.
            </div>
          )}
          <button
            onClick={handleImport}
            disabled={!text.trim()}
            className="w-full py-2 rounded-lg text-[11.5px] font-semibold transition-colors disabled:opacity-40"
            style={{ background: 'var(--color-amber)', color: '#0a0e16' }}
          >
            Overlay on Flow diagram
          </button>
        </div>
      </div>
    </div>
  );
}
