import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

await mkdir('artifacts', { recursive: true });
const browser = await chromium.launch();
try {
  for (const [name, width, height] of [['desktop', 1440, 900], ['laptop', 1280, 900], ['small-desktop', 1024, 900], ['tablet', 768, 900], ['mobile', 390, 844]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.goto('http://127.0.0.1:5173/');
    await page.locator('.hero-pc-scene[data-ready="true"]').waitFor();
    for (const [stage, progress] of [['assembled', 0], ['opening', .5], ['exploded', .92]]) {
      await page.evaluate(value => {
        const hero = document.querySelector('.hero-pc-scroll');
        const start = hero.getBoundingClientRect().top + window.scrollY;
        window.scrollTo(0, start + (hero.offsetHeight - window.innerHeight) * value);
      }, progress);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await page.screenshot({ path: `artifacts/hero-${name}-${stage}.png` });
    }
    await page.close();
  }
  console.log('Saved assembled, opening and final previews at 1440, 1280, 1024, 768 and 390px.');
} finally { await browser.close(); }
