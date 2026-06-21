import { useEffect, useRef } from 'react';
import { X, Copy } from 'lucide-react';
import { getEmbedUrl } from '../lib/urlState';

export default function EmbedModal({ onClose }: { onClose: () => void }) {
  const url = getEmbedUrl();
  const iframeCode = `<iframe\n  src="${url}"\n  width="100%"\n  height="500"\n  frameborder="0"\n  style="border: 1px solid #28324a; border-radius: 8px;"\n  title="SQL Visualizer"\n></iframe>`;

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  function copyCode() {
    navigator.clipboard.writeText(iframeCode).catch(() => {});
    if (textareaRef.current) {
      textareaRef.current.select();
    }
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
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: 'var(--color-border-soft)' }}
        >
          <span className="text-[12px] font-semibold" style={{ color: 'var(--color-text)' }}>
            Embed diagram
          </span>
          <button onClick={onClose} style={{ color: 'var(--color-text-faint)' }}>
            <X size={15} strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col gap-3">
          <p className="text-[11px]" style={{ color: 'var(--color-text-faint)' }}>
            Copy this snippet to embed the current diagram in any webpage or Markdown doc.
          </p>
          <textarea
            ref={textareaRef}
            readOnly
            value={iframeCode}
            rows={5}
            className="w-full rounded-lg px-3 py-2 text-[10.5px] font-mono resize-none outline-none border"
            style={{
              borderColor: 'var(--color-border)',
              background: 'var(--color-bg-raised)',
              color: 'var(--color-text-dim)',
            }}
          />
          <button
            onClick={copyCode}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-[11.5px] font-semibold transition-colors"
            style={{ background: 'var(--color-amber)', color: '#0a0e16' }}
          >
            <Copy size={13} strokeWidth={2.25} />
            Copy embed code
          </button>
        </div>
      </div>
    </div>
  );
}
