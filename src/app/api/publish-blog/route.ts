/**
 * API Route: /api/publish-blog
 * Handles blog publishing requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { ServerlessBlogPublisher } from '@/lib/services/serverless-blog-publisher';
import { validateBlogInput, BlogInput } from '@/lib/services/blog-converter';

export const dynamic = 'force-dynamic';

interface PublishBlogRequest {
  blogs: BlogInput[];
  mode?: 'separate' | 'batch'; // separate = one PR per blog, batch = all blogs in one PR
  batchTitle?: string; // Title for batch PR
  options?: {
    reviewers?: string[];
    labels?: string[];
    baseBranch?: string;
    autoMerge?: boolean; // New option for immediate auto-merge
  };
}

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    const githubToken = process.env.GITHUB_TOKEN;
    const githubOwner = process.env.GITHUB_OWNER;
    const githubRepo = process.env.GITHUB_REPO;

    if (!githubToken || !githubOwner || !githubRepo) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required environment variables (GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO)',
        },
        { status: 500 }
      );
    }

    // Parse request body
    const body: PublishBlogRequest = await request.json();

    // Validate request
    if (!body.blogs || !Array.isArray(body.blogs) || body.blogs.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request: blogs array is required and must not be empty',
        },
        { status: 400 }
      );
    }

    // Validate each blog post
    for (let i = 0; i < body.blogs.length; i++) {
      if (!validateBlogInput(body.blogs[i])) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid blog data at index ${i}. Required fields: title, description, author, date, content`,
          },
          { status: 400 }
        );
      }
    }

    // Initialize serverless publisher (works on Vercel)
    const publisher = new ServerlessBlogPublisher(
      githubToken,
      githubOwner,
      githubRepo
    );

    // Determine publishing mode - default to batch for all blogs
    const blogCount = body.blogs.length;
    
    // Mode selection:
    // - If mode is explicitly set to 'separate', use separate (one PR per blog)
    // - Otherwise, always use batch (all blogs in one PR)
    const mode = body.mode === 'separate' ? 'separate' : 'batch';

    if (mode === 'batch') {
      // Publish all blogs in a single PR
      const result = await publisher.publishMultipleBlogsInSinglePR(
        body.blogs,
        body.batchTitle || `New Blog Posts (${body.blogs.length})`,
        body.options
      );

      return NextResponse.json(
        {
          success: result.success,
          result,
          summary: {
            total: body.blogs.length,
            mode: 'batch',
            defaultMode: !body.mode,
          },
        },
        { status: result.success ? 200 : 500 }
      );
    } else {
      // Publish each blog in separate PRs
      const results = await publisher.publishMultipleBlogs(
        body.blogs,
        body.options
      );

      // Check if all succeeded
      const allSucceeded = results.every((r) => r.success);

      return NextResponse.json(
        {
          success: allSucceeded,
          results,
          summary: {
            total: results.length,
            succeeded: results.filter((r) => r.success).length,
            failed: results.filter((r) => !r.success).length,
            mode: 'separate',
            explicitMode: true,
          },
        },
        { status: allSucceeded ? 200 : 207 } // 207 Multi-Status for partial success
      );
    }
  } catch (error: any) {
    console.error('Error publishing blog:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to check API status
export async function GET() {
  const githubToken = process.env.GITHUB_TOKEN;
  const githubOwner = process.env.GITHUB_OWNER;
  const githubRepo = process.env.GITHUB_REPO;

  const configured = !!(githubToken && githubOwner && githubRepo);

  return NextResponse.json({
    status: 'ok',
    configured,
    message: configured
      ? 'Blog publishing API is ready'
      : 'Blog publishing API requires configuration',
    requiredEnvVars: ['GITHUB_TOKEN', 'GITHUB_OWNER', 'GITHUB_REPO'],
  });
}

