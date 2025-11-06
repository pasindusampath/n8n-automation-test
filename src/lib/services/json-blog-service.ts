import { marked } from "marked";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import type { BlogPost } from "../../types/blog";

// Re-export for backward compatibility
export type JsonBlogPost = BlogPost;

/**
 * Generate a URL-friendly slug from a title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Extract date from filename (e.g., ai_blog_posts_20251028.json -> 2025-10-28)
 */
function extractDateFromFilename(filename: string): string {
  const dateMatch = filename.match(/(\d{8})/);
  if (dateMatch) {
    const dateStr = dateMatch[1];
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${year}-${month}-${day}`;
  }
  // Fallback to current date if no date found
  return new Date().toISOString().split('T')[0];
}

/**
 * Process a single JSON blog file and extract all posts
 */
async function processJsonFile(filePath: string, filename: string): Promise<BlogPost[]> {
  try {
    const fileContent = readFileSync(filePath, 'utf-8');
    const jsonData = JSON.parse(fileContent);
    
    if (!jsonData.all_blog_posts || !Array.isArray(jsonData.all_blog_posts)) {
      console.warn(`Invalid JSON structure in ${filename}: missing all_blog_posts array`);
      return [];
    }

    const fileDate = extractDateFromFilename(filename);
    const posts: BlogPost[] = [];

    for (const item of jsonData.all_blog_posts) {
      if (!item.output) continue;

      const output = item.output;
      const title = output.title || 'Untitled Post';
      const slug = generateSlug(title);
      
      // Convert markdown content to HTML (using async marked like content-collections.ts)
      const html = await marked(output.blog_post || '');
      
      posts.push({
        title,
        description: output.meta_description || output.description || '',
        author: 'AI Generated', // Default author for n8n posts
        date: fileDate,
        published: true,
        slug,
        url: `/blog/${slug}`,
        html,
        tags: output.tags || [],
        meta_description: output.meta_description,
        outline: output.outline,
      });
    }

    return posts;
  } catch (error) {
    console.error(`Error processing JSON file ${filename}:`, error);
    return [];
  }
}

/**
 * Get all JSON blog posts from the blogs directory
 */
export async function getAllJsonBlogPosts(): Promise<BlogPost[]> {
  // Only run on server side
  if (typeof window !== 'undefined') {
    return [];
  }

  const blogsDir = join(process.cwd(), 'blogs');
  const posts: BlogPost[] = [];

  try {
    const files = readdirSync(blogsDir);
    const jsonFiles = files.filter((file: string) => file.endsWith('.json'));

    for (const file of jsonFiles) {
      const filePath = join(blogsDir, file);
      const filePosts = await processJsonFile(filePath, file);
      posts.push(...filePosts);
    }
  } catch (error) {
    console.error('Error reading blogs directory:', error);
  }

  return posts;
}

/**
 * Get a single JSON blog post by slug
 */
export async function getJsonBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
  const allPosts = await getAllJsonBlogPosts();
  return allPosts.find(post => post.slug === slug);
}

