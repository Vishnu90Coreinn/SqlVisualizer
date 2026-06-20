# SQL Visualizer Enhancement Design
**Date:** 2026-06-20
**Status:** Approved

---

## Overview

Expand the SQL Visualizer from a SELECT-only diagram tool into a two-mode platform:
- **Query Analyzer** — the existing SELECT visualizer, made significantly deeper
- **Schema Explorer** — a new DDL mode for visualizing database schemas as ER diagrams

Target audience: developers learning SQL (A) and DBAs / senior engineers analyzing complex queries (B).
Deployment: 100% client-side, hosted on Vercel. No backend, no auth, no persistence beyond URL state.

---

## Architecture

### New top-level concept: `mode`

`App.tsx` gains a `mode` state (`'query' | 'schema'`) alongside the existing `view` state. The header's view toggle becomes two separate controls:
- **Mode switcher** — `Query | Schema` (top-level, always visible)
- **View toggle** — `Relationship | Flow` (only visible in Query mode)

### New files

```
src/sql/ddlParser.ts              — parse CREATE TABLE / ALTER TABLE / FOREIGN KEY / CREATE INDEX
src/sql/schemaGraph.ts            — build ER graph from DDL AST (tables, columns, FK edges)
src/layout/schemaLayout.ts        — dagre layout for schema ER diagram
src/components/nodes/SchemaNode.tsx  — table card with columns, type badges, PK/FK/index chips
src/lib/urlState.ts               — encode/decode app state to/from URL query params (base64 SQL)
src/lib/exportPng.ts              — PNG export via html-to-image on the ReactFlow canvas
```

### Existing files touched

| File | Change |
|------|--------|
| `App.tsx` | Add `mode` state; route to query vs schema pane |
| `DiagramCanvas.tsx` | Add third `'schema'` branch |
| `Toolbar.tsx` | Mode switcher, export button, share button, keyboard shortcut tooltips |
| `SqlEditor.tsx` | Swap textarea for CodeMirror 6 (same external API) |
| `src/lib/sampleQueries.ts` | Add 4 DDL samples alongside existing SELECT samples |

### New dependencies (all client-side)

| Package | Purpose |
|---------|---------|
| `@uiw/react-codemirror` | CodeMirror 6 React wrapper |
| `@codemirror/lang-sql` | SQL language support for CodeMirror |
| `html-to-image` | PNG/SVG export from DOM node |

No new layout library — dagre is already present.

---

## Section 1: Query Analyzer Enhancements

### 1.1 Multi-statement script support

The parser processes all SELECT statements in a script (separated by `;`). Numbered tabs appear above the diagram ("Query 1 / Query 2 / ..."). The selected tab's query is visualized. Non-SELECT statements in a multi-statement script are skipped with an inline notice rather than erroring out.

### 1.2 INSERT / UPDATE / DELETE visualization

A flat "write impact" diagram (not a pipeline or relationship graph):
- Target table highlighted with a write-role color (red/orange border)
- Written columns tagged with a `write` role color
- Subqueries in WHERE / VALUES connected as source nodes
- FROM/JOIN tables in UPDATE…FROM shown with the same relationship edges as SELECT

### 1.3 Richer flow stage nodes

| Node | Enhancement |
|------|-------------|
| JOIN | Join type color-coded: INNER=cyan, LEFT=blue, RIGHT=purple, FULL=amber |
| WHERE | Correlated subquery references flagged with a `correlated` badge |
| SELECT | Shows column count; flags `SELECT *` with a warning badge |

### 1.4 Execution order badges

Each flow stage node shows a small circled number (①②③...) indicating SQL execution order. Helps learners understand that WHERE executes before SELECT, GROUP BY before HAVING, etc.

### 1.5 EXPLAIN-style cost hints (client-side heuristics only)

Lightweight AST-derived warning badges, clearly labeled as hints:
- JOIN with no ON condition → `⚠ cross join`
- No WHERE on a multi-table join → `⚠ full scan likely`
- Correlated subquery in WHERE → `⚠ may run per row`

---

## Section 2: Schema Explorer (DDL Mode)

### 2.1 Supported SQL

