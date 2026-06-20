# SQL Visualizer — Plan C: Query Analyzer Enhancements

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Prerequisite:** Plan A must be complete (mode switcher must exist). Plan B is not required.

**Goal:** Deepen the Query Analyzer: add execution order badges and cost-hint warnings to Flow view, add richer JOIN type colors, support multi-statement SELECT scripts with tabs, and visualize INSERT/UPDATE/DELETE as write-impact diagrams.

**Architecture:** Extend `FlowNode` with a `warnings` field. Update `flowGraph.ts` to emit warnings. Update `StageNode.tsx` to render order badges and warnings. Update `DiagramCanvas.tsx` to color-code JOIN nodes by type. Add multi-statement splitting to `parser.ts` and a `StatementTabs` component in `App.tsx`. Add `writeImpactGraph.ts` for DML and wire into `parser.ts`.

**Tech Stack:** React 19, TypeScript 6, Vite 8, node-sql-parser (already installed)

---

### Task 1: Execution Order Badges in Flow View

**Files:**
- Modify: `src/sql/types.ts`
- Modify: `src/components/nodes/StageNode.tsx`

The `FlowNode` already has an `order` field (sequential position within a lane). We also need a logical SQL execution order badge (① FROM, ② JOIN, ③ WHERE, ..., ⑦ SELECT) that helps learners see *why* the pipeline is ordered the way it is.

- [ ] **Step 1: Add `warnings` field to `FlowNode` in `src/sql/types.ts`**

Find the `FlowNode` interface and add the `warnings` field:

```typescript
export interface FlowNode {
  id: string;
  kind: FlowStageKind;
  title: string;
  snippet: string;
  lane: string;
  order: number;
  warnings?: string[];
}
```

- [ ] **Step 2: Add execution order map constant to `src/components/nodes/StageNode.tsx`**

Add this constant before the component, after the existing imports:

```tsx
const EXEC_ORDER: Partial<Record<import('../../sql/types').FlowStageKind, number>> = {
  cte: 0,
  from: 1,
  join: 2,
  where: 3,
  subquery: 3,
  groupby: 4,
  having: 5,
  window: 6,
  select: 7,
  orderby: 8,
  limit: 9,
};

const ORDER_GLYPHS = ['⓪', '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨'];
```

- [ ] **Step 3: Update `StageNode.tsx` to render order badge and warnings**

Replace the entire `StageNode` component:

