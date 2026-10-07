import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

// Run against `npm run dev` to refresh the local review images.
await mkdir('artifacts', { recursive: true });
const browser = await chromium.launch();
async function loadImages(page) {
  await page.locator('img').evaluateAll(async images => {
    await Promise.all(images.map(async image => {
      image.loading = 'eager';
      await image.decode();
    }));
  });
}
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto('http://127.0.0.1:5173/');
  await page.getByRole('heading', { name: 'Build the machine you actually need.' }).waitFor();
  await loadImages(page);
  await page.screenshot({ path: 'artifacts/home-desktop.png', fullPage: true });
  await page.goto('http://127.0.0.1:5173/builder?build=vortex-1440');
  await page.getByRole('heading', { name: 'Processors', exact: true }).waitFor();
  await loadImages(page);
  await page.screenshot({ path: 'artifacts/builder-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'artifacts/builder-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Review Build', exact: true }).click();
  await page.getByRole('dialog', { name: 'Review your build' }).waitFor();
  await page.getByRole('dialog').evaluate(async element => { await Promise.all(element.getAnimations({ subtree: true }).map(animation => animation.finished)); });
  await page.screenshot({ path: 'artifacts/review-mobile.png' });
  await page.goto('http://127.0.0.1:5173/');
  await loadImages(page);
  await page.screenshot({ path: 'artifacts/home-mobile.png', fullPage: true });
  await page.goto('http://127.0.0.1:5173/builds/studio-pro');
  await loadImages(page);
  await page.screenshot({ path: 'artifacts/detail-mobile.png', fullPage: true });
  console.log('Saved six preview images in artifacts/.');
} finally { await browser.close(); }
