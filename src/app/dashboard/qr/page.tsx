'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Download,
  Copy,
  CheckCircle,
  QrCode,
  Printer,
  Smartphone,
  UtensilsCrossed,
  Palette,
  RotateCcw,
} from 'lucide-react';
import { useRestaurant } from '@/lib/context/restaurant-context';

// ============================================
// QR generation using Canvas API
// ============================================

// QR Code generator - minimal implementation using Canvas
// For production, the `qrcode` npm package is used server-side
// Here we use the browser-friendly approach

interface QROptions {
  size: number;
  fgColor: string;
  bgColor: string;
  logoUrl?: string | null;
  margin: number;
}

async function generateQRDataURL(text: string, options: QROptions): Promise<string> {
  // Use dynamic import of qrcode library
  const QRCode = (await import('qrcode')).default;

  const canvas = document.createElement('canvas');
  canvas.width = options.size;
  canvas.height = options.size;

  await QRCode.toCanvas(canvas, text, {
    width: options.size,
    margin: options.margin,
    color: {
      dark: options.fgColor,
      light: options.bgColor,
    },
    errorCorrectionLevel: 'H', // High - allows logo overlay
  });

  // If logo, draw it in the center
  if (options.logoUrl) {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve) => {
        img.onload = () => {
          const logoSize = options.size * 0.22;
          const x = (options.size - logoSize) / 2;
          const y = (options.size - logoSize) / 2;

          // White background circle for logo
          ctx.beginPath();
          ctx.arc(options.size / 2, options.size / 2, logoSize * 0.62, 0, Math.PI * 2);
          ctx.fillStyle = options.bgColor;
          ctx.fill();

          // Draw logo
          ctx.drawImage(img, x, y, logoSize, logoSize);
          resolve();
        };
        img.onerror = () => resolve();
        img.src = options.logoUrl!;
      });
    }
  }

  return canvas.toDataURL('image/png');
}

// ============================================
// Print template generator
// ============================================

