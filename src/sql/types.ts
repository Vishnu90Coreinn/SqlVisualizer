// ── Relationship (ER-style) graph ───────────────────────────────────────────

export type RelKind = 'table' | 'cte' | 'subquery';

export interface RelColumn {
  name: string;
  /** why this column is highlighted: selected / joined / filtered / grouped / ordered */
  roles: Set<ColumnRole>;
}

export type ColumnRole = 'select' | 'join' | 'filter' | 'group' | 'order' | 'window';

export interface RelNode {
  id: string;
  kind: RelKind;
  /** display name, e.g. table name or CTE name */
  label: string;
  /** alias used in the query, if any (e.g. "o" for "orders o") */
  alias?: string;
  columns: RelColumn[];
  /** for CTE/subquery nodes: a short human description, e.g. "GROUP BY region" */
  detail?: string;
  depth: number;
}

export type RelEdgeKind = 'join' | 'in' | 'exists' | 'scalar' | 'from' | 'union';

export interface RelEdge {
  id: string;
  source: string;
  target: string;
  kind: RelEdgeKind;
  /** e.g. "INNER JOIN", "LEFT JOIN", "EXISTS", "IN" */
  label: string;
  condition?: string;
}

export interface RelationshipGraph {
  nodes: RelNode[];
  edges: RelEdge[];
}

// ── Execution flow (pipeline) graph ─────────────────────────────────────────

export type FlowStageKind =
  | 'cte'
  | 'from'
  | 'join'
  | 'where'
  | 'subquery'
  | 'groupby'
  | 'having'
  | 'window'
  | 'select'
  | 'orderby'
  | 'limit'
  | 'union';

export interface FlowNode {
  id: string;
  kind: FlowStageKind;
  title: string;
  snippet: string;
  /** pipeline lane this node belongs to: 'main' or a CTE name */
  lane: string;
  order: number;
  warnings?: string[];
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  /** true if this edge crosses from a CTE lane into the lane that consumes it */
  isReference?: boolean;
}

export interface FlowGraph {
  nodes: FlowNode[];
  edges: FlowEdge[];
  lanes: string[];
}

export interface ParseResult {
  ok: boolean;
  error?: string;
  errorPosition?: { line: number; column: number };
  relationship?: RelationshipGraph;
  flow?: FlowGraph;
  schema?: SchemaGraph;
}

// ── Schema (DDL / ER) graph ──────────────────────────────────────────────────

export type SchemaNodeRole = 'standalone' | 'parent' | 'junction';

export interface SchemaColumn {
  name: string;
  dataType: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isNotNull: boolean;
  isUnique: boolean;
  isIndexed: boolean;
  references?: { table: string; column: string };
}

export interface SchemaNode {
  id: string;
  tableName: string;
  columns: SchemaColumn[];
  compositePK?: string[];
  role: SchemaNodeRole;
}

export interface SchemaEdge {
  id: string;
  source: string;
  target: string;
  sourceColumn: string;
  targetColumn: string;
  label: string;
}

export interface SchemaGraph {
  nodes: SchemaNode[];
  edges: SchemaEdge[];
}
