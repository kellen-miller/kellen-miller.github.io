import { globSync } from 'node:fs';

export const blogSource = {
  base: './src/content/blog',
  pattern: '**/*.{md,mdx}',
};

export function hasBlogPosts(): boolean {
  return (
    globSync(blogSource.pattern, {
      cwd: blogSource.base,
      exclude: ['README.md'],
    }).length > 0
  );
}
