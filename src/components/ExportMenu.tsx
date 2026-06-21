import { useState, useRef, useEffect } from 'react';
import { Download, FileImage, FileCode2 } from 'lucide-react';

export default function ExportMenu({
  onExportPng,
  onExportSvg,
}: {
  onExportPng: () => void;
  onExportSvg: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Export diagram (Ctrl+Shift+E)"
        className="flex items-center justify-center w-7 h-7 rounded-md border transition-colors hover:border-[#f0a93f] hover:text-[#f0a93f]"
        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-dim)', background: 'var(--color-bg-raised)' }}
      >
        <Download size={13} strokeWidth={2.25} />
      </button>

      {open && (
        <div
          className="absolute top-full right-0 mt-1 w-36 rounded-lg border shadow-xl z-50 overflow-hidden"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
        >
          <button
            onClick={() => { onExportPng(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[11px] transition-colors hover:bg-[rgba(255,255,255,0.05)]"
            style={{ color: 'var(--color-text-dim)' }}
          >
            <FileImage size={12} strokeWidth={2} />
            Export PNG
          </button>
          <button
            onClick={() => { onExportSvg(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[11px] transition-colors hover:bg-[rgba(255,255,255,0.05)]"
            style={{ color: 'var(--color-text-dim)', borderTop: '1px solid var(--color-border-soft)' }}
          >
            <FileCode2 size={12} strokeWidth={2} />
            Export SVG
          </button>
        </div>
      )}
    </div>
  );
}
