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
          <p className="text-[11px]" style={{ color: 'var(--color-text-faint)' }}>
            Run <code className="px-1 rounded" style={{ background: 'rgba(255,255,255,0.06)' }}>EXPLAIN (FORMAT JSON) SELECT ...</code> in PostgreSQL or <code className="px-1 rounded" style={{ background: 'rgba(255,255,255,0.06)' }}>EXPLAIN FORMAT=JSON SELECT ...</code> in MySQL and paste the output below.
          </p>
          <textarea
            value={text}
            onChange={(e) => { setText(e.target.value); setError(null); }}
            placeholder='[{"Plan": {"Node Type": "Seq Scan", ...}}]'
            rows={8}
            className="w-full rounded-lg px-3 py-2 text-[10.5px] font-mono resize-none outline-none border"
            style={{
              borderColor: error ? 'var(--color-rose)' : 'var(--color-border)',
              background: 'var(--color-bg-raised)',
              color: 'var(--color-text-dim)',
            }}
          />
          {error && (
            <p className="text-[10.5px]" style={{ color: 'var(--color-rose)' }}>{error}</p>
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
