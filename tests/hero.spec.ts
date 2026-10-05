import { expect, test } from '@playwright/test';

async function setHeroProgress(page: import('@playwright/test').Page, progress: number) {
  await page.evaluate(value => {
    const hero = document.querySelector<HTMLElement>('.hero-pc-scroll')!;
    const top = hero.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, top + (hero.offsetHeight - window.innerHeight) * value);
  }, progress);
  await page.waitForFunction(value => Math.abs(Number(document.querySelector<HTMLElement>('.hero-pc-scroll')?.dataset.progress) - value) < .025, progress);
}

test('homepage hero opens in scroll stages without overflow', async ({ browser }) => {
  for (const width of [1440, 1280, 1024, 768, 390]) {
    const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 900 } });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Build the machine you actually need.' })).toBeVisible();
    await page.locator('.hero-pc-layer').evaluateAll(async images => {
      await Promise.all(images.map(image => (image as HTMLImageElement).decode()));
    });
    expect(await page.locator('.hero-pc-layer').count()).toBe(8);
    expect(await page.locator('link[rel="preload"][as="image"][href^="/images/hero/"]').count()).toBe(8);
    expect(await page.locator('.hero-pc-sticky').evaluate(element => getComputedStyle(element).position)).toBe('sticky');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const assembled = await page.locator('[data-layer="gpu"]').evaluate(element => getComputedStyle(element).transform);
    if (width > 767) {
      expect(Number(await page.locator('[data-callout="gpu"]').evaluate(element => getComputedStyle(element).opacity))).toBe(0);
    }
    await setHeroProgress(page, .5);
    const halfway = await page.locator('[data-layer="gpu"]').evaluate(element => getComputedStyle(element).transform);
    expect(halfway).not.toBe(assembled);
    await setHeroProgress(page, .92);
    expect(Number(await page.locator('.hero-pc-final').evaluate(element => getComputedStyle(element).opacity))).toBeGreaterThan(.65);
    if (width > 767) {
      expect(Number(await page.locator('[data-callout="gpu"]').evaluate(element => getComputedStyle(element).opacity))).toBeGreaterThan(.9);
    } else {
      expect(await page.locator('.hero-pc-layer-psu').evaluate(element => getComputedStyle(element).display)).toBe('none');
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(errors).toEqual([]);
    await page.close();
  }
});

test('reduced motion shows a short static final scene', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const hero = page.locator('.hero-pc-scroll');
  expect(await hero.evaluate(element => (element as HTMLElement).offsetHeight)).toBeLessThan(1000);
  expect(Number(await page.locator('.hero-pc-final').evaluate(element => getComputedStyle(element).opacity))).toBeGreaterThan(.95);
  await expect(page.getByRole('link', { name: 'Build My PC' }).last()).toBeVisible();
});
