import { useState, useRef, useEffect } from 'react';
import { Palette } from 'lucide-react';
import { PALETTE_LABELS, type DiagramPalette } from '../lib/theme';

const PALETTE_DOTS: Record<DiagramPalette, string[]> = {
  amber: ['#4fd6e0', '#f0a93f', '#b08af0'],
  ocean: ['#38bdf8', '#818cf8', '#e879f9'],
  forest: ['#4ade80', '#facc15', '#a78bfa'],
};

export default function PalettePicker({
  value,
  onChange,
}: {
  value: DiagramPalette;
  onChange: (p: DiagramPalette) => void;
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

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Change color palette"
        className="flex items-center justify-center w-7 h-7 rounded-md border transition-colors hover:border-[#f0a93f] hover:text-[#f0a93f]"
        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-dim)', background: 'var(--color-surface)' }}
      >
        <Palette size={13} strokeWidth={2} />
      </button>

      {open && (
        <div
          className="absolute top-full right-0 mt-1.5 w-40 rounded-lg border shadow-xl z-50 overflow-hidden py-1"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
        >
          <div className="px-3 py-1 text-[9px] font-bold tracking-widest uppercase" style={{ color: 'var(--color-text-faint)' }}>
            Color theme
          </div>
          {(Object.keys(PALETTE_LABELS) as DiagramPalette[]).map((p) => (
            <button
              key={p}
              onClick={() => { onChange(p); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] transition-colors hover:bg-[rgba(240,169,63,0.08)]"
              style={{ color: value === p ? '#f0a93f' : 'var(--color-text-dim)', fontWeight: value === p ? 700 : 400 }}
            >
              <span className="flex gap-1">
                {PALETTE_DOTS[p].map((c, i) => (
                  <span key={i} className="rounded-full" style={{ width: 8, height: 8, background: c }} />
                ))}
              </span>
              {PALETTE_LABELS[p]}
              {value === p && <span className="ml-auto text-[9px]">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
