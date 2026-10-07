import { test, expect } from '@playwright/test';
import { PerspectiveCamera, Vector3 } from 'three';

test.use({ launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } });
test.setTimeout(90000);

test('3D is lazy, preserves the build, selects hardware, focuses, orbits and assembles', async ({ page }) => {
  test.setTimeout(180000); // Software WebGL screenshots and shader readback on CI.
  const requests: string[] = [], errors: string[] = [];
  page.on('request', request => requests.push(request.url()));
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/builder?build=vortex-1440');
  await expect(page.getByRole('tab', { name: 'Configure', exact: true })).toHaveAttribute('aria-selected', 'true');
  const before = await page.evaluate(() => localStorage.getItem('pc-builder-draft'));
  expect(requests.some(url => /rigpilot-demo-pc\.glb|@react-three_fiber\.js|@react-three_drei\.js|deps\/three\.js/.test(url))).toBe(false);
  await page.getByRole('tab', { name: '3D Preview' }).click();
  await expect(page.locator('.pc3d-canvas[data-ready="true"]')).toBeVisible({ timeout: 45000 });
  expect(requests.some(url => url.includes('/assets/3d/rigpilot-demo-pc.manifest.json'))).toBe(true);
  expect(requests.some(url => url.includes('/assets/3d/rigpilot-demo-pc.glb'))).toBe(true);
  await expect(page.getByText('3D Preview is representative. Exact component appearance and placement may vary.')).toBeVisible();
  const canvas = page.locator('.pc3d-canvas canvas');
  await canvas.scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Hide Glass', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Show Glass', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.waitForTimeout(1100);
  // Project a known visible GPU surface to CSS pixels, then click the actual mesh.
  const rect = (await canvas.boundingBox())!;
  const camera = new PerspectiveCamera(40, rect.width / rect.height, .01, 12);
  camera.position.set(-.74, .64, -.9); camera.lookAt(0, .255, 0); camera.updateMatrixWorld();
  const gpu = new Vector3(-.083, .208, .05).project(camera);
  await page.mouse.click(rect.x + (gpu.x + 1) * rect.width / 2, rect.y + (1 - gpu.y) * rect.height / 2);
  const details = page.getByRole('region', { name: 'Selected 3D part' });
  await expect(details.getByRole('heading', { name: 'GeForce RTX 5070 12GB', exact: true })).toBeVisible();
  await expect(details.getByText('₹59,990', { exact: true })).toBeVisible();
  for (const name of ['Motherboard', 'Memory', 'Cooling', 'PSU', 'Storage', 'GPU']) {
    await page.getByRole('button', { name: `Inspect ${name}`, exact: true }).click();
    await expect(page.getByRole('button', { name: `Focus ${name}`, exact: true })).toBeEnabled();
    await expect(details.getByText('Selected in your build', { exact: false })).toBeVisible();
  }
  await page.getByRole('button', { name: 'Focus GPU', exact: true }).click();
  await page.getByRole('button', { name: 'Reset View', exact: true }).click();
  await canvas.scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  const assembledView = await canvas.screenshot();
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2 + 20, { steps: 8 }); await page.mouse.up();
  await page.waitForTimeout(700);
  expect((await canvas.screenshot()).equals(assembledView)).toBe(false);
  const rotated = await canvas.screenshot();
  await page.mouse.wheel(0, -250);
  await page.waitForTimeout(700);
  expect((await canvas.screenshot()).equals(rotated)).toBe(false);
  await page.getByRole('button', { name: 'Reset View', exact: true }).click();
  await page.getByRole('button', { name: 'Explode', exact: true }).click();
  await expect(page.getByRole('slider', { name: 'Explode amount' })).toHaveValue('100');
  await page.getByRole('button', { name: 'Assemble', exact: true }).click();
  await expect(page.getByRole('slider', { name: 'Explode amount' })).toHaveValue('0');
  await expect(page.getByRole('button', { name: 'Hide Glass', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('slider', { name: 'Explode amount' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('slider', { name: 'Explode amount' })).toHaveValue('1');
  await page.getByRole('tab', { name: 'Configure', exact: true }).click();
  await expect(page.locator('.pc3d-canvas canvas')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('pc-builder-draft'))).toBe(before);
  await expect(page.getByRole('heading', { name: 'Processors', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Select Ryzen 5 5600', exact: true }).click();
  await page.getByRole('tab', { name: '3D Preview' }).click();
  await expect(page.locator('.pc3d-canvas[data-ready="true"]')).toBeVisible({ timeout: 45000 });
  await page.getByRole('button', { name: 'Inspect Motherboard', exact: true }).click();
  await expect(details.getByText('CPU socket mismatch', { exact: true })).toBeVisible();
  await expect(details.getByText('Ryzen 5 5600 uses AM4; this motherboard uses AM5.', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('responsive 3D layout and keyboard part selection at all target widths', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/builder?build=vortex-1440');
  await page.getByRole('tab', { name: '3D Preview' }).click();
  await expect(page.locator('.pc3d-canvas[data-ready="true"]')).toBeVisible({ timeout: 45000 });
  for (const width of [1440, 1280, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole('button', { name: 'Inspect Memory', exact: true })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow, `Horizontal overflow at ${width}px`).toBe(false);
    const bounds = (await page.locator('.pc3d-viewport').boundingBox())!;
    if (width === 390) expect(bounds.height).toBeGreaterThanOrEqual(900 * .55);
  }
  await page.getByRole('button', { name: 'Inspect Memory', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('region', { name: 'Selected 3D part' }).getByRole('heading', { name: 'Flare X5 32GB DDR5', exact: true })).toBeVisible();
  await page.getByRole('tab', { name: '3D Preview' }).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('tab', { name: 'Configure', exact: true })).toHaveAttribute('aria-selected', 'true');
});

test('model failures are local to the preview and Retry recovers', async ({ page }) => {
  await page.route('**/assets/3d/rigpilot-demo-pc.glb', route => route.abort());
  await page.goto('/builder?build=vortex-1440');
  await page.getByRole('tab', { name: '3D Preview' }).click();
  await expect(page.getByText("3D preview couldn't load", { exact: true })).toBeVisible({ timeout: 45000 });
  await page.unroute('**/assets/3d/rigpilot-demo-pc.glb');
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.locator('.pc3d-canvas[data-ready="true"]')).toBeVisible({ timeout: 45000 });
  await page.getByRole('tab', { name: 'Configure', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Processors', exact: true })).toBeVisible();
});

test('WebGL-unavailable devices retain the HTML parts and normal builder', async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, ...args: Parameters<typeof getContext>) {
      if (String(args[0]).startsWith('webgl')) return null;
      return getContext.apply(this, args);
    } as typeof getContext;
  });
  await page.goto('/builder?build=vortex-1440');
  await page.getByRole('tab', { name: '3D Preview' }).click();
  await expect(page.getByText("3D Preview isn't available on this device.", { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Inspect GPU', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Selected 3D part' }).getByRole('heading', { name: 'GeForce RTX 5070 12GB', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Back to Configure', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Processors', exact: true })).toBeVisible();
});
