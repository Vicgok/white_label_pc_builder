import { expect, test, type Page } from '@playwright/test';

test.use({ launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } });
test.setTimeout(90000);

async function progress(page: Page, value: number) {
  await page.evaluate(p => {
    const hero = document.querySelector<HTMLElement>('.hero-pc-scroll')!;
    scrollTo(0, hero.getBoundingClientRect().top + scrollY + (hero.offsetHeight - innerHeight) * p);
  }, value);
}

for (const width of [1440, 1024, 768, 390]) {
  test(`story stays populated and its layout stable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto('/');
    await expect(page.locator('.hero-pc-scene')).toHaveAttribute('data-ready', 'true', { timeout: 60000 });
    await progress(page, 0);
    const canvas = await page.locator('.hero-pc-canvas canvas').elementHandle();
    const story = page.locator('.hero-pc-story');
    const initialStory = (await story.boundingBox())!;
    const initialScene = (await page.locator('.hero-pc-scene').boundingBox())!;
    const steps = width < 768
      ? [[.12, 'build'], [.26, 'open'], [.65, 'check'], [.9, 'visualize']] as const
      : [[.12, 'build'], [.26, 'open'], [.48, 'balance'], [.68, 'check'], [.9, 'visualize']] as const;
    for (const [p, id] of steps) {
      await progress(page, p);
      const active = page.locator(`[data-story="${id}"]`);
      await expect(active).toHaveAttribute('data-state', 'active');
      // Sample the whole crossfade: never let every story fade away together.
      const opacity = await page.locator('.hero-pc-story-stack').evaluate(async stack => {
        const samples: number[] = [];
        const started = performance.now();
        do {
          samples.push(Math.max(...Array.from(stack.children, child => Number(getComputedStyle(child).opacity))));
          await new Promise(resolve => requestAnimationFrame(resolve));
        } while (performance.now() - started < 350);
        return Math.min(...samples);
      });
      expect(opacity).toBeGreaterThanOrEqual(.45);
      await expect(active).toHaveCSS('opacity', '1');
      expect(await active.evaluate(element => (element as HTMLElement).inert)).toBe(false);
      const box = (await story.boundingBox())!, scene = (await page.locator('.hero-pc-scene').boundingBox())!;
      expect(box.height).toBeCloseTo(initialStory.height, 0);
      expect(box.y).toBeCloseTo(initialStory.y, 0);
      expect(scene.y).toBeCloseTo(initialScene.y, 0);
      expect(scene.height).toBeCloseTo(initialScene.height, 0);
      if (width < 768) expect(box.y).toBeGreaterThanOrEqual(scene.y + scene.height);
      else expect(box.x + box.width).toBeLessThanOrEqual((await page.locator('.hero-pc-visual').boundingBox())!.x);
      expect(await canvas!.evaluate(node => node === document.querySelector('.hero-pc-canvas canvas'))).toBe(true);
      if (width === 1440 && id === 'balance') {
        await page.waitForTimeout(1000); // Let software WebGL finish its damped transforms before readback.
        await page.screenshot({ path: 'artifacts/hero-story-1440-balance.png', animations: 'disabled', timeout: 60000 });
      }
    }
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `artifacts/hero-story-${width}-final.png`, animations: 'disabled', timeout: 60000 });
    await expect(page.locator('.hero-pc-final').getByRole('link', { name: 'Build My PC' })).toBeVisible();
    await expect(page.locator('.hero-pc-final').getByRole('link', { name: 'Open 3D Preview' })).toBeVisible();
    // Reverse scrolling must bring back the correct story, too.
    await progress(page, .25);
    await expect(page.locator('[data-story="open"]')).toHaveCSS('opacity', '1');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}

test('inactive stories cannot receive keyboard focus or announce while scrolling', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-story="build"]')).toHaveAttribute('aria-hidden', 'false');
  await progress(page, .48);
  await expect(page.locator('[data-story="balance"]')).toHaveAttribute('aria-hidden', 'false');
  expect(await page.locator('[data-story]').evaluateAll(stories => stories.every(story => {
    const active = (story as HTMLElement).dataset.state === 'active';
    return (story as HTMLElement).inert === !active && story.getAttribute('aria-hidden') === String(!active);
  }))).toBe(true);
  await expect(page.locator('.hero-pc-story [aria-live]')).toHaveCount(0);
});
