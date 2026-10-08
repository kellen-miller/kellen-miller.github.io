import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('navigate between the home, blog, and about pages', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Kellen Miller', level: 1 }),
  ).toBeVisible();
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Blog' })
    .click();
  await expect(page).toHaveURL('/blog/');
  await expect(
    page.getByRole('heading', { name: 'Blog', exact: true, level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole('navigation').getByRole('link', { name: 'Blog' }),
  ).toHaveAttribute('aria-current', 'page');
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'About' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'About', exact: true, level: 1 }),
  ).toBeVisible();
});

test('render Markdown and interactive MDX', async ({ page }) => {
  await page.goto('/blog/markdown-style-guide/');
  await expect(
    page.getByRole('heading', {
      name: 'Markdown Style Guide',
      exact: true,
      level: 1,
    }),
  ).toBeVisible();
  await expect(page.locator('pre').first()).toBeVisible();
  await page.goto('/blog/using-mdx/');
  await expect(
    page.getByRole('heading', { name: 'Using MDX', exact: true, level: 1 }),
  ).toBeVisible();
  const dialogMessage = page.waitForEvent('dialog').then(async (dialog) => {
    const message = dialog.message();
    await dialog.accept();
    return message;
  });

  await page.getByRole('link', { name: 'Embedded component in MDX' }).click();
  expect(await dialogMessage).toBe('clicked!');
});

test('serve feeds, sitemap, and the custom 404', async ({ request, page }) => {
  const feed = await request.get('/rss.xml');
  expect(feed.ok()).toBe(true);
  const feedBody = await feed.text();
  expect(feedBody).toContain('<title>Kellen Miller</title>');
  expect(feedBody).toContain('https://kellen-miller.github.io/blog/using-mdx/');
  expect(feedBody).not.toContain('example.com');

  const sitemapIndex = await request.get('/sitemap-index.xml');
  expect(sitemapIndex.ok()).toBe(true);
  const sitemap = await request.get('/sitemap-0.xml');
  expect(sitemap.ok()).toBe(true);
  const sitemapBody = await sitemap.text();
  expect(sitemapBody).toContain('https://kellen-miller.github.io/blog/');
  expect(sitemapBody).not.toContain('404.html');

  const response = await page.goto('/missing-page/');
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole('heading', { name: 'Page not found' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Return home' }).click();
  await expect(page).toHaveURL('/');
});

test('all public pages have working local links, assets, and canonical metadata', async ({
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
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      pathname,
    ).toBe(true);

    const localLinks = await page
      .locator('a[href^="/"]')
      .evaluateAll((links) =>
        links.map((link) => new URL((link as HTMLAnchorElement).href).pathname),
      );
    pending.push(
      ...localLinks.filter(
        (link) =>
          !link.endsWith('.xml') &&
          !visited.has(link) &&
          !pending.includes(link),
      ),
    );

    const assets = await page
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
      assets.filter((asset) => !checkedAssets.has(asset)),
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

  expect(visited).toContain('/blog/using-mdx/');
  expect(visited).toContain('/blog/markdown-style-guide/');
  expect(errors).toEqual([]);
});

for (const pathname of ['/', '/blog/', '/about/', '/blog/using-mdx/']) {
  test(`accessibility on ${pathname}`, async ({ page }) => {
    await page.goto(pathname);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}

test('content and navigation work without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/blog/');
  await page.getByRole('link', { name: 'Markdown Style Guide' }).click();
  await expect(
    page.getByRole('heading', {
      name: 'Markdown Style Guide',
      exact: true,
      level: 1,
    }),
  ).toBeVisible();
  await context.close();
});
