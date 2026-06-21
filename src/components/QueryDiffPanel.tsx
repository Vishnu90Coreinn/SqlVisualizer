import { useState } from 'react';
import { parseSql } from '../sql/parser';
import type { ParseResult } from '../sql/types';

const TA_STYLE: React.CSSProperties = {
  background: 'var(--color-bg-raised)',
  borderColor: 'var(--color-border)',
  color: 'var(--color-text-dim)',
  fontFamily: 'var(--font-mono)',
  fontSize: '11px',
  lineHeight: '18px',
  resize: 'none',
  outline: 'none',
  width: '100%',
  padding: '10px',
  borderRadius: '8px',
  border: '1px solid var(--color-border)',
  boxSizing: 'border-box',
};

export default function QueryDiffPanel({
  database,
  onResults,
}: {
  database: string;
  onResults: (before: ParseResult | null, after: ParseResult | null) => void;
}) {
  const [before, setBefore] = useState('');
  const [after, setAfter] = useState('');

  function runDiff() {
    const b = before.trim() ? parseSql(before.trim(), database) : null;
    const a = after.trim() ? parseSql(after.trim(), database) : null;
    onResults(b, a);
  }

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex gap-2 flex-1 min-h-0">
        <div className="flex-1 flex flex-col gap-1">
          <span className="text-[9.5px] font-bold tracking-wider px-0.5" style={{ color: '#f0708c' }}>
            BEFORE
          </span>
          <textarea
            value={before}
            onChange={(e) => setBefore(e.target.value)}
            placeholder="Paste original query..."
            rows={6}
            style={TA_STYLE}
          />
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <span className="text-[9.5px] font-bold tracking-wider px-0.5" style={{ color: '#5fd896' }}>
            AFTER
          </span>
          <textarea
            value={after}
            onChange={(e) => setAfter(e.target.value)}
            placeholder="Paste optimized query..."
            rows={6}
            style={TA_STYLE}
          />
        </div>
      </div>
      <button
        onClick={runDiff}
        disabled={!before.trim() && !after.trim()}
        className="w-full py-1.5 rounded-lg text-[11.5px] font-semibold transition-colors disabled:opacity-40"
        style={{ background: 'var(--color-amber)', color: '#0a0e16' }}
      >
        Compare Diagrams
      </button>
    </div>
  );
}
