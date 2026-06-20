# SQL // Visualizer

Paste a SQL query, get an interactive diagram of it. Built for queries with CTEs, window
functions, and nested subqueries — not just `SELECT * FROM a JOIN b`.

Two views:

- **Relationships** — an ER-style graph of every table, CTE, and subquery in the query,
  with join conditions and data lineage (which CTE reads from which table) drawn as edges.
  Columns are color-coded by how they're used (selected, joined on, filtered, grouped,
  ordered, or used in a window function).
- **Execution Flow** — a swim-lane pipeline showing the logical order SQL actually
  executes in (`FROM` → `JOIN` → `WHERE` → `GROUP BY` → `HAVING` → window functions →
  `SELECT` → `ORDER BY` → `LIMIT`), with each CTE as its own lane feeding into the main
  query.

Both diagrams are pan/zoom/drag-able (built on [React Flow](https://reactflow.dev)).

## Stack

- Vite + React + TypeScript
- [`node-sql-parser`](https://github.com/taozhi8833998/node-sql-parser) for SQL → AST
- [`@xyflow/react`](https://reactflow.dev) for the diagram canvas
- `dagre` for auto-layout of the relationship graph
- Tailwind CSS v4

All parsing and layout happens client-side — there's no backend.

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build   # outputs to dist/
npm run preview # serve the production build locally
```

## Deploying to Vercel

This is a static Vite app, so it deploys to Vercel with zero configuration.

**Option A — via GitHub (recommended)**

1. Push this folder to a new GitHub repo.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
3. Vercel auto-detects the Vite framework preset (build command `npm run build`,
   output directory `dist`). Click **Deploy**.

**Option B — via the Vercel CLI**

```bash
npm install -g vercel
vercel        # preview deploy
vercel --prod # production deploy
```

## Notes / limitations

- Only `SELECT` statements are supported (including CTEs, subqueries, and window
  functions). `INSERT`/`UPDATE`/`DDL` aren't visualized.
- `UNION` is supported at a basic level — branches are shown as connected stages, not
  fully expanded into separate diagrams.
- The SQL dialect selector (top toolbar, default PostgreSQL) changes how the parser
  reads dialect-specific syntax — switch it if your query uses MySQL/T-SQL/Snowflake/
  BigQuery-specific syntax that fails to parse under PostgreSQL.
