import { Search, Database } from 'lucide-react';

export type AppMode = 'query' | 'schema';

export default function ModeToggle({ mode, onChange }: { mode: AppMode; onChange: (m: AppMode) => void }) {
  const tabs: { key: AppMode; label: string; Icon: typeof Search }[] = [
    { key: 'query', label: 'Query', Icon: Search },
    { key: 'schema', label: 'Schema', Icon: Database },
  ];

  return (
    <div
      className="inline-flex rounded-lg border p-0.5 gap-0.5"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-raised)' }}
    >
      {tabs.map(({ key, label, Icon }) => {
        const active = key === mode;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11.5px] font-semibold transition-colors"
            style={{
              color: active ? '#0a0e16' : 'var(--color-text-dim)',
              background: active ? 'var(--color-amber)' : 'transparent',
            }}
          >
            <Icon size={13} strokeWidth={2.25} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
