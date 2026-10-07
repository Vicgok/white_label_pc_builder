import { expect, test } from '@playwright/test';

test.use({ launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } });
test.setTimeout(90000);

test('builder loader reflects Drei progress and fades into the same canvas', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.route('**/assets/3d/rigpilot-demo-pc.glb', async route => { await gate; await route.continue(); });
  try {
    await page.goto('/builder?build=vortex-1440&view=3d');
    const loader = page.locator('.pc3d-viewport .three-d-loading');
    await expect(loader.getByText('Preparing your 3D build', { exact: true })).toBeVisible();
    await expect(loader.locator('.three-d-loading-mark > span')).toHaveCount(3);
    await expect(loader.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    await expect(page.locator('.pc3d-viewport img, .pc3d-viewport svg')).toHaveCount(0);
    // Exercise real LoadingManager item events, without a second progress store.
    const real = await page.evaluate(async () => {
      // Preserve Vite's versioned URLs so this observes the app's singleton
      // store rather than evaluating a second Drei module during the test.
      const resources = performance.getEntriesByType('resource');
      const threeUrl = resources.find(entry => /\/three\.js\?/.test(entry.name))!.name;
      const dreiUrl = resources.find(entry => /\/@react-three_drei\.js\?/.test(entry.name))!.name;
      const { DefaultLoadingManager } = await import(/* @vite-ignore */ threeUrl);
      const { useProgress } = await import(/* @vite-ignore */ dreiUrl);
      DefaultLoadingManager.itemStart('/qa-material');
      DefaultLoadingManager.itemEnd('/qa-material');
      const { progress, active } = useProgress.getState();
      return { percentage: Math.round(progress), active };
    });
    expect(real.active).toBe(true);
    expect(real.percentage).toBeGreaterThan(0);
    await expect(loader.getByRole('progressbar')).toHaveAttribute('aria-valuenow', String(real.percentage));
    await page.locator('.pc3d-viewport').screenshot({ path: 'artifacts/loader-builder.png', timeout: 60000 });
    release();
    await expect(page.locator('.pc3d-canvas')).toHaveAttribute('data-ready', 'true', { timeout: 60000 });
    await expect(page.locator('.pc3d-render')).toHaveCSS('opacity', '1');
    await expect(loader).toBeHidden();
    await expect(page.locator('.pc3d-render')).toHaveCSS('transition-duration', '0.28s');
    expect(errors).toEqual([]);
  } finally { release(); }
});

test('mobile reduced-motion loader is static, centered and readable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/assets/3d/rigpilot-demo-pc.glb', async route => { await gate; await route.continue(); });
  try {
    await page.goto('/builder?build=vortex-1440&view=3d');
    const loader = page.locator('.pc3d-viewport .three-d-loading');
    await expect(loader).toBeVisible();
    await expect(loader.locator('.three-d-loading-mark > span').first()).toHaveCSS('animation-name', 'none');
    const viewport = (await page.locator('.pc3d-viewport').boundingBox())!;
    const content = (await loader.locator('.three-d-loading-content').boundingBox())!;
    expect(content.x).toBeGreaterThanOrEqual(viewport.x);
    expect(content.x + content.width).toBeLessThanOrEqual(viewport.x + viewport.width);
    expect(content.y + content.height / 2).toBeCloseTo(viewport.y + viewport.height / 2, 0);
    expect((await loader.locator('strong').boundingBox())!.height).toBeLessThan(30);
    await page.locator('.pc3d-viewport').screenshot({ path: 'artifacts/loader-mobile.png', timeout: 60000 });
  } finally { release(); }
});

test('homepage lazy loading and WebGL errors use no photo fallback', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/src/components/three/HeroPc3D.tsx*', async route => { await gate; await route.continue(); });
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(this: HTMLCanvasElement, kind: string, ...args: unknown[]) {
      if (kind.startsWith('webgl')) return null;
      return original.call(this, kind as '2d', ...args as []) as never;
    } as typeof original;
  });
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const hero = page.locator('.hero-pc-scene');
    await expect(hero.getByText('Preparing interactive 3D…', { exact: true })).toBeVisible();
    await expect(hero.locator('img')).toHaveCount(0);
    await expect(hero.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow');
    await hero.screenshot({ path: 'artifacts/loader-hero.png', timeout: 60000 });
    release();
    await expect(hero.getByText("3D Preview isn't available on this device.", { exact: true })).toBeVisible();
    await expect(hero.locator('.three-d-loading')).toHaveCount(0);
    await expect(hero.locator('img')).toHaveCount(0);
    await hero.getByRole('link', { name: 'Back to Configure' }).click();
    await expect(page).toHaveURL(/\/builder$/);
  } finally { release(); }
});
