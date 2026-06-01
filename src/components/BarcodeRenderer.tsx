import { useEffect, useRef } from 'react';

interface BarcodeRendererProps {
  value: string; // The NIS (digits only, e.g. "30101")
  width?: number;
  height?: number;
  showText?: boolean;
}

// Code 39 encoding map for digits and helper characters
const CODE39_MAP: { [key: string]: string } = {
  '0': 'N N W W N W N N N',
  '1': 'W N W N N N N N W',
  '2': 'N N W N W N N N W',
  '3': 'W N W N W N N N N',
  '4': 'N N W N N N W N W',
  '5': 'W N W N N N W N N',
  '6': 'N N W N W N W N N',
  '7': 'N N W N N N N W W',
  '8': 'W N W N N N N W N',
  '9': 'N N W N W N N W N',
  '*': 'N N W N N N W N N', // Start/Stop specifier for Code 39
};

export default function BarcodeRenderer({
  value,
  width = 2,
  height = 50,
  showText = true,
}: BarcodeRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Standardize input (only letters/digits, wrapped in * for Code 39 format)
    const formattedVal = `*${value.trim().toUpperCase()}*`;

    // Map definition: W = Wide, N = Narrow
    // Code 39 uses 9 bars per character: 5 black, 4 white
    // Next, we need an inter-character space (Narrow white)
    const bars: boolean[] = []; // true = black, false = white

    for (let i = 0; i < formattedVal.length; i++) {
      const char = formattedVal[i];
      const code = CODE39_MAP[char] || CODE39_MAP['*']; // Fallback to *
      const pattern = code.split(' ');

      // Render 9 element bars
      // Pattern alternates: bar, space, bar, space, bar, space, bar, space, bar
      for (let p = 0; p < pattern.length; p++) {
        const isBar = p % 2 === 0;
        const isWide = pattern[p] === 'W';
        const numBits = isWide ? 3 : 1; // 3x wide elements

        for (let b = 0; b < numBits; b++) {
          bars.push(isBar);
        }
      }

      // Add a single narrow inter-character gap (white)
      if (i < formattedVal.length - 1) {
        bars.push(false);
      }
    }

    // Calculate canvas size
    const quietZone = 12; // margins left & right
    const contentWidth = bars.length * width;
    canvas.width = contentWidth + quietZone * 2;
    canvas.height = height + (showText ? 24 : 0);

    // Clear background (White)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw bars
    ctx.fillStyle = '#000000';
    let currentX = quietZone;

    for (let i = 0; i < bars.length; i++) {
      if (bars[i]) {
        ctx.fillRect(currentX, 4, width, height - 4);
      }
      currentX += width;
    }

    // Draw label
    if (showText) {
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`NIS ${value}`, canvas.width / 2, canvas.height - 2);
    }
  }, [value, width, height, showText]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `BARCODE_${value}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div id={`barcode-container-${value}`} className="flex flex-col items-center justify-center p-2 bg-white rounded-md border border-gray-100 shadow-sm hover:shadow transition-shadow">
      <canvas ref={canvasRef} className="max-w-full h-auto cursor-pointer" onClick={handleDownload} title="Klik untuk mengunduh gambar Barcode" />
      <button
        onClick={handleDownload}
        type="button"
        id={`btn-dl-barcode-${value}`}
        className="mt-1 text-[10px] font-semibold text-red-700 hover:text-red-900 transition-colors uppercase tracking-wider cursor-pointer"
      >
        Unduh PNG
      </button>
    </div>
  );
}
