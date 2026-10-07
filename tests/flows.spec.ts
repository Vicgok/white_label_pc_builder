import { test, expect } from '@playwright/test';
import { readyBuilds } from '../src/data/builds';
import { deserializeBuild } from '../src/domain/build-serialization';

test('local product photography loads across hardware categories and cooler types', async ({ page }) => {
  await page.goto('/?brand=byos');
  await expect(page.locator('.hero-pc-copy h1')).toBeVisible();
  const hero = page.locator('.featured-art img');
  await expect(hero).toHaveAttribute('src', '/images/products/pc-tower.jpg');
  await hero.scrollIntoViewIfNeeded();
  await hero.evaluate(image => (image as HTMLImageElement).decode());
  expect(await hero.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(1000);
  await page.goto('/builds/studio-pro');
  const labels = page.getByLabel('Build specification labels');
  await expect(labels.locator('dt')).toHaveText(['CPU', 'GPU', 'Memory', 'Cooling']);
  await expect(labels.locator('dd')).toHaveText(['Ryzen 9 9900X', 'RTX 5070 Ti · 16GB', '64GB DDR5', 'AK620 · air']);
  await page.goto('/components');
  for (const [label, asset] of [['CPU', 'cpu'], ['GPU', 'gpu'], ['Motherboard', 'motherboard'], ['Memory', 'memory'], ['Storage', 'storage'], ['Power Supply', 'psu'], ['Case', 'case'], ['Cooling', 'cooling']]) {
    await page.getByRole('button', { name: label, exact: true }).click();
    const photo = page.locator('.catalog-card img').first();
    await expect(photo).toHaveAttribute('src', `/images/products/${asset}.jpg`);
    await photo.evaluate(image => (image as HTMLImageElement).decode());
    expect(await photo.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(1000);
  }
  const liquidCooler = page.locator('.catalog-card').filter({ has: page.getByRole('heading', { name: 'Nautilus 240', exact: true }) });
  await expect(liquidCooler.locator('img')).toHaveAttribute('src', '/images/products/cooling-liquid.jpg');
  await liquidCooler.scrollIntoViewIfNeeded();
  await liquidCooler.locator('img').evaluate(image => (image as HTMLImageElement).decode());
  await page.goto('/builder?build=vortex-1440');
  const builderPhoto = page.locator('.component-card img').first();
  await expect(builderPhoto).toHaveAttribute('src', '/images/products/cpu.jpg');
  await builderPhoto.evaluate(image => (image as HTMLImageElement).decode());
  await expect(page.locator('.part-visual svg, .pc-visual svg')).toHaveCount(0);
});

test('one product across legacy queries, routes and history', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?brand=satnam');
  await expect(page.getByRole('link', { name: 'RigPilot home' }).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: /Build it\.\s*See it before you buy it\./ })).toBeVisible();
  await expect(page.locator('body')).not.toContainText(/BYOS|Satnam|Jai Computech|Microcenter|Computer Garage 360|IT Fixer/);
  // A document marker proves internal navigation does not reload the page.
  await page.evaluate(() => { (window as unknown as { routeMarker: string }).routeMarker = 'alive'; });
  await page.getByRole('link', { name: 'Ready Builds', exact: true }).first().click();
  await expect(page).toHaveURL(/\/builds$/);
  await expect(page.getByRole('heading', { name: 'Ready-to-go PCs.' })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { routeMarker: string }).routeMarker)).toBe('alive');
  await page.goBack(); await expect(page.getByRole('heading', { name: /Build it\.\s*See it before you buy it\./ })).toBeVisible();
  await page.goForward(); await expect(page).toHaveURL(/\/builds$/);
  for (const route of ['/components', '/how-it-works', '/support', '/for-retailers', '/builds/vortex-1440']) {
    await page.goto(route); await expect(page.locator('main h1')).toBeVisible();
    await expect(page.getByRole('link', { name: 'RigPilot home' }).first()).toBeVisible();
    await expect(page.locator('body')).not.toContainText(/BYOS|Satnam|Jai Computech|Microcenter|Computer Garage 360|IT Fixer/);
    await expect(page.locator('a[href*="brand="], a[href^="tel:"], a[href*="wa.me"], a[href*="instagram.com"]')).toHaveCount(0);
  }
  await page.goto('/demo'); await expect(page.getByText('404 / A WRONG TURN')).toBeVisible();
  await page.goto('/?brand=not-configured'); await expect(page.getByRole('link', { name: 'RigPilot home' }).first()).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'is not configured' })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('recommend, customize, fix compatibility, persist, save, copy, share and quote', async ({ page, context, browser }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/builder?brand=byos&useCase=gaming&budget=150000');
  await expect(page.getByRole('heading', { name: 'Find your starting point.' })).toBeVisible();
  await page.getByRole('button', { name: 'Build it for me' }).click();
  const summary = page.getByRole('region', { name: 'Your build summary' });
  await expect(summary.getByText('All selected components are compatible', { exact: true })).toBeVisible();
  const reference = await summary.locator('h3').textContent();
  const previousTotal = await summary.locator('.summary-total strong').textContent();
  const originalCpu = await summary.locator('.summary-row').first().locator('strong').textContent();
  await page.getByRole('button', { name: 'Select Ryzen 5 5600', exact: true }).click();
  await expect(summary.getByText('CPU socket mismatch', { exact: true })).toBeVisible();
  expect(await summary.locator('.summary-total strong').textContent()).not.toBe(previousTotal);
  await summary.getByRole('button', { name: 'View Compatible Motherboard' }).click();
  await expect(page.getByRole('checkbox', { name: 'Compatible only' }).first()).toBeChecked();
  await expect(page.getByRole('heading', { name: 'B650 Gaming Plus WiFi', exact: true })).toHaveCount(0);
  // The filter must exclude every AM5 board while an AM4 CPU is selected.
  await page.getByRole('navigation', { name: 'Component categories' }).getByRole('button', { name: /^CPU/ }).click();
  await page.getByRole('button', { name: `Select ${originalCpu}`, exact: true }).click();
  await expect(summary.getByText('All selected components are compatible', { exact: true })).toBeVisible();
  expect(await summary.locator('.summary-total strong').textContent()).toBe(previousTotal);
  await page.getByRole('button', { name: 'Save', exact: true }).first().click();
  await expect(page.getByRole('status').filter({ hasText: 'Build saved on this device.' })).toBeVisible();
  await summary.getByRole('button', { name: 'Copy Build', exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(reference);
  await page.getByRole('button', { name: 'Share Build', exact: true }).first().click();
  const shared = await page.evaluate(() => navigator.clipboard.readText());
  expect(shared).toContain('shared='); expect(shared).not.toContain('brand=');
  await page.reload(); await expect(summary.locator('h3')).toHaveText(reference!);
  const draft = await page.evaluate(() => JSON.parse(localStorage.getItem('pc-builder-draft')!).state);
  expect(draft.selectedComponents.cpu).toBeTruthy();
  // A new browser context has no saved draft: the URL must supply the entire build.
  const freshContext = await browser.newContext();
  try {
    const freshPage = await freshContext.newPage();
    await freshPage.goto(shared);
    await expect(freshPage.getByRole('region', { name: 'Your build summary' }).locator('h3')).toHaveText(reference!);
    const restored = await freshPage.evaluate(() => JSON.parse(localStorage.getItem('pc-builder-draft')!).state);
    for (const key of ['buildId', 'selectedComponents', 'budget', 'resolution', 'useCase']) expect(restored[key]).toEqual(draft[key]);
  } finally { await freshContext.close(); }
  await page.goto(shared); await expect(summary.locator('h3')).toHaveText(reference!);
  await summary.getByRole('button', { name: 'Request a Quote' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Ready to price this build?' })).toBeVisible();
  await expect(dialog.getByRole('link', { name: 'Order via WhatsApp' })).toHaveCount(0);
  await expect(dialog.getByText(/preferred PC retailer/)).toBeVisible();
  await expect(dialog.locator('input')).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Copy Build', exact: true }).click();
  const copiedBuild = (await page.evaluate(() => navigator.clipboard.readText())).replaceAll('\r\n', '\n');
  expect(copiedBuild).toContain(`RigPilot Build\nBuild ID: ${reference}`);
  expect(copiedBuild).toContain('Use case: Gaming');
  expect(copiedBuild).toContain('Estimated system power:');
  expect(copiedBuild).toContain('All selected components are compatible.');
  await dialog.getByRole('button', { name: 'Copy Share Link' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(shared);
  expect(errors).toEqual([]);
});

test('ready-build customization remains intact after refresh and invalid shares are handled', async ({ page }) => {
  await page.goto('/builds/vortex-1440?brand=jaicomputech');
  await page.getByRole('link', { name: 'Customize this Build' }).click();
  const summary = page.getByRole('region', { name: 'Your build summary' });
  const reference = await summary.locator('h3').textContent();
  await page.getByRole('button', { name: 'Select Ryzen 5 7600', exact: true }).click();
  await page.reload();
  await expect(summary.locator('h3')).toHaveText(reference!);
  await expect(page.getByRole('button', { name: 'Selected Ryzen 5 7600', exact: true })).toBeVisible();
  await page.goto('/builder?brand=jaicomputech&shared=bad-link');
  await expect(page.getByRole('alert')).toContainText('shared build link is invalid');
  await expect(summary.locator('h3')).toHaveText(reference!);
});

test('budget errors, empty search and generic help', async ({ page }) => {
  await page.goto('/builder?budget=10000');
  await page.getByRole('button', { name: 'Build it for me' }).click();
  await expect(page.getByRole('alert')).toContainText('more room');
  await page.getByRole('button', { name: /^Set budget to/ }).click();
  await page.getByRole('button', { name: 'Build it for me' }).click();
  await page.getByRole('textbox', { name: 'Search components' }).fill('no-component-with-this-name');
  await expect(page.getByRole('heading', { name: 'No matching components.' })).toBeVisible();
  await page.goto('/support');
  await page.getByRole('button', { name: 'Get Help', exact: true }).last().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Find your starting point.' })).toBeVisible();
  await expect(dialog.locator('input')).toHaveCount(0);
  await dialog.getByRole('link', { name: 'Start Build' }).click();
  await expect(page).toHaveURL(/\/builder$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('ready-build quote actions use the viewed preset rather than the builder draft', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/builder?build=vortex-1440');
  await expect(page.getByRole('region', { name: 'Your build summary' })).toBeVisible();
  await page.goto('/builds/studio-pro');
  await page.getByRole('button', { name: 'Request a Quote', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Copy Build', exact: true }).click();
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text).toContain('Ryzen 9 9900X');
  expect(text).toContain('64GB DDR5');
  await dialog.getByRole('button', { name: 'Copy Share Link' }).click();
  const url = new URL(await page.evaluate(() => navigator.clipboard.readText()));
  expect(url.searchParams.has('brand')).toBe(false);
  const sharedBuild = deserializeBuild(url.searchParams.get('shared')!);
  expect(sharedBuild?.selectedComponents).toEqual(readyBuilds.find(build => build.slug === 'studio-pro')!.components);
  const draft = await page.evaluate(() => JSON.parse(localStorage.getItem('pc-builder-draft')!).state);
  expect(draft.selectedComponents).toEqual(readyBuilds.find(build => build.slug === 'vortex-1440')!.components);
});

test('blocked clipboard offers usable manual text and links on desktop and mobile', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: async () => { throw new Error('Clipboard blocked for test'); },
    }});
  });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/builder?build=vortex-1440');
    if (width === 390) await page.getByRole('button', { name: 'Review Build', exact: true }).click();
    const summary = width === 390
      ? page.getByRole('dialog').getByRole('region', { name: 'Your build summary' })
      : page.locator('.desktop-summary').getByRole('region', { name: 'Your build summary' });
    await summary.getByRole('button', { name: 'Copy Build', exact: true }).click();
    const manual = summary.locator('textarea');
    await expect(manual).toBeVisible();
    await expect(manual).toHaveValue(/^RigPilot Build/);
    await expect(manual).toBeFocused();
    expect(await manual.evaluate(element => {
      const textarea = element as HTMLTextAreaElement;
      return textarea.selectionStart === 0 && textarea.selectionEnd === textarea.value.length;
    })).toBe(true);
    await summary.getByRole('button', { name: 'Share Build', exact: true }).click();
    await expect(manual).toHaveValue(/\/builder\?shared=/);
    await summary.getByRole('button', { name: 'Request a Quote' }).click();
    const quote = page.getByRole('dialog', { name: 'Ready to price this build?' });
    await expect(page.getByRole('dialog')).toHaveCount(1);
    await quote.getByRole('button', { name: 'Copy Build', exact: true }).click();
    await expect(quote.locator('textarea')).toBeVisible();
    await expect(quote.locator('textarea')).toHaveValue(/^RigPilot Build/);
    await quote.getByRole('button', { name: 'Copy Share Link' }).click();
    await expect(quote.locator('textarea')).toHaveValue(/\/builder\?shared=/);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  }
});

test('responsive pages and mobile builder sheets have no horizontal overflow', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  for (const width of [1440, 1280, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/', '/builds', '/builds/studio-pro', '/components', '/how-it-works', '/for-retailers', '/support', '/builder?build=vortex-1440']) {
      await page.goto(route); await expect(page.locator('main h1')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${route} at ${width}px`).toBe(true);
      if (route === '/') {
        await expect(page.locator('.hero-pc-layer')).toHaveCount(width < 768 ? 4 : 7);
      }
      if (route === '/builds/studio-pro') {
        const labels = page.getByLabel('Build specification labels').locator('.callout-label');
        await expect(labels).toHaveCount(4);
        for (const label of await labels.all()) await expect(label).toBeVisible();
        const overlap = await labels.evaluateAll(elements => {
          const boxes = elements.map(element => element.getBoundingClientRect());
          return boxes.some((a, i) => boxes.slice(i + 1).some(b => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top));
        });
        expect(overlap, `Specification labels overlap at ${width}px on ${route}`).toBe(false);
      }
    }
  }
  await expect(page.getByRole('button', { name: 'Review Build', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Filter components' })).toBeVisible();
  await page.getByRole('dialog').getByRole('checkbox', { name: 'Compatible only' }).check();
  await page.getByRole('button', { name: /^Show \d+ components/ }).click();
  await page.getByRole('button', { name: 'Review Build', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Review your build' })).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Request a Quote' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await expect(page.getByRole('dialog', { name: 'Ready to price this build?' })).toBeVisible();
  await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(errors).toEqual([]);
});
