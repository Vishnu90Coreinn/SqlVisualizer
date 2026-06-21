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

  // Background — dark base
  ctx.fillStyle = '#090c12';
  ctx.fillRect(0, 0, W, H);

  // Radial amber glow top-left
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 480);
  glow.addColorStop(0, 'rgba(240,169,63,0.07)');
  glow.addColorStop(1, 'rgba(240,169,63,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Radial cyan glow bottom-right
  const glow2 = ctx.createRadialGradient(W, H, 0, W, H, 520);
  glow2.addColorStop(0, 'rgba(79,214,224,0.05)');
  glow2.addColorStop(1, 'rgba(79,214,224,0)');
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, W, H);

  // Subtle grid dots
  ctx.fillStyle = 'rgba(28,36,54,0.8)';
  for (let x = 28; x < W; x += 28) {
    for (let y = 28; y < H; y += 28) {
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Header bar — slightly raised bg
  ctx.fillStyle = 'rgba(15,20,32,0.9)';
  ctx.fillRect(0, 0, W, 80);

  // Amber accent line at top (thicker)
  ctx.fillStyle = '#f0a93f';
  ctx.fillRect(0, 0, W, 4);

  // Logo — larger, more prominent
  ctx.font = 'bold 28px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = '#e7ecf7';
  const sqlW = ctx.measureText('SQL').width;
  ctx.fillText('SQL', 36, 50);
  ctx.fillStyle = '#f0a93f';
  const slashW = ctx.measureText('//').width;
  ctx.fillText('//', 36 + sqlW, 50);
  ctx.fillStyle = '#e7ecf7';
  ctx.fillText('VISUALIZER', 36 + sqlW + slashW, 50);

  // Subtitle under logo
  ctx.font = '13px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = '#3d4d6a';
  const subtitle = mode === 'schema' ? 'schema explorer' : 'sql query visualizer';
  ctx.fillText(subtitle, 37, 68);

  // URL pill (right side of header)
  ctx.font = 'bold 12px "JetBrains Mono", ui-monospace, monospace';
  const urlText = 'sql-visualizer-theta.vercel.app';
  const urlW2 = ctx.measureText(urlText).width;
  const pillX = W - urlW2 - 72;
  const pillY = 28;
  const pillW = urlW2 + 24;
  const pillH = 26;
  // Pill background
  ctx.fillStyle = 'rgba(240,169,63,0.1)';
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, 6);
  ctx.fill();
  ctx.strokeStyle = 'rgba(240,169,63,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Pill text
  ctx.fillStyle = '#f0a93f';
  ctx.fillText(urlText, pillX + 12, pillY + 17);

  // Diagram image
  const img = new Image();
  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
    img.src = diagramDataUrl;
  });

  const FOOTER_H = 68;
  const diagramArea = { x: 0, y: 88, w: W, h: H - 88 - FOOTER_H };
  const scale = Math.min(diagramArea.w / img.width, diagramArea.h / img.height) * 0.92;
  const dw = img.width * scale;
  const dh = img.height * scale;
  const dx = diagramArea.x + (diagramArea.w - dw) / 2;
  const dy = diagramArea.y + (diagramArea.h - dh) / 2;

  // Subtle vignette over diagram area
  ctx.drawImage(img, dx, dy, dw, dh);

  // Footer
  ctx.fillStyle = 'rgba(9,12,18,0.92)';
  ctx.fillRect(0, H - FOOTER_H, W, FOOTER_H);
  ctx.fillStyle = '#1c2436';
  ctx.fillRect(0, H - FOOTER_H, W, 1);

  // SQL label badge
  ctx.fillStyle = 'rgba(240,169,63,0.12)';
  ctx.beginPath();
  ctx.roundRect(32, H - FOOTER_H + 18, 36, 18, 4);
  ctx.fill();
  ctx.font = 'bold 10px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = '#f0a93f';
  ctx.fillText('SQL', 40, H - FOOTER_H + 31);

  // SQL snippet
  const snippet = sql.replace(/\s+/g, ' ').trim();
  const maxLen = 115;
  const displaySnippet = snippet.length > maxLen ? snippet.slice(0, maxLen) + '…' : snippet;
  ctx.font = '12px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = '#5a6480';
  ctx.fillText(displaySnippet, 80, H - FOOTER_H + 31);

  // Amber bottom accent
  ctx.fillStyle = '#f0a93f';
  ctx.fillRect(0, H - 4, W, 4);

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
