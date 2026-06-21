import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ROLE_COLOR, ROLE_LABEL, STAGE_COLOR } from '../lib/theme';
import type { ViewMode } from './DiagramCanvas';
import type { ColumnRole } from '../sql/types';

const ROLE_ORDER: ColumnRole[] = ['select', 'join', 'filter', 'group', 'order', 'window'];
const STAGE_ENTRIES: { key: keyof typeof STAGE_COLOR; label: string }[] = [
  { key: 'from', label: 'FROM' },
  { key: 'join', label: 'JOIN' },
  { key: 'where', label: 'WHERE / SUBQUERY' },
  { key: 'groupby', label: 'GROUP BY' },
  { key: 'window', label: 'WINDOW' },
  { key: 'select', label: 'SELECT' },
];

export default function Legend({ view }: { view: ViewMode }) {
  const [open, setOpen] = useState(true);

  return (
    <div
      className="rounded-lg border overflow-hidden shrink-0"
      style={{ borderColor: 'var(--color-border-soft)', background: 'var(--color-surface)' }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-2.5 py-1.5 transition-colors hover:bg-[rgba(255,255,255,0.03)]"
      >
        <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: 'var(--color-text-faint)' }}>
          Legend
        </span>
        {open
          ? <ChevronUp size={11} strokeWidth={2} color="var(--color-text-faint)" />
          : <ChevronDown size={11} strokeWidth={2} color="var(--color-text-faint)" />}
      </button>

      {/* Items */}
      {open && (
        <div
          className="flex flex-wrap gap-x-3 gap-y-1.5 px-2.5 pb-2.5 border-t"
          style={{ borderColor: 'var(--color-border-soft)' }}
        >
          {view === 'relationship'
            ? (
              <>
                {ROLE_ORDER.map((role) => (
                  <span key={role} className="flex items-center gap-1.5 text-[10px] mt-1.5" style={{ color: 'var(--color-text-dim)' }}>
                    <span className="rounded-full shrink-0" style={{ width: 7, height: 7, background: ROLE_COLOR[role] }} />
                    {ROLE_LABEL[role]}
                  </span>
                ))}
                <span key="index-hint" className="flex items-center gap-1.5 text-[10px] mt-1.5" style={{ color: 'var(--color-text-dim)' }}>
                  <span className="text-[10px] shrink-0" style={{ color: '#f0a93f', opacity: 0.8 }}>⚡</span>
                  INDEX HINT
                </span>
              </>
            )
            : STAGE_ENTRIES.map((s) => (
              <span key={s.key} className="flex items-center gap-1.5 text-[10px] mt-1.5" style={{ color: 'var(--color-text-dim)' }}>
                <span className="rounded-full shrink-0" style={{ width: 7, height: 7, background: STAGE_COLOR[s.key] }} />
                {s.label}
              </span>
            ))}
        </div>
      )}
    </div>
  );
}
