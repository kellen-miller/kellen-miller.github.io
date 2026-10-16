import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import snapshot from '../src/data/projects.snapshot.json' with { type: 'json' };

const snapshotProjects = Object.values(snapshot.projects);
const snapshotCommits = snapshotProjects.reduce(
  (total, project) => total + project.commits,
  0,
);
const snapshotBuilds = snapshotProjects.filter((project) => project.build);

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

test('homepage ships real data and its full garage drawing in static HTML', async ({
  page,
  request,
}) => {
  const browserRequests: string[] = [];
  page.on('request', (requestEvent) =>
    browserRequests.push(requestEvent.url()),
  );
  const response = await page.goto('/');
  const html = await response?.text();

  await expect(
    page.getByRole('heading', { name: 'Notes from the garage.' }),
  ).toBeVisible();
  await expect(page.locator('.stats')).toContainText(String(snapshotCommits));
  await expect(page.locator('.stats')).toContainText('Posts 00');
  await expect(page.locator('.scene [data-obj]')).toHaveCount(
    snapshotProjects.length,
  );
  await expect(page.locator('.project-card')).toHaveCount(
    snapshotProjects.length,
  );
  await expect(page.locator('.project-card svg [data-obj]')).toHaveCount(
    snapshotProjects.length,
  );
  await expect(page.locator('.shop-log [data-call]')).toHaveCount(
    snapshotBuilds.length,
  );
  const buildRow = page.locator('.shop-log li:has(.build)').first();
  const rowBox = await buildRow.boundingBox();
  const linkBox = await buildRow.locator('.build').boundingBox();
  expect(linkBox?.width).toBe(rowBox?.width);
  await expect(
    page.locator('.project-card[data-project-id="chief"]'),
  ).toHaveAttribute(
    'data-project-commits',
    String(snapshot.projects.chief.commits),
  );
  await expect(
    page.locator('.project-card[data-project-id="venae-machinae"]'),
  ).toHaveAttribute('href', 'https://github.com/kellen-miller/venae-machinae');
  expect(html).toContain('<animateTransform');
  expect(html).toContain('begin="indefinite"');
  expect(html).not.toContain('document.createElement');
  expect(browserRequests.some((url) => url.includes('api.github.com'))).toBe(
    false,
  );
  expect((await request.get('/')).ok()).toBe(true);
});

