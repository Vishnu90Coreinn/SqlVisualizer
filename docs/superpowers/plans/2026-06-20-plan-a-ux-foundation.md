# SQL Visualizer — Plan A: UX Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the editor to CodeMirror 6, add URL-based sharing, PNG export, a mode switcher (Query/Schema), keyboard shortcuts, and an improved empty state with clickable sample cards.

**Architecture:** Add `urlState.ts` and `exportPng.ts` utilities, replace `SqlEditor.tsx` internals with CodeMirror 6 (same external API), add `forwardRef` to `DiagramCanvas` exposing `fitView`/`exportPng`, create `ModeToggle.tsx` and `SampleGrid.tsx` components, update `App.tsx` to hold `mode` state and wire everything together.

**Tech Stack:** React 19, TypeScript 6, Vite 8, @uiw/react-codemirror, @codemirror/lang-sql, html-to-image, @xyflow/react, lucide-react

---

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json` (via npm)

- [ ] **Step 1: Install packages**

```bash
npm install @uiw/react-codemirror @codemirror/lang-sql html-to-image
```

Expected: `added N packages in Xs`

- [ ] **Step 2: Verify build still passes**

```bash
npm run build
```

Expected: Build completes with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add codemirror 6 and html-to-image dependencies"
```

---

### Task 2: Replace SqlEditor with CodeMirror 6

