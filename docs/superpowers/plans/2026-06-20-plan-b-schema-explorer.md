# SQL Visualizer — Plan B: Schema Explorer

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Prerequisite:** Plan A must be complete (mode switcher and `SchemaPlaceholder` must exist in `App.tsx`).

**Goal:** Add a Schema Explorer mode that parses DDL (CREATE TABLE, FOREIGN KEY, CREATE INDEX, ALTER TABLE) and renders a Crow's Foot-inspired ER diagram with typed column cards.

**Architecture:** `ddlParser.ts` extracts tables/columns/FKs from the AST produced by `node-sql-parser`. `schemaGraph.ts` converts that into a typed `SchemaGraph` (nodes + edges). `schemaLayout.ts` runs dagre to produce positions. `SchemaNode.tsx` renders each table card. `DiagramCanvas.tsx` gets a new `'schema'` view branch. `App.tsx` routes schema mode through the new pipeline. DDL samples live in `src/lib/ddlSampleQueries.ts`.

**Tech Stack:** React 19, TypeScript 6, node-sql-parser (already installed), dagre (already installed), @xyflow/react (already installed)

---

### Task 1: Add Schema Types to `types.ts` and `theme.ts`

**Files:**
- Modify: `src/sql/types.ts`
- Modify: `src/lib/theme.ts`

- [ ] **Step 1: Append schema types to `src/sql/types.ts`**

Add after the existing `ParseResult` interface:

```typescript
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
```

Also extend `ParseResult` to carry an optional `schema` field. Replace the existing `ParseResult` interface:

```typescript
export interface ParseResult {
  ok: boolean;
  error?: string;
  errorPosition?: { line: number; column: number };
  relationship?: RelationshipGraph;
  flow?: FlowGraph;
  schema?: SchemaGraph;
}
```

- [ ] **Step 2: Add schema colors to `src/lib/theme.ts`**

Append to the end of `src/lib/theme.ts`:

```typescript
export const SCHEMA_NODE_ROLE_COLOR: Record<SchemaNodeRole, string> = {
  standalone: '#4fd6e0',
  parent: '#f0a93f',
  junction: '#b08af0',
};

export const FK_EDGE_COLOR = '#4fd6e0';
```

Add the import for `SchemaNodeRole` at the top of `theme.ts`:

```typescript
import type { RelKind, RelEdgeKind, ColumnRole, FlowStageKind, SchemaNodeRole } from '../sql/types';
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: No TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/sql/types.ts src/lib/theme.ts
git commit -m "feat: add SchemaGraph types and schema color constants"
```

---

### Task 2: DDL Parser

**Files:**
- Create: `src/sql/ddlParser.ts`

This module uses `node-sql-parser` (already installed) to parse DDL SQL into a structured `DDLParseResult`. It handles CREATE TABLE (with inline and table-level PKs and FKs), CREATE INDEX, and ALTER TABLE ADD CONSTRAINT.

- [ ] **Step 1: Create `src/sql/ddlParser.ts`**

