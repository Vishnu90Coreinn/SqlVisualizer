import { toPng, toSvg } from 'html-to-image';

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
