import { Network, GitBranch } from 'lucide-react';
import type { ViewMode } from './DiagramCanvas';

export default function ViewToggle({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  const tabs: { key: ViewMode; label: string; icon: typeof Network }[] = [
    { key: 'relationship', label: 'Relationships', icon: Network },
    { key: 'flow', label: 'Execution Flow', icon: GitBranch },
  ];

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[9.5px] font-bold tracking-wider uppercase hidden md:block" style={{ color: 'var(--color-text-faint)' }}>
        View
      </span>
      <div className="inline-flex rounded-lg border p-0.5 gap-0.5" style={{ borderColor: 'var(--color-border-soft)', background: 'var(--color-bg-raised)' }}>
        {tabs.map((t) => {
          const active = t.key === view;
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => onChange(t.key)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10.5px] font-semibold transition-colors"
              style={{
                color: active ? 'var(--color-amber)' : 'var(--color-text-faint)',
                background: active ? 'rgba(240,169,63,0.12)' : 'transparent',
              }}
            >
              <Icon size={12} strokeWidth={2.25} />
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
