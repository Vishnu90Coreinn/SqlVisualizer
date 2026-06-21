import { useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { sql, PostgreSQL, MySQL, SQLite, MSSQL, StandardSQL, type SQLDialect } from '@codemirror/lang-sql';
import { EditorView, Decoration } from '@codemirror/view';
import type { Extension } from '@codemirror/state';
import { autocompletion } from '@codemirror/autocomplete';
import { buildSqlCompletions } from '../lib/sqlCompletions';
import type { ParseResult } from '../sql/types';

const dialectMap: Record<string, SQLDialect | undefined> = {
  PostgreSQL,
  MySQL,
  Sqlite: SQLite,
  TransactSQL: MSSQL,
  BigQuery: StandardSQL,
  Snowflake: StandardSQL,
};

const BASIC_SETUP = {
  lineNumbers: true,
  highlightActiveLine: true,
  bracketMatching: true,
  autocompletion: true,
  foldGutter: false,
  indentOnInput: true,
} as const;

// CSS variables don't resolve inside CodeMirror's injected StyleModule, so hex values are used directly.
const lightTheme = EditorView.theme(
  {
    '&': { height: '100%', background: '#ffffff' },
    '.cm-scroller': {
      fontFamily: "'JetBrains Mono', ui-monospace, 'SFMono-Regular', monospace",
      fontSize: '12px',
      lineHeight: '20px',
      overflow: 'auto',
    },
    '.cm-content': { padding: '12px 12px 12px 0', caretColor: '#c97f00' },
    '.cm-line': { padding: '0 12px' },
    '.cm-cursor': { borderLeftColor: '#c97f00' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
      background: 'rgba(201,127,0,0.15) !important',
    },
    '.cm-activeLine': { background: 'rgba(0,0,0,0.04)' },
    '.cm-gutters': {
      background: '#eef1f6',
      borderRight: '1px solid #d0d6e3',
      color: '#8b95ad',
      minWidth: '36px',
    },
    '.cm-lineNumbers .cm-gutterElement': { padding: '0 8px' },
    '.cm-activeLineGutter': {
      background: '#e4e8f0',
      color: '#4a5370',
    },
    '.cm-error-line': { background: 'rgba(225,29,72,0.08)' },
    '.cm-matchingBracket': {
      background: 'rgba(201,127,0,0.15)',
      color: '#c97f00 !important',
      outline: 'none',
    },
    '.cm-tooltip.cm-tooltip-autocomplete': {
      background: '#ffffff',
      border: '1px solid #d0d6e3',
      borderRadius: '6px',
      overflow: 'hidden',
    },
    '.cm-tooltip-autocomplete ul li': {
      color: '#4a5370',
      padding: '3px 10px',
    },
    '.cm-tooltip-autocomplete ul li[aria-selected]': {
      background: 'rgba(201,127,0,0.12)',
      color: '#c97f00',
    },
  },
  { dark: false }
);

const baseTheme = EditorView.theme(
  {
    '&': { height: '100%', background: '#0f1420' },
    '.cm-scroller': {
      fontFamily: "'JetBrains Mono', ui-monospace, 'SFMono-Regular', monospace",
      fontSize: '12px',
      lineHeight: '20px',
      overflow: 'auto',
    },
    '.cm-content': { padding: '12px 12px 12px 0', caretColor: '#f0a93f' },
    '.cm-line': { padding: '0 12px' },
    '.cm-cursor': { borderLeftColor: '#f0a93f' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
      background: 'rgba(240,169,63,0.2) !important',
    },
    '.cm-activeLine': { background: 'rgba(255,255,255,0.025)' },
    '.cm-gutters': {
      background: '#141a28',
      borderRight: '1px solid #28324a',
      color: '#5a6480',
      minWidth: '36px',
    },
    '.cm-lineNumbers .cm-gutterElement': { padding: '0 8px' },
    '.cm-activeLineGutter': {
      background: '#1b2333',
      color: '#8b95ad',
    },
    '.cm-error-line': { background: 'rgba(240,112,140,0.12)' },
    '.cm-matchingBracket': {
      background: 'rgba(240,169,63,0.2)',
      color: '#f0a93f !important',
      outline: 'none',
    },
    '.cm-tooltip.cm-tooltip-autocomplete': {
      background: '#141a28',
      border: '1px solid #28324a',
      borderRadius: '6px',
      overflow: 'hidden',
    },
    '.cm-tooltip-autocomplete ul li': {
      color: '#8b95ad',
      padding: '3px 10px',
    },
    '.cm-tooltip-autocomplete ul li[aria-selected]': {
      background: 'rgba(240,169,63,0.15)',
      color: '#f0a93f',
    },
  },
  { dark: true }
);

// Decoration is tied to the extension instance (compute with empty deps), not live document
// positions. Parent re-derives errorLine on every parse so the 350ms debounce bounds the drift.
function errorLineExt(errorLine: number | undefined): Extension {
  if (!errorLine) return [];
  return EditorView.decorations.compute([], (state) => {
    try {
      const line = state.doc.line(errorLine);
      return Decoration.set([Decoration.line({ class: 'cm-error-line' }).range(line.from)]);
    } catch {
      return Decoration.none;
    }
  });
}

export default function SqlEditor({
  value,
  onChange,
  errorLine,
  dialect,
  theme,
  completionResult,
}: {
  value: string;
  onChange: (v: string) => void;
  errorLine?: number;
  dialect?: string;
  theme?: 'dark' | 'light';
  completionResult?: ParseResult | null;
}) {
  const extensions = useMemo(
    () => {
      const exts: Extension[] = [
        sql({ dialect: dialect ? dialectMap[dialect] : undefined }),
        theme === 'light' ? lightTheme : baseTheme,
        errorLineExt(errorLine),
      ];
      if (completionResult) {
        exts.push(
          autocompletion({
            override: [buildSqlCompletions(completionResult)],
            activateOnTyping: true,
          })
        );
      }
      return exts;
    },
    [errorLine, dialect, theme, completionResult]
  );

  return (
    <CodeMirror
      value={value}
      onChange={(v) => onChange(v)}
      extensions={extensions}
      theme={theme === 'light' ? 'light' : 'dark'}
      height="100%"
      placeholder="Paste a SQL query here..."
      basicSetup={BASIC_SETUP}
      style={{
        height: '100%',
        overflow: 'hidden',
        borderRadius: '8px',
        border: '1px solid var(--color-border)',
      }}
    />
  );
}
