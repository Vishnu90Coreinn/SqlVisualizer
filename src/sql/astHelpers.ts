import { Parser } from 'node-sql-parser';

export const parser = new Parser();

export const DIALECT_OPTIONS: Record<string, string> = {
  PostgreSQL: 'PostgreSQL',
  MySQL: 'MySQL',
  TransactSQL: 'TransactSQL',
  Sqlite: 'Sqlite',
  BigQuery: 'BigQuery',
  Snowflake: 'Snowflake',
};

/** Strip backtick / double-quote identifier wrapping for cleaner display. */
export function cleanSql(s: string): string {
  return s
    .replace(/`([a-zA-Z_][\w$]*)`/g, '$1')
    .replace(/"([a-zA-Z_][\w$]*)"/g, '$1')
    .trim();
}

export function exprToSql(expr: any, database: string): string {
  if (expr === null || expr === undefined) return '';
  try {
    return cleanSql(parser.exprToSQL(expr, { database } as any));
  } catch {
    return '';
  }
}

export function astToSql(ast: any, database: string): string {
  try {
    return cleanSql(parser.sqlify(ast, { database } as any));
  } catch {
    return '';
  }
}

/** Safely get the table/CTE name a FROM entry refers to (ignores derived tables). */
export function fromEntryName(entry: any): string | null {
  if (entry && typeof entry.table === 'string') return entry.table;
  return null;
}

export function fromEntryAlias(entry: any): string | undefined {
  if (!entry) return undefined;
  if (typeof entry.as === 'string') return entry.as;
  return undefined;
}

/** True if a FROM entry is a derived table (subquery), i.e. has expr.ast */
export function isDerivedTable(entry: any): boolean {
  return !!(entry && entry.expr && entry.expr.ast);
}

/**
 * Recursively collect column_ref nodes {table, column} from any expression/object.
 * Stops at the boundary of any nested SELECT (subquery/derived table) - those are
 * handled as their own relations elsewhere, so their columns shouldn't leak into
 * the outer scope's attribution.
 */
export function collectColumnRefs(node: any, out: { table: string | null; column: string }[] = []): typeof out {
  if (!node || typeof node !== 'object') return out;

  if (Array.isArray(node)) {
    for (const item of node) collectColumnRefs(item, out);
    return out;
  }

  if (node.type === 'column_ref') {
    const colVal =
      node.column?.expr?.value ??
      node.column?.value ??
      (typeof node.column === 'string' ? node.column : undefined);
    if (typeof colVal === 'string') {
      out.push({ table: node.table ?? null, column: colVal });
    }
    return out;
  }

  // Boundary: a bare nested SELECT, or a derived-table/subquery wrapper {expr:{ast:{...}}}
  if (node.type === 'select') return out;
  if (node.ast && node.ast.type === 'select') return out;
  if (node.expr && node.expr.ast && node.expr.ast.type === 'select') return out;

  for (const key of Object.keys(node)) {
    const val = node[key];
    if (val && typeof val === 'object') collectColumnRefs(val, out);
  }
  return out;
}

/** Find every nested subquery AST embedded anywhere within an expression, tagged with the context it appeared in. */
export interface FoundSubquery {
  ast: any;
  context: 'in' | 'exists' | 'scalar' | 'from';
  alias?: string;
}

export function findSubqueries(node: any, context: FoundSubquery['context'] = 'scalar'): FoundSubquery[] {
  const found: FoundSubquery[] = [];

  function walk(n: any, ctx: FoundSubquery['context']) {
    if (!n || typeof n !== 'object') return;

    if (n.ast && n.ast.type === 'select') {
      found.push({ ast: n.ast, context: ctx, alias: n.as });
      return;
    }
    if (n.type === 'select') {
      found.push({ ast: n, context: ctx });
      return;
    }

    if (n.type === 'function') {
      const fname = (n.name?.name?.[0]?.value ?? n.name ?? '').toString().toUpperCase();
      const nextCtx: FoundSubquery['context'] = fname === 'EXISTS' ? 'exists' : ctx;
      if (n.args) walk(n.args, nextCtx);
      return;
    }

    if (n.operator === 'IN' || n.operator === 'NOT IN') {
      if (n.right) walk(n.right, 'in');
      if (n.left) walk(n.left, ctx);
      return;
    }

    if (Array.isArray(n)) {
      n.forEach((item) => walk(item, ctx));
      return;
    }

    for (const key of Object.keys(n)) {
      const val = n[key];
      if (val && typeof val === 'object') walk(val, ctx);
    }
  }

  walk(node, context);
  return found;
}

let idCounter = 0;
export function uid(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${idCounter}_${Math.random().toString(36).slice(2, 7)}`;
}

export function resetUidCounter() {
  idCounter = 0;
}
