import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getBlogPosts } from '../data/blog';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';

export const GET: APIRoute = async (context) => {
  if (!context.site) {
    throw new Error('Set site in astro.config.mjs before generating RSS.');
  }

  const posts = await getBlogPosts();
  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/blog/${post.id}/`,
      categories: post.data.tag ? [post.data.tag] : undefined,
    })),
  });
};
