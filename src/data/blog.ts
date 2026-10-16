import { getCollection } from 'astro:content';
import { hasBlogPosts } from './blog-source';

export async function getBlogPosts() {
  if (!hasBlogPosts()) {
    return [];
  }

  return (await getCollection('blog')).sort(
    (left, right) => right.data.pubDate.getTime() - left.data.pubDate.getTime(),
  );
}
