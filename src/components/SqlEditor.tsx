import { useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { sql, PostgreSQL, MySQL, SQLite, MSSQL, StandardSQL, type SQLDialect } from '@codemirror/lang-sql';
import { EditorView, Decoration } from '@codemirror/view';
import type { Extension } from '@codemirror/state';

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
  autocompletion: false,
  foldGutter: false,
  indentOnInput: true,
} as const;

// CSS variables don't resolve inside CodeMirror's injected StyleModule, so hex values are used directly.
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
}: {
  value: string;
  onChange: (v: string) => void;
  errorLine?: number;
  dialect?: string;
}) {
  const extensions = useMemo(
    () => [
      sql({ dialect: dialect ? dialectMap[dialect] : undefined }),
      baseTheme,
      errorLineExt(errorLine),
    ],
    [errorLine, dialect]
  );

  return (
    <CodeMirror
      value={value}
      onChange={(v) => onChange(v)}
      extensions={extensions}
      theme="dark"
      height="100%"
      placeholder="Paste a SQL query here..."
      basicSetup={BASIC_SETUP}
      style={{
        height: '100%',
        overflow: 'hidden',
        borderRadius: '8px',
        border: '1px solid #28324a',
      }}
    />
  );
}
