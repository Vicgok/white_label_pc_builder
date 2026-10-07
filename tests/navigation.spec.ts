import { test, expect } from '@playwright/test';

// Navigation tests don't need a GPU; the normal WebGL fallback keeps them light.
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (/webgl/.test(type)) return null;
      return getContext.apply(this, [type, ...args] as Parameters<typeof getContext>);
    } as typeof getContext;
  });
});

test('global navigation preserves geometry across route-aware light and dark themes at every breakpoint', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  const geometry = () => page.locator('.marketing-header').evaluate(header => {
    const box = (element: Element) => {
      const { x, y, width, height } = element.getBoundingClientRect();
      return { x, y, width, height };
    };
    const style = getComputedStyle(header);
    return {
      header: box(header), inner: box(header.querySelector('.header-inner')!),
      logo: box(header.querySelector('.wordmark')!), actions: box(header.querySelector('.header-actions')!),
      borderWidth: style.borderBottomWidth,
      font: getComputedStyle(header.querySelector('.wordmark')!).fontSize,
    };
  });
  for (const width of [1440, 1280, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const reference = await geometry();
    for (const route of ['/builder', '/builds', '/components', '/how-it-works']) {
      await page.goto(route);
      await expect(page.locator('.marketing-header')).toHaveCount(1);
      expect(await geometry(), `${route} at ${width}px`).toEqual(reference);
      await expect(page.locator('.marketing-header')).toHaveAttribute('data-theme', route === '/builder' ? 'dark' : 'light');
      await expect(page.locator('.marketing-header')).toHaveCSS('background-color', route === '/builder' ? 'rgb(11, 12, 15)' : 'rgb(247, 247, 245)');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await page.goto('/builder?build=vortex-1440');
    await expect(page.getByRole('heading', { name: 'Build your PC', exact: true })).toBeVisible();
    expect(await geometry()).toEqual(reference);
    const workspace = page.locator('header[aria-label="Builder workspace"]');
    await expect(workspace.getByRole('button', { name: 'Save', exact: true })).toBeVisible();
    await expect(workspace.getByRole('button', { name: 'Share Build', exact: true })).toBeVisible();
    const tabs = page.getByRole('tablist', { name: 'Builder view' });
    await expect(tabs.getByRole('tab', { name: 'Configure', exact: true })).toBeVisible();
    await expect(tabs.getByRole('tab', { name: '3D Preview', exact: true })).toBeVisible();
    const overlap = await workspace.evaluate(element => {
      const children = [...element.children].map(child => child.getBoundingClientRect());
      return children.some((a, i) => children.slice(i + 1).some(b => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top));
    });
    expect(overlap, `Workspace controls overlap at ${width}px`).toBe(false);
    await page.evaluate(() => scrollTo(0, 650));
    await expect.poll(async () => (await workspace.boundingBox())!.y).toBe(reference.header.height);
    if (width >= 1024) {
      const summary = (await page.locator('.desktop-summary').boundingBox())!;
      const secondary = (await workspace.boundingBox())!;
      expect(summary.y).toBeGreaterThanOrEqual(secondary.y + secondary.height);
    }
    await page.screenshot({ path: `artifacts/navigation-${width}.png` });
  }
  expect(errors).toEqual([]);
});

test('navigation stays client-side and 3D links open the same builder draft', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/builder?build=vortex-1440');
  const draft = await page.evaluate(() => localStorage.getItem('pc-builder-draft'));
  await page.evaluate(() => Object.assign(window, { navigationMarker: 'same-document' }));
  const nav = page.getByRole('navigation', { name: 'Main navigation', exact: true });
  await expect(nav.getByRole('link', { name: 'Build a PC', exact: true })).toHaveAttribute('aria-current', 'page');
  await nav.getByRole('link', { name: 'Ready Builds', exact: true }).click();
  await expect(page).toHaveURL(/\/builds$/);
  await nav.getByRole('link', { name: '3D Preview', exact: true }).click();
  await expect(page.getByRole('tab', { name: '3D Preview', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.marketing-header')).toHaveAttribute('data-theme', 'dark');
  await expect(page).toHaveURL(/\/builder$/);
  await page.getByRole('tab', { name: 'Configure', exact: true }).click();
  await nav.getByRole('link', { name: '3D Preview', exact: true }).click();
  await expect(page.getByRole('tab', { name: '3D Preview', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: 'Configure', exact: true }).click();
  await page.evaluate(() => scrollTo(0, 650));
  await page.locator('.marketing-header').getByRole('link', { name: 'Start Build', exact: true }).click();
  await expect(page.locator('#builder-start')).toBeFocused();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  expect(await page.evaluate(() => localStorage.getItem('pc-builder-draft'))).toBe(draft);
  expect(await page.evaluate(() => (window as unknown as { navigationMarker: string }).navigationMarker)).toBe('same-document');
});

test('mobile global menu remains available above the builder workspace', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/builder?build=vortex-1440');
  await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  const menu = page.getByRole('navigation', { name: 'Mobile navigation', exact: true });
  await expect(page.locator('.dialog-backdrop')).toHaveClass(/dark/);
  await expect(menu.getByRole('link', { name: 'Build a PC', exact: true })).toHaveAttribute('aria-current', 'page');
  await menu.getByRole('link', { name: '3D Preview', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('tab', { name: '3D Preview', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  await page.getByRole('navigation', { name: 'Mobile navigation', exact: true }).getByRole('link', { name: 'Components', exact: true }).click();
  await expect(page).toHaveURL(/\/components$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('workspace save and share preserve existing actions including clipboard fallback', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', {
    configurable: true, value: { writeText: async () => { throw new Error('Clipboard blocked'); } },
  }));
  await page.goto('/builder?build=vortex-1440');
  const workspace = page.locator('header[aria-label="Builder workspace"]');
  await workspace.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Build saved on this device.' })).toBeVisible();
  const draft = await page.evaluate(() => localStorage.getItem('pc-builder-draft'));
  await workspace.getByRole('button', { name: 'Share Build', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Copy your build', exact: true });
  await expect(dialog.getByRole('textbox', { name: 'Build text or link' })).toHaveValue(/\/builder\?shared=/);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(workspace.getByRole('button', { name: 'Share Build', exact: true })).toBeFocused();
  expect(await page.evaluate(() => localStorage.getItem('pc-builder-draft'))).toBe(draft);
});
