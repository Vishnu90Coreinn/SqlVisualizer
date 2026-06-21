import { useState } from 'react';
import { Search, X } from 'lucide-react';

export default function DiagramSearch({
  onSearch,
}: {
  onSearch: (q: string) => void;
}) {
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);

  function update(v: string) {
    setValue(v);
    onSearch(v);
  }

  function clear() {
    setValue('');
    onSearch('');
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Search nodes (Ctrl+F)"
        className="flex items-center justify-center w-7 h-7 rounded-md border transition-colors hover:border-[#f0a93f] hover:text-[#f0a93f]"
        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-dim)', background: 'var(--color-surface)' }}
      >
        <Search size={13} strokeWidth={2} />
      </button>
    );
  }

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded-md border"
      style={{ borderColor: '#f0a93f40', background: 'var(--color-surface)', minWidth: 180 }}
    >
      <Search size={12} strokeWidth={2} color="var(--color-text-faint)" />
      <input
        autoFocus
        value={value}
        onChange={(e) => update(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && clear()}
        placeholder="Filter nodes…"
        className="flex-1 bg-transparent outline-none text-[11px]"
        style={{ color: 'var(--color-text)', caretColor: '#f0a93f' }}
      />
      {value && (
        <button onClick={clear} style={{ color: 'var(--color-text-faint)' }}>
          <X size={11} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
