import type { SampleQuery } from '../lib/sampleQueries';

export default function SampleGrid({
  samples,
  prompt,
  onSelect,
}: {
  samples: SampleQuery[];
  prompt: string;
  onSelect: (sql: string) => void;
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-8">
      <div className="w-full max-w-lg">
        <p className="text-[11px] text-center mb-4" style={{ color: 'var(--color-text-faint)' }}>
          {prompt}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {samples.map((q) => (
            <button
              key={q.label}
              onClick={() => onSelect(q.sql)}
              className="text-left rounded-lg border px-3 py-2.5 transition-all"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-amber)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
            >
              <div className="text-[11.5px] font-semibold mb-0.5" style={{ color: 'var(--color-text)' }}>
                {q.label}
              </div>
              <div className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
                {q.description}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
