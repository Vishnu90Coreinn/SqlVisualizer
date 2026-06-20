import { Network, GitBranch } from 'lucide-react';
import type { ViewMode } from './DiagramCanvas';

export default function ViewToggle({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  const tabs: { key: ViewMode; label: string; icon: typeof Network }[] = [
    { key: 'relationship', label: 'Relationships', icon: Network },
    { key: 'flow', label: 'Execution Flow', icon: GitBranch },
  ];

  return (
    <div className="inline-flex rounded-lg border p-0.5 gap-0.5" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-raised)' }}>
      {tabs.map((t) => {
        const active = t.key === view;
        const Icon = t.icon;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11.5px] font-semibold transition-colors"
            style={{
              color: active ? '#0a0e16' : 'var(--color-text-dim)',
              background: active ? 'var(--color-amber)' : 'transparent',
            }}
          >
            <Icon size={13} strokeWidth={2.25} />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