```typescript
import { parser } from './astHelpers';

export interface DDLColumn {
  name: string;
  dataType: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isNotNull: boolean;
  isUnique: boolean;
  isIndexed: boolean;
  references?: { table: string; column: string };
}

export interface DDLTable {
  name: string;
  columns: DDLColumn[];
  compositePK?: string[];
  foreignKeys: { columns: string[]; refTable: string; refColumns: string[] }[];
}

export interface DDLParseResult {
  tables: Map<string, DDLTable>;
  indexedColumns: Map<string, Set<string>>;
  errors: string[];
}

function extractTableName(entry: any): string | null {
  if (typeof entry?.table === 'string') return entry.table;
  if (typeof entry?.table?.table === 'string') return entry.table.table;
  return null;
}

function extractColumnName(col: any): string | null {
  if (typeof col?.column === 'string') return col.column;
  if (typeof col?.column?.column === 'string') return col.column.column;
  if (typeof col?.column?.expr?.value === 'string') return col.column.expr.value;
  return null;
}

function extractDataType(def: any): string {
  if (!def) return '';
  const base = (def.dataType ?? def.data_type ?? '').toUpperCase();
  const len = def.length ?? def.expr?.value;
  return len !== undefined && len !== null ? `${base}(${len})` : base;
}

function applyIndexedColumns(result: DDLParseResult): void {
  for (const [tableName, colSet] of result.indexedColumns) {
    const table = result.tables.get(tableName.toLowerCase());
    if (!table) continue;
    for (const col of table.columns) {
      if (colSet.has(col.name.toLowerCase())) col.isIndexed = true;
    }
  }
}

function parseCreateTable(ast: any, result: DDLParseResult): void {
  const rawName = ast.table?.[0];
  const tableName = extractTableName(rawName) ?? rawName?.table;
  if (!tableName || typeof tableName !== 'string') return;

  const table: DDLTable = { name: tableName, columns: [], foreignKeys: [] };
  const pkColumns = new Set<string>();
  const defs: any[] = ast.create_definitions ?? ast.columns ?? [];

  for (const def of defs) {
    const ctype = def.constraint_type ?? def.constraint;

    // Table-level PRIMARY KEY
    if (ctype === 'PRIMARY KEY') {
      const cols = (def.definition ?? def.columns ?? [])
        .map((c: any) => extractColumnName(c) ?? c?.column)
        .filter((c: any): c is string => typeof c === 'string');
      cols.forEach((c) => pkColumns.add(c.toLowerCase()));
      if (cols.length > 1) table.compositePK = cols;
      continue;
    }

    // Table-level FOREIGN KEY
    if (ctype === 'FOREIGN KEY' || ctype === 'foreign key') {
      const fkCols = (def.definition ?? def.columns ?? [])
        .map((c: any) => extractColumnName(c) ?? c?.column)
        .filter((c: any): c is string => typeof c === 'string');
      const refDef = def.reference_definition ?? def.references;
      const refTable = extractTableName(refDef?.table?.[0]) ?? refDef?.table?.[0]?.table;
      const refCols = (refDef?.columns ?? [])
        .map((c: any) => extractColumnName(c) ?? c?.column)
        .filter((c: any): c is string => typeof c === 'string');
      if (fkCols.length && typeof refTable === 'string') {
        table.foreignKeys.push({ columns: fkCols, refTable, refColumns: refCols });
      }
      continue;
    }

    // Column definition
    const colName = extractColumnName(def.column) ?? def.column?.column;
    if (!colName || typeof colName !== 'string') continue;

    const isPK = !!(def.primary_key || def.primary_key_token);
    const nullableType: string = def.nullable?.type ?? '';
    const isNotNull = isPK || nullableType.toLowerCase().includes('not null');
    const isUnique = !!(def.unique || def.unique_or_primary === 'unique');
    const dataType = extractDataType(def.definition ?? def.data_type_obj);

    // Inline REFERENCES
    let references: DDLColumn['references'];
    const refDef = def.reference_definition ?? def.references;
    if (refDef) {
      const refTable = extractTableName(refDef.table?.[0]) ?? refDef.table?.[0]?.table;
      const refCol = extractColumnName(refDef.columns?.[0]) ?? refDef.columns?.[0]?.column;
      if (typeof refTable === 'string') {
        references = { table: refTable, column: typeof refCol === 'string' ? refCol : 'id' };
      }
    }

    if (isPK) pkColumns.add(colName.toLowerCase());

    table.columns.push({
      name: colName,
      dataType,
      isPrimaryKey: isPK,
      isForeignKey: !!references,
      isNotNull,
      isUnique,
      isIndexed: false,
      references,
    });
  }

  // Apply table-level PKs to column entries
  for (const col of table.columns) {
    if (pkColumns.has(col.name.toLowerCase())) col.isPrimaryKey = true;
  }

  // Apply table-level FK info to column entries
  for (const fk of table.foreignKeys) {
    for (const fkColName of fk.columns) {
      const col = table.columns.find((c) => c.name.toLowerCase() === fkColName.toLowerCase());
      if (col) {
        col.isForeignKey = true;
        if (!col.references) {
          col.references = { table: fk.refTable, column: fk.refColumns[0] ?? 'id' };
        }
      }
    }
  }

  result.tables.set(tableName.toLowerCase(), table);
}

function parseCreateIndex(ast: any, result: DDLParseResult): void {
  const tableName = extractTableName(ast.on) ?? ast.on?.table;
  if (!tableName || typeof tableName !== 'string') return;
  const cols = (ast.definition ?? ast.columns ?? [])
    .map((c: any) => extractColumnName(c) ?? c?.column)
    .filter((c: any): c is string => typeof c === 'string');
  const key = tableName.toLowerCase();
  if (!result.indexedColumns.has(key)) result.indexedColumns.set(key, new Set());
  cols.forEach((c) => result.indexedColumns.get(key)!.add(c.toLowerCase()));
}

function parseAlterTable(ast: any, result: DDLParseResult): void {
  const tableName = extractTableName(ast.table?.[0]) ?? ast.table?.[0]?.table;
  if (!tableName || typeof tableName !== 'string') return;
  const table = result.tables.get(tableName.toLowerCase());
  if (!table) return;

  const exprs: any[] = ast.expr ?? [];
  for (const expr of exprs) {
    const constraint = expr.constraint ?? expr.add ?? expr;
    const ctype = constraint?.constraint_type ?? constraint?.constraint;
    if (ctype === 'FOREIGN KEY' || ctype === 'foreign key') {
      const fkCols = (constraint.definition ?? constraint.columns ?? [])
        .map((c: any) => extractColumnName(c) ?? c?.column)
        .filter((c: any): c is string => typeof c === 'string');
      const refDef = constraint.reference_definition ?? constraint.references;
      const refTable = extractTableName(refDef?.table?.[0]) ?? refDef?.table?.[0]?.table;
      const refCols = (refDef?.columns ?? [])
        .map((c: any) => extractColumnName(c) ?? c?.column)
        .filter((c: any): c is string => typeof c === 'string');
      if (fkCols.length && typeof refTable === 'string') {
        table.foreignKeys.push({ columns: fkCols, refTable, refColumns: refCols });
        for (const fkColName of fkCols) {
          const col = table.columns.find((c) => c.name.toLowerCase() === fkColName.toLowerCase());
          if (col) {
            col.isForeignKey = true;
            if (!col.references) col.references = { table: refTable, column: refCols[0] ?? 'id' };
          }
        }
      }
    }
  }
}

export function parseDDL(ddlSql: string, database: string): DDLParseResult {
  const result: DDLParseResult = { tables: new Map(), indexedColumns: new Map(), errors: [] };

  let stmts: any[];
  try {
    const ast = parser.astify(ddlSql.trim(), { database } as any);
    stmts = Array.isArray(ast) ? ast : [ast];
  } catch (e: any) {
    result.errors.push(e?.message?.split('\n')[0] ?? 'Could not parse DDL.');
    return result;
  }

  for (const stmt of stmts) {
    if (!stmt) continue;
    if (stmt.type === 'create') {
      if (stmt.keyword === 'table') parseCreateTable(stmt, result);
      else if (stmt.keyword === 'index') parseCreateIndex(stmt, result);
    } else if (stmt.type === 'alter') {
      parseAlterTable(stmt, result);
    }
  }

  applyIndexedColumns(result);
  return result;
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/sql/ddlParser.ts
git commit -m "feat: DDL parser for CREATE TABLE, FOREIGN KEY, CREATE INDEX, ALTER TABLE"
```