**Files:**
- Modify: `src/components/SqlEditor.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Rewrite `src/components/SqlEditor.tsx`**

```tsx
import { useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { sql, PostgreSQL, MySQL, SQLite, MSSQL, StandardSQL, BigQuery } from '@codemirror/lang-sql';
import { EditorView, Decoration } from '@codemirror/view';
import type { Extension } from '@codemirror/state';

const dialectMap: Record<string, any> = {
  PostgreSQL,
  MySQL,
  Sqlite: SQLite,
  TransactSQL: MSSQL,
  BigQuery,
  Snowflake: StandardSQL,
};

const baseTheme = EditorView.theme(
  {
    '&': { height: '100%', background: 'var(--color-bg-raised)' },
    '.cm-scroller': {
      fontFamily: 'var(--font-mono)',
      fontSize: '12px',
      lineHeight: '20px',
      overflow: 'auto',
    },
    '.cm-content': { padding: '12px 12px 12px 0', caretColor: 'var(--color-amber)' },
    '.cm-line': { padding: '0 12px' },
    '.cm-cursor': { borderLeftColor: 'var(--color-amber)' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
      background: 'rgba(240,169,63,0.2) !important',
    },
    '.cm-activeLine': { background: 'rgba(255,255,255,0.025)' },
    '.cm-gutters': {
      background: 'var(--color-surface)',
      borderRight: '1px solid var(--color-border)',
      color: 'var(--color-text-faint)',
      minWidth: '36px',
    },
    '.cm-lineNumbers .cm-gutterElement': { padding: '0 8px' },
    '.cm-activeLineGutter': {
      background: 'var(--color-surface-2)',
      color: 'var(--color-text-dim)',
    },
    '.cm-error-line': { background: 'rgba(240,112,140,0.12)' },
    '.cm-matchingBracket': {
      background: 'rgba(240,169,63,0.2)',
      color: 'var(--color-amber) !important',
      outline: 'none',
    },
  },
  { dark: true }
);

function errorLineExt(errorLine: number | undefined): Extension {
  if (!errorLine) return [];
  return EditorView.decorations.compute([], (state) => {
    try {
      const line = state.doc.line(errorLine);
      return Decoration.set([Decoration.line({ class: 'cm-error-line' }).range(line.from)]);
    } catch {
      return Decoration.none;
    }
  });
}

export default function SqlEditor({
  value,
  onChange,
  errorLine,
  dialect,
}: {
  value: string;
  onChange: (v: string) => void;
  errorLine?: number;
  dialect?: string;
}) {
  const extensions = useMemo(
    () => [
      sql({ dialect: dialect ? dialectMap[dialect] : undefined }),
      baseTheme,
      errorLineExt(errorLine),
    ],
    [errorLine, dialect]
  );

  return (
    <CodeMirror
      value={value}
      onChange={(v) => onChange(v)}
      extensions={extensions}
      height="100%"
      placeholder="Paste a SQL query here..."
      basicSetup={{
        lineNumbers: true,
        highlightActiveLine: true,
        bracketMatching: true,
        autocompletion: false,
        foldGutter: false,
        indentOnInput: true,
      }}
      style={{
        height: '100%',
        overflow: 'hidden',
        borderRadius: '8px',
        border: '1px solid var(--color-border)',
      }}
    />
  );
}
```

- [ ] **Step 2: Pass `dialect` prop in `App.tsx`**

Find `<SqlEditor` in `src/App.tsx` and update it:

```tsx
<SqlEditor
  value={sql}
  onChange={setSql}
  errorLine={result.errorPosition?.line}
  dialect={database}
/>
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: No TypeScript errors.

- [ ] **Step 4: Verify in browser**

```bash
npm run dev
```

Open http://localhost:5173. Confirm:
- SQL keywords (SELECT, FROM, WHERE, JOIN) are syntax-highlighted
- Line numbers appear in the left gutter
- Type `SELECT FROM` to trigger a parse error — the error line turns pink
- Changing the dialect dropdown updates keyword highlighting

- [ ] **Step 5: Commit**

```bash
git add src/components/SqlEditor.tsx src/App.tsx
git commit -m "feat: replace textarea with CodeMirror 6 SQL editor"
```

---

### Task 3: URL State Sharing

**Files:**
- Create: `src/lib/urlState.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create `src/lib/urlState.ts`**

```typescript
export interface AppUrlState {
  mode: 'query' | 'schema';
  dialect: string;
  sql: string;
}

export function encodeUrlState(state: AppUrlState): void {
  const params = new URLSearchParams();
  params.set('mode', state.mode);
  params.set('dialect', state.dialect);
  try {
    params.set('q', btoa(encodeURIComponent(state.sql)));
  } catch {
    // unencodable characters; skip updating q param
  }
  window.history.replaceState(null, '', `?${params.toString()}`);
}

export function decodeUrlState(): Partial<AppUrlState> {
  const params = new URLSearchParams(window.location.search);
  const out: Partial<AppUrlState> = {};

  const mode = params.get('mode');
  if (mode === 'query' || mode === 'schema') out.mode = mode;

  const dialect = params.get('dialect');
  if (dialect) out.dialect = dialect;

  const q = params.get('q');
  if (q) {
    try {
      out.sql = decodeURIComponent(atob(q));
    } catch {
      // invalid base64 — ignore, fall back to default
    }
  }

  return out;
}

export function copyShareLink(): void {
  navigator.clipboard.writeText(window.location.href);
}
```

- [ ] **Step 2: Wire URL state into `App.tsx`**

Add import at top of `src/App.tsx`:

```tsx
import { encodeUrlState, decodeUrlState, copyShareLink } from './lib/urlState';
```

Replace the three state initialisations with URL-aware versions. At the top of the `App` function body, before the `useState` calls:

```tsx
const initialUrl = decodeUrlState();
```

Then update each `useState`:

```tsx
const [sql, setSql] = useState(initialUrl.sql ?? SAMPLE_QUERIES[1].sql);
const [database, setDatabase] = useState(initialUrl.dialect ?? 'PostgreSQL');
const [mode, setMode] = useState<'query' | 'schema'>(initialUrl.mode ?? 'query');
const [view, setView] = useState<ViewMode>('relationship');
const [result, setResult] = useState<ParseResult>({ ok: false });
```

Add a URL sync effect after the existing parse `useEffect`:

```tsx
useEffect(() => {
  encodeUrlState({ mode, dialect: database, sql });
}, [mode, database, sql]);
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

- [ ] **Step 4: Verify in browser**

```bash
npm run dev
```

Type in the editor. Watch the URL update automatically (e.g. `?mode=query&dialect=PostgreSQL&q=U0VMR...`). Copy the full URL, open a new tab, paste it — the same query and dialect should load.

- [ ] **Step 5: Commit**

```bash
git add src/lib/urlState.ts src/App.tsx
git commit -m "feat: URL-based state sharing (mode, dialect, SQL encoded as base64)"
```

---

### Task 4: PNG Export

**Files:**
- Create: `src/lib/exportPng.ts`
- Modify: `src/components/DiagramCanvas.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create `src/lib/exportPng.ts`**

```typescript
import { toPng } from 'html-to-image';

export async function exportDiagramAsPng(element: HTMLElement): Promise<void> {
  const dataUrl = await toPng(element, {
    backgroundColor: '#090c12',
    pixelRatio: 2,
    filter: (node) => {
      if (!(node instanceof Element)) return true;
      if (node.classList.contains('react-flow__controls')) return false;
      if (node.classList.contains('react-flow__minimap')) return false;
      return true;
    },
  });
  const a = document.createElement('a');
  a.download = `sql-diagram-${new Date().toISOString().slice(0, 10)}.png`;
  a.href = dataUrl;
  a.click();
}
```

- [ ] **Step 2: Rewrite `src/components/DiagramCanvas.tsx` with `forwardRef`**

Replace the entire file content:

```tsx
import { useMemo, forwardRef, useImperativeHandle, useRef } from 'react';
import {
  ReactFlow, Background, Controls, MiniMap, BackgroundVariant,
  MarkerType, type Node, type Edge, type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { ParseResult } from '../sql/types';
import { layoutRelationshipGraph } from '../layout/dagreLayout';
import { layoutFlowGraph } from '../layout/flowLayout';
import { EDGE_COLOR, STAGE_COLOR, KIND_COLOR } from '../lib/theme';
import RelationNode from './nodes/RelationNode';
import StageNode from './nodes/StageNode';
import LaneLabelNode from './nodes/LaneLabelNode';
import { exportDiagramAsPng } from '../lib/exportPng';

export type ViewMode = 'relationship' | 'flow';

const nodeTypes = { relation: RelationNode, stage: StageNode, laneLabel: LaneLabelNode };

export interface DiagramCanvasHandle {
  fitView: () => void;
  exportPng: () => Promise<void>;
}

const DiagramCanvas = forwardRef<DiagramCanvasHandle, { result: ParseResult; view: ViewMode }>(
  ({ result, view }, ref) => {
    const { nodes, edges } = useMemo(() => buildGraph(result, view), [result, view]);
    const rfInstance = useRef<ReactFlowInstance | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      fitView: () => rfInstance.current?.fitView({ padding: 0.18, maxZoom: 1.1 }),
      exportPng: async () => {
        if (wrapperRef.current) await exportDiagramAsPng(wrapperRef.current);
      },
    }));

    if (nodes.length === 0) return null;

    return (
      <div ref={wrapperRef} style={{ width: '100%', height: '100%' }}>
        <ReactFlow
          key={view}
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.18, maxZoom: 1.1 }}
          minZoom={0.15}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{ type: 'smoothstep' }}
          onInit={(instance) => { rfInstance.current = instance; }}
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="#1c2436" />
          <Controls showInteractive={false} />
          <MiniMap
            pannable
            zoomable
            maskColor="rgba(9,12,18,0.75)"
            nodeColor={(n: Node) => {
              const data = n.data as any;
              return n.type === 'relation'
                ? KIND_COLOR[data.kind as keyof typeof KIND_COLOR]
                : STAGE_COLOR[data.kind as keyof typeof STAGE_COLOR] || '#3a4560';
            }}
          />
        </ReactFlow>
      </div>
    );
  }
);

