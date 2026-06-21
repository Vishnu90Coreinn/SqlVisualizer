import type { ParseResult } from './types';

export type HintSeverity = 'warn' | 'info';

export interface QueryHint {
  id: string;
  severity: HintSeverity;
  title: string;
  detail: string;
  fix?: string;
}

export function computeHints(result: ParseResult): QueryHint[] {
  if (!result.ok || !result.relationship) return [];

  const hints: QueryHint[] = [];
  const { nodes, edges } = result.relationship;

  // SELECT * detection — look for node with no columns at all but has 'select' role columns = none
  // Actually detect via flow snippets
  if (result.flow) {
    for (const node of result.flow.nodes) {
      if (node.kind === 'select') {
        const snippet = node.snippet.toLowerCase();
        if (snippet.includes('select *') || snippet.startsWith('*')) {
          hints.push({
            id: 'select-star',
            severity: 'warn',
            title: 'SELECT * fetches all columns',
            detail: 'Specifying only needed columns reduces network transfer and prevents future bugs when columns are added.',
            fix: 'Replace * with explicit column names',
          });
          break;
        }
      }
    }
  }

  // Correlated subquery — EXISTS or IN edges in relationship + no joins
  const correlatedEdges = edges.filter((e) => e.kind === 'exists' || e.kind === 'in');
  if (correlatedEdges.length > 0) {
    const joinEdges = edges.filter((e) => e.kind === 'join');
    if (joinEdges.length === 0) {
      hints.push({
        id: 'correlated-subquery',
        severity: 'warn',
        title: 'Correlated subquery may run once per row',
        detail: 'IN / EXISTS subqueries without JOINs can cause O(n) re-execution for each outer row.',
        fix: 'Consider rewriting as a JOIN or using EXISTS with proper indexing',
      });
    }
  }

  // LIMIT without ORDER BY
  if (result.flow) {
    const hasLimit = result.flow.nodes.some((n) => n.kind === 'limit');
    const hasOrderBy = result.flow.nodes.some((n) => n.kind === 'orderby');
    if (hasLimit && !hasOrderBy) {
      hints.push({
        id: 'limit-no-orderby',
        severity: 'warn',
        title: 'LIMIT without ORDER BY is non-deterministic',
        detail: 'Without ORDER BY the database can return any rows — results may differ between runs.',
        fix: 'Add ORDER BY before LIMIT to guarantee stable results',
      });
    }
  }

  // Cartesian join — join edges with no condition in flow
  if (result.flow) {
    const crossJoinNodes = result.flow.nodes.filter(
      (n) => n.kind === 'join' && (n.warnings ?? []).some((w) => w.includes('cross join'))
    );
    if (crossJoinNodes.length > 0) {
      hints.push({
        id: 'cartesian-join',
        severity: 'warn',
        title: 'Cartesian product detected',
        detail: `${crossJoinNodes.length} JOIN(s) have no ON condition — every row in one table is paired with every row in the other.`,
        fix: 'Add an ON clause to the JOIN, e.g. ON a.id = b.a_id',
      });
    }
  }

  // Many CTEs — complexity smell
  const cteNodes = nodes.filter((n) => n.kind === 'cte');
  if (cteNodes.length >= 4) {
    hints.push({
      id: 'many-ctes',
      severity: 'info',
      title: `${cteNodes.length} CTEs — consider splitting into views`,
      detail: 'Deep CTE chains can be hard to debug and some databases materialise them unnecessarily.',
      fix: 'Break complex CTEs into named views or temporary tables for reuse and clarity',
    });
  }

  // Join-heavy query with no filter
  const joinEdges = edges.filter((e) => e.kind === 'join');
  const filterColumns = nodes.flatMap((n) => n.columns.filter((c) => c.roles.has('filter')));
  if (joinEdges.length >= 3 && filterColumns.length === 0) {
    hints.push({
      id: 'joins-no-filter',
      severity: 'warn',
      title: 'Multi-table JOIN with no WHERE filter',
      detail: `${joinEdges.length} JOINs with no filtering will read entire tables — potentially very expensive.`,
      fix: 'Add a WHERE clause to filter rows early, before the joins multiply them',
    });
  }

  // Subquery in FROM (derived table) when JOIN could work
  const subqueries = nodes.filter((n) => n.kind === 'subquery');
  if (subqueries.length > 0 && joinEdges.length > 0) {
    hints.push({
      id: 'derived-table',
      severity: 'info',
      title: "Derived table in FROM — verify it's necessary",
      detail: "Subqueries in FROM are materialised before JOINs. A direct JOIN may be more efficient.",
      fix: 'Try rewriting the subquery as a JOIN if it only filters or aggregates one table',
    });
  }

  return hints;
}