---

### Task 3: Schema Graph Builder

**Files:**
- Create: `src/sql/schemaGraph.ts`

- [ ] **Step 1: Create `src/sql/schemaGraph.ts`**

```typescript
import type { DDLParseResult } from './ddlParser';
import type { SchemaGraph, SchemaNode, SchemaEdge, SchemaNodeRole } from './types';
import { uid, resetUidCounter } from './astHelpers';

export function buildSchemaGraph(ddl: DDLParseResult): SchemaGraph {
  resetUidCounter();
  const nodes: SchemaNode[] = [];
  const edges: SchemaEdge[] = [];
  const tableToId = new Map<string, string>();

  // Determine which tables are referenced as FK parents
  const parentTableKeys = new Set<string>();
  const fkOutCount = new Map<string, number>();

  for (const table of ddl.tables.values()) {
    for (const fk of table.foreignKeys) {
      parentTableKeys.add(fk.refTable.toLowerCase());
      const key = table.name.toLowerCase();
      fkOutCount.set(key, (fkOutCount.get(key) ?? 0) + 1);
    }
  }

  // Create nodes
  for (const table of ddl.tables.values()) {
    const id = uid('schema');
    tableToId.set(table.name.toLowerCase(), id);

    const isParent = parentTableKeys.has(table.name.toLowerCase());
    const hasOutgoingFKs = (fkOutCount.get(table.name.toLowerCase()) ?? 0) > 0;
    const role: SchemaNodeRole =
      isParent && hasOutgoingFKs ? 'junction' : isParent ? 'parent' : 'standalone';

    const node: SchemaNode = {
      id,
      tableName: table.name,
      columns: table.columns.map((c) => ({ ...c })),
      compositePK: table.compositePK,
      role,
    };
    nodes.push(node);
  }

  // Create FK edges (child → parent)
  for (const table of ddl.tables.values()) {
    const sourceId = tableToId.get(table.name.toLowerCase());
    if (!sourceId) continue;
    for (const fk of table.foreignKeys) {
      const targetId = tableToId.get(fk.refTable.toLowerCase());
      if (!targetId || targetId === sourceId) continue;
      const srcCol = fk.columns[0] ?? '';
      const tgtCol = fk.refColumns[0] ?? 'id';
      const edge: SchemaEdge = {
        id: uid('sedge'),
        source: sourceId,
        target: targetId,
        sourceColumn: srcCol,
        targetColumn: tgtCol,
        label: `${srcCol} → ${tgtCol}`,
      };
      edges.push(edge);
    }
  }

  return { nodes, edges };
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/sql/schemaGraph.ts
git commit -m "feat: schema graph builder from parsed DDL"
```

