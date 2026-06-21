export interface HistoryEntry {
  sql: string;
  timestamp: number;
  dialect: string;
}

const KEY = 'sql-viz-history';
const MAX = 20;

export function addToHistory(sql: string, dialect: string): void {
  const trimmed = sql.trim();
  if (trimmed.length < 10) return; // skip trivially short queries
  const entries = getHistory().filter((e) => e.sql !== trimmed); // dedupe
  entries.unshift({ sql: trimmed, timestamp: Date.now(), dialect });
  localStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX)));
}

export function getHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function clearHistory(): void {
  localStorage.removeItem(KEY);
}

export function formatTimestamp(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(ts).toLocaleDateString();
}
