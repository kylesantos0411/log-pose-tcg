'use client';

// Dynamically load Tesseract.js from CDN to avoid huge bundle sizes
let tesseractPromise: Promise<any> | null = null;

function loadTesseract(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject('SSR');
  if ((window as any).Tesseract) return Promise.resolve((window as any).Tesseract);
  if (tesseractPromise) return tesseractPromise;

  tesseractPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-tesseract]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve((window as any).Tesseract));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    script.setAttribute('data-tesseract', 'true');
    script.async = true;
    script.onload = () => {
      resolve((window as any).Tesseract);
    };
    script.onerror = (err) => {
      console.warn('Failed to load Tesseract from CDN:', err);
      reject(err);
    };
    document.head.appendChild(script);
  });

  return tesseractPromise;
}

/**
 * Preprocesses an image canvas for optimal OCR accuracy.
 * Enhances contrast and converts to grayscale thresholding.
 */
export function preprocessCanvas(
  source: HTMLVideoElement | HTMLImageElement,
  cropArea?: { x: number; y: number; width: number; height: number }
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const sw = cropArea ? cropArea.width : (source as any).videoWidth || source.width || 800;
  const sh = cropArea ? cropArea.height : (source as any).videoHeight || source.height || 600;
  const sx = cropArea ? cropArea.x : 0;
  const sy = cropArea ? cropArea.y : 0;

  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh);

  try {
    const imgData = ctx.getImageData(0, 0, sw, sh);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      // Luminance grayscale
      const v = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      // Adaptive contrast enhancement: boost contrast around the text threshold
      const enhanced = v > 110 ? Math.min(255, v * 1.35) : Math.max(0, v * 0.65);
      d[i] = enhanced;
      d[i + 1] = enhanced;
      d[i + 2] = enhanced;
    }
    ctx.putImageData(imgData, 0, 0);
  } catch (e) {
    // Canvas tainted or context error, return raw canvas
  }

  return canvas;
}

/**
 * Extracts One Piece Card Game serial IDs from raw OCR text.
 * Handles common OCR mistakes (e.g. 0 vs O, missing hyphens, spaces).
 */
export function extractOnePieceCode(rawText: string): string | null {
  if (!rawText) return null;

  // Clean and normalize text
  const clean = rawText
    .toUpperCase()
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[—–_]/g, '-');

  // Fix common OCR zero/O mixups in standard set prefixes
  const normalized = clean
    .replace(/\b0P(\d{2})/g, 'OP$1')
    .replace(/\bOPO(\d{1})/g, 'OP0$1')
    .replace(/\b5T(\d{2})/g, 'ST$1');

  // Regex patterns:
  // 1. Standard Booster (OP01-001, OP05-119, OP10-025)
  // 2. Starter Deck (ST01-001, ST13-005)
  // 3. Extra Booster (EB01-001)
  // 4. Premium Booster (PRB01-001)
  // 5. Promo (P-001 to P-099)
  const pattern = /\b(OP\d{2}|ST\d{2}|EB\d{2}|PRB\d{2}|P)[\s-]?(\d{3})\b/i;
  const match = normalized.match(pattern);

  if (match) {
    const prefix = match[1].toUpperCase();
    const num = match[2];
    return `${prefix}-${num}`;
  }

  // Secondary relaxed check: e.g. "OP05 119" without boundary
  const relaxed = normalized.match(/(OP\d{2}|ST\d{2}|EB\d{2}|PRB\d{2}|P)[\s-]?(\d{3})/i);
  if (relaxed) {
    return `${relaxed[1].toUpperCase()}-${relaxed[2]}`;
  }

  return null;
}

/**
 * Recognizes text from a canvas using either Native Shape Detection API or Tesseract.js
 */
export async function recognizeTextFromCanvas(canvas: HTMLCanvasElement): Promise<string> {
  // Strategy 1: Native Android Chrome / Chromium Shape Detection API (instant ~15ms)
  if (typeof window !== 'undefined' && 'TextDetector' in window) {
    try {
      const detector = new (window as any).TextDetector();
      const detected = await detector.detect(canvas);
      if (detected && detected.length > 0) {
        return detected.map((t: any) => t.rawValue).join(' ');
      }
    } catch (e) {
      console.warn('Native TextDetector failed, falling back to Tesseract:', e);
    }
  }

  // Strategy 2: Tesseract.js (pure JS fallback for Safari / browsers without TextDetector)
  try {
    const Tesseract = await loadTesseract();
    const result = await Tesseract.recognize(canvas, 'eng', {
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789- ',
    });
    return result.data?.text || '';
  } catch (err) {
    console.error('OCR recognition error:', err);
    return '';
  }
}
