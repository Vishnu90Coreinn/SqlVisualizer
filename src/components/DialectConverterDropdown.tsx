import { useState, useRef, useEffect } from 'react';
import { ArrowLeftRight } from 'lucide-react';

const DIALECTS = ['PostgreSQL', 'MySQL', 'TransactSQL', 'Sqlite', 'BigQuery', 'Snowflake'];

export default function DialectConverterDropdown({
  currentDialect,
  onConvert,
}: {
  currentDialect: string;
  onConvert: (targetDialect: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const targets = DIALECTS.filter((d) => d !== currentDialect);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Convert SQL to another dialect"
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors hover:border-[#f0a93f] hover:text-[#f0a93f]"
        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-dim)', background: 'var(--color-bg-raised)' }}
      >
        <ArrowLeftRight size={11} strokeWidth={2} />
        Convert
      </button>

      {open && (
        <div
          className="absolute top-full right-0 mt-1 w-44 rounded-lg border shadow-xl z-50 overflow-hidden py-1"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
        >
          <div className="px-3 py-1 text-[9px] font-bold tracking-widest uppercase" style={{ color: 'var(--color-text-faint)' }}>
            Convert to…
          </div>
          {targets.map((d) => (
            <button
              key={d}
              onClick={() => { onConvert(d); setOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-[11px] transition-colors hover:bg-[rgba(240,169,63,0.08)] hover:text-[#f0a93f]"
              style={{ color: 'var(--color-text-dim)' }}
            >
              {d}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