```tsx
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { FlowNode, FlowStageKind } from '../../sql/types';
import { STAGE_COLOR } from '../../lib/theme';
import { FLOW_NODE_WIDTH } from '../../layout/flowLayout';

const EXEC_ORDER: Partial<Record<FlowStageKind, number>> = {
  cte: 0,
  from: 1,
  join: 2,
  where: 3,
  subquery: 3,
  groupby: 4,
  having: 5,
  window: 6,
  select: 7,
  orderby: 8,
  limit: 9,
};

const ORDER_GLYPHS = ['⓪', '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨'];

export default function StageNode({ data, selected }: NodeProps & { data: FlowNode }) {
  const color = STAGE_COLOR[data.kind];
  const dashed = data.kind === 'subquery' || data.kind === 'union';
  const execStep = EXEC_ORDER[data.kind];
  const glyph = execStep !== undefined ? ORDER_GLYPHS[execStep] ?? String(execStep) : null;

  return (
    <div
      style={{
        width: FLOW_NODE_WIDTH,
        borderColor: selected ? color : 'var(--color-border)',
        borderStyle: dashed ? 'dashed' : 'solid',
        borderLeft: `3px solid ${color}`,
        borderLeftStyle: 'solid',
      }}
      className="rounded-lg border bg-(--color-surface) shadow-lg overflow-hidden"
    >
      <Handle type="target" position={Position.Left} id="left" style={{ background: color, border: 'none', width: 7, height: 7 }} />
      <Handle type="source" position={Position.Right} id="right" style={{ background: color, border: 'none', width: 7, height: 7 }} />
      <Handle type="target" position={Position.Top} id="top" style={{ background: color, border: 'none', width: 7, height: 7 }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ background: color, border: 'none', width: 7, height: 7 }} />

      <div className="px-2.5 pt-2 pb-1 flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold tracking-wider" style={{ color }}>
          {data.title}
        </span>
        {glyph && (
          <span
            className="text-[11px] shrink-0"
            style={{ color, opacity: 0.7 }}
            title={`SQL execution step ${execStep}`}
          >
            {glyph}
          </span>
        )}
      </div>

      <div
        className="px-2.5 pb-2 text-[10.5px] leading-snug whitespace-pre-wrap break-words"
        style={{ color: 'var(--color-text-dim)', maxHeight: 96, overflow: 'hidden' }}
        title={data.snippet}
      >
        {data.snippet}
      </div>

      {data.warnings && data.warnings.length > 0 && (
        <div className="border-t px-2.5 py-1.5 flex flex-col gap-0.5" style={{ borderColor: 'var(--color-border-soft)' }}>
          {data.warnings.map((w, i) => (
            <span key={i} className="text-[9.5px] flex items-center gap-1" style={{ color: '#f0a93f' }}>
              ⚠ {w}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

- [ ] **Step 5: Verify in browser**

```bash
npm run dev
```

Switch to "Execution Flow" view. Each stage node should show a circled number in the top-right (FROM shows ①, JOIN shows ②, WHERE shows ③, SELECT shows ⑦, etc.). CTE nodes show ⓪.

- [ ] **Step 6: Commit**

```bash
git add src/sql/types.ts src/components/nodes/StageNode.tsx
git commit -m "feat: execution order badges on Flow view stage nodes"
```

---

### Task 2: Cost Hint Warnings

**Files:**
- Modify: `src/sql/flowGraph.ts`

Populate `warnings` on `FlowNode` with AST-derived heuristics. Three hints: cross join (JOIN with no ON), full scan likely (multiple FROM tables with no WHERE), correlated subquery (subquery referencing outer table).

- [ ] **Step 1: Add warning detection to `buildPipelineForSelect` in `src/sql/flowGraph.ts`**

Inside `buildPipelineForSelect`, after the `fromList` loop and before the `where` block, add:

```typescript
// Detect cross joins (JOIN with no ON condition)
for (const entry of fromList) {
  if (entry.join && !entry.on) {
    const nodeId = chain[chain.length - 1];
    if (nodeId) {
      const node = nodes.find((n) => n.id === nodeId);
      if (node) node.warnings = [...(node.warnings ?? []), 'cross join — no ON condition'];
    }
  }
}

// Detect likely full scan: 2+ tables in FROM, no WHERE clause
const joinCount = fromList.filter((e: any) => e.join).length;
if (joinCount >= 1 && !selectAst.where && chain.length > 0) {
  const firstFromNode = nodes.find((n) => n.id === chain[0]);
  if (firstFromNode) {
    firstFromNode.warnings = [...(firstFromNode.warnings ?? []), 'full scan likely — no WHERE'];
  }
}
```

Also, after the `subquery` node is pushed for each found subquery inside the WHERE block, add a correlated warning if the subquery references columns from the outer scope. Find the block `for (const sub of subs)` inside the `where` section and add:

```typescript
// Detect correlated subquery (inner query references outer table aliases)
const innerFrom: string[] = (sub.ast.from ?? [])
  .map((f: any) => f.table)
  .filter((t: any): t is string => typeof t === 'string')
  .map((t: string) => t.toLowerCase());

