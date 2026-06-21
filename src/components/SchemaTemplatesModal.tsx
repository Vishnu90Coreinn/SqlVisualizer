import { useEffect } from 'react';
import { X } from 'lucide-react';
import { SCHEMA_TEMPLATES } from '../lib/schemaTemplates';

export default function SchemaTemplatesModal({
  onSelect,
  onClose,
}: {
  onSelect: (sql: string) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-2xl rounded-xl border shadow-2xl flex flex-col max-h-[85vh]"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b shrink-0"
          style={{ borderColor: 'var(--color-border-soft)' }}
        >
          <div>
            <h2 className="text-[13px] font-bold" style={{ color: 'var(--color-text)' }}>
              Schema Templates
            </h2>
            <p className="text-[10.5px] mt-0.5" style={{ color: 'var(--color-text-faint)' }}>
              Real-world database schemas — click to load and explore
            </p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--color-text-faint)' }}>
            <X size={15} strokeWidth={2} />
          </button>
        </div>

        {/* Grid */}
        <div className="overflow-y-auto p-5 grid grid-cols-2 gap-3">
          {SCHEMA_TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => { onSelect(t.sql); onClose(); }}
              className="text-left rounded-lg border p-4 transition-all group"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-raised)' }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-amber)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0 mt-0.5">{t.emoji}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold" style={{ color: 'var(--color-text)' }}>
                      {t.name}
                    </span>
                    <span
                      className="text-[8.5px] font-bold px-1.5 py-0.5 rounded shrink-0"
                      style={{ color: 'var(--color-amber)', background: 'rgba(240,169,63,0.12)' }}
                    >
                      {t.tables} tables
                    </span>
                  </div>
                  <p className="text-[10.5px] mt-0.5 leading-snug" style={{ color: 'var(--color-text-faint)' }}>
                    {t.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
