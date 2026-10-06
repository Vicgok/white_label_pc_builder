import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

// Registration/format conversion only. All hardware pixels come from imagegen.
// Every exported file uses the same canvas; the browser never crops individual layers.
const canvasSize = 1600;
const placements = {
  case: [480, 385, 730, 750],
  motherboard: [575, 500, 350, 435],
  storage: [680, 875, 150, 40],
  psu: [520, 975, 365, 120],
  ram: [855, 555, 52, 185],
  cooler: [590, 464, 365, 240],
  gpu: [542, 770, 445, 150],
};
const sources = JSON.parse((await readFile('artifacts/hero-sources.json', 'utf8')).replace(/^\uFEFF/, ''));
await mkdir('public/assets/hero-pc/layers', { recursive: true });
await mkdir('public/assets/hero-pc/assembled', { recursive: true });
await mkdir('artifacts/hero-originals', { recursive: true });
const browser = await chromium.launch();
const report = [];
try {
  const page = await browser.newPage();
  for (const [id, target] of Object.entries(placements)) {
    const original = await readFile(sources[id]);
    await writeFile(`artifacts/hero-originals/${id}.png`, original);
    const result = await page.evaluate(async ({ url, target, canvasSize }) => {
      const image = new Image(); image.src = url; await image.decode();
      const source = document.createElement('canvas');
      source.width = image.naturalWidth; source.height = image.naturalHeight;
      const sourceContext = source.getContext('2d', { willReadFrequently: true });
      sourceContext.drawImage(image, 0, 0);
      const pixels = sourceContext.getImageData(0, 0, source.width, source.height).data;
      let left = source.width, top = source.height, right = 0, bottom = 0, transparent = 0;
      for (let y = 0; y < source.height; y++) for (let x = 0; x < source.width; x++) {
        const alpha = pixels[(y * source.width + x) * 4 + 3];
        if (alpha === 0) transparent++;
        if (alpha > 24) { left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y); }
      }
      if (transparent < source.width * source.height * .1) throw new Error('Source is not a transparent cutout');
      const output = document.createElement('canvas'); output.width = canvasSize; output.height = canvasSize;
      const context = output.getContext('2d'); context.imageSmoothingQuality = 'high';
      // Register the full original canvas. Its transparent margin is retained;
      // bbox only establishes the mechanical placement, never a tight image crop.
      const scale = Math.min(target[2] / (right - left + 1), target[3] / (bottom - top + 1));
      const offsetX = target[0] + (target[2] - (right - left + 1) * scale) / 2;
      const offsetY = target[1] + (target[3] - (bottom - top + 1) * scale) / 2;
      context.drawImage(image, offsetX - left * scale, offsetY - top * scale, image.naturalWidth * scale, image.naturalHeight * scale);
      return { webp: output.toDataURL('image/webp', .95), sourceSize: [source.width, source.height], sourceBounds: [left, top, right, bottom], transparentFraction: transparent / (source.width * source.height) };
    }, { url: `data:image/png;base64,${original.toString('base64')}`, target, canvasSize });
    const encoded = Buffer.from(result.webp.split(',')[1], 'base64');
    await writeFile(`public/assets/hero-pc/layers/hero-${id}.webp`, encoded);
    const { webp, ...metadata } = result;
    report.push({ id, canvasSize, placement: target, bytes: encoded.length, ...metadata });
  }
  await page.evaluate(async () => {
    window.heroImages = {};
  });
  for (const id of ['case', 'storage', 'psu', 'ram', 'motherboard']) {
    const bytes = await readFile(`public/assets/hero-pc/layers/hero-${id}.webp`);
    await page.evaluate(async ({ id, url }) => {
      const image = new Image(); image.src = url; await image.decode(); window.heroImages[id] = image;
    }, { id, url: `data:image/webp;base64,${bytes.toString('base64')}` });
  }
  const mobileBase = await page.evaluate(size => {
    const canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size;
    const context = canvas.getContext('2d');
    for (const id of ['case', 'psu']) context.drawImage(window.heroImages[id], 0, 0);
    return canvas.toDataURL('image/webp', .95);
  }, canvasSize);
  await writeFile('public/assets/hero-pc/layers/hero-case-mobile.webp', Buffer.from(mobileBase.split(',')[1], 'base64'));
  const mobileBoard = await page.evaluate(size => {
    const canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size;
    const context = canvas.getContext('2d');
    for (const id of ['motherboard', 'storage', 'ram']) context.drawImage(window.heroImages[id], 0, 0);
    return canvas.toDataURL('image/webp', .95);
  }, canvasSize);
  await writeFile('public/assets/hero-pc/layers/hero-motherboard-mobile.webp', Buffer.from(mobileBoard.split(',')[1], 'base64'));
  // The original assembled campaign image is the static/reduced-motion fallback.
  const master = await readFile(sources.assembled);
  await writeFile('artifacts/hero-originals/assembled.png', master);
  const assembled = await page.evaluate(async ({ url, size }) => {
    const image = new Image(); image.src = url; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size;
    const context = canvas.getContext('2d'); context.imageSmoothingQuality = 'high';
    // The master and empty case have the same photographed outer bounds.
    const scale = 750 / 1097;
    context.drawImage(image, 480 - 97 * scale, 385 - 81 * scale, image.width * scale, image.height * scale);
    return canvas.toDataURL('image/webp', .95);
  }, { url: `data:image/png;base64,${master.toString('base64')}`, size: canvasSize });
  await writeFile('public/assets/hero-pc/assembled/pc.webp', Buffer.from(assembled.split(',')[1], 'base64'));
  await writeFile('public/assets/hero-pc/layers/manifest.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ canvasSize, totalBytes: report.reduce((sum, item) => sum + item.bytes, 0), layers: report }, null, 2));
} finally { await browser.close(); }
