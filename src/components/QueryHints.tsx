import { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, Info } from 'lucide-react';
import type { QueryHint } from '../sql/queryHints';

export default function QueryHints({ hints }: { hints: QueryHint[] }) {
  const [open, setOpen] = useState(true);

  if (hints.length === 0) return null;

  const warns = hints.filter((h) => h.severity === 'warn').length;

  return (
    <div
      className="rounded-lg border overflow-hidden shrink-0"
      style={{ borderColor: warns > 0 ? 'rgba(240,112,140,0.4)' : 'var(--color-border-soft)', background: 'var(--color-surface)' }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-2.5 py-1.5 transition-colors hover:bg-[rgba(255,255,255,0.03)]"
      >
        <div className="flex items-center gap-1.5">
          <AlertTriangle size={11} strokeWidth={2.5} color={warns > 0 ? '#f0708c' : '#f0a93f'} />
          <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: warns > 0 ? '#f0708c' : '#f0a93f' }}>
            Optimizer · {hints.length} hint{hints.length > 1 ? 's' : ''}
          </span>
        </div>
        {open
          ? <ChevronUp size={11} strokeWidth={2} color="var(--color-text-faint)" />
          : <ChevronDown size={11} strokeWidth={2} color="var(--color-text-faint)" />}
      </button>

      {open && (
        <div
          className="flex flex-col divide-y border-t"
          style={{ borderColor: 'var(--color-border-soft)' }}
        >
          {hints.map((hint) => (
            <div key={hint.id} className="px-2.5 py-2">
              <div className="flex items-start gap-1.5">
                {hint.severity === 'warn'
                  ? <AlertTriangle size={11} className="shrink-0 mt-0.5" color="#f0708c" strokeWidth={2} />
                  : <Info size={11} className="shrink-0 mt-0.5" color="#f0a93f" strokeWidth={2} />}
                <span className="text-[10.5px] font-semibold leading-snug" style={{ color: 'var(--color-text-dim)' }}>
                  {hint.title}
                </span>
              </div>
              <p className="text-[9.5px] leading-snug mt-0.5 pl-4" style={{ color: 'var(--color-text-faint)' }}>
                {hint.detail}
              </p>
              {hint.fix && (
                <p className="text-[9.5px] leading-snug mt-0.5 pl-4" style={{ color: '#5fd896' }}>
                  ✓ {hint.fix}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
