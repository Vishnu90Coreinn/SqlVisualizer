import type { RelationshipGraph, RelNode, RelEdge, RelKind, RelEdgeKind, ColumnRole, RelColumn } from './types';
import { collectColumnRefs, findSubqueries, fromEntryName, fromEntryAlias, isDerivedTable, exprToSql, uid, resetUidCounter } from './astHelpers';

function buildResultNode(
  finalAst: any,
  nodes: Map<string, RelNode>,
  nameToId: Map<string, string>,
  edges: RelEdge[],
  edgeDedupe: Set<string>,
  _database: string
): void {
  if (!finalAst || !Array.isArray(finalAst.columns)) return;

  const outputColumns: RelColumn[] = finalAst.columns
    .map((c: any) => {
      const name =
        c.as ||
        c.expr?.column?.expr?.value ||
        c.expr?.column?.value ||
        (typeof c.expr === 'string' ? c.expr : null);
      return name ? { name: String(name), roles: new Set<ColumnRole>(['select']) } : null;
    })
    .filter(Boolean) as RelColumn[];

  if (outputColumns.length === 0) return;

  const resultId = uid('rel');
  const maxDepth = Math.max(0, ...[...nodes.values()].map((n) => n.depth));
  const resultNode: RelNode = {
    id: resultId,
    kind: 'result',
    label: 'Query Result',
    columns: outputColumns,
    depth: maxDepth + 1,
  };
  nodes.set(resultId, resultNode);

  const fromList: any[] = finalAst.from || [];
  const addedSources = new Set<string>();
  for (const entry of fromList) {
    if (isDerivedTable(entry)) continue;
    const tname = fromEntryName(entry);
    if (!tname) continue;
    const sourceId =
      nameToId.get(`named:${tname.toLowerCase()}`) ??
      nameToId.get(`sub:${tname.toLowerCase()}`);
    if (!sourceId || addedSources.has(sourceId)) continue;
    addedSources.add(sourceId);
    const dedupeKey = `${sourceId}|${resultId}|→ output|`;
    if (!edgeDedupe.has(dedupeKey)) {
      edgeDedupe.add(dedupeKey);
      edges.push({ id: uid('edge'), source: sourceId, target: resultId, kind: 'from', label: '→ output' });
    }
  }
}

