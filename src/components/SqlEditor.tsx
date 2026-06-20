import { useRef } from 'react';

export default function SqlEditor({
  value,
  onChange,
  errorLine,
}: {
  value: string;
  onChange: (v: string) => void;
  errorLine?: number;
}) {
  const gutterRef = useRef<HTMLDivElement>(null);
  const lines = value.split('\n').length;

  function syncScroll(e: React.UIEvent<HTMLTextAreaElement>) {
    if (gutterRef.current) gutterRef.current.scrollTop = e.currentTarget.scrollTop;
  }

  return (
    <div className="flex h-full rounded-lg border overflow-hidden" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-raised)' }}>
      <div
        ref={gutterRef}
        className="select-none text-right py-3 pl-3 pr-2 text-[12px] overflow-hidden shrink-0"
        style={{ color: 'var(--color-text-faint)', lineHeight: '20px', background: 'var(--color-surface)' }}
      >
        {Array.from({ length: Math.max(lines, 1) }, (_, i) => (
          <div
            key={i}
            style={{
              color: errorLine === i + 1 ? 'var(--color-rose)' : undefined,
              fontWeight: errorLine === i + 1 ? 700 : undefined,
            }}
          >
            {i + 1}
          </div>
        ))}
      </div>
      <textarea
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={syncScroll}
        placeholder="Paste a SQL query here..."
        className="flex-1 resize-none py-3 px-3 text-[12px] outline-none bg-transparent"
        style={{ color: 'var(--color-text)', lineHeight: '20px', caretColor: 'var(--color-amber)' }}
      />
    </div>
  );
}
