export default function StatementTabs({
  count,
  selected,
  onSelect,
}: {
  count: number;
  selected: number;
  onSelect: (i: number) => void;
}) {
  if (count <= 1) return null;

  return (
    <div
      className="flex gap-1 px-3 py-1.5 border-b shrink-0 overflow-x-auto"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-raised)' }}
    >
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className="px-2.5 py-1 rounded text-[10.5px] font-semibold shrink-0 transition-colors"
          style={{
            background: selected === i ? 'var(--color-amber)' : 'var(--color-surface)',
            color: selected === i ? '#0a0e16' : 'var(--color-text-dim)',
          }}
        >
          Query {i + 1}
        </button>
      ))}
    </div>
  );
}
