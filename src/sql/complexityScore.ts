import type { ParseResult } from './types';

export interface ComplexityResult {
  score: number;
  label: 'SIMPLE' | 'MODERATE' | 'COMPLEX' | 'VERY COMPLEX';
  breakdown: string[];
}

export function computeComplexity(result: ParseResult): ComplexityResult | null {
  if (!result.ok || !result.relationship) return null;

  const { nodes, edges } = result.relationship;
  let score = 0;
  const breakdown: string[] = [];

  const tables = nodes.filter((n) => n.kind === 'table').length;
  const ctes = nodes.filter((n) => n.kind === 'cte').length;
  const subqueries = nodes.filter((n) => n.kind === 'subquery').length;
  const joins = edges.filter((e) => e.kind === 'join').length;
  const existsEdges = edges.filter((e) => e.kind === 'exists' || e.kind === 'in').length;
  const hasWindow = nodes.some((n) => n.columns.some((c) => c.roles.has('window')));
  const hasGroupBy = nodes.some((n) => n.columns.some((c) => c.roles.has('group')));
  const unionCount = edges.filter((e) => e.kind === 'union').length;

  // Score each dimension
  if (tables > 1) { score += (tables - 1) * 2; breakdown.push(`${tables} tables`); }
  if (ctes > 0) { score += ctes * 3; breakdown.push(`${ctes} CTE${ctes > 1 ? 's' : ''}`); }
  if (subqueries > 0) { score += subqueries * 4; breakdown.push(`${subqueries} subquer${subqueries > 1 ? 'ies' : 'y'}`); }
  if (joins > 0) { score += joins * 2; }
  if (existsEdges > 0) { score += existsEdges * 3; breakdown.push(`${existsEdges} correlated`); }
  if (hasWindow) { score += 4; breakdown.push('window fn'); }
  if (hasGroupBy) { score += 2; }
  if (unionCount > 0) { score += unionCount * 3; breakdown.push(`${unionCount} UNION`); }

  const label: ComplexityResult['label'] =
    score <= 4 ? 'SIMPLE' :
    score <= 10 ? 'MODERATE' :
    score <= 20 ? 'COMPLEX' : 'VERY COMPLEX';

  return { score, label, breakdown };
}
