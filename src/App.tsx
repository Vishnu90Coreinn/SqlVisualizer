import { useEffect, useState, useRef } from 'react';
import { Network, AlertTriangle, Download, Link, Database } from 'lucide-react';
import SqlEditor from './components/SqlEditor';
import Toolbar from './components/Toolbar';
import ViewToggle from './components/ViewToggle';
import ModeToggle, { type AppMode } from './components/ModeToggle';
import SampleGrid from './components/SampleGrid';
import DiagramCanvas, { type DiagramCanvasHandle, type ViewMode } from './components/DiagramCanvas';
import Legend from './components/Legend';
import { parseMultiStatement } from './sql/parser';
import StatementTabs from './components/StatementTabs';
import { parseDDL } from './sql/ddlParser';
import { buildSchemaGraph } from './sql/schemaGraph';
import { SAMPLE_QUERIES } from './lib/sampleQueries';
import { DDL_SAMPLE_QUERIES } from './lib/ddlSampleQueries';
import type { ParseResult, SchemaGraph } from './sql/types';
import { encodeUrlState, decodeUrlState, copyShareLink } from './lib/urlState';
import { explainError } from './lib/errorExplanations';

export default function App() {
  const [sql, setSql] = useState(() => decodeUrlState().sql ?? '');
  const [database, setDatabase] = useState(() => decodeUrlState().dialect ?? 'PostgreSQL');
  const [view, setView] = useState<ViewMode>('relationship');
  const [results, setResults] = useState<ParseResult[]>([{ ok: false }]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [mode, setMode] = useState<AppMode>(() => decodeUrlState().mode ?? 'query');
  const canvasRef = useRef<DiagramCanvasHandle>(null);
  const [schemaSql, setSchemaSql] = useState(DDL_SAMPLE_QUERIES[1].sql);
  const [schemaGraph, setSchemaGraph] = useState<SchemaGraph | null>(null);
  const [schemaError, setSchemaError] = useState<string | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => {
      const parsed = parseMultiStatement(sql, database);
      setResults(parsed);
      setSelectedIdx(0);
    }, 350);
    return () => clearTimeout(handle);
  }, [sql, database]);

  useEffect(() => {
    if (mode !== 'schema') return;
    const handle = setTimeout(() => {
      const ddlResult = parseDDL(schemaSql, database);
      if (ddlResult.errors.length) {
        setSchemaError(ddlResult.errors[0]);
        setSchemaGraph(null);
      } else if (ddlResult.tables.size === 0) {
        setSchemaError('No CREATE TABLE statements found.');
        setSchemaGraph(null);
      } else {
        setSchemaError(null);
        setSchemaGraph(buildSchemaGraph(ddlResult));
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [schemaSql, database, mode]);

  useEffect(() => {
    encodeUrlState({ mode, dialect: database, sql });
  }, [mode, database, sql]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        if (mode !== 'schema') {
          const parsed = parseMultiStatement(sql, database);
          setResults(parsed);
          setSelectedIdx(0);
        }
        // In schema mode, the DDL re-parses automatically via its own debounce effect
      }
      if (e.shiftKey && e.key === 'F') {
        e.preventDefault();
        canvasRef.current?.fitView();
      }
      if (e.shiftKey && e.key === 'E') {
        e.preventDefault();
        canvasRef.current?.exportPng();
      }
      if (e.shiftKey && e.key === 'C') {
        e.preventDefault();
        copyShareLink().catch(() => {});
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [sql, database, mode]);

  const result = results[selectedIdx] ?? { ok: false };
  const showCanvas = result.ok;

  useEffect(() => {
    if (result.ok && !result.flow && view === 'flow') {
      setView('relationship');
    }
  }, [result]);

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
        <div className="flex items-center gap-2">
          <ModeToggle mode={mode} onChange={setMode} />
          {mode === 'query' && result.flow && (
            <>
              <div className="w-px h-5 shrink-0" style={{ background: 'var(--color-border)' }} />
              <ViewToggle view={view} onChange={setView} />
            </>
          )}
          <div className="w-px h-5 shrink-0" style={{ background: 'var(--color-border)' }} />
          <button
            onClick={() => canvasRef.current?.exportPng()}
            title="Export PNG (Ctrl+Shift+E)"
            className="flex items-center justify-center w-7 h-7 rounded-md border transition-colors hover:border-[#f0a93f] hover:text-[#f0a93f]"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-dim)', background: 'var(--color-bg-raised)' }}
          >
            <Download size={13} strokeWidth={2.25} />
          </button>
          <button
            onClick={() => copyShareLink().catch(() => {})}
            title="Copy share link (Ctrl+Shift+C)"
            className="flex items-center justify-center w-7 h-7 rounded-md border transition-colors hover:border-[#f0a93f] hover:text-[#f0a93f]"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-dim)', background: 'var(--color-bg-raised)' }}
          >
            <Link size={13} strokeWidth={2.25} />
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row min-h-0">
        <section
          className="flex flex-col gap-2.5 p-3 lg:w-[420px] shrink-0 border-b lg:border-b-0 lg:border-r min-h-[260px]"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <Toolbar
            database={database}
            mode={mode}
            onDatabaseChange={setDatabase}
            onPickSample={mode === 'schema' ? setSchemaSql : setSql}
          />
          <div className="flex-1 min-h-[160px]">
            <SqlEditor
              value={mode === 'schema' ? schemaSql : sql}
              onChange={mode === 'schema' ? setSchemaSql : setSql}
              errorLine={mode === 'schema' ? undefined : result.errorPosition?.line}
              dialect={database}
            />
          </div>
          {mode === 'query' && !result.ok && result.error && (
            <div
              className="flex flex-col gap-1 rounded-lg border px-3 py-2 text-[11.5px] fade-up"
              style={{ borderColor: 'var(--color-rose)', background: 'rgba(240,112,140,0.08)', color: 'var(--color-rose)' }}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>{result.error}</span>
              </div>
              {explainError(result.error) && (
                <span className="text-[10.5px] pl-5 opacity-75">{explainError(result.error)}</span>
              )}
            </div>
          )}
          {mode === 'schema' && schemaError && (
            <div
              className="flex flex-col gap-1 rounded-lg border px-3 py-2 text-[11.5px] fade-up"
              style={{ borderColor: 'var(--color-rose)', background: 'rgba(240,112,140,0.08)', color: 'var(--color-rose)' }}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>{schemaError}</span>
              </div>
              {explainError(schemaError) && (
                <span className="text-[10.5px] pl-5 opacity-75">{explainError(schemaError)}</span>
              )}
            </div>
          )}
          {mode === 'query' && <Legend view={view} />}
        </section>

        <section className="flex-1 flex flex-col min-h-[360px]">
          {mode === 'query' && results.length > 1 && (
            <StatementTabs
              count={results.length}
              selected={selectedIdx}
              onSelect={setSelectedIdx}
            />
          )}
          <div className="flex-1 relative">
            {mode === 'schema' ? (
              schemaGraph ? (
                <DiagramCanvas
                  ref={canvasRef}
                  result={{ ok: true, schema: schemaGraph }}
                  view="schema"
                />
              ) : (
                <SchemaEmptyState error={schemaError} />
              )
            ) : sql.trim() === '' ? (
              <SampleGrid
                samples={SAMPLE_QUERIES}
                prompt="Paste a SELECT query — or pick a sample to get started:"
                onSelect={setSql}
              />
            ) : showCanvas ? (
              <DiagramCanvas ref={canvasRef} result={result} view={view} />
            ) : (
              <EmptyState hasError={!result.ok && !!result.error} />
            )}
          </div>
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

function SchemaEmptyState({ error }: { error: string | null }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center max-w-xs px-6">
        <Database size={28} color="var(--color-border)" className="mx-auto mb-3" />
        {error ? (
          <p className="text-[11.5px]" style={{ color: 'var(--color-rose)' }}>{error}</p>
        ) : (
          <p className="text-[12px]" style={{ color: 'var(--color-text-faint)' }}>
            Paste a CREATE TABLE script to visualize your schema.
          </p>
        )}
      </div>
    </div>
  );
}
