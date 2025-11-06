/**
 * GitHub Webhook Handler for Auto-Merge
 * Handles PR creation events and automatically merges them
 */

import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

export const dynamic = 'force-dynamic';

interface GitHubWebhookPayload {
  action: string;
  pull_request?: {
    number: number;
    title: string;
    head: {
      ref: string;
    };
    base: {
      ref: string;
    };
    user: {
      login: string;
    };
    labels: Array<{
      name: string;
    }>;
  };
  repository?: {
    name: string;
    owner: {
      login: string;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    // Get GitHub token
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      return NextResponse.json(
        { error: 'GitHub token not configured' },
        { status: 500 }
      );
    }

    // Parse webhook payload
    const payload: GitHubWebhookPayload = await request.json();
    
    // Only handle PR opened events
    if (payload.action !== 'opened') {
      return NextResponse.json({ message: 'Event not relevant' });
    }

    const pr = payload.pull_request;
    if (!pr) {
      return NextResponse.json({ error: 'No PR data' }, { status: 400 });
    }

    // Check if this is a blog post PR (starts with "📝 New Blog Post:")
    const isBlogPost = pr.title.startsWith('📝 New Blog Post:');
    
    // Check for auto-merge label
    const hasAutoMergeLabel = pr.labels.some(label => 
      label.name === 'auto-merge' || 
      label.name === 'automated' ||
      label.name === 'auto-publish'
    );

    // Auto-merge conditions:
    // 1. Must be a blog post PR
    // 2. Must have auto-merge label OR be from automated system
    // 3. Must be targeting main branch
    const shouldAutoMerge = isBlogPost && 
                           (hasAutoMergeLabel || pr.user.login === 'kkasaei') && 
                           pr.base.ref === 'main';

    if (!shouldAutoMerge) {
      return NextResponse.json({ 
        message: 'PR does not meet auto-merge criteria',
        criteria: {
          isBlogPost,
          hasAutoMergeLabel,
          user: pr.user.login,
          baseBranch: pr.base.ref
        }
      });
    }

    // Initialize GitHub client
    const octokit = new Octokit({
      auth: githubToken,
    });

    // Wait a moment for any CI checks to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if PR is mergeable
    const { data: prData } = await octokit.rest.pulls.get({
      owner: payload.repository!.owner.login,
      repo: payload.repository!.name,
      pull_number: pr.number,
    });

    if (prData.mergeable === false) {
      return NextResponse.json({ 
        message: 'PR is not mergeable',
        mergeable: prData.mergeable,
        mergeable_state: prData.mergeable_state
      });
    }

    // Auto-merge the PR
    const mergeResult = await octokit.rest.pulls.merge({
      owner: payload.repository!.owner.login,
      repo: payload.repository!.name,
      pull_number: pr.number,
      commit_title: `Auto-merge: ${pr.title}`,
      commit_message: `Automatically merged blog post: ${pr.title}`,
      merge_method: 'merge',
    });

    // Add a comment to the PR
    await octokit.rest.issues.createComment({
      owner: payload.repository!.owner.login,
      repo: payload.repository!.name,
      issue_number: pr.number,
      body: `🤖 **Auto-merged by Blog Publishing System**\n\nThis PR was automatically merged as part of the automated blog publishing workflow.\n\n- **Merged at**: ${new Date().toISOString()}\n- **Merge SHA**: \`${mergeResult.data.sha}\`\n- **Blog Post**: Now live in the repository! 🎉`
    });

    return NextResponse.json({
      success: true,
      message: 'PR auto-merged successfully',
      prNumber: pr.number,
      mergeSha: mergeResult.data.sha,
      merged: mergeResult.data.merged,
    });

  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { 
        error: 'Webhook processing failed',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// Handle GET requests (for webhook verification)
export async function GET() {
  return NextResponse.json({
    message: 'GitHub webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}
