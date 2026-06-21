import { SAMPLE_QUERIES } from '../lib/sampleQueries';
import { DDL_SAMPLE_QUERIES } from '../lib/ddlSampleQueries';
import type { AppMode } from './ModeToggle';

const DIALECTS = ['PostgreSQL', 'MySQL', 'TransactSQL', 'Sqlite', 'BigQuery', 'Snowflake'];

const selectStyle: React.CSSProperties = {
  background: 'var(--color-bg-raised)',
  borderColor: 'var(--color-border)',
  color: 'var(--color-text-dim)',
};

export default function Toolbar({
  database,
  mode,
  onDatabaseChange,
  onPickSample,
  onFormat,
}: {
  database: string;
  mode: AppMode;
  onDatabaseChange: (db: string) => void;
  onPickSample: (sql: string) => void;
  onFormat: () => void;
}) {
  const samples = mode === 'schema' ? DDL_SAMPLE_QUERIES : SAMPLE_QUERIES;

  return (
    <div className="flex items-center gap-2">
      <select
        key={mode}
        defaultValue=""
        onChange={(e) => {
          const q = samples.find((s) => s.label === e.target.value);
          if (q) onPickSample(q.sql);
          e.target.value = '';
        }}
        className="text-[11px] rounded-md border px-2 py-1.5 outline-none flex-1 min-w-0"
        style={selectStyle}
      >
        <option value="" disabled>
          {mode === 'schema' ? 'Try a DDL sample…' : 'Try a sample query…'}
        </option>
        {samples.map((q) => (
          <option key={q.label} value={q.label}>
            {q.label}
          </option>
        ))}
      </select>

      <select
        value={database}
        onChange={(e) => onDatabaseChange(e.target.value)}
        className="text-[11px] rounded-md border px-2 py-1.5 outline-none shrink-0"
        style={selectStyle}
      >
        {DIALECTS.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>

      <button
        onClick={onFormat}
        title="Format SQL (Alt+Shift+F)"
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-semibold border shrink-0 transition-colors hover:border-[#f0a93f] hover:text-[#f0a93f]"
        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-dim)', background: 'var(--color-bg-raised)' }}
      >
        <span className="font-mono">{ }</span>
        Format
      </button>
    </div>
  );
}