export default DiagramCanvas;

function buildGraph(result: ParseResult, view: ViewMode): { nodes: Node[]; edges: Edge[] } {
  if (!result.ok) return { nodes: [], edges: [] };

  if (view === 'relationship' && result.relationship) {
    const graph = result.relationship;
    const { positions } = layoutRelationshipGraph(graph);
    const nodes: Node[] = graph.nodes.map((n) => ({
      id: n.id,
      type: 'relation',
      position: positions.get(n.id) ?? { x: 0, y: 0 },
      data: n as any,
      draggable: true,
    }));
    const edges: Edge[] = graph.edges.map((e) => {
      const color = EDGE_COLOR[e.kind];
      const isLineage = e.kind === 'from';
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        label: isLineage ? undefined : e.label,
        labelStyle: { fill: color, fontSize: 9.5, fontWeight: 700, fontFamily: 'var(--font-mono)' },
        labelBgStyle: { fill: '#0f1420', fillOpacity: 0.9 },
        labelBgPadding: [4, 2] as [number, number],
        style: { stroke: color, strokeWidth: isLineage ? 1.25 : 1.75, strokeDasharray: isLineage ? '3 3' : undefined },
        markerEnd: { type: MarkerType.ArrowClosed, color, width: 14, height: 14 },
      };
    });
    return { nodes, edges };
  }

  if (view === 'flow' && result.flow) {
    const graph = result.flow;
    const { positions, laneIndex, laneHeight } = layoutFlowGraph(graph);
    const stageNodes: Node[] = graph.nodes.map((n) => ({
      id: n.id,
      type: 'stage',
      position: positions.get(n.id) ?? { x: 0, y: 0 },
      data: n as any,
      draggable: true,
    }));
    const laneLabelNodes: Node[] = graph.lanes.map((lane) => ({
      id: `lane_${lane}`,
      type: 'laneLabel',
      position: { x: -190, y: (laneIndex.get(lane) ?? 0) * laneHeight + 18 },
      data: { label: lane, isMain: lane === 'main' },
      draggable: false,
      selectable: false,
    }));
    const edges: Edge[] = graph.edges.map((e) => {
      const sourceNode = graph.nodes.find((n) => n.id === e.source);
      const color = e.isReference ? '#f0a93f' : sourceNode ? STAGE_COLOR[sourceNode.kind] : '#5a6480';
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.isReference ? 'bottom' : 'right',
        targetHandle: e.isReference ? 'top' : 'left',
        label: e.label,
        labelStyle: { fill: color, fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-mono)' },
        labelBgStyle: { fill: '#0f1420', fillOpacity: 0.9 },
        labelBgPadding: [4, 2] as [number, number],
        style: { stroke: color, strokeWidth: 1.5, strokeDasharray: e.isReference ? '4 3' : undefined },
        markerEnd: { type: MarkerType.ArrowClosed, color, width: 13, height: 13 },
      };
    });
    return { nodes: [...laneLabelNodes, ...stageNodes], edges };
  }

  return { nodes: [], edges: [] };
}
```

- [ ] **Step 3: Add canvas ref and Export/Share buttons to `App.tsx`**

Add imports:

```tsx
import { useRef } from 'react';
import { Network, AlertTriangle, Download, Link } from 'lucide-react';
import DiagramCanvas, { type DiagramCanvasHandle, type ViewMode } from './components/DiagramCanvas';
import { copyShareLink } from './lib/urlState';
```

Add ref inside `App`:

```tsx
const canvasRef = useRef<DiagramCanvasHandle>(null);
```

Pass ref to `DiagramCanvas`:

```tsx
<DiagramCanvas ref={canvasRef} result={result} view={view} />
```

Add Export and Share buttons in the header, just before `<ViewToggle`:

```tsx
<button
  onClick={() => canvasRef.current?.exportPng()}
  title="Export PNG (Ctrl+Shift+E)"
  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11.5px] font-semibold border transition-colors"
  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-dim)', background: 'var(--color-bg-raised)' }}
