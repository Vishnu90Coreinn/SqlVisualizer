import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Link, Save, FolderOpen, Code2 } from 'lucide-react';

export default function HeaderActionsMenu({
  onShare,
  onSave,
  onLoad,
  onEmbed,
}: {
  onShare: () => void;
  onSave: () => void;
  onLoad: () => void;
  onEmbed: () => void;
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

  function act(fn: () => void) {
    fn();
    setOpen(false);
  }

  const itemCls =
    'w-full flex items-center gap-2.5 px-3 py-2 text-[11px] transition-colors hover:bg-[rgba(240,169,63,0.08)] hover:text-[#f0a93f]';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="More actions"
        className="flex items-center justify-center w-7 h-7 rounded-md border transition-colors hover:border-[#f0a93f] hover:text-[#f0a93f]"
        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-dim)', background: 'var(--color-bg-raised)' }}
      >
        <MoreHorizontal size={14} strokeWidth={2} />
      </button>

      {open && (
        <div
          className="absolute top-full right-0 mt-1.5 w-44 rounded-lg border shadow-xl z-50 overflow-hidden py-1"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
        >
          <button onClick={() => act(onShare)} className={itemCls} style={{ color: 'var(--color-text-dim)' }}>
            <Link size={13} strokeWidth={2} />
            Copy share link
          </button>
          <button onClick={() => act(onSave)} className={itemCls} style={{ color: 'var(--color-text-dim)' }}>
            <Save size={13} strokeWidth={2} />
            Save workspace
          </button>
          <button onClick={() => act(onLoad)} className={itemCls} style={{ color: 'var(--color-text-dim)' }}>
            <FolderOpen size={13} strokeWidth={2} />
            Load workspace
          </button>
          <div className="my-1 border-t" style={{ borderColor: 'var(--color-border-soft)' }} />
          <button onClick={() => act(onEmbed)} className={itemCls} style={{ color: 'var(--color-text-dim)' }}>
            <Code2 size={13} strokeWidth={2} />
            Get embed code
          </button>
        </div>
      )}
    </div>
  );
}
