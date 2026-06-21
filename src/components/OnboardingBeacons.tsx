import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const STORAGE_KEY = 'sql-viz-onboarded-v1';

interface Beacon {
  id: string;
  title: string;
  body: string;
  anchor: string; // CSS selector for the element to point at
  position: 'bottom' | 'left';
}

const BEACONS: Beacon[] = [
  {
    id: 'editor',
    title: 'Paste any SQL here',
    body: 'Type or paste a SELECT, INSERT, UPDATE, DELETE, or CREATE TABLE — the diagram updates live as you type.',
    anchor: '[data-beacon="editor"]',
    position: 'bottom',
  },
  {
    id: 'view',
    title: 'Two diagram views',
    body: 'Relationships shows table connections. Execution Flow shows the SQL pipeline step-by-step with execution order badges.',
    anchor: '[data-beacon="view-toggle"]',
    position: 'bottom',
  },
  {
    id: 'help',
    title: '? — all features listed',
    body: 'Click ? to see every feature: schema templates, query diff, EXPLAIN overlay, share card, keyboard shortcuts, and more.',
    anchor: '[data-beacon="help"]',
    position: 'left',
  },
];

export default function OnboardingBeacons() {
  const [active, setActive] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) {
      setDone(true);
      return;
    }
    // Small delay so the app renders first
    const t = setTimeout(() => setActive(0), 1200);
    return () => clearTimeout(t);
  }, []);

  function next() {
    if (active === null) return;
    if (active < BEACONS.length - 1) {
      setActive(active + 1);
    } else {
      dismiss();
    }
  }

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1');
    setActive(null);
    setDone(true);
  }

  if (done || active === null) return null;

  const beacon = BEACONS[active];
  const el = document.querySelector(beacon.anchor);
  if (!el) return null;

  const rect = el.getBoundingClientRect();
  const isBottom = beacon.position === 'bottom';

  const tooltipStyle: React.CSSProperties = isBottom
    ? { top: rect.bottom + 10, left: Math.max(8, rect.left + rect.width / 2 - 150) }
    : { top: rect.top + rect.height / 2 - 60, left: rect.left - 318 };

  const dotStyle: React.CSSProperties = {
    top: rect.top + rect.height / 2 - 6,
    left: rect.left + rect.width / 2 - 6,
  };

  return (
    <>
      {/* Pulsing dot on element */}
      <div className="fixed z-[60] pointer-events-none" style={dotStyle}>
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#f0a93f' }} />
          <span className="relative inline-flex rounded-full h-3 w-3" style={{ background: '#f0a93f' }} />
        </span>
      </div>

      {/* Tooltip */}
      <div
        className="fixed z-[60] w-72 rounded-xl border shadow-2xl p-4"
        style={{ ...tooltipStyle, borderColor: '#f0a93f40', background: 'var(--color-surface)' }}
      >
        {/* Progress dots */}
        <div className="flex gap-1.5 mb-3">
          {BEACONS.map((_, i) => (
            <span
              key={i}
              className="h-1.5 rounded-full transition-all"
              style={{ width: i === active ? 16 : 6, background: i <= active ? '#f0a93f' : 'var(--color-border)' }}
            />
          ))}
        </div>

        <div className="flex items-start justify-between gap-2 mb-1">
          <span className="text-[12px] font-bold" style={{ color: 'var(--color-text)' }}>
            {beacon.title}
          </span>
          <button onClick={dismiss} style={{ color: 'var(--color-text-faint)' }} className="shrink-0 mt-0.5">
            <X size={13} strokeWidth={2} />
          </button>
        </div>

        <p className="text-[10.5px] leading-relaxed mb-3" style={{ color: 'var(--color-text-faint)' }}>
          {beacon.body}
        </p>

        <div className="flex items-center justify-between">
          <button
            onClick={dismiss}
            className="text-[10px]"
            style={{ color: 'var(--color-text-faint)' }}
          >
            Skip tour
          </button>
          <button
            onClick={next}
            className="px-3 py-1 rounded-md text-[11px] font-semibold"
            style={{ background: '#f0a93f', color: '#0a0e16' }}
          >
            {active < BEACONS.length - 1 ? 'Next →' : 'Got it!'}
          </button>
        </div>
      </div>
    </>
  );
}
