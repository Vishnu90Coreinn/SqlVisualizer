import { useState, useRef, useEffect } from 'react';
import { History, Trash2 } from 'lucide-react';
import { getHistory, clearHistory, formatTimestamp, type HistoryEntry } from '../lib/queryHistory';

export default function QueryHistoryDropdown({ onSelect }: { onSelect: (sql: string) => void }) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  function openDropdown() {
    setEntries(getHistory());
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={openDropdown}
        title="Query history"
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-semibold border shrink-0 transition-colors hover:border-[#f0a93f] hover:text-[#f0a93f]"
        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-dim)', background: 'var(--color-bg-raised)' }}
      >
        <History size={12} strokeWidth={2.25} />
        History
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-1 w-72 rounded-lg border shadow-xl z-50 overflow-hidden"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
        >
          <div
            className="flex items-center justify-between px-3 py-2 border-b text-[10.5px]"
            style={{ borderColor: 'var(--color-border-soft)', color: 'var(--color-text-faint)' }}
          >
            <span>Recent queries</span>
            {entries.length > 0 && (
              <button
                onClick={() => { clearHistory(); setEntries([]); }}
                className="flex items-center gap-1 hover:text-[#f0708c] transition-colors"
              >
                <Trash2 size={10} /> Clear
              </button>
            )}
          </div>

          {entries.length === 0 ? (
            <div className="px-3 py-4 text-[11px] text-center" style={{ color: 'var(--color-text-faint)' }}>
              No history yet
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {entries.map((entry, i) => (
                <button
                  key={i}
                  onClick={() => { onSelect(entry.sql); setOpen(false); }}
                  className="w-full text-left px-3 py-2 border-b transition-colors hover:bg-[rgba(255,255,255,0.04)]"
                  style={{ borderColor: 'var(--color-border-soft)' }}
                >
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-[9px] font-semibold tracking-wider" style={{ color: 'var(--color-amber)' }}>
                      {entry.dialect}
                    </span>
                    <span className="text-[9px]" style={{ color: 'var(--color-text-faint)' }}>
                      {formatTimestamp(entry.timestamp)}
                    </span>
                  </div>
                  <div
                    className="text-[10.5px] truncate font-mono"
                    style={{ color: 'var(--color-text-dim)' }}
                  >
                    {entry.sql.replace(/\s+/g, ' ').slice(0, 80)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
