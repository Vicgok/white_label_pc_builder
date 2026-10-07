import { expect, test, type Page } from '@playwright/test';

test.use({ launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } });
test.setTimeout(90000);

async function setHeroProgress(page: Page, progress: number) {
  await page.evaluate(value => {
    const hero = document.querySelector<HTMLElement>('.hero-pc-scroll')!;
    window.scrollTo(0, hero.getBoundingClientRect().top + window.scrollY + (hero.offsetHeight - window.innerHeight) * value);
  }, progress);
}

async function sceneSnapshot(page: Page) {
  return page.evaluate(async () => {
    // Inspect the actual R3F scene in the test, without adding production debug UI.
    const fiberUrl = '/node_modules/.vite/deps/@react-three_fiber.js';
    const { _roots } = await import(/* @vite-ignore */ fiberUrl);
    const state = _roots.get(document.querySelector('.hero-pc-canvas canvas')).store.getState();
    const names = ['Case_Chassis', 'Case_SideGlass', 'Case_TopPanel', 'Motherboard', 'GPU', 'RAM_01', 'AIO_Radiator', 'AIO_Fan_01', 'AIO_Pump', 'PSU', 'SSD_M2'];
    const parts: Record<string, number[]> = {};
    for (const name of names) parts[name] = state.scene.getObjectByName(name).position.toArray();
    const materials: { opacity: number; transmission: number; roughness: number }[] = [];
    state.scene.traverse((object: { isMesh?: boolean; material?: { name?: string; opacity: number; transmission: number; roughness: number } }) => {
      if (object.isMesh && object.material?.name === 'RigPilot_ClearTemperedGlass') materials.push(object.material);
    });
    return { parts, camera: state.camera.position.toArray() as number[], controls: !!state.controls,
      glass: materials.map(material => ({ opacity: material.opacity, transmission: material.transmission, roughness: material.roughness })) };
  });
}