---

### Task 4: Schema Layout

**Files:**
- Create: `src/layout/schemaLayout.ts`

- [ ] **Step 1: Create `src/layout/schemaLayout.ts`**

```typescript
import dagre from 'dagre';
import type { SchemaGraph } from '../sql/types';

export const SCHEMA_NODE_WIDTH = 280;
const SCHEMA_HEADER_HEIGHT = 40;
const SCHEMA_ROW_HEIGHT = 22;
const SCHEMA_FOOTER_PAD = 16;

export function schemaNodeHeight(columnCount: number): number {
  return SCHEMA_HEADER_HEIGHT + Math.max(columnCount, 1) * SCHEMA_ROW_HEIGHT + SCHEMA_FOOTER_PAD;
}

export function layoutSchemaGraph(graph: SchemaGraph) {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'LR', nodesep: 64, ranksep: 140, marginx: 48, marginy: 48 });
  g.setDefaultEdgeLabel(() => ({}));

  for (const node of graph.nodes) {
    g.setNode(node.id, {
      width: SCHEMA_NODE_WIDTH,
      height: schemaNodeHeight(node.columns.length),
    });
  }

  const nodeIds = new Set(graph.nodes.map((n) => n.id));
  for (const edge of graph.edges) {
    if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
      g.setEdge(edge.source, edge.target);
    }
  }

  dagre.layout(g);

  const positions = new Map<string, { x: number; y: number }>();
  g.nodes().forEach((id) => {
    const n = g.node(id);
    positions.set(id, { x: n.x - n.width / 2, y: n.y - n.height / 2 });
  });

  return { positions };
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/layout/schemaLayout.ts
git commit -m "feat: dagre layout for schema ER diagram"
```

---

### Task 5: SchemaNode Component

**Files:**
- Create: `src/components/nodes/SchemaNode.tsx`

- [ ] **Step 1: Create `src/components/nodes/SchemaNode.tsx`**