>
  <Download size={13} strokeWidth={2.25} />
</button>
<button
  onClick={copyShareLink}
  title="Copy share link (Ctrl+Shift+C)"
  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11.5px] font-semibold border transition-colors"
  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-dim)', background: 'var(--color-bg-raised)' }}
>
  <Link size={13} strokeWidth={2.25} />
</button>
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

- [ ] **Step 5: Verify in browser**

Load a sample query. Click the download icon. Confirm a `.png` file downloads. Open it — diagram renders at 2× resolution without controls/minimap.

- [ ] **Step 6: Commit**

```bash
git add src/lib/exportPng.ts src/components/DiagramCanvas.tsx src/App.tsx
git commit -m "feat: PNG export and share-link button in header"
```

---

### Task 5: Mode Switcher

**Files:**
- Create: `src/components/ModeToggle.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create `src/components/ModeToggle.tsx`**

```tsx
import { Search, Database } from 'lucide-react';

export type AppMode = 'query' | 'schema';

export default function ModeToggle({ mode, onChange }: { mode: AppMode; onChange: (m: AppMode) => void }) {
  const tabs: { key: AppMode; label: string; Icon: typeof Search }[] = [
    { key: 'query', label: 'Query', Icon: Search },
    { key: 'schema', label: 'Schema', Icon: Database },
  ];

  return (
    <div
      className="inline-flex rounded-lg border p-0.5 gap-0.5"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-raised)' }}
    >
      {tabs.map(({ key, label, Icon }) => {
        const active = key === mode;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11.5px] font-semibold transition-colors"
            style={{
              color: active ? '#0a0e16' : 'var(--color-text-dim)',
              background: active ? 'var(--color-amber)' : 'transparent',
            }}
          >
            <Icon size={13} strokeWidth={2.25} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Update `App.tsx` header**

Add import:

```tsx
import ModeToggle, { type AppMode } from './components/ModeToggle';
import { Database } from 'lucide-react';
```

Replace the header's right side (the `<ViewToggle ... />` block) with:

```tsx
<div className="flex items-center gap-2">
  <ModeToggle mode={mode} onChange={setMode} />
  {mode === 'query' && <ViewToggle view={view} onChange={setView} />}
  <button
    onClick={() => canvasRef.current?.exportPng()}
    title="Export PNG (Ctrl+Shift+E)"
    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11.5px] font-semibold border transition-colors"
    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-dim)', background: 'var(--color-bg-raised)' }}
  >
    <Download size={13} strokeWidth={2.25} />
  </button>
  <button
    onClick={copyShareLink}
    title="Copy link (Ctrl+Shift+C)"
    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11.5px] font-semibold border transition-colors"
    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-dim)', background: 'var(--color-bg-raised)' }}
  >
    <Link size={13} strokeWidth={2.25} />
  </button>
</div>
```

Update the canvas section in `App.tsx` to handle schema mode with a placeholder:

```tsx
<section className="flex-1 relative min-h-[360px]">
  {mode === 'schema' ? (
    <SchemaPlaceholder />
  ) : showCanvas ? (
    <DiagramCanvas ref={canvasRef} result={result} view={view} />
  ) : (
    <EmptyState hasError={!result.ok && !!result.error} />
  )}
</section>
```

Add `SchemaPlaceholder` at the bottom of `App.tsx`:

```tsx
function SchemaPlaceholder() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center max-w-xs px-6">
        <Database size={28} color="var(--color-border)" className="mx-auto mb-3" />
        <p className="text-[12px] font-semibold mb-1" style={{ color: 'var(--color-text-dim)' }}>
          Schema Explorer
        </p>
        <p className="text-[11px]" style={{ color: 'var(--color-text-faint)' }}>
          Paste a CREATE TABLE script to visualize your schema. Coming in the next update.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

- [ ] **Step 4: Verify in browser**

Confirm: "Query" and "Schema" tabs appear. Schema shows placeholder. Query shows the existing diagram. The ViewToggle only appears in Query mode.

- [ ] **Step 5: Commit**

```bash
git add src/components/ModeToggle.tsx src/App.tsx
git commit -m "feat: Query/Schema mode switcher with Schema placeholder"
```

---

### Task 6: Keyboard Shortcuts

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add keyboard handler to `App.tsx`**

Add this `useEffect` inside the `App` component, after the parse effect:

```tsx
useEffect(() => {
  function onKeyDown(e: KeyboardEvent) {
    const mod = e.ctrlKey || e.metaKey;
    if (!mod) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      setResult(parseSql(sql, database));
    }
    if (e.shiftKey && e.key === 'F') {
      e.preventDefault();
      canvasRef.current?.fitView();
    }
    if (e.shiftKey && e.key === 'E') {
      e.preventDefault();
      canvasRef.current?.exportPng();
    }
    if (e.shiftKey && e.key === 'C') {
      e.preventDefault();
      copyShareLink();
    }
  }
  window.addEventListener('keydown', onKeyDown);
  return () => window.removeEventListener('keydown', onKeyDown);
}, [sql, database]);
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Verify in browser**

- Type an invalid query → `Ctrl+Enter` re-parses immediately (no 350ms wait)
- `Ctrl+Shift+F` fits the diagram to the viewport
- `Ctrl+Shift+E` downloads a PNG
- `Ctrl+Shift+C` copies the URL (check clipboard)

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: keyboard shortcuts Ctrl+Enter, Ctrl+Shift+F/E/C"
```

---

### Task 7: Improved Empty State with Sample Cards

**Files:**
- Modify: `src/lib/sampleQueries.ts`
- Create: `src/components/SampleGrid.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Add `description` to `SampleQuery` and update `src/lib/sampleQueries.ts`**

```typescript
export interface SampleQuery {
  label: string;
  description: string;
  sql: string;
}

export const SAMPLE_QUERIES: SampleQuery[] = [
  {
    label: 'Simple join',
    description: 'JOIN two tables with WHERE and ORDER BY',
    sql: `SELECT o.id, o.amount, c.customer_name, c.region
FROM orders o
JOIN customers c ON o.customer_id = c.id
WHERE o.amount > 100
ORDER BY o.amount DESC;`,
  },
  {
    label: 'CTE + window function',
    description: 'Multi-CTE with RANK() OVER and an IN subquery',
    sql: `WITH regional_sales AS (
  SELECT region, SUM(amount) AS total_sales
  FROM orders
  WHERE order_date >= '2024-01-01'
  GROUP BY region
),
top_regions AS (
  SELECT region
  FROM regional_sales
  WHERE total_sales > 1000
)
SELECT
  c.customer_name,
  o.region,
  o.amount,
  RANK() OVER (PARTITION BY o.region ORDER BY o.amount DESC) AS rnk
FROM orders o
JOIN customers c ON o.customer_id = c.id
WHERE o.region IN (SELECT region FROM top_regions)
ORDER BY o.amount DESC
LIMIT 10;`,
  },
  {
    label: 'Nested subquery + EXISTS',
    description: 'Derived table in FROM with a correlated EXISTS',
    sql: `SELECT t.id, t.total
FROM (
  SELECT customer_id AS id, SUM(amount) AS total
  FROM orders
  GROUP BY customer_id
) t
WHERE EXISTS (
  SELECT 1 FROM customers c
  WHERE c.id = t.id AND c.active = true
)
ORDER BY t.total DESC;`,
  },
  {
    label: 'Four-way join chain',
    description: 'LEFT JOIN across four tables in one query',
    sql: `SELECT p.name, o.id AS order_id, s.shipped_at
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
LEFT JOIN products p ON p.id = oi.product_id
LEFT JOIN shipments s ON s.order_id = o.id
WHERE o.status = 'completed';`,
  },
];
```

- [ ] **Step 2: Create `src/components/SampleGrid.tsx`**

```tsx
import type { SampleQuery } from '../lib/sampleQueries';

export default function SampleGrid({
  samples,
  prompt,
  onSelect,
}: {
  samples: SampleQuery[];
  prompt: string;
  onSelect: (sql: string) => void;
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-8">
      <div className="w-full max-w-lg">
        <p className="text-[11px] text-center mb-4" style={{ color: 'var(--color-text-faint)' }}>
          {prompt}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {samples.map((q) => (
            <button
              key={q.label}
              onClick={() => onSelect(q.sql)}
              className="text-left rounded-lg border px-3 py-2.5 transition-all"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-amber)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
            >
              <div className="text-[11.5px] font-semibold mb-0.5" style={{ color: 'var(--color-text)' }}>
                {q.label}
              </div>
              <div className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
                {q.description}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update canvas section in `App.tsx`**

Add import:

```tsx
import SampleGrid from './components/SampleGrid';
```

Update the canvas `<section>` block — show `SampleGrid` when the editor is empty:

```tsx
<section className="flex-1 relative min-h-[360px]">
  {mode === 'schema' ? (
    <SchemaPlaceholder />
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

- [ ] **Step 4: Verify build**

```bash
npm run build
```

- [ ] **Step 5: Verify in browser**

Clear the editor. Confirm 4 sample cards appear with labels and descriptions. Click a card — it populates the editor and the diagram renders. In Schema mode, the placeholder still shows.

- [ ] **Step 6: Commit**

```bash
git add src/lib/sampleQueries.ts src/components/SampleGrid.tsx src/App.tsx
git commit -m "feat: sample card grid in empty state with descriptions"
```

---

**Plan A complete.** The app now has a CodeMirror 6 editor, URL sharing, PNG export, mode switcher, keyboard shortcuts, and a sample card grid. Plan B (Schema Explorer) can now be executed to replace the Schema placeholder.
