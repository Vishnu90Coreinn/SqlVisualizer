import type { FlowGraph, FlowNode, FlowEdge, FlowStageKind } from './types';
import { exprToSql, fromEntryName, fromEntryAlias, isDerivedTable, findSubqueries, uid, resetUidCounter } from './astHelpers';

interface PipelineResult {
  firstId: string | null;
  lastId: string | null;
  selectStageId: string | null;
  fromJoinRefs: { nodeId: string; tableName: string }[];
}

function truncate(s: string, max = 60): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + '\u2026';
}

function buildPipelineForSelect(
  selectAst: any,
  lane: string,
  database: string,
  nodes: FlowNode[],
  edges: FlowEdge[],
  orderStart: number
): PipelineResult {
  let order = orderStart;
  const fromJoinRefs: { nodeId: string; tableName: string }[] = [];
  const chain: string[] = [];

  function push(kind: FlowStageKind, title: string, snippet: string): string {
    const id = uid('flow');
    nodes.push({ id, kind, title, snippet, lane, order: order++ });
    return id;
  }

  function link(a: string | null, b: string | null, label?: string) {
    if (!a || !b) return;
    edges.push({ id: uid('fedge'), source: a, target: b, label });
  }

  if (!selectAst) return { firstId: null, lastId: null, selectStageId: null, fromJoinRefs };

  const fromList: any[] = selectAst.from || [];
  for (const entry of fromList) {
    if (isDerivedTable(entry)) {
      const alias = entry.as || 'subquery';
      const id = push('from', entry.join ? `${entry.join}` : 'FROM', `${entry.join ? entry.join + ' ' : 'FROM '}(subquery) AS ${alias}`);
      chain.push(id);
    } else {
      const tname = fromEntryName(entry);
      if (!tname) continue;
      const alias = fromEntryAlias(entry);
      if (entry.join) {
        const cond = entry.on ? exprToSql(entry.on, database) : '';
        const id = push('join', entry.join, `${entry.join} ${tname}${alias ? ' ' + alias : ''}${cond ? `\nON ${truncate(cond, 50)}` : ''}`);
        chain.push(id);
        fromJoinRefs.push({ nodeId: id, tableName: tname });
      } else {
        const id = push('from', 'FROM', `FROM ${tname}${alias ? ' AS ' + alias : ''}`);
        chain.push(id);
        fromJoinRefs.push({ nodeId: id, tableName: tname });
      }
    }
  }

  // Detect cross joins (JOIN with no ON condition)
  for (const entry of fromList) {
    if (entry.join && !entry.on) {
      const nodeId = chain[chain.length - 1];
      const node = nodes.find((n) => n.id === nodeId);
      if (node) node.warnings = [...(node.warnings ?? []), 'cross join — no ON condition'];
    }
  }

  // Detect likely full scan: 2+ tables joined but no WHERE clause
  const joinCount = fromList.filter((e: any) => e.join).length;
  if (joinCount >= 1 && !selectAst.where && chain.length > 0) {
    const firstFromNode = nodes.find((n) => n.id === chain[0]);
    if (firstFromNode) {
      firstFromNode.warnings = [...(firstFromNode.warnings ?? []), 'full scan likely — no WHERE'];
    }
  }

  if (selectAst.where) {
    const subs = findSubqueries(selectAst.where);
    for (const sub of subs) {
      const snippet = truncate(exprToSql(sub.ast, database) || '(subquery)', 70);
      const id = push('subquery', sub.context.toUpperCase(), `${sub.context.toUpperCase()} (\n  ${snippet}\n)`);
      // side node, will connect into WHERE below once WHERE id is known
      (sub as any)._flowId = id;
      // Flag EXISTS subqueries as potentially correlated
      if (sub.context === 'exists') {
        const subNode = nodes.find((n) => n.id === id);
        if (subNode) subNode.warnings = [...(subNode.warnings ?? []), 'may run per row (correlated)'];
      }
    }
    const whereId = push('where', 'WHERE', `WHERE ${truncate(exprToSql(selectAst.where, database), 70)}`);
    for (const sub of subs) link((sub as any)._flowId, whereId, 'evaluated in');
    chain.push(whereId);
  }

  if (selectAst.groupby?.columns?.length) {
    const cols = selectAst.groupby.columns.map((c: any) => exprToSql(c, database)).join(', ');
    const id = push('groupby', 'GROUP BY', `GROUP BY ${truncate(cols, 60)}`);
    chain.push(id);
  }

  if (selectAst.having) {
    const id = push('having', 'HAVING', `HAVING ${truncate(exprToSql(selectAst.having, database), 60)}`);
    chain.push(id);
  }

  const windowCols = (selectAst.columns || []).filter((c: any) => c.expr?.over);
  if (windowCols.length) {
    const parts = windowCols.map((c: any) => {
      const name = c.expr?.name || 'WINDOW';
      const overSql = exprToSql(c.expr, database);
      return truncate(overSql || `${name}() OVER (...)`, 60);
    });
    const id = push('window', 'WINDOW', parts.join('\n'));
    chain.push(id);
  }

  let selectStageId: string | null = null;
  if (Array.isArray(selectAst.columns)) {
    const parts = selectAst.columns.slice(0, 8).map((c: any) => {
      const sql = exprToSql(c.expr, database);
      return c.as ? `${sql} AS ${c.as}` : sql;
    });
    const more = selectAst.columns.length > 8 ? `, \u2026 +${selectAst.columns.length - 8} more` : '';
    selectStageId = push('select', 'SELECT', truncate(parts.join(', ') + more, 80));
    chain.push(selectStageId);
  }

  if (Array.isArray(selectAst.orderby) && selectAst.orderby.length) {
    const cols = selectAst.orderby.map((o: any) => `${exprToSql(o.expr, database)} ${o.type || ''}`.trim()).join(', ');
    const id = push('orderby', 'ORDER BY', `ORDER BY ${truncate(cols, 60)}`);
    chain.push(id);
  }

  if (selectAst.limit?.value?.length) {
    const vals = selectAst.limit.value.map((v: any) => v.value).join(', ');
    const id = push('limit', 'LIMIT', `LIMIT ${vals}`);
    chain.push(id);
  }

  for (let i = 0; i < chain.length - 1; i++) link(chain[i], chain[i + 1]);

  return {
    firstId: chain[0] ?? null,
    lastId: chain[chain.length - 1] ?? null,
    selectStageId,
    fromJoinRefs,
  };
}

