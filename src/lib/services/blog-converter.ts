/**
 * Blog Converter Service
 * Converts JSON blog data to Markdown format with frontmatter
 */

export interface BlogPost {
  title: string;
  description: string;
  author: string;
  date: string;
  published: boolean;
  slug: string;
  content: string;
}

export interface BlogInput {
  title: string;
  description: string;
  author: string;
  date: string;
  published?: boolean;
  content: string;
}

/**
 * Converts a blog post object to markdown format with YAML frontmatter
 */
export function convertJsonToMarkdown(blog: BlogInput): string {
  const frontmatter = [
    '---',
    `title: "${blog.title}"`,
    `description: "${blog.description}"`,
    `author: "${blog.author}"`,
    `date: "${blog.date}"`,
    `published: ${blog.published ?? true}`,
    '---',
    '',
  ].join('\n');

  return frontmatter + blog.content;
}

/**
 * Generates a slug from a title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
}

/**
 * Validates blog input data
 */
export function validateBlogInput(blog: any): blog is BlogInput {
  return (
    typeof blog.title === 'string' &&
    typeof blog.description === 'string' &&
    typeof blog.author === 'string' &&
    typeof blog.date === 'string' &&
    typeof blog.content === 'string' &&
    (blog.published === undefined || typeof blog.published === 'boolean')
  );
}

