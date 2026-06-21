import { type CompletionContext, type Completion } from '@codemirror/autocomplete';
import type { ParseResult } from '../sql/types';

export function buildSqlCompletions(result: ParseResult | null) {
  const tableNames: string[] = [];
  const columnNames: string[] = [];
  const aliases: string[] = [];

  if (result?.ok && result.relationship) {
    for (const node of result.relationship.nodes) {
      if (node.kind === 'table' || node.kind === 'cte') {
        tableNames.push(node.label);
      }
      if (node.alias) aliases.push(node.alias);
      for (const col of node.columns) {
        if (!columnNames.includes(col.name)) columnNames.push(col.name);
      }
    }
  }

  return function sqlCompletionSource(context: CompletionContext) {
    const word = context.matchBefore(/[\w.]+/);
    if (!word || (word.from === word.to && !context.explicit)) return null;

    const text = word.text.toLowerCase();
    const options: Completion[] = [];

    for (const name of tableNames) {
      if (name.toLowerCase().startsWith(text)) {
        options.push({ label: name, type: 'class', detail: 'table' });
      }
    }
    for (const alias of aliases) {
      if (alias.toLowerCase().startsWith(text) && !options.find(o => o.label === alias)) {
        options.push({ label: alias, type: 'variable', detail: 'alias' });
      }
    }
    for (const col of columnNames) {
      if (col.toLowerCase().startsWith(text)) {
        options.push({ label: col, type: 'property', detail: 'column' });
      }
    }

    if (options.length === 0) return null;

    return {
      from: word.from,
      options,
      validFor: /^\w*$/,
    };
  };
}