```tsx
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { SchemaNode, SchemaColumn } from '../../sql/types';
import { SCHEMA_NODE_ROLE_COLOR } from '../../lib/theme';
import { SCHEMA_NODE_WIDTH, schemaNodeHeight } from '../../layout/schemaLayout';

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="text-[7.5px] font-bold px-[3px] py-[1px] rounded shrink-0"
      style={{ color, background: `${color}22` }}
    >
      {label}
    </span>
  );
}

function ColumnRow({ col }: { col: SchemaColumn }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-[3px]">
      <span className="text-[11px] truncate flex-1" style={{ color: 'var(--color-text-dim)' }}>
        {col.name}
      </span>
      {col.dataType && (
        <span className="text-[9px] shrink-0 font-mono" style={{ color: 'var(--color-text-faint)' }}>
          {col.dataType}
        </span>
      )}
      <span className="flex gap-0.5 shrink-0">
        {col.isPrimaryKey && <Chip label="PK" color="#f0a93f" />}
        {col.isForeignKey && <Chip label="FK" color="#4fd6e0" />}
        {col.isUnique && !col.isPrimaryKey && <Chip label="UQ" color="#b08af0" />}
        {col.isIndexed && <Chip label="IDX" color="#5fd896" />}
        {col.isNotNull && !col.isPrimaryKey && <Chip label="NN" color="#7c879f" />}
      </span>
    </div>
  );
}

export default function SchemaNodeComponent({ data, selected }: NodeProps & { data: SchemaNode }) {
  const color = SCHEMA_NODE_ROLE_COLOR[data.role];
  const height = schemaNodeHeight(data.columns.length);

  return (
    <div
      style={{ width: SCHEMA_NODE_WIDTH, minHeight: height, borderColor: selected ? color : 'var(--color-border)' }}
      className="rounded-lg border bg-(--color-surface) shadow-lg overflow-hidden transition-shadow"
    >
      <Handle type="target" position={Position.Left} style={{ background: color, border: 'none', width: 7, height: 7 }} />
      <Handle type="source" position={Position.Right} style={{ background: color, border: 'none', width: 7, height: 7 }} />

      {/* Header */}
      <div
        className="flex items-center gap-1.5 px-2.5 py-2 border-b"
        style={{
          borderColor: 'var(--color-border-soft)',
          borderLeft: `3px solid ${color}`,
          borderLeftStyle: 'solid',
        }}
      >
        <span
          className="text-[12.5px] font-semibold truncate flex-1"
          style={{ color: 'var(--color-text)' }}
          title={data.tableName}
        >
          {data.tableName}
        </span>
        <span
          className="text-[8px] font-bold tracking-wider px-1 py-0.5 rounded shrink-0"
          style={{ color, background: `${color}1f` }}
        >
          {data.role.toUpperCase()}
        </span>
      </div>

      {/* Columns */}
      <div className="py-1">
        {data.columns.length === 0 && (
          <div className="px-2.5 py-1.5 text-[10.5px] italic" style={{ color: 'var(--color-text-faint)' }}>
            no columns
          </div>
        )}
        {data.columns.map((col) => (
          <ColumnRow key={col.name} col={col} />
        ))}
      </div>

      {/* Footer: composite PK */}
      {data.compositePK && (
        <div
          className="px-2.5 py-1.5 text-[9.5px] italic border-t truncate"
          style={{ color: 'var(--color-text-faint)', borderColor: 'var(--color-border-soft)' }}
          title={`Composite PK: ${data.compositePK.join(', ')}`}
        >
          PK: {data.compositePK.join(', ')}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/nodes/SchemaNode.tsx
git commit -m "feat: SchemaNode component with typed column rows and PK/FK/UQ/IDX chips"
```

---

### Task 6: Wire Schema into DiagramCanvas

**Files:**
- Modify: `src/components/DiagramCanvas.tsx`

- [ ] **Step 1: Add `'schema'` to `ViewMode` and register `SchemaNode`**

In `src/components/DiagramCanvas.tsx`:

Change the `ViewMode` type:

