import { existsSync, readdirSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const generatedBlogPages = existsSync('dist/blog')
  ? readdirSync('dist/blog').filter((path) => path !== 'index.html')
  : [];
const hasGeneratedPosts = generatedBlogPages.length > 0;

if (hasGeneratedPosts) {
  test('a published post uses the shared readable layout', async ({ page }) => {
    await page.goto('/blog/');
    const postLink = page.locator('.writing-log a[href^="/blog/"]').first();
    const title = await postLink.innerText();
    const href = await postLink.getAttribute('href');

    await page.goto(href!);
    await expect(
      page.getByRole('heading', { name: title, level: 1 }),
    ).toBeVisible();
    await expect(page.locator('.post-meta time')).toHaveAttribute(
      'datetime',
      /^\d{4}-\d{2}-\d{2}T/,
    );
    await expect(page.locator('.post-meta time')).toHaveText(
      /^\d{4}\.\d{2}\.\d{2}$/,
    );
    await expect(
      page.locator('.post-meta').getByText(/\d+ min read/),
    ).toBeVisible();
    await expect(page.locator('.post-prose')).toBeVisible();
    await expect(
      page.locator('.post-prose').locator('> *').first(),
    ).toBeVisible();
  });
}

if (generatedBlogPages.includes('markdown-style-guide')) {
  for (const theme of [
    {
      name: 'light',
      preBackground: 'rgb(228, 227, 222)',
      codeText: 'rgb(21, 21, 21)',
    },
    {
      name: 'dark',
      preBackground: 'rgb(20, 21, 23)',
      codeText: 'rgb(236, 235, 231)',
    },
  ]) {
    test(`Markdown code uses ${theme.name} theme colors and stays accessible`, async ({
      page,
    }) => {
      await page.addInitScript((selectedTheme: string) => {
        localStorage.setItem('km-theme', selectedTheme);
      }, theme.name);
      await page.goto('/blog/markdown-style-guide/');
      await expect(
        page.getByRole('heading', { name: 'Markdown Style Guide', level: 1 }),
      ).toBeVisible();

      const pre = page.locator('.post-prose pre').first();
      await expect(pre).toBeVisible();
      await expect(pre).toHaveCSS('background-color', theme.preBackground);
      await expect(pre.locator('code')).toHaveCSS('color', theme.codeText);
      expect(
        await pre.evaluate(
          (element) => getComputedStyle(element, '::before').content,
        ),
      ).toBe('"[ code ]"');
      await expect(
        page.locator('.post-prose blockquote').first(),
      ).toBeVisible();
      await expect(page.locator('.post-prose table')).toBeVisible();

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }
}

if (generatedBlogPages.includes('using-mdx')) {
  test('MDX fixture imports its local component', async ({ page }) => {
    await page.goto('/blog/using-mdx/');
    await expect(
      page.getByRole('heading', { name: 'Using MDX', level: 1 }),
    ).toBeVisible();
    const dialogMessage = page.waitForEvent('dialog').then(async (dialog) => {
      const message = dialog.message();
      await dialog.accept();
      return message;
    });
    await page.getByRole('link', { name: 'Embedded component in MDX' }).click();
    expect(await dialogMessage).toBe('clicked!');
  });
}
