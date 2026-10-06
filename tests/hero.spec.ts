import { expect, test, type Page } from '@playwright/test';

async function setHeroProgress(page: Page, progress: number) {
  await page.evaluate(async value => {
    const hero = document.querySelector<HTMLElement>('.hero-pc-scroll')!;
    const top = hero.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, top + (hero.offsetHeight - window.innerHeight) * value);
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }, progress);
}

async function positions(page: Page) {
  return page.locator('.hero-pc-layer').evaluateAll(elements => Object.fromEntries(elements.map(element => {
    const image = element as HTMLImageElement;
    const style = getComputedStyle(image);
    const matrix = new DOMMatrixReadOnly(style.transform);
    return [image.dataset.layer!, { x: matrix.m41, y: matrix.m42, opacity: style.opacity, display: style.display }];
  })));
}

for (const width of [1440, 1280, 1024, 768, 390]) {
  test(`photographic hardware visibly assembles, explodes and holds at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto('/');
    const scene = page.locator('.hero-pc-scene');
    const sticky = page.locator('.hero-pc-sticky');
    const copy = page.locator('.hero-pc-copy');
    const summary = page.getByRole('region', { name: 'Featured build summary' });
    await expect(scene).toHaveAttribute('data-ready', 'true');
    await expect(page.locator('.hero-pc-layer')).toHaveCount(width < 768 ? 4 : 7);
    await expect(page.locator('.hero-pc-assembled')).toHaveCount(0);
    await expect(sticky).toHaveCSS('position', 'sticky');
    expect(await page.locator('.hero-pc-scroll').evaluate(element => (element as HTMLElement).offsetHeight / innerHeight)).toBeCloseTo(width < 768 ? 1.6 : 2.2, 2);
    expect(await scene.locator('img').evaluateAll(images => images.every(element => {
      const image = element as HTMLImageElement;
      return image.currentSrc.endsWith('.webp') && image.naturalWidth === 1600 && image.naturalHeight === 1600 && getComputedStyle(image).objectFit === 'contain';
    }))).toBe(true);
    await expect(scene.locator('svg, [data-callout], .hero-pc-line, .hero-pc-callout')).toHaveCount(0);
    expect(await scene.textContent()).toBe('');
    await expect(copy).toHaveCSS('opacity', '1');
    await expect(summary).toBeHidden();
    await setHeroProgress(page, 0);
    const assembled = await positions(page);
    for (const part of Object.values(assembled)) {
      expect(part.x).toBe(0); expect(part.y).toBe(0);
      expect(part.opacity).toBe('1'); expect(part.display).not.toBe('none');
    }
    await page.screenshot({ path: `artifacts/hero-${width}-assembled.png` });
    await setHeroProgress(page, .17);
    expect(await positions(page)).toEqual(assembled);
    await setHeroProgress(page, .45);
    expect(Number(await copy.evaluate(element => getComputedStyle(element).opacity))).toBeCloseTo(.35, 2);
    await setHeroProgress(page, .5);
    const opening = await positions(page);
    expect(opening.gpu.x).toBeGreaterThan(15);
    expect(opening.cooler.y).toBeLessThan(-10);
    expect(opening.motherboard.x).toBeLessThan(-5);
    expect(opening.case).toEqual(assembled.case);
    expect((await sticky.boundingBox())!.y).toBeCloseTo(0);
    await expect(scene.locator('.hero-pc-layer-stack')).toHaveCSS('opacity', '1');
    await page.screenshot({ path: `artifacts/hero-${width}-opening.png` });
    await setHeroProgress(page, .82);
    const exploded = await positions(page);
    expect(exploded.gpu.x).toBeGreaterThan(opening.gpu.x);
    expect(exploded.cooler.y).toBeLessThan(opening.cooler.y);
    expect(exploded.motherboard.x).toBeLessThan(opening.motherboard.x);
    expect(exploded.case).toEqual(assembled.case);
    if (width >= 768) {
      expect(exploded.ram.y).toBeLessThan(-10);
      expect(exploded.psu.x).toBeLessThan(-10);
      expect(exploded.storage.x).toBeGreaterThan(10);
    }
    const sceneTransform = await scene.evaluate(element => getComputedStyle(element).transform);
    await setHeroProgress(page, .92);
    expect(await positions(page)).toEqual(exploded);
    expect(await scene.evaluate(element => getComputedStyle(element).transform)).toBe(sceneTransform);
    await expect(summary).toHaveCSS('opacity', '1');
    expect(await summary.evaluate(element => (element as HTMLElement).inert)).toBe(false);
    await expect(copy).toBeHidden();
    await expect(summary.getByRole('link', { name: 'Customize Build' })).toBeVisible();
    const summaryBox = (await summary.boundingBox())!, visualBox = (await page.locator('.hero-pc-visual').boundingBox())!;
    if (width >= 768) expect(summaryBox.x + summaryBox.width).toBeLessThanOrEqual(visualBox.x);
    else expect(summaryBox.y).toBeGreaterThanOrEqual(visualBox.y + visualBox.height - 1);
    await page.screenshot({ path: `artifacts/hero-${width}-exploded.png` });
    await setHeroProgress(page, .94);
    expect(await positions(page)).toEqual(exploded);
    await setHeroProgress(page, 1);
    expect(await positions(page)).toEqual(exploded);
    await expect(scene).toHaveCSS('opacity', '0.85');
    await setHeroProgress(page, 1.25);
    expect((await sticky.boundingBox())!.y).toBeLessThan(0);
    await expect(page.locator('.intro-strip')).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await setHeroProgress(page, 0);
    expect(await positions(page)).toEqual(assembled);
    await expect(copy).toHaveCSS('opacity', '1');
    await expect(summary).toBeHidden();
    expect(errors).toEqual([]);
  });
}

test('reduced motion alone uses a static photograph and can be toggled live', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.hero-pc-scene')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('.hero-pc-layer')).toHaveCount(0);
  const photo = page.locator('.hero-pc-assembled');
  await expect(photo).toBeVisible();
  await expect(page.getByRole('region', { name: 'Featured build summary' })).toBeVisible();
  await expect(page.locator('.hero-pc-sticky')).toHaveCSS('position', 'relative');
  const transform = await photo.evaluate(element => getComputedStyle(element).transform);
  await page.mouse.wheel(0, 400);
  expect(await photo.evaluate(element => getComputedStyle(element).transform)).toBe(transform);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('.hero-pc-layer')).toHaveCount(7);
  await expect(page.locator('.hero-pc-sticky')).toHaveCSS('position', 'sticky');
  await setHeroProgress(page, .82);
  expect((await positions(page)).gpu.x).toBeGreaterThan(20);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(photo).toBeVisible();
  await expect(page.locator('.hero-pc-layer')).toHaveCount(0);
});

for (const failedLayer of ['storage', 'ram', 'psu', 'gpu']) {
  test(`failed ${failedLayer} hides only that layer`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route(`**/layers/hero-${failedLayer}.webp`, route => route.fulfill({ status: 200, contentType: 'image/webp', body: 'invalid image' }));
    await page.goto('/');
    await expect(page.locator('.hero-pc-scene')).toHaveAttribute('data-ready', 'true');
    await expect(page.locator(`[data-layer="${failedLayer}"]`)).toBeHidden();
    await expect(page.locator('.hero-pc-assembled')).toHaveCount(0);
    await setHeroProgress(page, .82);
    const moved = await positions(page);
    expect(moved.case.x).toBe(0);
    expect(moved.motherboard.x).toBeLessThan(-20);
    expect(moved.cooler.y).toBeLessThan(-20);
    if (failedLayer !== 'gpu') expect(moved.gpu.x).toBeGreaterThan(20);
    expect(errors).toEqual([]);
  });
}

test('a pending optional image does not gate the visible animation', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/layers/hero-storage.webp', async route => { await gate; await route.continue(); });
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('[data-layer="gpu"]').evaluate(image => (image as HTMLImageElement).decode());
    await setHeroProgress(page, .82);
    expect((await positions(page)).gpu.x).toBeGreaterThan(20);
    await expect(page.locator('.hero-pc-layer-stack')).toBeVisible();
  } finally { release(); }
  await expect(page.locator('.hero-pc-scene')).toHaveAttribute('data-ready', 'true');
});

test('touch and high pixel density keep desktop animation; resizing keeps the correct layers', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 1024, height: 900 }, hasTouch: true, deviceScaleFactor: 2 });
  await page.goto('/');
  for (const width of [1024, 768, 767, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.locator('.hero-pc-layer')).toHaveCount(width < 768 ? 4 : 7);
    await expect(page.locator('.hero-pc-scene')).toHaveAttribute('data-ready', 'true');
    await setHeroProgress(page, .82);
    expect((await positions(page)).gpu.x).toBeGreaterThan(20);
  }
  await page.close();
});

test('hero customization opens the same AIO configuration and sample price', async ({ page }) => {
  await page.goto('/');
  await setHeroProgress(page, .92);
  const summary = page.getByRole('region', { name: 'Featured build summary' });
  const price = await summary.locator('strong').textContent();
  await summary.getByRole('link', { name: 'Customize Build' }).click();
  const build = page.getByRole('region', { name: 'Your build summary' });
  await expect(build.locator('.summary-total strong')).toHaveText(price!);
  await expect(build.getByText('Nautilus 240', { exact: true })).toBeVisible();
});
