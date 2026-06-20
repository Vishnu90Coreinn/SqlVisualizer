import { useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { sql, PostgreSQL, MySQL, SQLite, MSSQL, StandardSQL } from '@codemirror/lang-sql';
import { EditorView, Decoration } from '@codemirror/view';
import type { Extension } from '@codemirror/state';

const dialectMap: Record<string, any> = {
  PostgreSQL,
  MySQL,
  Sqlite: SQLite,
  TransactSQL: MSSQL,
  BigQuery: StandardSQL,
  Snowflake: StandardSQL,
};

const baseTheme = EditorView.theme(
  {
    '&': { height: '100%', background: 'var(--color-bg-raised)' },
    '.cm-scroller': {
      fontFamily: 'var(--font-mono)',
      fontSize: '12px',
      lineHeight: '20px',
      overflow: 'auto',
    },
    '.cm-content': { padding: '12px 12px 12px 0', caretColor: 'var(--color-amber)' },
    '.cm-line': { padding: '0 12px' },
    '.cm-cursor': { borderLeftColor: 'var(--color-amber)' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
      background: 'rgba(240,169,63,0.2) !important',
    },
    '.cm-activeLine': { background: 'rgba(255,255,255,0.025)' },
    '.cm-gutters': {
      background: 'var(--color-surface)',
      borderRight: '1px solid var(--color-border)',
      color: 'var(--color-text-faint)',
      minWidth: '36px',
    },
    '.cm-lineNumbers .cm-gutterElement': { padding: '0 8px' },
    '.cm-activeLineGutter': {
      background: 'var(--color-surface-2)',
      color: 'var(--color-text-dim)',
    },
    '.cm-error-line': { background: 'rgba(240,112,140,0.12)' },
    '.cm-matchingBracket': {
      background: 'rgba(240,169,63,0.2)',
      color: 'var(--color-amber) !important',
      outline: 'none',
    },
  },
  { dark: true }
);

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
      height="100%"
      placeholder="Paste a SQL query here..."
      basicSetup={{
        lineNumbers: true,
        highlightActiveLine: true,
        bracketMatching: true,
        autocompletion: false,
        foldGutter: false,
        indentOnInput: true,
      }}
      style={{
        height: '100%',
        overflow: 'hidden',
        borderRadius: '8px',
        border: '1px solid var(--color-border)',
      }}
    />
  );
}
