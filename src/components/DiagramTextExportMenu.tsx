import { useState, useRef, useEffect } from 'react';
import { FileText } from 'lucide-react';
import type { SchemaGraph } from '../sql/types';
import { toMermaid, toPlantUML, copyToClipboard } from '../lib/diagramTextExport';

export default function DiagramTextExportMenu({ graph }: { graph: SchemaGraph }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  async function copy(format: 'mermaid' | 'plantuml') {
    const text = format === 'mermaid' ? toMermaid(graph) : toPlantUML(graph);
    await copyToClipboard(text).catch(() => {});
    setCopied(format);
    setTimeout(() => setCopied(null), 2000);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Copy as Mermaid or PlantUML"
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-semibold border shrink-0 transition-colors hover:border-[#f0a93f] hover:text-[#f0a93f]"
        style={{ borderColor: 'var(--color-border)', color: copied ? '#5fd896' : 'var(--color-text-dim)', background: 'var(--color-bg-raised)' }}
      >
        <FileText size={12} strokeWidth={2.25} />
        {copied ? 'Copied!' : 'As text'}
      </button>

      {open && (
        <div
          className="absolute top-full right-0 mt-1 w-44 rounded-lg border shadow-xl z-50 overflow-hidden"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
        >
          <button
            onClick={() => copy('mermaid')}
            className="w-full flex items-center gap-2 px-3 py-2 text-[11px] transition-colors hover:bg-[rgba(255,255,255,0.05)]"
            style={{ color: 'var(--color-text-dim)' }}
          >
            Copy as Mermaid
          </button>
          <button
            onClick={() => copy('plantuml')}
            className="w-full flex items-center gap-2 px-3 py-2 text-[11px] transition-colors hover:bg-[rgba(255,255,255,0.05)] border-t"
            style={{ color: 'var(--color-text-dim)', borderColor: 'var(--color-border-soft)' }}
          >
            Copy as PlantUML
          </button>
        </div>
      )}
    </div>
  );
}