function generatePrintHTML(
  qrDataUrl: string,
  restaurantName: string,
  menuUrl: string,
  template: 'single' | 'table-tent' | 'multi',
  accentColor: string
): string {
  const baseStyles = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        @page { margin: 0; }
      }
    </style>
  `;

  if (template === 'single') {
    return `<!DOCTYPE html><html><head><title>QR - ${restaurantName}</title>${baseStyles}
    <style>
      .page {
        width: 100vw; height: 100vh;
        display: flex; align-items: center; justify-content: center;
        background: white;
      }
      .card {
        text-align: center; padding: 48px;
        border: 3px solid ${accentColor}; border-radius: 24px;
        max-width: 420px;
      }
      .icon-bar {
        display: flex; align-items: center; justify-content: center;
        gap: 10px; margin-bottom: 20px;
      }
      .icon-bar svg { width: 28px; height: 28px; color: ${accentColor}; }
      .name {
        font-size: 26px; font-weight: 800; color: #1a1a1a;
        margin-bottom: 6px;
      }
      .subtitle {
        font-size: 14px; color: #666; margin-bottom: 28px;
        font-weight: 500;
      }
      .qr-wrapper {
        background: white; padding: 16px; border-radius: 16px;
        display: inline-block; margin-bottom: 24px;
        box-shadow: 0 2px 12px rgba(0,0,0,0.06);
      }
      .qr-wrapper img { width: 240px; height: 240px; display: block; }
      .scan-text {
        font-size: 18px; font-weight: 700; color: ${accentColor};
        margin-bottom: 6px;
      }
      .url {
        font-size: 11px; color: #999; word-break: break-all;
        font-family: monospace;
      }
    </style></head><body>
    <div class="page"><div class="card">
      <div class="icon-bar">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>
      </div>
      <div class="name">${restaurantName}</div>
      <div class="subtitle">Menú Digital</div>
      <div class="qr-wrapper"><img src="${qrDataUrl}" alt="QR"/></div>
      <div class="scan-text">Escaneá para ver el menú</div>
      <div class="url">${menuUrl}</div>
    </div></div>
    <script>window.onload=()=>window.print()</script>
    </body></html>`;
  }

  if (template === 'table-tent') {
    return `<!DOCTYPE html><html><head><title>QR Tent - ${restaurantName}</title>${baseStyles}
    <style>
      @page { size: A4 landscape; margin: 0; }
      .page {
        width: 297mm; height: 210mm;
        display: flex;
        page-break-after: always;
      }
      .side {
        width: 50%; height: 100%;
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        padding: 30px; text-align: center;
      }
      .side-front { background: white; }
      .side-back {
        background: linear-gradient(135deg, ${accentColor}, ${accentColor}dd);
        transform: rotate(180deg);
      }
      .name {
        font-size: 28px; font-weight: 800; color: #1a1a1a;
        margin-bottom: 8px;
      }
      .back-name {
        font-size: 28px; font-weight: 800; color: white;
        margin-bottom: 8px;
      }
      .subtitle { font-size: 14px; color: #666; margin-bottom: 24px; }
      .back-subtitle { font-size: 14px; color: rgba(255,255,255,0.8); margin-bottom: 24px; }
      .qr-wrapper {
        background: white; padding: 16px; border-radius: 16px;
        display: inline-block; margin-bottom: 20px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      }
      .qr-wrapper img { width: 200px; height: 200px; display: block; }
      .scan-text { font-size: 20px; font-weight: 700; color: ${accentColor}; margin-bottom: 8px; }
      .back-scan { font-size: 20px; font-weight: 700; color: white; margin-bottom: 8px; }
      .dashed { border-left: 2px dashed #ccc; }
      .fold-line {
        position: absolute; top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        writing-mode: vertical-rl;
        font-size: 10px; color: #ccc; letter-spacing: 2px;
      }
    </style></head><body>
    <div class="page" style="position:relative;">
      <div class="side side-front">
        <div class="name">${restaurantName}</div>
        <div class="subtitle">Menú Digital</div>
        <div class="qr-wrapper"><img src="${qrDataUrl}" alt="QR"/></div>
        <div class="scan-text">Escaneá el QR</div>
      </div>
      <div class="side side-back dashed">
        <div class="back-name">${restaurantName}</div>
        <div class="back-subtitle">Menú Digital</div>
        <div class="qr-wrapper"><img src="${qrDataUrl}" alt="QR"/></div>
        <div class="back-scan">Escaneá el QR</div>
      </div>
      <div class="fold-line">✂ DOBLAR AQUÍ</div>
    </div>
    <script>window.onload=()=>window.print()</script>
    </body></html>`;
  }

  // Multi - 6 QR codes per A4 page (2x3 grid)
  return `<!DOCTYPE html><html><head><title>QR x6 - ${restaurantName}</title>${baseStyles}
  <style>
    @page { size: A4; margin: 10mm; }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      grid-template-rows: repeat(3, 1fr);
      gap: 12px;
      height: calc(297mm - 20mm);
      width: calc(210mm - 20mm);
    }
    .cell {
      border: 2px solid ${accentColor}; border-radius: 16px;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      padding: 14px; text-align: center;
    }
    .name { font-size: 15px; font-weight: 800; color: #1a1a1a; margin-bottom: 4px; }
    .subtitle { font-size: 10px; color: #666; margin-bottom: 10px; }
    .qr-wrapper img { width: 120px; height: 120px; display: block; }
    .scan-text { font-size: 13px; font-weight: 700; color: ${accentColor}; margin-top: 8px; }
  </style></head><body>
  <div class="grid">
    ${Array(6).fill(`
      <div class="cell">
        <div class="name">${restaurantName}</div>
        <div class="subtitle">Menú Digital</div>
        <div class="qr-wrapper"><img src="${qrDataUrl}" alt="QR"/></div>
        <div class="scan-text">Escaneá el QR</div>
      </div>
    `).join('')}
  </div>
  <script>window.onload=()=>window.print()</script>
  </body></html>`;
}

// ============================================
// Color presets
// ============================================

const colorPresets = [
  { name: 'Púrpura', fg: '#6d28d9', bg: '#ffffff' },
  { name: 'Negro', fg: '#000000', bg: '#ffffff' },
  { name: 'Azul', fg: '#1d4ed8', bg: '#ffffff' },
  { name: 'Rojo', fg: '#b91c1c', bg: '#ffffff' },
  { name: 'Verde', fg: '#15803d', bg: '#ffffff' },
  { name: 'Naranja', fg: '#c2410c', bg: '#ffffff' },
];

// ============================================
// Main Component
// ============================================

export default function QRCodePage() {
  const { currentRestaurant } = useRestaurant();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState(colorPresets[0]);
  const [qrSize] = useState(800); // High res for printing

  const restaurantName = currentRestaurant?.name || '';
  const restaurantSlug = currentRestaurant?.slug || '';
  const restaurantLogo: string | null = null;
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://restoqr.app';
  const menuUrl = `${siteUrl}/menu/${restaurantSlug}`;

  const generateQR = useCallback(async () => {
    if (!restaurantSlug) return;
    setLoading(true);
    try {
      const dataUrl = await generateQRDataURL(menuUrl, {
        size: qrSize,
        fgColor: selectedColor.fg,
        bgColor: selectedColor.bg,
        logoUrl: restaurantLogo,
        margin: 2,
      });
      setQrDataUrl(dataUrl);
    } catch (error) {
      console.error('Error generating QR:', error);
    } finally {
      setLoading(false);
    }
  }, [menuUrl, qrSize, selectedColor, restaurantLogo, restaurantSlug]);

  useEffect(() => {
    generateQR();
  }, [generateQR]);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(menuUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPNG = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `qr-${restaurantSlug}.png`;
    link.click();
  };

  const handlePrint = (template: 'single' | 'table-tent' | 'multi') => {
    if (!qrDataUrl) return;

    const html = generatePrintHTML(
      qrDataUrl,
      restaurantName,
      menuUrl,
      template,
      selectedColor.fg
    );

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    }
  };

  if (!currentRestaurant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Cargando restaurante...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Código QR del Menú</h1>
        <p className="text-gray-500 mt-1">
          Genera, personaliza e imprime el QR para que tus clientes accedan al menú
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* QR Preview - Left side */}
        <div className="lg:col-span-3 space-y-6">
          {/* QR Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex flex-col items-center">
              {/* QR Image */}
              <div
                className="p-5 rounded-2xl border-2 mb-6 transition-colors"
                style={{ borderColor: selectedColor.fg + '33' }}
              >
                {loading ? (
                  <div className="w-64 h-64 bg-gray-100 rounded-xl animate-pulse flex items-center justify-center">
                    <QrCode className="w-12 h-12 text-gray-300" />
                  </div>
                ) : qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Código QR del menú"
                    className="w-64 h-64 rounded-xl"
                  />
                ) : null}
              </div>

              {/* Restaurant name */}
              <h2 className="text-xl font-bold text-gray-900 mb-1">{restaurantName}</h2>
              <p className="text-sm text-gray-500 mb-6">Menú Digital</p>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={handleDownloadPNG}
                  disabled={!qrDataUrl}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Descargar PNG
                </button>
                <button
                  onClick={generateQR}
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-all"
                >
                  <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Regenerar
                </button>
              </div>
            </div>
          </div>

          {/* URL Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">URL del Menú</h3>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl">
                <Smartphone className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" />
                <span className="text-sm text-gray-600 font-mono truncate">{menuUrl}</span>
              </div>
              <button
                onClick={handleCopyUrl}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all flex-shrink-0 ${
                  copied
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copiar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Customization & Print - Right side */}
        <div className="lg:col-span-2 space-y-6">
          {/* Color picker */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-900">Color del QR</h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {colorPresets.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setSelectedColor(color)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                    selectedColor.name === color.name
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-lg border border-gray-200"
                    style={{ backgroundColor: color.fg }}
                  />
                  <span className="text-xs text-gray-600 font-medium">{color.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Print Templates */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Printer className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-900">Imprimir</h3>
            </div>
            <div className="space-y-3">
              {/* Single QR */}
              <button
                onClick={() => handlePrint('single')}
                disabled={!qrDataUrl}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all text-left group disabled:opacity-50"
              >
                <div className="w-12 h-12 bg-purple-100 group-hover:bg-purple-200 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                  <div className="w-6 h-6 border-2 border-purple-600 rounded" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">QR Individual</p>
                  <p className="text-xs text-gray-500">Una página con un QR grande, ideal para cartelería</p>
                </div>
              </button>

              {/* Table tent */}
              <button
                onClick={() => handlePrint('table-tent')}
                disabled={!qrDataUrl}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all text-left group disabled:opacity-50"
              >
                <div className="w-12 h-12 bg-indigo-100 group-hover:bg-indigo-200 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                  <div className="w-8 h-5 border-2 border-indigo-600 rounded flex">
                    <div className="w-1/2 border-r border-dashed border-indigo-400" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Tent Card</p>
                  <p className="text-xs text-gray-500">Doble cara para doblar y poner en la mesa</p>
                </div>
              </button>

              {/* Multi print */}
              <button
                onClick={() => handlePrint('multi')}
                disabled={!qrDataUrl}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all text-left group disabled:opacity-50"
              >
                <div className="w-12 h-12 bg-blue-100 group-hover:bg-blue-200 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                  <div className="grid grid-cols-2 gap-0.5">
                    <div className="w-2.5 h-2.5 border border-blue-600 rounded-sm" />
                    <div className="w-2.5 h-2.5 border border-blue-600 rounded-sm" />
                    <div className="w-2.5 h-2.5 border border-blue-600 rounded-sm" />
                    <div className="w-2.5 h-2.5 border border-blue-600 rounded-sm" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">6 por Página</p>
                  <p className="text-xs text-gray-500">A4 con 6 QRs para recortar</p>
                </div>
              </button>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-5 border border-purple-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Consejos</h3>
            <ul className="text-xs text-gray-600 space-y-1.5">
              <li>Imprimí en tamaño mínimo de 3x3 cm para que se escanee bien</li>
              <li>Usá colores con alto contraste (oscuro sobre claro)</li>
              <li>Probá escanearlo con tu celular antes de imprimir</li>
              <li>Cada escaneo queda registrado en tus métricas</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
