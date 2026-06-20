import { SAMPLE_QUERIES } from '../lib/sampleQueries';

const DIALECTS = ['PostgreSQL', 'MySQL', 'TransactSQL', 'Sqlite', 'BigQuery', 'Snowflake'];

const selectStyle: React.CSSProperties = {
  background: 'var(--color-bg-raised)',
  borderColor: 'var(--color-border)',
  color: 'var(--color-text-dim)',
};

export default function Toolbar({
  database,
  onDatabaseChange,
  onPickSample,
}: {
  database: string;
  onDatabaseChange: (db: string) => void;
  onPickSample: (sql: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <select
        defaultValue=""
        onChange={(e) => {
          const q = SAMPLE_QUERIES.find((s) => s.label === e.target.value);
          if (q) onPickSample(q.sql);
          e.target.value = '';
        }}
        className="text-[11px] rounded-md border px-2 py-1.5 outline-none flex-1 min-w-0"
        style={selectStyle}
      >
        <option value="" disabled>
          Try a sample query…
        </option>
        {SAMPLE_QUERIES.map((q) => (
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
    </div>
  );
}