export function buildFlowGraph(ast: any, database: string): FlowGraph {
  resetUidCounter();
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  const lanes: string[] = [];
  const cteSelectStage = new Map<string, string>();

  let order = 0;

  if (ast?.with && Array.isArray(ast.with)) {
    for (const w of ast.with) {
      const name = w.name?.value ?? w.name;
      const stmt = w.stmt?.ast ?? w.stmt;
      if (typeof name !== 'string') continue;
      lanes.push(name);
      const cteOrderStart = order;
      const result = buildPipelineForSelect(stmt, name, database, nodes, edges, cteOrderStart);
      order += 20;
      if (result.selectStageId) cteSelectStage.set(name.toLowerCase(), result.selectStageId);
      wireReferences(result.fromJoinRefs, cteSelectStage, edges);
    }
  }

  lanes.push('main');
  let mainAst = ast;
  let laneOrder = order;
  let prevLastId: string | null = null;
  let guard = 0;
  while (mainAst && guard < 10) {
    if (guard > 0) {
      const unionId = `union_${uid('u')}`;
      const node: FlowNode = { id: unionId, kind: 'union', title: 'UNION', snippet: mainAst.set_op?.toUpperCase?.() || 'UNION', lane: 'main', order: laneOrder++ };
      nodes.push(node);
      if (prevLastId) edges.push({ id: uid('fedge'), source: prevLastId, target: unionId });
      prevLastId = unionId;
    }
    const result = buildPipelineForSelect(mainAst, 'main', database, nodes, edges, laneOrder);
    laneOrder += 20;
    if (prevLastId && result.firstId) edges.push({ id: uid('fedge'), source: prevLastId, target: result.firstId });
    wireReferences(result.fromJoinRefs, cteSelectStage, edges);
    prevLastId = result.lastId;
    mainAst = mainAst._next;
    guard += 1;
  }

  return { nodes, edges, lanes };
}

function wireReferences(
  refs: { nodeId: string; tableName: string }[],
  cteSelectStage: Map<string, string>,
  edges: FlowEdge[]
) {
  for (const ref of refs) {
    const cteId = cteSelectStage.get(ref.tableName.toLowerCase());
    if (cteId) {
      edges.push({ id: uid('fedge'), source: cteId, target: ref.nodeId, label: `uses ${ref.tableName}`, isReference: true });
    }
  }
}
