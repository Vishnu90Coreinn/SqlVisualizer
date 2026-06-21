const KEY = 'sql-viz-theme';

export type Theme = 'dark' | 'light';

export function getStoredTheme(): Theme {
  return (localStorage.getItem(KEY) as Theme) ?? 'dark';
}

export function applyTheme(theme: Theme): void {
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  localStorage.setItem(KEY, theme);
}
