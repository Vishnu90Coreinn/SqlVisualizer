import type { RelKind, RelEdgeKind, ColumnRole, FlowStageKind, SchemaNodeRole } from '../sql/types';

export const KIND_COLOR: Record<RelKind, string> = {
  table: '#4fd6e0',
  cte: '#f0a93f',
  subquery: '#b08af0',
};

export const KIND_LABEL: Record<RelKind, string> = {
  table: 'TABLE',
  cte: 'CTE',
  subquery: 'SUBQUERY',
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
