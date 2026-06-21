import { Sun, Moon } from 'lucide-react';
import type { Theme } from '../lib/themeStorage';

export default function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="flex items-center justify-center w-7 h-7 rounded-md border transition-colors hover:border-[#f0a93f] hover:text-[#f0a93f]"
      style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-dim)', background: 'var(--color-bg-raised)' }}
    >
      {theme === 'dark' ? <Sun size={13} strokeWidth={2.25} /> : <Moon size={13} strokeWidth={2.25} />}
    </button>
  );
}
