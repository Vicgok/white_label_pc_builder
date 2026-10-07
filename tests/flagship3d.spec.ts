import { test, expect } from '@playwright/test';

test.use({ launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } });
test.setTimeout(90000);

test('reduced-motion hero loads the real GLB while the interactive demo stays lazy', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.hero-pc-scene')).toHaveAttribute('data-ready', 'true', { timeout: 60000 });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
  expect(requests.some(url => /rigpilot-demo-pc\.glb/.test(url))).toBe(true);
  await expect(page.locator('[id="3d-preview"] canvas')).toHaveCount(0);
});

test('homepage leads with 3D, loads on intent and keeps the customer draft untouched', async ({ page }) => {
  const requests: string[] = [], errors: string[] = [];
  page.on('request', request => requests.push(request.url()));
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(page.locator('.hero-pc-copy h1')).toHaveText('Build it.See it before you buy it.');
  await expect(page.locator('[id="3d-preview"] canvas')).toHaveCount(0);
  const draft = await page.evaluate(() => localStorage.getItem('pc-builder-draft'));
  await page.locator('.hero-pc-copy').getByRole('link', { name: 'Explore 3D Preview' }).click();
  await expect(page.locator('[id="3d-preview"]')).toBeInViewport();
  await page.getByRole('button', { name: 'Explore in 3D', exact: true }).click();
  await expect(page.locator('[id="3d-preview"] .pc3d-canvas[data-ready="true"]')).toBeVisible({ timeout: 45000 });
  await page.getByRole('button', { name: 'Hide Glass', exact: true }).click();
  await page.getByRole('button', { name: 'Explode', exact: true }).click();
  await expect(page.getByRole('slider', { name: 'Explode amount' })).toHaveValue('100');
  await page.getByRole('button', { name: 'Assemble', exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem('pc-builder-draft'))).toBe(draft);
  await page.getByRole('link', { name: 'Try 3D Builder' }).click();
  await expect(page.getByRole('tab', { name: '3D Preview', exact: true })).toHaveAttribute('aria-selected', 'true', { timeout: 30000 });
  await expect(page.getByText('Your build is taking shape.', { exact: true })).toBeVisible();
  await expect(page.locator('.pc3d-canvas[data-ready="true"]')).toBeVisible({ timeout: 45000 });
  await page.getByRole('button', { name: 'Continue Building', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Configure', exact: true })).toHaveAttribute('aria-selected', 'true');
  expect(errors).toEqual([]);
});

test('recommendation promotes 3D and change GPU loops back to the same build', async ({ page }) => {
  const events: { name: string; part?: string }[] = [];
  await page.exposeFunction('collectPreviewEvent', (event: { name: string; part?: string }) => events.push(event));
  await page.addInitScript(() => window.addEventListener('rigpilot:preview', event => {
    void (window as unknown as { collectPreviewEvent: (detail: unknown) => Promise<void> }).collectPreviewEvent((event as CustomEvent).detail);
  }));
  await page.goto('/builder?useCase=gaming&budget=150000');
  await page.getByRole('button', { name: 'Build it for me' }).click();
  await expect(page.getByRole('heading', { name: 'Your build is ready.' })).toBeVisible();
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('pc-builder-draft')!).state);
  await page.getByRole('button', { name: 'Explore in 3D', exact: true }).click();
  await expect(page.locator('.pc3d-canvas[data-ready="true"]')).toBeVisible({ timeout: 45000 });
  await page.getByRole('button', { name: 'Inspect GPU', exact: true }).click();
  await page.getByRole('button', { name: 'Change GPU', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Configure', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('heading', { name: /Graphics cards/i, exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Select GeForce RTX 5060 8GB', exact: true }).click();
  await page.getByRole('button', { name: 'View it in your build', exact: false }).click();
  await expect(page.locator('.pc3d-canvas[data-ready="true"]')).toBeVisible({ timeout: 45000 });
  const details = page.getByRole('region', { name: 'Selected 3D part' });
  await expect(details.getByRole('heading', { name: 'GeForce RTX 5060 8GB', exact: true })).toBeVisible();
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('pc-builder-draft')!).state);
  expect(after.buildId).toBe(before.buildId);
  for (const category of ['cpu', 'motherboard', 'memory', 'storage', 'case', 'cooling', 'psu']) {
    expect(after.selectedComponents[category]).toBe(before.selectedComponents[category]);
  }
  expect(events.some(event => event.name === '3d_preview_opened')).toBe(true);
  expect(events.some(event => event.name === '3d_to_configure_clicked' && event.part === 'gpu')).toBe(true);
  expect(events.some(event => event.name === 'configure_to_3d_clicked' && event.part === 'gpu')).toBe(true);
  await page.getByRole('button', { name: 'Share Build', exact: true }).first().click();
});

test('flagship and prominent builder modes fit mobile and desktop', async ({ page }) => {
  await page.goto('/');
  for (const width of [1440, 1280, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.goto('/builder?build=vortex-1440');
  const modes = page.getByRole('tablist', { name: 'Builder view' });
  await expect(modes.getByRole('tab', { name: 'Configure', exact: true })).toBeVisible();
  await expect(modes.getByRole('tab', { name: '3D Preview', exact: true })).toBeVisible();
  await expect(page.locator('.builder-mode-bar')).toHaveCSS('position', 'sticky');
  await modes.getByRole('tab', { name: '3D Preview', exact: true }).click();
  await expect(page.locator('.pc3d-canvas[data-ready="true"]')).toBeVisible({ timeout: 45000 });
  expect((await page.locator('.pc3d-viewport').boundingBox())!.height).toBeGreaterThanOrEqual(900 * .55);
  await page.getByRole('button', { name: 'Inspect Memory', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Change Memory' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