| Statement | Support |
|-----------|---------|
| `CREATE TABLE` | Columns, types, NOT NULL, DEFAULT, CHECK |
| `PRIMARY KEY` | Inline and table-level, including composite PKs |
| `FOREIGN KEY ... REFERENCES` | Parsed as ER edges between tables |
| `CREATE INDEX` / `UNIQUE INDEX` | Shown as column indicators |
| `ALTER TABLE ... ADD CONSTRAINT` | FK constraints added post-definition |

Dialects: PostgreSQL, MySQL, SQLite.

### 2.2 SchemaNode design

Each table renders as a three-zone card:

**Header**
- Table name, bold left border colored by role:
  - Standalone (no FK relations) = cyan
  - Referenced by FK (parent) = amber
  - Junction / many-to-many = purple

**Column list**
Each column row shows:
- Column name
- Data type badge (e.g. `INT`, `VARCHAR(255)`)
- Indicator chips: `PK` (gold), `FK` (teal), `UQ` (unique), `IDX` (index), `NN` (not null)

**Footer**
- Composite key note when table has a multi-column PK

### 2.3 ER graph edges

Each `FOREIGN KEY` becomes a directed edge from the child table (FK column) to the parent table (PK column):
- Edge label: column pair (e.g. `order_id → id`)
- Many-side marker: fork (Crow's Foot-inspired)
- One-side marker: single bar
- Edge color: teal (FK_COLOR constant added to `theme.ts`)

### 2.4 Layout

Uses the existing dagre layout with `rankdir: 'LR'` and wider node/rank spacing to accommodate taller schema nodes. Tables with no FK relationships are grouped to the right as isolated nodes.

### 2.5 Sample DDL queries

Four built-in samples:
1. Simple two-table schema (users + posts)
2. E-commerce schema (customers, orders, order_items, products)
3. Junction table / many-to-many (students, courses, enrollments)
4. Schema with indexes and unique constraints

---

## Section 3: UX Improvements

### 3.1 CodeMirror 6 editor

Replaces the current textarea in `SqlEditor.tsx`. External API unchanged (`value`, `onChange`, `errorLine`).

Features:
- SQL syntax highlighting
- Line numbers
- Bracket matching and auto-closing quotes/parens
- Active line highlight
- Error line gutter marker (red dot)
- Dark theme via CSS variables

### 3.2 URL state sharing

`src/lib/urlState.ts` encodes `mode`, `dialect`, and `sql` (base64) into URL query params on every change via `history.replaceState`. A **"Copy link"** button in the toolbar copies the current URL to clipboard. On load, URL params take priority over the default sample query.

No backend, no short-link service.

### 3.3 PNG export

**"Export"** button in toolbar captures the ReactFlow canvas div (full extent, not just viewport) via `html-to-image`. Downloads as a timestamped `.png` file directly in the browser.

SVG export is a stretch goal (lower fidelity with React Flow's SVG edges).

### 3.4 Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Enter` | Re-parse immediately (bypass debounce) |
| `Ctrl/Cmd + Shift + F` | Fit diagram to view |
| `Ctrl/Cmd + Shift + E` | Export PNG |
| `Ctrl/Cmd + Shift + C` | Copy share link |

Shown as tooltips on hover over relevant toolbar buttons.

### 3.5 Empty state + onboarding

Replace the current faint message with a clickable sample query grid:
- 4 cards in Query mode, 4 cards in Schema mode
- Each card: query label + one-line description
- Click loads the query into the editor instantly
- Grid only shown when the editor is empty

---

## Out of Scope

- Auth, user accounts, persistent history (requires backend)
- Real EXPLAIN / query cost from a database engine
- Stored procedures, triggers, views (future iteration)
- Google Sheets / CSV import
- Collaboration / multiplayer

---

## Success Criteria

1. A user can paste a DDL script and see an ER diagram with FK edges in Schema Explorer
2. A user can paste a multi-statement SELECT script and tab between visualizations
3. A user can share a diagram via a URL that loads the exact same query and mode
4. A user can export the diagram as a PNG in one click
5. INSERT/UPDATE/DELETE statements produce a write-impact diagram instead of an error
6. The editor has syntax highlighting and error line marking
7. Flow view shows execution order badges on every stage node
8. AST-derived warnings appear for cross joins and correlated subqueries