```tsx
export type ViewMode = 'relationship' | 'flow' | 'schema';
```

Add import for `SchemaNode` and schema layout:

```tsx
import SchemaNodeComponent from './nodes/SchemaNode';
import { layoutSchemaGraph } from '../layout/schemaLayout';
import { SCHEMA_NODE_ROLE_COLOR, FK_EDGE_COLOR } from '../lib/theme';
import type { SchemaNode } from '../sql/types';
```

Add `schemaNode` to the `nodeTypes` map:

```tsx
const nodeTypes = {
  relation: RelationNode,
  stage: StageNode,
  laneLabel: LaneLabelNode,
  schemaNode: SchemaNodeComponent,
};
```

- [ ] **Step 2: Add schema branch to `buildGraph`**

Add before the final `return { nodes: [], edges: [] }` in the `buildGraph` function:

```tsx
if (view === 'schema' && result.schema) {
  const graph = result.schema;
  const { positions } = layoutSchemaGraph(graph);

  const nodes: Node[] = graph.nodes.map((n) => ({
    id: n.id,
    type: 'schemaNode',
    position: positions.get(n.id) ?? { x: 0, y: 0 },
    data: n as any,
    draggable: true,
  }));

  const edges: Edge[] = graph.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    labelStyle: { fill: FK_EDGE_COLOR, fontSize: 9.5, fontWeight: 700, fontFamily: 'var(--font-mono)' },
    labelBgStyle: { fill: '#0f1420', fillOpacity: 0.9 },
    labelBgPadding: [4, 2] as [number, number],
    style: { stroke: FK_EDGE_COLOR, strokeWidth: 1.75 },
    markerEnd: { type: MarkerType.ArrowClosed, color: FK_EDGE_COLOR, width: 14, height: 14 },
    markerStart: { type: MarkerType.Arrow, color: FK_EDGE_COLOR, width: 10, height: 10 },
  }));

  return { nodes, edges };
}
```

Also update the `MiniMap` `nodeColor` callback to handle schema nodes:

```tsx
nodeColor={(n: Node) => {
  const data = n.data as any;
  if (n.type === 'schemaNode') return SCHEMA_NODE_ROLE_COLOR[data.role as keyof typeof SCHEMA_NODE_ROLE_COLOR] ?? '#4fd6e0';
  return n.type === 'relation'
    ? KIND_COLOR[data.kind as keyof typeof KIND_COLOR]
    : STAGE_COLOR[data.kind as keyof typeof STAGE_COLOR] || '#3a4560';
}}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/components/DiagramCanvas.tsx
git commit -m "feat: schema view branch in DiagramCanvas with FK edges"
```

---

### Task 7: DDL Sample Queries

**Files:**
- Create: `src/lib/ddlSampleQueries.ts`

- [ ] **Step 1: Create `src/lib/ddlSampleQueries.ts`**

```typescript
import type { SampleQuery } from './sampleQueries';

export const DDL_SAMPLE_QUERIES: SampleQuery[] = [
  {
    label: 'Users & Posts',
    description: 'Simple two-table schema with a FK relationship',
    sql: `CREATE TABLE users (
  id INT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL
);

CREATE TABLE posts (
  id INT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT,
  published_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);`,
  },
  {
    label: 'E-commerce',
    description: 'Customers, orders, items, and products with FKs',
    sql: `CREATE TABLE customers (
  id INT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  region VARCHAR(100)
);

CREATE TABLE products (
  id INT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0
);

