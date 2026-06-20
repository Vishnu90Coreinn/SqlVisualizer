import { useEffect, useState, useRef } from 'react';
import { Network, AlertTriangle, Download, Link } from 'lucide-react';
import SqlEditor from './components/SqlEditor';
import Toolbar from './components/Toolbar';
import ViewToggle from './components/ViewToggle';
import DiagramCanvas, { type DiagramCanvasHandle, type ViewMode } from './components/DiagramCanvas';
import Legend from './components/Legend';
import { parseSql } from './sql/parser';
import { SAMPLE_QUERIES } from './lib/sampleQueries';
import type { ParseResult } from './sql/types';
import { encodeUrlState, decodeUrlState, copyShareLink } from './lib/urlState';

export default function App() {
  const [sql, setSql] = useState(() => decodeUrlState().sql ?? SAMPLE_QUERIES[1].sql);
  const [database, setDatabase] = useState(() => decodeUrlState().dialect ?? 'PostgreSQL');
  const [view, setView] = useState<ViewMode>('relationship');
  const [result, setResult] = useState<ParseResult>({ ok: false });
  const canvasRef = useRef<DiagramCanvasHandle>(null);

  useEffect(() => {
    const handle = setTimeout(() => {
      setResult(parseSql(sql, database));
    }, 350);
    return () => clearTimeout(handle);
  }, [sql, database]);

  useEffect(() => {
    // TODO(A5): replace 'query' with actual mode state once ModeToggle is added
    encodeUrlState({ mode: 'query', dialect: database, sql });
  }, [database, sql]);

  const showCanvas = result.ok;

  return (
    <div className="h-screen flex flex-col">
      <header
        className="flex items-center gap-2.5 px-4 py-2.5 border-b shrink-0"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-raised)' }}
      >
        <Network size={17} color="var(--color-amber)" strokeWidth={2.5} />
        <h1 className="text-[13px] font-bold tracking-wide" style={{ color: 'var(--color-text)' }}>
          SQL<span style={{ color: 'var(--color-amber)' }}>//</span>VISUALIZER
        </h1>
        <span className="text-[10.5px] hidden sm:inline" style={{ color: 'var(--color-text-faint)' }}>
          paste a query, see how it actually runs
        </span>
        <div className="flex-1" />
        <button
          onClick={() => canvasRef.current?.exportPng()}
          title="Export PNG (Ctrl+Shift+E)"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11.5px] font-semibold border transition-colors"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-dim)', background: 'var(--color-bg-raised)' }}
        >
          <Download size={13} strokeWidth={2.25} />
        </button>
        <button
          onClick={() => copyShareLink()}
          title="Copy share link (Ctrl+Shift+C)"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11.5px] font-semibold border transition-colors"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-dim)', background: 'var(--color-bg-raised)' }}
        >
          <Link size={13} strokeWidth={2.25} />
        </button>
        <ViewToggle view={view} onChange={setView} />
      </header>

      <main className="flex-1 flex flex-col lg:flex-row min-h-0">
        <section
          className="flex flex-col gap-2.5 p-3 lg:w-[420px] shrink-0 border-b lg:border-b-0 lg:border-r min-h-[260px]"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <Toolbar database={database} onDatabaseChange={setDatabase} onPickSample={setSql} />
          <div className="flex-1 min-h-[160px]">
            <SqlEditor value={sql} onChange={setSql} errorLine={result.errorPosition?.line} dialect={database} />
          </div>
          {!result.ok && result.error && (
            <div
              className="flex items-start gap-2 rounded-lg border px-3 py-2 text-[11.5px] fade-up"
              style={{ borderColor: 'var(--color-rose)', background: 'rgba(240,112,140,0.08)', color: 'var(--color-rose)' }}
            >
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>{result.error}</span>
            </div>
          )}
          <Legend view={view} />
        </section>

        <section className="flex-1 relative min-h-[360px]">
          {showCanvas ? (
            <DiagramCanvas ref={canvasRef} result={result} view={view} />
          ) : (
            <EmptyState hasError={!result.ok && !!result.error} />
          )}
        </section>
      </main>
    </div>
  );
}

function EmptyState({ hasError }: { hasError: boolean }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center max-w-xs px-6">
        <Network size={28} color="var(--color-border)" className="mx-auto mb-3" />
        <p className="text-[12px]" style={{ color: 'var(--color-text-faint)' }}>
          {hasError ? 'Fix the query on the left to see the diagram.' : 'Paste a SELECT query to visualize it.'}
        </p>
      </div>
    </div>
  );
}
