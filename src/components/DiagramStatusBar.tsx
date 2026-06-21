import type { ParseResult } from '../sql/types';
import { computeComplexity } from '../sql/complexityScore';

export default function DiagramStatusBar({ result, view }: { result: ParseResult; view: string }) {
  if (!result.ok) return null;

  const complexity = computeComplexity(result);
  const rel = result.relationship;
  const flow = result.flow;

  const tables = rel?.nodes.filter((n) => n.kind === 'table').length ?? 0;
  const ctes = rel?.nodes.filter((n) => n.kind === 'cte').length ?? 0;
  const joins = rel?.edges.filter((e) => e.kind === 'join').length ?? 0;
  const totalCols = rel?.nodes.reduce((sum, n) => sum + n.columns.length, 0) ?? 0;
  const stages = flow?.nodes.length ?? 0;

  const items: { label: string; value: string | number }[] = [];

  if (view === 'relationship' || view === 'schema') {
    if (tables > 0) items.push({ label: 'tables', value: tables });
    if (ctes > 0) items.push({ label: 'CTEs', value: ctes });
    if (joins > 0) items.push({ label: 'joins', value: joins });
    if (totalCols > 0) items.push({ label: 'columns', value: totalCols });
  } else if (view === 'flow') {
    if (stages > 0) items.push({ label: 'stages', value: stages });
    const lanes = flow?.lanes.length ?? 0;
    if (lanes > 1) items.push({ label: 'lanes', value: lanes });
  }

  if (complexity) {
    items.push({ label: 'complexity', value: complexity.label });
  }

  if (items.length === 0) return null;

  const COMPLEXITY_COLOR: Record<string, string> = {
    'SIMPLE': '#5fd896',
    'MODERATE': '#f0a93f',
    'COMPLEX': '#f0708c',
    'VERY COMPLEX': '#b08af0',
  };

  return (
    <div
      className="absolute bottom-0 left-0 right-0 flex items-center gap-3 px-3 py-1 border-t text-[9.5px] pointer-events-none"
      style={{ borderColor: 'var(--color-border-soft)', background: 'rgba(9,12,18,0.7)', backdropFilter: 'blur(4px)' }}
    >
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          <span style={{ color: item.label === 'complexity' ? COMPLEXITY_COLOR[String(item.value)] ?? 'var(--color-text-faint)' : 'var(--color-text-dim)', fontWeight: item.label === 'complexity' ? 700 : 400 }}>
            {item.value}
          </span>
          {item.label !== 'complexity' && (
            <span style={{ color: 'var(--color-text-faint)' }}>{item.label}</span>
          )}
          {i < items.length - 1 && <span style={{ color: 'var(--color-border)' }}>·</span>}
        </span>
      ))}
    </div>
  );
}
