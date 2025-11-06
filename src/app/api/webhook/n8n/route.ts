/**
 * API Route: /api/webhook/n8n
 * Receives blog posts from n8n workflows and saves them to the blogs directory
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

interface N8nBlogPost {
  title: string;
  meta_description?: string;
  description?: string;
  blog_post: string; // Markdown content
  tags?: string[];
  outline?: string[];
}

interface N8nWebhookPayload {
  all_blog_posts?: Array<{
    output: N8nBlogPost;
  }>;
  // Also support single post format
  output?: N8nBlogPost;
}

export async function POST(request: NextRequest) {
  try {
    const body: N8nWebhookPayload = await request.json();
    
    // Ensure blogs directory exists
    const blogsDir = join(process.cwd(), 'blogs');
    if (!existsSync(blogsDir)) {
      mkdirSync(blogsDir, { recursive: true });
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0].replace('T', '_');
    const filename = `n8n_blog_posts_${timestamp}.json`;

    // Prepare the data structure
    let blogPosts: Array<{ output: N8nBlogPost }> = [];

    // Handle different payload formats
    if (body.all_blog_posts && Array.isArray(body.all_blog_posts)) {
      // Format: { all_blog_posts: [{ output: {...} }] }
      blogPosts = body.all_blog_posts;
    } else if (body.output) {
      // Format: { output: {...} } - single post
      blogPosts = [{ output: body.output }];
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid payload format. Expected "all_blog_posts" array or "output" object',
        },
        { status: 400 }
      );
    }

    // Validate posts
    for (const item of blogPosts) {
      if (!item.output || !item.output.title || !item.output.blog_post) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid blog post: missing required fields (title, blog_post)',
          },
          { status: 400 }
        );
      }
    }

    // Save to file
    const filePath = join(blogsDir, filename);
    const jsonData = {
      all_blog_posts: blogPosts,
      received_at: new Date().toISOString(),
      source: 'n8n',
    };

    writeFileSync(filePath, JSON.stringify(jsonData, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      message: `Successfully saved ${blogPosts.length} blog post(s)`,
      filename,
      filePath: `/blogs/${filename}`,
      postsCount: blogPosts.length,
      posts: blogPosts.map((item, index) => ({
        index,
        title: item.output.title,
        slug: item.output.title
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, ''),
      })),
    });
  } catch (error: any) {
    console.error('Error processing n8n webhook:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check webhook status
export async function GET() {
  const blogsDir = join(process.cwd(), 'blogs');
  const exists = existsSync(blogsDir);

  return NextResponse.json({
    status: 'ok',
    webhookUrl: '/api/webhook/n8n',
    method: 'POST',
    blogsDirectory: exists ? 'exists' : 'not found',
    message: 'n8n webhook endpoint is ready',
    expectedPayload: {
      all_blog_posts: [
        {
          output: {
            title: 'Blog Post Title',
            meta_description: 'SEO description',
            blog_post: 'Markdown content here...',
            tags: ['tag1', 'tag2'],
            outline: ['Section 1', 'Section 2'],
          },
        },
      ],
    },
  });
}

