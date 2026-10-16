import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('shared navigation points to real sections and pages', async ({
  page,
}) => {
  await page.goto('/');
  const navigation = page.getByRole('navigation', { name: 'Main navigation' });
  await expect(
    navigation.getByRole('link', { name: 'Writing' }),
  ).toHaveAttribute('href', '/blog/');
  await expect(
    navigation.getByRole('link', { name: 'Projects' }),
  ).toHaveAttribute('href', '/#projects');

  await navigation.getByRole('link', { name: 'Writing' }).click();
  await expect(page).toHaveURL('/blog/');
  await expect(
    page.getByRole('heading', { name: 'Writing', level: 1 }),
  ).toBeVisible();
  await expect(
    navigation.getByRole('link', { name: 'Writing' }),
  ).toHaveAttribute('aria-current', 'page');
  await expect(
    page.getByText('No notes published yet. Check back soon.'),
  ).toBeVisible();

  await navigation.getByRole('link', { name: 'About' }).click();
  await expect(
    page.getByRole('heading', { name: 'Built after hours.' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Writing' })).not.toHaveAttribute(
    'aria-current',
    'page',
  );
});

test('theme toggle persists and handles a blocked localStorage write', async ({
  page,
}) => {
  await page.goto('/about/');
  const toggle = page.getByRole('button', { name: 'Switch to dark theme' });
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(
    page.getByRole('button', { name: 'Switch to light theme' }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await page.addInitScript(() => {
    Object.defineProperty(Storage.prototype, 'setItem', {
      configurable: true,
      value() {
        throw new DOMException('blocked', 'SecurityError');
      },
    });
  });
  await page.addInitScript(() => {
    Object.defineProperty(Storage.prototype, 'getItem', {
      configurable: true,
      value() {
        throw new DOMException('blocked', 'SecurityError');
      },
    });
  });
  await page.reload();
  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'light';
  });
  await page.locator('.theme-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('page content and page navigation work without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/blog/');
  await expect(
    page.getByText('No notes published yet. Check back soon.'),
  ).toBeVisible();
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'About' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Built after hours.' }),
  ).toBeVisible();
  await context.close();
});

test('empty feed, sitemap, and custom not-found page are valid', async ({
  request,
  page,
}) => {
  const feed = await request.get('/rss.xml');
  expect(feed.ok()).toBe(true);
  const feedBody = await feed.text();
  expect(feedBody).toContain('<title>Kellen Miller</title>');
  expect(feedBody).not.toContain('<item>');
  expect(feedBody).not.toContain('First post');

  const sitemap = await request.get('/sitemap-0.xml');
  expect(sitemap.ok()).toBe(true);
  const sitemapBody = await sitemap.text();
  expect(sitemapBody).toContain('https://kellen-miller.github.io/blog/');
  expect(sitemapBody).not.toContain('first-post');
  expect(sitemapBody).not.toContain('404.html');

  const response = await page.goto('/missing-page/');
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole('heading', { name: 'Nothing in this bay.' }),
  ).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'noindex',
  );
  await page.getByRole('link', { name: 'Return to the garage' }).click();
  await expect(page).toHaveURL('/');
});

test('every page uses the shared shell and local font assets', async ({
  page,
  request,
}) => {
  const pages = ['/', '/blog/', '/about/', '/404/'];
  for (const pathname of pages) {
    await page.goto(pathname);
    await expect(page.locator('header.site-header')).toBeVisible();
    await expect(page.locator('footer.site-footer')).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `https://kellen-miller.github.io${pathname}`,
    );
  }

  const fontLinks = await page
    .locator('link[rel="preload"][as="font"]')
    .evaluateAll((links) =>
      links.map((link) => (link as HTMLLinkElement).href),
    );
  expect(fontLinks.length).toBeGreaterThan(0);
  for (const font of fontLinks) {
    expect(new URL(font).origin).toBe(new URL(page.url()).origin);
    expect((await request.get(font)).ok()).toBe(true);
  }
});

test('crawl local pages, assets, images, and browser errors', async ({
  page,
  request,
}) => {
  const pending = ['/'];
  const visited = new Set<string>();
  const checkedAssets = new Set<string>();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  while (pending.length > 0) {
    const pathname = pending.shift()!;
    visited.add(pathname);
    const response = await page.goto(pathname);
    expect(response?.ok(), pathname).toBe(true);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `https://kellen-miller.github.io${pathname}`,
    );
    await expect(page.locator('main h1').first()).toBeVisible();

    const localPages = await page
      .locator('a[href^="/"]')
      .evaluateAll((links) =>
        links.map((link) => new URL((link as HTMLAnchorElement).href).pathname),
      );
    pending.push(
      ...localPages.filter(
        (path) =>
          !path.endsWith('.xml') &&
          !visited.has(path) &&
          !pending.includes(path),
      ),
    );

    const localAssets = await page
      .locator(
        'img[src], link[rel="stylesheet"], link[rel="preload"], link[rel="icon"], script[src]',
      )
      .evaluateAll((elements) =>
        elements
          .map(
            (element) =>
              element.getAttribute('src') ?? element.getAttribute('href'),
          )
          .filter((url): url is string => url !== null && url.startsWith('/')),
      );
    for (const asset of new Set(
      localAssets.filter((path) => !checkedAssets.has(path)),
    )) {
      checkedAssets.add(asset);
      expect((await request.get(asset)).ok(), asset).toBe(true);
    }

    const brokenImages = await page
      .locator('img')
      .evaluateAll((elements) =>
        (elements as HTMLImageElement[])
          .filter((image) => image.complete && image.naturalWidth === 0)
          .map((image) => image.src),
      );
    expect(brokenImages, pathname).toEqual([]);
  }

  expect(visited).toContain('/blog/');
  expect(visited).toContain('/about/');
  expect(errors).toEqual([]);
});

for (const pathname of ['/', '/blog/', '/about/']) {
  test(`accessibility on ${pathname} in light theme`, async ({ page }) => {
    await page.goto(pathname);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test(`accessibility on ${pathname} in dark theme`, async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('km-theme', 'dark');
    });
    await page.goto(pathname);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}