for (const width of [1440, 1280, 1024, 768, 390]) {
  test(`real GLB opens panels first, explodes coherently and reverses at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto('/');
    const scene = page.locator('.hero-pc-scene');
    const summary = page.getByRole('region', { name: 'Interactive 3D Preview invitation' });
    await expect(scene).toHaveAttribute('data-ready', 'true', { timeout: 60000 });
    await expect(scene.locator('canvas')).toHaveCount(1);
    await expect(scene.locator('img, svg, [data-callout], .hero-pc-layer')).toHaveCount(0);
    await expect(page.locator('.hero-pc-sticky')).toHaveCSS('position', 'sticky');
    await expect(page.locator('.hero-pc-copy h1')).toHaveText('Build it.See it before you buy it.');
    await expect(summary).toBeHidden();
    const assembled = await sceneSnapshot(page);
    expect(assembled.controls).toBe(false);
    expect(assembled.glass).toHaveLength(2);
    expect(assembled.glass.every(glass => glass.transmission === 0 && glass.opacity === .14)).toBe(true);

    await setHeroProgress(page, .25);
    await expect.poll(async () => (await sceneSnapshot(page)).parts.Case_SideGlass[0], { timeout: 15000 }).toBeLessThan(assembled.parts.Case_SideGlass[0] - .09);
    const opened = await sceneSnapshot(page);
    for (const name of ['GPU', 'Motherboard', 'RAM_01', 'PSU', 'SSD_M2', 'Case_Chassis']) expect(opened.parts[name]).toEqual(assembled.parts[name]);

    await setHeroProgress(page, .94);
    await expect(summary).toHaveCSS('opacity', '1');
    await expect(summary.getByRole('link', { name: 'Build My PC' })).toBeVisible();
    await expect.poll(async () => (await sceneSnapshot(page)).parts.GPU[0], { timeout: 15000 }).toBeLessThan(assembled.parts.GPU[0] - .065);
    // Wait for the damping to settle; reversal must recover exact positions.
    await page.waitForTimeout(1400);
    const exploded = await sceneSnapshot(page);
    expect(exploded.parts.Case_Chassis).toEqual(assembled.parts.Case_Chassis);
    expect(exploded.parts.Case_TopPanel[1]).toBeGreaterThan(exploded.parts.AIO_Radiator[1]);
    expect(exploded.glass).toEqual(assembled.glass);
    if (width < 768) {
      for (const name of ['Motherboard', 'RAM_01', 'PSU', 'SSD_M2', 'AIO_Pump']) expect(exploded.parts[name]).toEqual(assembled.parts[name]);
    } else expect(exploded.parts.Motherboard[0]).toBeLessThan(assembled.parts.Motherboard[0]);
    await expect(page.locator('.hero-pc-copy')).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `artifacts/hero-3d-${width}-exploded.png`, timeout: 60000 });
    await setHeroProgress(page, 0);
    await expect.poll(async () => (await sceneSnapshot(page)).parts, { timeout: 15000 }).toEqual(assembled.parts);
    await expect(page.locator('.hero-pc-copy')).toHaveCSS('opacity', '1');
    await expect(summary).toBeHidden();
    expect(errors).toEqual([]);
  });
}

test('reduced motion retains a real assembled GLB without scroll animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.hero-pc-scene')).toHaveAttribute('data-ready', 'true', { timeout: 60000 });
  await expect(page.locator('.hero-pc-sticky')).toHaveCSS('position', 'relative');
  const initial = await sceneSnapshot(page);
  await page.mouse.wheel(0, 350);
  expect(await sceneSnapshot(page)).toEqual(initial);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('.hero-pc-sticky')).toHaveCSS('position', 'sticky');
  await setHeroProgress(page, .94);
  await expect.poll(async () => (await sceneSnapshot(page)).parts.GPU[0]).toBeLessThan(initial.parts.GPU[0] - .06);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(async () => (await sceneSnapshot(page)).parts).toEqual(initial.parts);
});

test('lazy hero chunk cannot block the first paint or Start Building', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/src/components/three/HeroPc3D.tsx*', async route => { await gate; await route.continue(); });
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.hero-pc-copy h1')).toBeVisible();
    await expect(page.locator('.hero-pc-copy').getByRole('link', { name: 'Start Building' })).toBeVisible();
    await expect(page.locator('.hero-pc-scene canvas')).toHaveCount(0);
    await expect(page.locator('.hero-pc-scene .three-d-loading')).toBeVisible();
    await expect(page.locator('.hero-pc-scene img')).toHaveCount(0);
  } finally { release(); }
  await expect(page.locator('.hero-pc-scene')).toHaveAttribute('data-ready', 'true', { timeout: 60000 });
  await expect(page.locator('.hero-pc-scene .three-d-loading')).toBeHidden();
});

test('WebGL fallback retains the hero and working product links', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(this: HTMLCanvasElement, kind: string, ...args: unknown[]) {
      if (kind.startsWith('webgl')) return null;
      return original.call(this, kind as '2d', ...args as []) as never;
    } as typeof original;
  });
  await page.goto('/');
  await expect(page.getByText('Explore your build in 3D on a WebGL-enabled device.')).toBeVisible();
  await page.locator('.hero-pc-copy').getByRole('link', { name: 'Start Building' }).click();
  await expect(page).toHaveURL(/\/builder$/);
});

test('final hero CTA enters the existing guided builder', async ({ page }) => {
  await page.goto('/');
  await setHeroProgress(page, .94);
  const summary = page.getByRole('region', { name: 'Interactive 3D Preview invitation' });
  await expect(summary.getByText('Representative build', { exact: true })).toBeVisible();
  await summary.getByRole('link', { name: 'Build My PC' }).click();
  await expect(page).toHaveURL(/\/builder$/);
  await expect(page.getByRole('heading', { name: 'Find your starting point.' })).toBeVisible();
});
