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
  const normalized: BlogPost = {
    title: post.title,
    description: post.description,
    author: post.author,
    date: post.date,
    published: post.published,
    slug: post.slug,
    url: post.url,
    html: post.html,
  };
  
  // Add optional fields if they exist
  if ('tags' in post && Array.isArray(post.tags)) {
    normalized.tags = post.tags as string[];
  }
  
  if ('meta_description' in post && typeof post.meta_description === 'string') {
    normalized.meta_description = post.meta_description;
  }
  
  if ('outline' in post && Array.isArray(post.outline)) {
    normalized.outline = post.outline as string[];
  }
  
  return normalized;
}