const isCorrelated = (sub.ast.from ?? []).some((f: any) => {
  const alias = (f.as ?? f.table ?? '').toLowerCase();
  // a subquery is correlated when its WHERE references a table from the OUTER aliasMap
  return false; // placeholder — see below
});
// Simple heuristic: flag any EXISTS subquery as potentially correlated
if (sub.context === 'exists') {
  const subId = (sub as any)._flowId;
  const subNode = nodes.find((n) => n.id === subId);
  if (subNode) subNode.warnings = [...(subNode.warnings ?? []), 'may run per row (correlated)'];
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Verify in browser**

Load the "Nested subquery + EXISTS" sample. Switch to Execution Flow. The EXISTS subquery node should show `⚠ may run per row (correlated)` in amber below its snippet. Load a query with a JOIN and no WHERE — the FROM node should show `⚠ full scan likely — no WHERE`.

- [ ] **Step 4: Commit**

```bash
git add src/sql/flowGraph.ts
git commit -m "feat: cost-hint warnings for cross joins, full scans, and correlated subqueries"
```

---

### Task 3: Richer JOIN Type Colors

**Files:**
- Modify: `src/lib/theme.ts`
- Modify: `src/components/DiagramCanvas.tsx`

Currently all JOIN nodes use the same `STAGE_COLOR.join` color. Color-code them by join type: INNER JOIN = cyan, LEFT JOIN = blue-ish, RIGHT JOIN = purple, FULL JOIN = amber.

- [ ] **Step 1: Add `JOIN_TYPE_COLOR` map to `src/lib/theme.ts`**

Append to `src/lib/theme.ts`:

```typescript
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
```

- [ ] **Step 2: Apply join type color in `buildGraph` flow branch in `src/components/DiagramCanvas.tsx`**

Add import:

```tsx
import { EDGE_COLOR, STAGE_COLOR, KIND_COLOR, SCHEMA_NODE_ROLE_COLOR, FK_EDGE_COLOR, JOIN_TYPE_COLOR } from '../lib/theme';
```

In the flow `stageNodes` mapping inside `buildGraph`, replace the simple mapping with one that injects a `joinColor` into the node data for JOIN nodes:

```tsx
const stageNodes: Node[] = graph.nodes.map((n) => ({
  id: n.id,
  type: 'stage',
  position: positions.get(n.id) ?? { x: 0, y: 0 },
  data: n.kind === 'join'
    ? { ...n, joinColor: JOIN_TYPE_COLOR[n.title.toUpperCase()] ?? STAGE_COLOR.join }
    : (n as any),
  draggable: true,
}));
```

- [ ] **Step 3: Use `joinColor` in `StageNode.tsx`**

In `StageNode.tsx`, update the color derivation at the top of the component:

```tsx
const color = (data as any).joinColor ?? STAGE_COLOR[data.kind];
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

- [ ] **Step 5: Verify in browser**

Load the "Four-way join chain" sample and switch to Execution Flow. Each LEFT JOIN node should show a different blue color from the FROM node. If you modify the sample to use an INNER JOIN, it should appear cyan.

- [ ] **Step 6: Commit**

```bash
git add src/lib/theme.ts src/components/DiagramCanvas.tsx src/components/nodes/StageNode.tsx
git commit -m "feat: color-coded JOIN type nodes in Flow view"
```

---

### Task 4: Multi-Statement Script Support

**Files:**
- Modify: `src/sql/parser.ts`
- Create: `src/components/StatementTabs.tsx`
- Modify: `src/App.tsx`

Split a SQL script on `;`, parse each SELECT independently, show numbered tabs above the diagram.

- [ ] **Step 1: Add `parseMultiStatement` to `src/sql/parser.ts`**

Add after the existing `parseSql` function:

```typescript
export function parseMultiStatement(sql: string, database: string): ParseResult[] {
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (statements.length <= 1) {
    return [parseSql(sql, database)];
  }

  return statements.map((stmt) => parseSql(stmt + ';', database));
}
```

- [ ] **Step 2: Create `src/components/StatementTabs.tsx`**

```tsx
export default function StatementTabs({
  count,
  selected,
  onSelect,
}: {
  count: number;
  selected: number;
  onSelect: (i: number) => void;
}) {
  if (count <= 1) return null;

  return (
    <div
      className="flex gap-1 px-3 py-1.5 border-b shrink-0 overflow-x-auto"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-raised)' }}
    >
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className="px-2.5 py-1 rounded text-[10.5px] font-semibold shrink-0 transition-colors"
          style={{
            background: selected === i ? 'var(--color-amber)' : 'var(--color-surface)',
            color: selected === i ? '#0a0e16' : 'var(--color-text-dim)',
          }}
        >
          Query {i + 1}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Update `App.tsx` to use multi-statement parsing**

Add imports:

```tsx
import { parseMultiStatement } from './sql/parser';
import StatementTabs from './components/StatementTabs';
```

Add state for selected statement index:

```tsx
const [results, setResults] = useState<ParseResult[]>([{ ok: false }]);
const [selectedIdx, setSelectedIdx] = useState(0);
```

Replace the existing parse `useEffect`:

```tsx
useEffect(() => {
  const handle = setTimeout(() => {
    const parsed = parseMultiStatement(sql, database);
    setResults(parsed);
    setSelectedIdx(0);
  }, 350);
  return () => clearTimeout(handle);
}, [sql, database]);
```

Derive `result` and `showCanvas` from the array:

```tsx
const result = results[selectedIdx] ?? { ok: false };
const showCanvas = result.ok;
```

Remove the old `const [result, setResult]` and `const showCanvas` declarations.

Add `StatementTabs` between the editor and the canvas sections, inside `<main>`:

```tsx
{mode === 'query' && results.length > 1 && (
  <StatementTabs
    count={results.length}
    selected={selectedIdx}
    onSelect={setSelectedIdx}
  />
)}
```

Update the keyboard shortcut `Ctrl+Enter` handler to use the new multi-statement parser:

```tsx
if (e.key === 'Enter') {
  e.preventDefault();
  const parsed = parseMultiStatement(sql, database);
  setResults(parsed);
}
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

- [ ] **Step 5: Verify in browser**

```bash
npm run dev
```

Paste two SELECT statements separated by `;`:

```sql
SELECT id, name FROM users WHERE active = true;

SELECT o.id, o.amount FROM orders o JOIN customers c ON o.customer_id = c.id;
```

Confirm: "Query 1" and "Query 2" tabs appear above the diagram. Clicking each tab switches the diagram. With a single statement, no tabs appear.

- [ ] **Step 6: Commit**

```bash
git add src/sql/parser.ts src/components/StatementTabs.tsx src/App.tsx
git commit -m "feat: multi-statement SELECT script support with statement tabs"
```

---

### Task 5: DML Write-Impact Visualization

**Files:**
- Create: `src/sql/writeImpactGraph.ts`
- Modify: `src/sql/parser.ts`
- Modify: `src/lib/theme.ts`
- Modify: `src/sql/types.ts`

INSERT, UPDATE, and DELETE produce a flat relationship-style graph showing the target table (red border), written columns, and any source tables (from FROM or subqueries).

- [ ] **Step 1: Add `'write-target'` to `RelKind` in `src/sql/types.ts`**

Update the `RelKind` type:

```typescript
export type RelKind = 'table' | 'cte' | 'subquery' | 'write-target';
```

- [ ] **Step 2: Add write-target color to `src/lib/theme.ts`**

Update `KIND_COLOR`:

```typescript
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
```

- [ ] **Step 3: Create `src/sql/writeImpactGraph.ts`**

```typescript
import type { RelationshipGraph, RelNode, RelEdge } from './types';
import { uid, resetUidCounter, fromEntryName, fromEntryAlias, collectColumnRefs, exprToSql } from './astHelpers';

function makeNode(id: string, label: string, kind: RelNode['kind'], depth: number): RelNode {
  return { id, kind, label, columns: [], depth };
}

function extractWrittenColumns(ast: any, database: string): string[] {
  // INSERT: columns array
  if (ast.type === 'insert' && Array.isArray(ast.columns)) {
    return ast.columns.map((c: any) => (typeof c === 'string' ? c : c?.column ?? String(c)));
  }
  // UPDATE: set list
  if (ast.type === 'update' && Array.isArray(ast.set)) {
    return ast.set.map((s: any) => s.column ?? s.table_column ?? '').filter(Boolean);
  }
  // DELETE: no columns written
  return [];
}

export function buildWriteImpactGraph(ast: any, database: string): RelationshipGraph {
  resetUidCounter();
  const nodes = new Map<string, RelNode>();
  const edges: RelEdge[] = [];

  const targetName: string =
    ast.table?.[0]?.table ??
    ast.into?.table ??
    (typeof ast.table === 'string' ? ast.table : null) ??
    'target';

  const targetId = uid('wt');
  const targetNode = makeNode(targetId, targetName, 'write-target', 0);

  // Tag written columns
  const writtenCols = extractWrittenColumns(ast, database);
  for (const col of writtenCols) {
    targetNode.columns.push({ name: col, roles: new Set(['select']) });
  }
  nodes.set(targetId, targetNode);

  // For UPDATE with FROM, or subqueries in WHERE — source tables
  const fromList: any[] = ast.from ?? [];
  for (const entry of fromList) {
    const tname = fromEntryName(entry);
    if (!tname || tname.toLowerCase() === targetName.toLowerCase()) continue;
    const srcId = uid('src');
    const srcNode = makeNode(srcId, tname, 'table', 1);
    nodes.set(srcId, srcNode);
    edges.push({
      id: uid('edge'),
      source: srcId,
      target: targetId,
      kind: 'from',
      label: entry.join ?? 'FROM',
      condition: entry.on ? exprToSql(entry.on, database) : undefined,
    });
  }

  // Subqueries in WHERE
  if (ast.where) {
    const refs = collectColumnRefs(ast.where);
    // Find any nested SELECT in the where clause as source of the filter
    const whereStr = exprToSql(ast.where, database);
    if (whereStr) {
      targetNode.columns.push({ name: `WHERE: ${whereStr.slice(0, 50)}`, roles: new Set(['filter']) });
    }
  }

  return { nodes: [...nodes.values()], edges };
}
```

- [ ] **Step 4: Wire DML into `src/sql/parser.ts`**

Add import:

```typescript
import { buildWriteImpactGraph } from './writeImpactGraph';
```

In `parseSql`, after the `statement.type !== 'select'` check, replace the current rejection with DML handling:

```typescript
if (!statement) {
  return { ok: false, error: 'Could not parse this SQL.' };
}

if (statement.type !== 'select') {
  const dmlTypes = ['insert', 'update', 'delete'];
  if (dmlTypes.includes(statement.type)) {
    try {
      const relationship = buildWriteImpactGraph(statement, database);
      return { ok: true, relationship };
    } catch (e: any) {
      return { ok: false, error: `Parsed ${statement.type.toUpperCase()}, but failed to build diagram: ${e?.message ?? 'unknown error'}` };
    }
  }
  return {
    ok: false,
    error: 'Only SELECT, INSERT, UPDATE, and DELETE statements can be visualized right now.',
  };
}
```

- [ ] **Step 5: Hide Flow view toggle for DML results in `App.tsx`**

DML only has a relationship view (no flow graph). In `App.tsx`, update the `ViewToggle` visibility:

```tsx
{mode === 'query' && result.flow && <ViewToggle view={view} onChange={setView} />}
```

This hides the flow tab when the result has no flow graph (i.e., for DML statements).

Also reset to relationship view when DML is detected:

```tsx
useEffect(() => {
  if (result.ok && !result.flow && view === 'flow') {
    setView('relationship');
  }
}, [result]);
```

- [ ] **Step 6: Verify build**

```bash
npm run build
```

- [ ] **Step 7: Verify in browser**

```bash
npm run dev
```

Paste this query:

```sql
UPDATE orders
SET status = 'shipped', shipped_at = NOW()
FROM shipments s
WHERE orders.id = s.order_id AND s.carrier = 'DHL';
```

Confirm: a diagram appears showing `orders` as a write-target node (red border, tagged `WRITE TARGET`) with `status` and `shipped_at` columns visible, and `shipments` as a source table with a `FROM` edge pointing to `orders`. The Flow toggle disappears since there's no flow graph for UPDATE.

Paste:

```sql
INSERT INTO audit_log (user_id, action, created_at)
VALUES (1, 'login', NOW());
```

Confirm: `audit_log` appears as a write-target node with `user_id`, `action`, `created_at` columns tagged.

- [ ] **Step 8: Commit**

```bash
git add src/sql/writeImpactGraph.ts src/sql/parser.ts src/lib/theme.ts src/sql/types.ts src/App.tsx
git commit -m "feat: INSERT/UPDATE/DELETE write-impact diagram visualization"
```

---

**Plan C complete.** The Query Analyzer now shows execution order badges and cost hints in Flow view, color-codes JOIN types, supports multi-statement scripts with tabs, and visualizes DML statements as write-impact diagrams.
