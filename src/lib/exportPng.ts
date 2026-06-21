import { toPng, toSvg } from 'html-to-image';

export async function exportDiagramAsCard(
  element: HTMLElement,
  sql: string,
  mode: 'query' | 'schema'
): Promise<void> {
  // Capture diagram at 2× resolution
  const diagramDataUrl = await toPng(element, {
    backgroundColor: '#090c12',
    pixelRatio: 2,
    filter: (node) => {
      if (!(node instanceof Element)) return true;
      if (node.classList.contains('react-flow__controls')) return false;
      if (node.classList.contains('react-flow__minimap')) return false;
      return true;
    },
  });

  const W = 1200;
  const H = 630;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#090c12';
  ctx.fillRect(0, 0, W, H);

  // Subtle grid dots
  ctx.fillStyle = '#1c2436';
  for (let x = 24; x < W; x += 28) {
    for (let y = 24; y < H; y += 28) {
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Header bar background
  ctx.fillStyle = '#0f1420';
  ctx.fillRect(0, 0, W, 72);

  // Amber accent line at top
  ctx.fillStyle = '#f0a93f';
  ctx.fillRect(0, 0, W, 3);

  // Logo text
  ctx.font = 'bold 22px "JetBrains Mono", monospace';
  ctx.fillStyle = '#e7ecf7';
  ctx.fillText('SQL', 32, 44);
  ctx.fillStyle = '#f0a93f';
  ctx.fillText('//', 32 + ctx.measureText('SQL').width, 44);
  ctx.fillStyle = '#e7ecf7';
  ctx.fillText('VISUALIZER', 32 + ctx.measureText('SQL//').width, 44);

  // Subtitle
  ctx.font = '13px "JetBrains Mono", monospace';
  ctx.fillStyle = '#5a6480';
  const subtitle = mode === 'schema' ? 'schema explorer' : 'paste a query, see how it actually runs';
  ctx.fillText(subtitle, 32, 62);

  // URL tag (right side)
  ctx.font = 'bold 11px "JetBrains Mono", monospace';
  ctx.fillStyle = '#f0a93f';
  const urlText = 'sql-visualizer-theta.vercel.app';
  const urlW = ctx.measureText(urlText).width;
  ctx.fillText(urlText, W - urlW - 32, 44);

  // Diagram image (composite in middle section)
  const img = new Image();
  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
    img.src = diagramDataUrl;
  });

  const diagramArea = { x: 24, y: 80, w: W - 48, h: H - 160 };
  const scale = Math.min(diagramArea.w / img.width, diagramArea.h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  const dx = diagramArea.x + (diagramArea.w - dw) / 2;
  const dy = diagramArea.y + (diagramArea.h - dh) / 2;

  ctx.drawImage(img, dx, dy, dw, dh);

  // SQL snippet bar at bottom
  ctx.fillStyle = '#0f1420';
  ctx.fillRect(0, H - 72, W, 72);

  ctx.fillStyle = '#28324a';
  ctx.fillRect(0, H - 72, W, 1);

  ctx.font = '12px "JetBrains Mono", monospace';
  ctx.fillStyle = '#5a6480';
  ctx.fillText('SQL', 32, H - 44);

  const snippet = sql.replace(/\s+/g, ' ').trim().slice(0, 110) + (sql.length > 110 ? '…' : '');
  ctx.font = '12px "JetBrains Mono", monospace';
  ctx.fillStyle = '#8b95ad';
  ctx.fillText(snippet, 80, H - 44);

  // Amber bottom accent
  ctx.fillStyle = '#f0a93f';
  ctx.fillRect(0, H - 3, W, 3);

  // Download
  const a = document.createElement('a');
  a.download = `sql-viz-card-${new Date().toISOString().slice(0, 10)}.png`;
  a.href = canvas.toDataURL('image/png');
  a.click();
}

export async function exportDiagramAsPng(element: HTMLElement): Promise<void> {
  const dataUrl = await toPng(element, {
    backgroundColor: '#090c12',
    pixelRatio: 2,
    filter: (node) => {
      if (!(node instanceof Element)) return true;
      if (node.classList.contains('react-flow__controls')) return false;
      if (node.classList.contains('react-flow__minimap')) return false;
      return true;
    },
  });
  const a = document.createElement('a');
  a.download = `sql-diagram-${new Date().toISOString().slice(0, 10)}.png`;
  a.href = dataUrl;
  a.click();
}

export async function exportDiagramAsSvg(element: HTMLElement): Promise<void> {
  const dataUrl = await toSvg(element, {
    filter: (node) => {
      if (!(node instanceof Element)) return true;
      if (node.classList.contains('react-flow__controls')) return false;
      if (node.classList.contains('react-flow__minimap')) return false;
      return true;
    },
  });
  const a = document.createElement('a');
  a.download = `sql-diagram-${new Date().toISOString().slice(0, 10)}.svg`;
  a.href = dataUrl;
  a.click();
}
