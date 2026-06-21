import type { RelKind, RelEdgeKind, ColumnRole, FlowStageKind, SchemaNodeRole } from '../sql/types';

// ── Color palettes ───────────────────────────────────────────────────────────
export type DiagramPalette = 'amber' | 'ocean' | 'forest';

export const PALETTE_LABELS: Record<DiagramPalette, string> = {
  amber: 'Amber',
  ocean: 'Ocean',
  forest: 'Forest',
};

// Per-palette table/cte/subquery colors
export const PALETTE_KIND_COLOR: Record<DiagramPalette, Record<RelKind, string>> = {
  amber: { table: '#4fd6e0', cte: '#f0a93f', subquery: '#b08af0', 'write-target': '#f0708c' },
  ocean: { table: '#38bdf8', cte: '#818cf8', subquery: '#e879f9', 'write-target': '#f87171' },
  forest: { table: '#4ade80', cte: '#facc15', subquery: '#a78bfa', 'write-target': '#f87171' },
};

let _palette: DiagramPalette = 'amber';
export function setActivePalette(p: DiagramPalette) { _palette = p; }
export function getActivePalette(): DiagramPalette { return _palette; }

export const KIND_COLOR: Record<RelKind, string> = {
  table: '#4fd6e0',
  cte: '#f0a93f',
  subquery: '#b08af0',
  'write-target': '#f0708c',
};

export const KIND_LABEL: Record<RelKind, string> = {
  table: 'TABLE',
  cte: 'CTE',
  subquery: 'SUBQUERY',
  'write-target': 'WRITE TARGET',
};

export const ROLE_COLOR: Record<ColumnRole, string> = {
  select: '#f0a93f',
  join: '#4fd6e0',
  filter: '#f0708c',
  group: '#5fd896',
  order: '#7c879f',
  window: '#b08af0',
};

export const ROLE_LABEL: Record<ColumnRole, string> = {
  select: 'SELECT',
  join: 'JOIN KEY',
  filter: 'FILTER',
  group: 'GROUP BY',
  order: 'ORDER BY',
  window: 'WINDOW',
};

export const EDGE_COLOR: Record<RelEdgeKind, string> = {
  join: '#4fd6e0',
  in: '#f0708c',
  exists: '#f0708c',
  scalar: '#f0708c',
  from: '#5a6480',
  union: '#f0a93f',
};

export const STAGE_COLOR: Record<FlowStageKind, string> = {
  cte: '#f0a93f',
  from: '#4fd6e0',
  join: '#3fb8c2',
  where: '#f0708c',
  subquery: '#b08af0',
  groupby: '#5fd896',
  having: '#e0556f',
  window: '#b08af0',
  select: '#f0a93f',
  orderby: '#7c879f',
  limit: '#7c879f',
  union: '#f0a93f',
};

export const SCHEMA_NODE_ROLE_COLOR: Record<SchemaNodeRole, string> = {
  standalone: '#4fd6e0',
  parent: '#f0a93f',
  junction: '#b08af0',
};

export const FK_EDGE_COLOR = '#4fd6e0';

export const JOIN_TYPE_COLOR: Record<string, string> = {
  'INNER JOIN': '#4fd6e0',
  'LEFT JOIN': '#5b8ef0',
  'LEFT OUTER JOIN': '#5b8ef0',
  'RIGHT JOIN': '#b08af0',
  'RIGHT OUTER JOIN': '#b08af0',
  'FULL JOIN': '#f0a93f',
  'FULL OUTER JOIN': '#f0a93f',
  'CROSS JOIN': '#f0708c',
};
