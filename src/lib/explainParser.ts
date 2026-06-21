export interface ExplainNodeData {
  nodeType: string;
  rows?: number;
  cost?: number;
  actualRows?: number;
  actualTime?: number;
  relation?: string;
}

export interface ExplainResult {
  nodes: ExplainNodeData[];
  maxCost: number;
  maxRows: number;
  dialect: 'postgresql' | 'mysql' | 'unknown';
}

function parsePostgresNode(node: any, out: ExplainNodeData[]): void {
  if (!node || typeof node !== 'object') return;

  const entry: ExplainNodeData = {
    nodeType: node['Node Type'] ?? '',
    rows: node['Plan Rows'],
    cost: node['Total Cost'],
    actualRows: node['Actual Rows'],
    actualTime: node['Actual Total Time'],
    relation: node['Relation Name'] ?? node['Alias'],
  };
  out.push(entry);

  const children: any[] = node['Plans'] ?? [];
  for (const child of children) parsePostgresNode(child, out);
}

function parseMySQLNode(node: any, out: ExplainNodeData[]): void {
  if (!node || typeof node !== 'object') return;

  if (node.query_block) {
    parseMySQLNode(node.query_block, out);
    return;
  }

  const entry: ExplainNodeData = {
    nodeType: node.select_type ?? node.operation ?? '',
    rows: node.rows_examined_per_scan ?? node.rows,
    cost: node.cost_info?.query_cost ? parseFloat(node.cost_info.query_cost) : undefined,
    relation: node.table_name,
  };
  if (entry.nodeType || entry.relation) out.push(entry);

  for (const key of ['nested_loop', 'table', 'ordering_operation', 'grouping_operation']) {
    if (Array.isArray(node[key])) node[key].forEach((n: any) => parseMySQLNode(n, out));
    else if (node[key]) parseMySQLNode(node[key], out);
  }
}

export function parseExplainJson(jsonText: string): ExplainResult | null {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonText.trim());
  } catch {
    return null;
  }

  const nodes: ExplainNodeData[] = [];

  // PostgreSQL: [{Plan: {...}}] or {Plan: {...}}
  const pgRoot = Array.isArray(parsed) ? parsed[0] : parsed;
  if (pgRoot?.Plan) {
    parsePostgresNode(pgRoot.Plan, nodes);
    const maxCost = Math.max(...nodes.map((n) => n.cost ?? 0), 0);
    const maxRows = Math.max(...nodes.map((n) => n.rows ?? 0), 1);
    return { nodes, maxCost, maxRows, dialect: 'postgresql' };
  }

  // MySQL: {query_block: {...}}
  if (parsed?.query_block || (Array.isArray(parsed) && parsed[0]?.query_block)) {
    const root = Array.isArray(parsed) ? parsed[0] : parsed;
    parseMySQLNode(root, nodes);
    const maxCost = Math.max(...nodes.map((n) => n.cost ?? 0), 0);
    const maxRows = Math.max(...nodes.map((n) => n.rows ?? 0), 1);
    return { nodes, maxCost, maxRows, dialect: 'mysql' };
  }

  return null;
}

export function getCostColor(cost: number, maxCost: number): string {
  if (maxCost === 0) return '#5fd896';
  const ratio = cost / maxCost;
  if (ratio > 0.7) return '#f0708c'; // expensive — red
  if (ratio > 0.3) return '#f0a93f'; // moderate — amber
  return '#5fd896'; // cheap — green
}
