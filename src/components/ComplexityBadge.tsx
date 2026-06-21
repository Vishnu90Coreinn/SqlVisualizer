import type { ParseResult } from '../sql/types';
import { computeComplexity } from '../sql/complexityScore';

const LABEL_COLOR: Record<string, string> = {
  'SIMPLE': '#5fd896',
  'MODERATE': '#f0a93f',
  'COMPLEX': '#f0708c',
  'VERY COMPLEX': '#b08af0',
};

export default function ComplexityBadge({ result }: { result: ParseResult }) {
  const complexity = computeComplexity(result);
  if (!complexity) return null;

  const color = LABEL_COLOR[complexity.label];

  return (
    <div
      className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9.5px] font-bold tracking-wider pointer-events-none"
      style={{ background: `${color}18`, border: `1px solid ${color}40`, color }}
    >
      <span>{complexity.label}</span>
      <span className="opacity-50">·</span>
      <span className="font-normal opacity-75">{complexity.breakdown.join(', ') || 'single table'}</span>
    </div>
  );
}