test('shop log, plan, keyed notes, and cards share project focus', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('#readout-name')).toHaveText('Hover an entry');
  await expect(page.locator('.scene')).not.toHaveClass(/focus/);

  const chiefBuild = page.locator('.shop-log [data-call="chief"]');
  await chiefBuild.hover();
  await expect(page.locator('#readout-id')).toHaveText('#04');
  await expect(
    page.locator('.project-card[data-project-id="chief"]'),
  ).toHaveClass(/on/);
  await expect(page.locator('.scene [data-obj="chief"]')).toHaveClass(/on/);
  await expect(page.locator('#keyed-notes [data-call="chief"]')).toHaveClass(
    /on/,
  );
  await expect(chiefBuild).toHaveClass(/on/);

  await page.mouse.move(0, 0);
  await expect(page.locator('#readout-name')).toHaveText('Hover an entry');

  const chiefPlate = page.locator('.scene [data-call="chief"]');
  await chiefPlate.hover();
  await expect(page.locator('#readout-id')).toHaveText('#04');
  await expect(page.locator('.scene .led')).toHaveCSS('animation-name', 'led');
  await chiefPlate.click();
  await expect(page).toHaveURL(/#project-chief$/);
  await expect(page.locator('#project-chief')).toBeFocused();

  await page.mouse.move(0, 0);
  const deburrNote = page.locator('#keyed-notes [data-call="deburr"]');
  await deburrNote.focus();
  await expect(page.locator('#readout-id')).toHaveText('#03');
  await chiefBuild.hover();
  await expect(page.locator('#readout-id')).toHaveText('#04');
  await page.mouse.move(0, 0);
  await expect(page.locator('#readout-id')).toHaveText('#03');

  const deburrCard = page.locator('.project-card[data-project-id="deburr"]');
  await deburrCard.hover();
  await expect(page.locator('#readout-id')).toHaveText('#03');
  await expect(deburrCard.locator('.spark').first()).toHaveCSS(
    'animation-name',
    'spark',
  );

  await page.locator('.project-card[data-project-id="skills"]').hover();
  await expect(page.locator('#readout-id')).toHaveText('#06');
});

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  for (const sourceSelector of ['.note-link', '.scene .callout']) {
    test(`project activation wins over stationary hover: ${sourceSelector}, ${reducedMotion}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.emulateMedia({ reducedMotion });
      await page.goto('/');
      await page
        .locator(`${sourceSelector}[data-project-id="celerity"]`)
        .click();
      const card = page.locator('#project-celerity');
      await expect(card).toBeFocused();
      await expect
        .poll(() =>
          card.evaluate((element) =>
            Math.abs(element.getBoundingClientRect().top),
          ),
        )
        .toBeLessThan(1);
      await expect(page.locator('#readout-id')).toHaveText('#01');
      await expect(page.locator('.project-card.on')).toHaveAttribute(
        'id',
        'project-celerity',
      );

      await page.locator('#project-chief').hover();
      await expect(page.locator('#readout-id')).toHaveText('#04');
      await expect(card).toBeFocused();
      await page.mouse.move(0, 0);
      await expect(page.locator('#readout-id')).toHaveText('#01');
    });
  }
}

test('celerity rotor keeps running when its focused card is hovered', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.locator('#keyed-notes [data-call="celerity"]').focus();

  const rotor = page.locator('.rotor-animation').first();
  await expect
    .poll(() =>
      rotor.evaluate((element) =>
        (element as SVGAnimateTransformElement).getStartTime(),
      ),
    )
    .not.toBeNull();
  const startTime = await rotor.evaluate((element) =>
    (element as SVGAnimateTransformElement).getStartTime(),
  );

  await page.locator('.project-card[data-project-id="celerity"]').hover();
  await page.mouse.move(0, 0);

  expect(
    await rotor.evaluate((element) =>
      (element as SVGAnimateTransformElement).getStartTime(),
    ),
  ).toBe(startTime);
});

test('project commit meters use dotted fills for default and hot cards', async ({
  page,
}) => {
  await page.goto('/');
  const meter = page.locator(
    '.project-card[data-project-id="celerity"] .commit-meter span',
  );
  const idleBackground = await meter.evaluate(
    (element) => getComputedStyle(element).backgroundImage,
  );
  expect(idleBackground).toContain('repeating-linear-gradient');

  const hotMeter = page.locator('.project-card.hot .commit-meter span');
  const hotBackground = await hotMeter.evaluate(
    (element) => getComputedStyle(element).backgroundImage,
  );
  expect(hotBackground).toContain('repeating-linear-gradient');
  expect(hotBackground).not.toBe(idleBackground);
});

test('focus follows reduced-motion preference changes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.evaluate(() => {
    const svgAnimation = SVGAnimateTransformElement.prototype;
    let started = 0;
    let stopped = 0;
    Object.defineProperty(svgAnimation, 'beginElement', {
      configurable: true,
      value() {
        started += 1;
      },
    });
    Object.defineProperty(svgAnimation, 'endElement', {
      configurable: true,
      value() {
        stopped += 1;
      },
    });
    Object.defineProperty(window, 'garageMotionCalls', {
      configurable: true,
      get: () => ({ started, stopped }),
    });
  });

  await page.locator('.project-card[data-project-id="celerity"]').hover();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { garageMotionCalls: { started: number } })
            .garageMotionCalls.started,
      ),
    )
    .toBe(0);
  await expect(page.locator('.spark').first()).toHaveCSS(
    'animation-name',
    'none',
  );

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { garageMotionCalls: { started: number } })
            .garageMotionCalls.started,
      ),
    )
    .toBe(1);
  await page.mouse.move(0, 0);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { garageMotionCalls: { stopped: number } })
            .garageMotionCalls.stopped,
      ),
    )
    .toBeGreaterThan(0);
});

test('garage plan and project cards remain usable without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('.scene [data-obj]')).toHaveCount(6);
  await expect(page.locator('.project-card')).toHaveCount(6);
  await expect(page.locator('.scene a[data-call="chief"]')).toHaveAttribute(
    'href',
    '#project-chief',
  );
  await page.locator('.scene a[data-call="chief"]').click();
  await expect(page).toHaveURL(/#project-chief$/);
  await expect(page.locator('#project-chief')).toBeInViewport();
  await context.close();
});

test('homepage stacks cleanly at 400 pixels', async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 900 });
  await page.goto('/');
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    projectColumns: getComputedStyle(document.querySelector('.project-grid')!)
      .gridTemplateColumns,
    heroColumns: getComputedStyle(document.querySelector('.hero')!)
      .gridTemplateColumns,
  }));
  expect(dimensions.scrollWidth).toBe(dimensions.clientWidth);
  expect(dimensions.projectColumns.trim().split(/\s+/)).toHaveLength(1);
  expect(dimensions.heroColumns.trim().split(/\s+/)).toHaveLength(1);
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
