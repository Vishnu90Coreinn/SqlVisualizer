import type { SchemaGraph, SchemaNode, SchemaColumn } from '../sql/types';

function columnLine(col: SchemaColumn): string {
  const parts: string[] = [col.name];
  if (col.dataType) parts.push(col.dataType);
  if (col.isPrimaryKey) parts.push('PRIMARY KEY');
  else if (col.isNotNull) parts.push('NOT NULL');
  if (col.isUnique && !col.isPrimaryKey) parts.push('UNIQUE');
  return '  ' + parts.join(' ');
}

function tableToSql(node: SchemaNode): string {
  const lines: string[] = [];

  // Regular columns
  for (const col of node.columns) {
    if (!col.isForeignKey || col.isPrimaryKey) {
      lines.push(columnLine(col));
    } else {
      // FK columns - just name + type, constraint added separately
      const parts = [col.name];
      if (col.dataType) parts.push(col.dataType);
      if (col.isNotNull) parts.push('NOT NULL');
      lines.push('  ' + parts.join(' '));
    }
  }

  // Composite PK
  if (node.compositePK && node.compositePK.length > 1) {
    // Remove individual PK markers, add composite
    const filtered = lines.map((l) => l.replace(' PRIMARY KEY', ''));
    lines.length = 0;
    lines.push(...filtered);
    lines.push(`  PRIMARY KEY (${node.compositePK.join(', ')})`);
  }

  // FK constraints
  for (const col of node.columns) {
    if (col.isForeignKey && col.references) {
      lines.push(`  FOREIGN KEY (${col.name}) REFERENCES ${col.references.table}(${col.references.column})`);
    }
  }

  return `CREATE TABLE ${node.tableName} (\n${lines.join(',\n')}\n);`;
}

export function generateDDL(graph: SchemaGraph): string {
  // Sort: parent tables first (nodes without FKs first)
  const withFKs = new Set(
    graph.nodes.filter((n) => n.columns.some((c) => c.isForeignKey)).map((n) => n.id)
  );
  const sorted = [
    ...graph.nodes.filter((n) => !withFKs.has(n.id)),
    ...graph.nodes.filter((n) => withFKs.has(n.id)),
  ];

  return sorted.map(tableToSql).join('\n\n');
}

export function downloadDDL(graph: SchemaGraph): void {
  const sql = generateDDL(graph);
  const blob = new Blob([sql], { type: 'text/plain' });
  const a = document.createElement('a');
  a.download = `schema-${new Date().toISOString().slice(0, 10)}.sql`;
  a.href = URL.createObjectURL(blob);
  a.click();
  URL.revokeObjectURL(a.href);
}
