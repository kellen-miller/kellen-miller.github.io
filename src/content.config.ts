import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { blogSource, hasBlogPosts } from './data/blog-source';

const blog = defineCollection({
  // Keep the glob watcher active so the first post appears during development.
  loader:
    import.meta.env.DEV || hasBlogPosts()
      ? glob({
          base: blogSource.base,
          pattern: [blogSource.pattern, '!README.md'],
        })
      : () => [],
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      tag: z.string().optional(),
      heroImage: z.optional(image()),
    }),
});

export const collections = { blog };
