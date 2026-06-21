export interface AppUrlState {
  mode: 'query' | 'schema';
  dialect: string;
  sql: string;
}

export function encodeUrlState(state: AppUrlState): void {
  const params = new URLSearchParams();
  params.set('mode', state.mode);
  params.set('dialect', state.dialect);
  try {
    params.set('q', btoa(encodeURIComponent(state.sql)));
  } catch {
    // unencodable characters; skip updating q param
  }
  window.history.replaceState(null, '', `?${params.toString()}`);
}

export function decodeUrlState(): Partial<AppUrlState> {
  const params = new URLSearchParams(window.location.search);
  const out: Partial<AppUrlState> = {};

  const mode = params.get('mode');
  if (mode === 'query' || mode === 'schema') out.mode = mode;

  const dialect = params.get('dialect');
  if (dialect) out.dialect = dialect;

  const q = params.get('q');
  if (q) {
    try {
      out.sql = decodeURIComponent(atob(q));
    } catch {
      // invalid base64 — ignore, fall back to default
    }
  }

  return out;
}

export function copyShareLink(): Promise<void> {
  return navigator.clipboard.writeText(window.location.href);
}

export function isEmbedMode(): boolean {
  return new URLSearchParams(window.location.search).get('embed') === '1';
}

export function getEmbedUrl(): string {
  const url = new URL(window.location.href);
  url.searchParams.set('embed', '1');
  return url.toString();
}
