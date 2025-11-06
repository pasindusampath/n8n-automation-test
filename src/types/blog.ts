/**
 * Unified blog post interface that works for both markdown and JSON posts
 */

export interface BlogPost {
  title: string;
  description: string;
  author: string;
  date: string;
  published: boolean;
  slug: string;
  url: string;
  html: string;
  tags?: string[];
  meta_description?: string;
  outline?: string[];
}

/**
 * Type guard to check if a post has tags
 */
export function hasTags(post: BlogPost): post is BlogPost & { tags: string[] } {
  return 'tags' in post && Array.isArray(post.tags) && post.tags.length > 0;
}

/**
 * Type guard to check if a post has a specific property
 */
export function hasProperty<K extends string>(
  post: BlogPost,
  prop: K
): post is BlogPost & Record<K, unknown> {
  return prop in post;
}

