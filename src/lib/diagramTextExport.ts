import type { SchemaGraph } from '../sql/types';

export function toMermaid(graph: SchemaGraph): string {
  const lines: string[] = ['erDiagram'];

  for (const node of graph.nodes) {
    lines.push(`  ${node.tableName} {`);
    for (const col of node.columns) {
      const type = col.dataType || 'string';
      const pk = col.isPrimaryKey ? ' PK' : '';
      const fk = col.isForeignKey ? ' FK' : '';
      lines.push(`    ${type} ${col.name}${pk}${fk}`);
    }
    lines.push('  }');
  }

  for (const edge of graph.edges) {
    const sourceNode = graph.nodes.find((n) => n.id === edge.source);
    const targetNode = graph.nodes.find((n) => n.id === edge.target);
    if (sourceNode && targetNode) {
      lines.push(`  ${targetNode.tableName} ||--o{ ${sourceNode.tableName} : "${edge.targetColumn}"`);
    }
  }

  return lines.join('\n');
}

export function toPlantUML(graph: SchemaGraph): string {
  const lines: string[] = ['@startuml', ''];

  for (const node of graph.nodes) {
    lines.push(`entity "${node.tableName}" {`);
    for (const col of node.columns) {
      const pk = col.isPrimaryKey ? '* ' : '';
      const fk = col.isForeignKey ? '# ' : '';
      const type = col.dataType || 'string';
      lines.push(`  ${pk}${fk}${col.name} : ${type}`);
    }
    lines.push('}');
    lines.push('');
  }

  for (const edge of graph.edges) {
    const sourceNode = graph.nodes.find((n) => n.id === edge.source);
    const targetNode = graph.nodes.find((n) => n.id === edge.target);
    if (sourceNode && targetNode) {
      lines.push(`${targetNode.tableName} ||--o{ ${sourceNode.tableName} : has`);
    }
  }

  lines.push('');
  lines.push('@enduml');
  return lines.join('\n');
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}
