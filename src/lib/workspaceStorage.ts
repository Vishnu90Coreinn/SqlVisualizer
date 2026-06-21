export interface WorkspaceState {
  version: 1;
  mode: 'query' | 'schema';
  dialect: string;
  sql: string;
  schemaSql: string;
}

export function saveWorkspace(state: Omit<WorkspaceState, 'version'>): void {
  const data: WorkspaceState = { version: 1, ...state };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.download = `sql-viz-workspace-${new Date().toISOString().slice(0, 10)}.json`;
  a.href = URL.createObjectURL(blob);
  a.click();
  URL.revokeObjectURL(a.href);
}

export function loadWorkspace(file: File): Promise<WorkspaceState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data?.version !== 1) throw new Error('Unknown workspace format');
        resolve(data as WorkspaceState);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
