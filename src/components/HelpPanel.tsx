import { useEffect } from 'react';
import { X } from 'lucide-react';

const SECTIONS = [
  {
    title: 'Editor',
    items: [
      { key: 'Alt+Shift+F', desc: 'Format / beautify SQL' },
      { key: 'Ctrl+Enter', desc: 'Re-parse immediately' },
      { key: 'Ctrl+Space', desc: 'Trigger autocomplete (table & column names)' },
      { key: '{ } Format button', desc: 'Above the editor in query mode' },
      { key: 'History button', desc: 'Last 20 queries, click to reload' },
    ],
  },
  {
    title: 'Diagram',
    items: [
      { key: 'Click any node', desc: 'Opens detail panel with full column info' },
      { key: 'Ctrl+Shift+F', desc: 'Fit diagram to screen' },
      { key: 'Click CTE lane label', desc: 'Collapse / expand that CTE lane (Flow view)' },
      { key: '▶ Play button', desc: 'Animate execution order through pipeline (Flow view)' },
      { key: 'EXPLAIN button', desc: 'Overlay real query costs from EXPLAIN JSON (Flow view)' },
      { key: 'Complexity badge', desc: 'Top-left of canvas — SIMPLE → VERY COMPLEX score' },
      { key: '⚡ on columns', desc: 'Index hint — column used in JOIN/WHERE without known index' },
    ],
  },
  {
    title: 'Schema Explorer',
    items: [
      { key: '⇄ Diff Mode', desc: 'Compare two DDL scripts, see added / removed / changed tables' },
      { key: 'Export DDL', desc: 'Generate CREATE TABLE SQL from the parsed schema' },
      { key: 'As text button', desc: 'Copy schema as Mermaid erDiagram or PlantUML' },
    ],
  },
  {
    title: 'Export & Share',
    items: [
      { key: 'Export menu', desc: 'Download diagram as PNG or SVG' },
      { key: 'Ctrl+Shift+E', desc: 'Export PNG shortcut' },
      { key: '••• → Copy share link', desc: 'URL encodes current query + dialect + mode' },
      { key: 'Ctrl+Shift+C', desc: 'Copy share link shortcut' },
      { key: '••• → Get embed code', desc: '<iframe> snippet for blogs or docs' },
      { key: '••• → Save / Load workspace', desc: 'Download or restore full session as JSON' },
    ],
  },
];

export default function HelpPanel({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-14"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-sm rounded-xl border shadow-2xl flex flex-col max-h-[85vh]"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b shrink-0"
          style={{ borderColor: 'var(--color-border-soft)' }}
        >
          <span className="text-[12px] font-bold" style={{ color: 'var(--color-text)' }}>
            Features & Shortcuts
          </span>
          <button onClick={onClose} style={{ color: 'var(--color-text-faint)' }}>
            <X size={14} strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-4 flex flex-col gap-5">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <div
                className="text-[9.5px] font-bold tracking-widest uppercase mb-2"
                style={{ color: 'var(--color-amber)' }}
              >
                {section.title}
              </div>
              <div className="flex flex-col gap-1.5">
                {section.items.map((item) => (
                  <div key={item.key} className="flex items-start gap-3">
                    <code
                      className="text-[9.5px] px-1.5 py-0.5 rounded shrink-0 mt-0.5"
                      style={{
                        background: 'var(--color-bg-raised)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-dim)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.key}
                    </code>
                    <span className="text-[10.5px] leading-snug" style={{ color: 'var(--color-text-faint)' }}>
                      {item.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