export function buildRelationshipGraph(ast: any, database: string): RelationshipGraph {
  resetUidCounter();
  const nodes = new Map<string, RelNode>();
  const nameToId = new Map<string, string>();
  const edges: RelEdge[] = [];
  const edgeDedupe = new Set<string>();

  function getOrCreateNamed(name: string, kind: RelKind, depth: number): RelNode {
    const key = `${kind === 'cte' || kind === 'table' ? 'named' : 'sub'}:${name.toLowerCase()}`;
    let id = nameToId.get(key);
    if (id) return nodes.get(id)!;
    id = uid('rel');
    const node: RelNode = { id, kind, label: name, columns: [], depth };
    nodes.set(id, node);
    nameToId.set(key, id);
    return node;
  }

  function createSubqueryNode(label: string, depth: number, detail?: string): RelNode {
    const id = uid('rel');
    const node: RelNode = { id, kind: 'subquery', label, columns: [], depth, detail };
    nodes.set(id, node);
    return node;
  }

  function addColumnRole(node: RelNode, columnName: string, role: ColumnRole) {
    let col = node.columns.find((c) => c.name === columnName);
    if (!col) {
      col = { name: columnName, roles: new Set() };
      node.columns.push(col);
    }
    col.roles.add(role);
  }

  function addEdge(sourceId: string, targetId: string, kind: RelEdgeKind, label: string, condition?: string) {
    const dedupeKey = `${sourceId}|${targetId}|${label}|${condition ?? ''}`;
    if (edgeDedupe.has(dedupeKey)) return;
    edgeDedupe.add(dedupeKey);
    edges.push({ id: uid('edge'), source: sourceId, target: targetId, kind, label, condition });
  }

  // Register CTE names up front so self/forward references resolve correctly.
  const cteDefs: { name: string; stmt: any }[] = [];
  if (ast?.with && Array.isArray(ast.with)) {
    for (const w of ast.with) {
      const name = w.name?.value ?? w.name;
      if (typeof name === 'string') {
        getOrCreateNamed(name, 'cte', 0);
        cteDefs.push({ name, stmt: w.stmt?.ast ?? w.stmt });
      }
    }
  }

  function processSelect(
    selectAst: any,
    depth: number,
    containerNode?: RelNode
  ): { aliasMap: Map<string, string>; primaryNodeId: string | null } {
    const aliasMap = new Map<string, string>();
    let primaryNodeId: string | null = null;
    const usedNodeIds = new Set<string>();
    if (!selectAst) return { aliasMap, primaryNodeId };

    const fromList: any[] = selectAst.from || [];
    let prevId: string | null = null;

    for (const entry of fromList) {
      let nodeId: string;

      if (isDerivedTable(entry)) {
        const alias = entry.as || `subquery`;
        const subNode = createSubqueryNode(alias, depth + 1);
        processSelect(entry.expr.ast, depth + 1, subNode);
        nodeId = subNode.id;
        aliasMap.set(alias.toLowerCase(), nodeId);
        attributeInnerColumns(entry.expr.ast, subNode);
      } else {
        const tname = fromEntryName(entry);
        if (!tname) continue;
        const isCte = nameToId.has(`named:${tname.toLowerCase()}`) && nodes.get(nameToId.get(`named:${tname.toLowerCase()}`)!)?.kind === 'cte';
        const node = getOrCreateNamed(tname, isCte ? 'cte' : 'table', isCte ? 0 : depth);
        nodeId = node.id;
        const alias = fromEntryAlias(entry) || tname;
        aliasMap.set(alias.toLowerCase(), nodeId);
      }

      usedNodeIds.add(nodeId);
      if (!primaryNodeId) primaryNodeId = nodeId;

      if (entry.join && entry.on) {
        const refs = collectColumnRefs(entry.on);
        const otherIds = new Set<string>();
        for (const r of refs) {
          if (r.table) {
            const rid = aliasMap.get(r.table.toLowerCase());
            if (rid && rid !== nodeId) otherIds.add(rid);
          }
        }
        if (otherIds.size === 0 && prevId) otherIds.add(prevId);
        const cond = exprToSql(entry.on, database);
        for (const oid of otherIds) {
          addEdge(oid, nodeId, 'join', entry.join, cond);
        }
      }
      prevId = nodeId;
    }

    if (containerNode) {
      for (const nid of usedNodeIds) {
        if (nid !== containerNode.id) addEdge(nid, containerNode.id, 'from', 'FROM');
      }
    }

    function tag(exprNode: any, role: ColumnRole) {
      const refs = collectColumnRefs(exprNode);
      for (const r of refs) {
        let targetId: string | undefined;
        if (r.table) targetId = aliasMap.get(r.table.toLowerCase());
        else if (aliasMap.size === 1) targetId = [...aliasMap.values()][0];
        if (targetId) addColumnRole(nodes.get(targetId)!, r.column, role);
      }
    }

    if (Array.isArray(selectAst.columns)) {
      for (const col of selectAst.columns) {
        tag(col.expr, 'select');
        const over = col.expr?.over;
        const spec = over?.as_window_specification?.window_specification;
        if (spec) {
          tag(spec.partitionby, 'window');
          if (spec.orderby) tag(spec.orderby.map((o: any) => o.expr), 'window');
        }
      }
    }
    if (selectAst.where) tag(selectAst.where, 'filter');
    if (selectAst.groupby?.columns) tag(selectAst.groupby.columns, 'group');
    if (selectAst.having) tag(selectAst.having, 'filter');
    if (Array.isArray(selectAst.orderby)) tag(selectAst.orderby.map((o: any) => o.expr), 'order');

    if (selectAst.where) {
      const subs = findSubqueries(selectAst.where);
      for (const sub of subs) {
        const subNode = createSubqueryNode(`(${sub.context})`, depth + 1);
        processSelect(sub.ast, depth + 1, subNode);
        attributeInnerColumns(sub.ast, subNode);

        let sourceId = primaryNodeId;
        const innerRefs = collectColumnRefs(sub.ast.where);
        for (const r of innerRefs) {
          if (r.table && aliasMap.has(r.table.toLowerCase())) {
            sourceId = aliasMap.get(r.table.toLowerCase())!;
            break;
          }
        }
        if (sourceId) {
          addEdge(sourceId, subNode.id, sub.context, sub.context.toUpperCase());
        }
      }
    }

    return { aliasMap, primaryNodeId };
  }

  // Give a subquery node a lightweight summary of its own select clause / group-by for the detail badge.
  function attributeInnerColumns(innerAst: any, node: RelNode) {
    const bits: string[] = [];
    if (innerAst?.groupby?.columns?.length) bits.push('GROUP BY');
    if (innerAst?.where) bits.push('WHERE');
    if (Array.isArray(innerAst?.columns)) {
      const names = innerAst.columns
        .map((c: any) => c.as || c.expr?.column?.expr?.value || c.expr?.column?.value)
        .filter(Boolean)
        .slice(0, 4);
      if (names.length) node.detail = names.join(', ') + (bits.length ? `  ·  ${bits.join(', ')}` : '');
    }
  }

  for (const { name, stmt } of cteDefs) {
    const node = nodes.get(nameToId.get(`named:${name.toLowerCase()}`)!);
    processSelect(stmt, 1, node);
    if (node) attributeInnerColumns(stmt, node);
  }

  const finalMainAst = ast;
  let mainAst = ast;
  let guard = 0;
  while (mainAst && guard < 10) {
    processSelect(mainAst, 0);
    if (mainAst._next) {
      // UNION branch: process as its own scope, results merge into the same graph
      mainAst = mainAst._next;
      guard += 1;
    } else {
      break;
    }
  }

  buildResultNode(finalMainAst, nodes, nameToId, edges, edgeDedupe, database);

  return { nodes: [...nodes.values()], edges };
}
