import { ZoomIn, ZoomOut, Maximize2, Download } from 'lucide-react';

const BG_LABELS: Record<string, string> = { dots: '·', lines: '—', none: '□' };

export default function DiagramToolbar({
  onZoomIn,
  onZoomOut,
  onFitView,
  onExport,
  bgStyle,
  onToggleBg,
}: {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onExport: () => void;
  bgStyle?: 'dots' | 'lines' | 'none';
  onToggleBg?: () => void;
}) {
  const btnCls =
    'flex items-center justify-center w-7 h-7 transition-colors hover:text-[#f0a93f]';

  return (
    <div
      className="flex items-center gap-0.5 rounded-lg border shadow-lg overflow-hidden"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
    >
      <button onClick={onZoomIn} title="Zoom in" className={btnCls} style={{ color: 'var(--color-text-dim)' }}>
        <ZoomIn size={13} strokeWidth={2} />
      </button>
      <button onClick={onZoomOut} title="Zoom out" className={btnCls} style={{ color: 'var(--color-text-dim)' }}>
        <ZoomOut size={13} strokeWidth={2} />
      </button>
      <div className="w-px h-4 mx-0.5" style={{ background: 'var(--color-border)' }} />
      <button onClick={onFitView} title="Fit to screen (Ctrl+Shift+F)" className={btnCls} style={{ color: 'var(--color-text-dim)' }}>
        <Maximize2 size={13} strokeWidth={2} />
      </button>
      {onToggleBg && (
        <>
          <div className="w-px h-4 mx-0.5" style={{ background: 'var(--color-border)' }} />
          <button
            onClick={onToggleBg}
            title={`Background: ${bgStyle} (click to cycle)`}
            className={`${btnCls} text-[11px] font-bold`}
            style={{ color: 'var(--color-text-dim)' }}
          >
            {BG_LABELS[bgStyle ?? 'dots']}
          </button>
        </>
      )}
      <div className="w-px h-4 mx-0.5" style={{ background: 'var(--color-border)' }} />
      <button onClick={onExport} title="Export PNG (Ctrl+Shift+E)" className={btnCls} style={{ color: 'var(--color-text-dim)' }}>
        <Download size={13} strokeWidth={2} />
      </button>
    </div>
  );
}
