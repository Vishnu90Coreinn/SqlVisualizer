import { ROLE_COLOR, ROLE_LABEL, STAGE_COLOR } from '../lib/theme';
import type { ViewMode } from './DiagramCanvas';
import type { ColumnRole } from '../sql/types';

const ROLE_ORDER: ColumnRole[] = ['select', 'join', 'filter', 'group', 'order', 'window'];
const STAGE_ENTRIES: { key: keyof typeof STAGE_COLOR; label: string }[] = [
  { key: 'from', label: 'FROM' },
  { key: 'join', label: 'JOIN' },
  { key: 'where', label: 'WHERE / SUBQUERY' },
  { key: 'groupby', label: 'GROUP BY' },
  { key: 'window', label: 'WINDOW' },
  { key: 'select', label: 'SELECT' },
];

export default function Legend({ view }: { view: ViewMode }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 px-0.5 pt-1 pb-0.5">
      {view === 'relationship'
        ? ROLE_ORDER.map((role) => (
            <span key={role} className="flex items-center gap-1 text-[9.5px]" style={{ color: 'var(--color-text-faint)' }}>
              <span className="rounded-full" style={{ width: 5, height: 5, background: ROLE_COLOR[role] }} />
              {ROLE_LABEL[role]}
            </span>
          ))
        : STAGE_ENTRIES.map((s) => (
            <span key={s.key} className="flex items-center gap-1 text-[9.5px]" style={{ color: 'var(--color-text-faint)' }}>
              <span className="rounded-full" style={{ width: 5, height: 5, background: STAGE_COLOR[s.key] }} />
              {s.label}
            </span>
          ))}
    </div>
  );
}
