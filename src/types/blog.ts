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

/**
 * Content Collections Post type (includes _meta and content)
 */
export interface ContentCollectionsPost {
  title: string;
  description: string;
  author: string;
  date: string;
  published: boolean;
  slug: string;
  url: string;
  html: string;
  content?: string;
  _meta?: {
    filePath: string;
    fileName: string;
    directory: string;
    path: string;
    extension: string;
  };
}

/**
 * Convert Content Collections post to BlogPost
 */
export function normalizePost(post: ContentCollectionsPost | BlogPost): BlogPost {
  // If it's already a BlogPost (from JSON), return as is
  if (!('_meta' in post) && !('content' in post)) {
    return post;
  }
  
  // Convert Content Collections post to BlogPost
  return {
    title: post.title,
    description: post.description,
    author: post.author,
    date: post.date,
    published: post.published,
    slug: post.slug,
    url: post.url,
    html: post.html,
    tags: 'tags' in post ? post.tags : undefined,
    meta_description: 'meta_description' in post ? post.meta_description : undefined,
    outline: 'outline' in post ? post.outline : undefined,
  };
}

