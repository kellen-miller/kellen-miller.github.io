import { existsSync, readdirSync } from 'node:fs';
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
  test('Markdown fixture keeps code, quotes, and tables styled', async ({
    page,
  }) => {
    await page.goto('/blog/markdown-style-guide/');
    await expect(
      page.getByRole('heading', { name: 'Markdown Style Guide', level: 1 }),
    ).toBeVisible();
    await expect(page.locator('.post-prose pre').first()).toBeVisible();
    await expect(page.locator('.post-prose blockquote').first()).toBeVisible();
    await expect(page.locator('.post-prose table')).toBeVisible();
  });
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
