import { useState, useEffect, useRef, useMemo } from 'react';
import { Search } from 'lucide-react';
import { SAMPLE_QUERIES } from '../lib/sampleQueries';
import { DDL_SAMPLE_QUERIES } from '../lib/ddlSampleQueries';
import { SCHEMA_TEMPLATES } from '../lib/schemaTemplates';

export interface Command {
  id: string;
  label: string;
  group: string;
  keywords?: string;
  action: () => void;
}

export default function CommandPalette({
  commands,
  onClose,
}: {
  commands: Command[];
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands.slice(0, 12);
    const q = query.toLowerCase();
    return commands
      .filter((c) =>
        c.label.toLowerCase().includes(q) ||
        c.group.toLowerCase().includes(q) ||
        (c.keywords ?? '').toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [query, commands]);

  useEffect(() => { setActiveIdx(0); }, [filtered]);

  function run(cmd: Command) {
    cmd.action();
    onClose();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[activeIdx]) {
      e.preventDefault();
      run(filtered[activeIdx]);
    }
  }

  // Group items
  const groups = useMemo(() => {
    const map = new Map<string, Command[]>();
    for (const cmd of filtered) {
      if (!map.has(cmd.group)) map.set(cmd.group, []);
      map.get(cmd.group)!.push(cmd);
    }
    return map;
  }, [filtered]);

  let globalIdx = 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg rounded-xl border shadow-2xl overflow-hidden"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
      >
        {/* Search input */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b" style={{ borderColor: 'var(--color-border-soft)' }}>
          <Search size={14} strokeWidth={2} color="var(--color-text-faint)" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search commands, samples, templates…"
            className="flex-1 bg-transparent outline-none text-[12px]"
            style={{ color: 'var(--color-text)', caretColor: 'var(--color-amber)' }}
          />
          <kbd className="text-[9px] px-1.5 py-0.5 rounded border" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-faint)', background: 'var(--color-bg-raised)' }}>
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto py-1">
          {filtered.length === 0 && (
            <div className="px-4 py-6 text-center text-[11px]" style={{ color: 'var(--color-text-faint)' }}>
              No commands found
            </div>
          )}
          {[...groups.entries()].map(([group, items]) => (
            <div key={group}>
              <div className="px-3 py-1 text-[9px] font-bold tracking-widest uppercase" style={{ color: 'var(--color-text-faint)' }}>
                {group}
              </div>
              {items.map((cmd) => {
                const idx = globalIdx++;
                const active = idx === activeIdx;
                return (
                  <button
                    key={cmd.id}
                    onMouseEnter={() => setActiveIdx(idx)}
                    onClick={() => run(cmd)}
                    className="w-full text-left px-3 py-2 text-[11.5px] transition-colors"
                    style={{
                      background: active ? 'rgba(240,169,63,0.1)' : 'transparent',
                      color: active ? 'var(--color-amber)' : 'var(--color-text-dim)',
                    }}
                  >
                    {cmd.label}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t flex gap-3 text-[9px]" style={{ borderColor: 'var(--color-border-soft)', color: 'var(--color-text-faint)' }}>
          <span>↑↓ navigate</span>
          <span>↵ run</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}

// Helper to build the full command list from App state
export function buildCommands(opts: {
  setMode: (m: 'query' | 'schema') => void;
  setView: (v: 'relationship' | 'flow') => void;
  setSql: (s: string) => void;
  setSchemaSql: (s: string) => void;
  handleFormat: () => void;
  fitView: () => void;
  exportPng: () => void;
  exportCard: () => void;
  copyShareLink: () => void;
  setShowHelp: (v: boolean) => void;
  setShowTemplates: (v: boolean) => void;
}): Command[] {
  const cmds: Command[] = [
    { id: 'mode-query', label: 'Switch to Query mode', group: 'Navigation', action: () => opts.setMode('query') },
    { id: 'mode-schema', label: 'Switch to Schema mode', group: 'Navigation', action: () => opts.setMode('schema') },
    { id: 'view-rel', label: 'View: Relationships', group: 'Navigation', action: () => opts.setView('relationship') },
    { id: 'view-flow', label: 'View: Execution Flow', group: 'Navigation', action: () => opts.setView('flow') },
    { id: 'format', label: 'Format SQL', group: 'Editor', keywords: 'beautify indent', action: opts.handleFormat },
    { id: 'fit', label: 'Fit diagram to screen', group: 'Diagram', keywords: 'zoom reset center', action: opts.fitView },
    { id: 'export-png', label: 'Export as PNG', group: 'Export', action: opts.exportPng },
    { id: 'share-card', label: 'Share Card (social image)', group: 'Export', keywords: 'twitter linkedin social', action: opts.exportCard },
    { id: 'share-link', label: 'Copy share link', group: 'Export', keywords: 'url copy clipboard', action: opts.copyShareLink },
    { id: 'help', label: 'Open help & shortcuts', group: 'App', keywords: 'features keyboard', action: () => opts.setShowHelp(true) },
    { id: 'templates', label: 'Browse schema templates', group: 'App', keywords: 'ecommerce blog github twitter', action: () => opts.setShowTemplates(true) },
  ];

  // Sample queries
  for (const q of SAMPLE_QUERIES) {
    cmds.push({ id: `sample-${q.label}`, label: `Sample: ${q.label}`, group: 'Sample Queries', keywords: q.description, action: () => { opts.setMode('query'); opts.setSql(q.sql); } });
  }
  for (const q of DDL_SAMPLE_QUERIES) {
    cmds.push({ id: `ddl-${q.label}`, label: `DDL Sample: ${q.label}`, group: 'Schema Samples', keywords: q.description, action: () => { opts.setMode('schema'); opts.setSchemaSql(q.sql); } });
  }
  for (const t of SCHEMA_TEMPLATES) {
    cmds.push({ id: `tpl-${t.id}`, label: `${t.emoji} Template: ${t.name}`, group: 'Schema Templates', keywords: t.description, action: () => { opts.setMode('schema'); opts.setSchemaSql(t.sql); } });
  }

  return cmds;
}