CREATE TABLE orders (
  id INT PRIMARY KEY,
  customer_id INT NOT NULL,
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE order_items (
  id INT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);`,
  },
  {
    label: 'Many-to-Many',
    description: 'Junction table pattern: students, courses, enrollments',
    sql: `CREATE TABLE students (
  id INT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  enrolled_at DATE NOT NULL
);

CREATE TABLE courses (
  id INT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  credits INT NOT NULL,
  instructor VARCHAR(255)
);

CREATE TABLE enrollments (
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  grade CHAR(2),
  enrolled_at TIMESTAMP NOT NULL,
  PRIMARY KEY (student_id, course_id),
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (course_id) REFERENCES courses(id)
);`,
  },
  {
    label: 'Indexes & Constraints',
    description: 'Schema with unique constraints, indexes, and ALTER TABLE FKs',
    sql: `CREATE TABLE departments (
  id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  budget DECIMAL(15,2)
);

CREATE TABLE employees (
  id INT PRIMARY KEY,
  department_id INT,
  manager_id INT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  salary DECIMAL(10,2) NOT NULL,
  hired_at DATE NOT NULL
);

CREATE UNIQUE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_dept ON employees(department_id);

ALTER TABLE employees
  ADD CONSTRAINT fk_emp_dept FOREIGN KEY (department_id) REFERENCES departments(id);

ALTER TABLE employees
  ADD CONSTRAINT fk_emp_mgr FOREIGN KEY (manager_id) REFERENCES employees(id);`,
  },
];
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/ddlSampleQueries.ts
git commit -m "feat: four DDL sample queries for Schema Explorer"
```

---

### Task 8: Wire Schema Mode into App.tsx

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/Toolbar.tsx`

- [ ] **Step 1: Add schema parsing pipeline to `App.tsx`**

Add imports:

```tsx
import { parseDDL } from './sql/ddlParser';
import { buildSchemaGraph } from './sql/schemaGraph';
import { DDL_SAMPLE_QUERIES } from './lib/ddlSampleQueries';
import type { SchemaGraph } from './sql/types';
```

Add `schemaSql` state and schema result state:

```tsx
const [schemaSql, setSchemaSql] = useState(DDL_SAMPLE_QUERIES[1].sql);
const [schemaGraph, setSchemaGraph] = useState<SchemaGraph | null>(null);
const [schemaError, setSchemaError] = useState<string | null>(null);
```

Add a schema parse effect:

```tsx
useEffect(() => {
  if (mode !== 'schema') return;
  const handle = setTimeout(() => {
    const ddlResult = parseDDL(schemaSql, database);
    if (ddlResult.errors.length) {
      setSchemaError(ddlResult.errors[0]);
      setSchemaGraph(null);
    } else if (ddlResult.tables.size === 0) {
      setSchemaError('No CREATE TABLE statements found.');
      setSchemaGraph(null);
    } else {
      setSchemaError(null);
      setSchemaGraph(buildSchemaGraph(ddlResult));
    }
  }, 350);
  return () => clearTimeout(handle);
}, [schemaSql, database, mode]);
```

- [ ] **Step 2: Build a `ParseResult` for schema mode and pass to `DiagramCanvas`**

Replace `SchemaPlaceholder` usage in the canvas section with the real schema canvas. Update the canvas `<section>`:

```tsx
<section className="flex-1 relative min-h-[360px]">
  {mode === 'schema' ? (
    schemaGraph ? (
      <DiagramCanvas
        ref={canvasRef}
        result={{ ok: true, schema: schemaGraph }}
        view="schema"
      />
    ) : (
      <SchemaEmptyState error={schemaError} />
    )
  ) : sql.trim() === '' ? (
    <SampleGrid
      samples={SAMPLE_QUERIES}
      prompt="Paste a SELECT query — or pick a sample to get started:"
      onSelect={setSql}
    />
  ) : showCanvas ? (
    <DiagramCanvas ref={canvasRef} result={result} view={view} />
  ) : (
    <EmptyState hasError={!result.ok && !!result.error} />
  )}
</section>
```

Replace `SchemaPlaceholder` function with `SchemaEmptyState`:

```tsx
function SchemaEmptyState({ error }: { error: string | null }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center max-w-xs px-6">
        <Database size={28} color="var(--color-border)" className="mx-auto mb-3" />
        {error ? (
          <p className="text-[11.5px]" style={{ color: 'var(--color-rose)' }}>{error}</p>
        ) : (
          <p className="text-[12px]" style={{ color: 'var(--color-text-faint)' }}>
            Paste a CREATE TABLE script to visualize your schema.
          </p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Show correct SQL in editor per mode**

Update `SqlEditor` to show schema SQL when in schema mode:

```tsx
<SqlEditor
  value={mode === 'schema' ? schemaSql : sql}
  onChange={mode === 'schema' ? setSchemaSql : setSql}
  errorLine={mode === 'schema' ? undefined : result.errorPosition?.line}
  dialect={database}
/>
```

Update the error display below the editor:

```tsx
{mode === 'query' && !result.ok && result.error && (
  <div ...>
    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
    <span>{result.error}</span>
  </div>
)}
{mode === 'schema' && schemaError && (
  <div ...>
    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
    <span>{schemaError}</span>
  </div>
)}
```

- [ ] **Step 4: Update `Toolbar.tsx` to show DDL samples in schema mode**

Replace `src/components/Toolbar.tsx`:

```tsx
import { SAMPLE_QUERIES } from '../lib/sampleQueries';
import { DDL_SAMPLE_QUERIES } from '../lib/ddlSampleQueries';
import type { AppMode } from './ModeToggle';

const DIALECTS = ['PostgreSQL', 'MySQL', 'TransactSQL', 'Sqlite', 'BigQuery', 'Snowflake'];

const selectStyle: React.CSSProperties = {
  background: 'var(--color-bg-raised)',
  borderColor: 'var(--color-border)',
  color: 'var(--color-text-dim)',
};

export default function Toolbar({
  database,
  mode,
  onDatabaseChange,
  onPickSample,
}: {
  database: string;
  mode: AppMode;
  onDatabaseChange: (db: string) => void;
  onPickSample: (sql: string) => void;
}) {
  const samples = mode === 'schema' ? DDL_SAMPLE_QUERIES : SAMPLE_QUERIES;

  return (
    <div className="flex items-center gap-2">
      <select
        defaultValue=""
        onChange={(e) => {
          const q = samples.find((s) => s.label === e.target.value);
          if (q) onPickSample(q.sql);
          e.target.value = '';
        }}
        className="text-[11px] rounded-md border px-2 py-1.5 outline-none flex-1 min-w-0"
        style={selectStyle}
      >
        <option value="" disabled>
          {mode === 'schema' ? 'Try a DDL sample…' : 'Try a sample query…'}
        </option>
        {samples.map((q) => (
          <option key={q.label} value={q.label}>
            {q.label}
          </option>
        ))}
      </select>

      <select
        value={database}
        onChange={(e) => onDatabaseChange(e.target.value)}
        className="text-[11px] rounded-md border px-2 py-1.5 outline-none shrink-0"
        style={selectStyle}
      >
        {DIALECTS.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
    </div>
  );
}
```

Update `Toolbar` usage in `App.tsx` to pass `mode` and correct `onPickSample`:

```tsx
<Toolbar
  database={database}
  mode={mode}
  onDatabaseChange={setDatabase}
  onPickSample={mode === 'schema' ? setSchemaSql : setSql}
/>
```

- [ ] **Step 5: Also update `Legend` to hide in schema mode**

In `App.tsx`, wrap `<Legend>` with a mode guard:

```tsx
{mode === 'query' && <Legend view={view} />}
```

- [ ] **Step 6: Verify build**

```bash
npm run build
```

- [ ] **Step 7: Verify in browser**

```bash
npm run dev
```

Switch to Schema mode. Confirm:
- E-commerce sample loads and shows 4 table nodes with FK edges between them
- Column chips (PK, FK, NN, UQ, IDX) appear correctly on each column row
- Switching back to Query mode restores the SQL diagram
- DDL sample dropdown shows the 4 DDL samples
- The "Many-to-Many" sample shows the junction table colored purple

- [ ] **Step 8: Commit**

```bash
git add src/App.tsx src/components/Toolbar.tsx
git commit -m "feat: Schema Explorer mode — DDL parsing, ER diagram, DDL samples"
```

---

**Plan B complete.** Schema mode now parses DDL and renders a fully typed ER diagram with FK edges and column-level indicators. Plan C (Query Analyzer Enhancements) is independent and can be executed in any order.
