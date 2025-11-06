/**
 * Serverless Blog Publisher Service
 * Works on Vercel and other serverless platforms
 * Uses GitHub API only - no file system or git CLI required
 */

import { BlogInput, convertJsonToMarkdown, generateSlug } from './blog-converter';
import { GitHubFileService } from './github-file-service';
import { GitHubService } from './github-service';

export interface PublishOptions {
  reviewers?: string[];
  labels?: string[];
  baseBranch?: string;
  autoMerge?: boolean; // New option for immediate auto-merge
}

export interface PublishResult {
  success: boolean;
  message: string;
  slug?: string;
  branchName?: string;
  prUrl?: string;
  prNumber?: number;
  merged?: boolean;
  mergeSha?: string;
  error?: string;
}

export class ServerlessBlogPublisher {
  private fileService: GitHubFileService;
  private githubService: GitHubService;
  private contentPath: string;

  constructor(
    githubToken: string,
    githubOwner: string,
    githubRepo: string,
    contentPath: string = 'content/posts'
  ) {
    this.fileService = new GitHubFileService(githubToken, githubOwner, githubRepo);
    this.githubService = new GitHubService(githubToken, githubOwner, githubRepo);
    this.contentPath = contentPath;
  }

  /**
   * Publishes a single blog post using GitHub API
   */
  async publishBlog(
    blog: BlogInput,
    options?: PublishOptions
  ): Promise<PublishResult> {
    try {
      // Generate slug from title
      const slug = generateSlug(blog.title);
      const fileName = `${slug}.md`;
      const filePath = `${this.contentPath}/${fileName}`;

      // Convert JSON to Markdown
      const markdownContent = convertJsonToMarkdown(blog);

      // Create unique branch name
      const timestamp = Date.now();
      const branchName = `blog/${slug}-${timestamp}`;

      // Determine base branch
      const baseBranch = options?.baseBranch || 'main';

      // Create new branch via GitHub API
      await this.fileService.createBranch(branchName, baseBranch);

      // Create the file in the new branch via GitHub API
      await this.fileService.createOrUpdateFile(
        filePath,
        markdownContent,
        `feat: Add new blog post "${blog.title}"`,
        branchName
      );

      // Create Pull Request
      const pr = await this.githubService.createPullRequest({
        title: `📝 New Blog Post: ${blog.title}`,
        body: this.generatePRBody(blog, slug),
        head: branchName,
        base: baseBranch,
      });

      // Add labels if provided
      if (options?.labels && options.labels.length > 0) {
        await this.githubService.addLabels(pr.number, options.labels);
      }

      // Add reviewers if provided
      if (options?.reviewers && options.reviewers.length > 0) {
        await this.githubService.addReviewers(pr.number, options.reviewers);
      }

      // Auto-merge if requested
      let mergeResult = null;
      if (options?.autoMerge) {
        try {
          // Wait a moment for any potential CI checks
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          mergeResult = await this.githubService.mergePullRequest(pr.number, {
            commit_title: `Auto-merge: ${blog.title}`,
            commit_message: `Automatically merged blog post: ${blog.title}`,
            merge_method: 'merge',
          });
        } catch (mergeError: any) {
          console.warn('Auto-merge failed:', mergeError.message);
          // Continue with PR creation even if auto-merge fails
        }
      }

      return {
        success: true,
        message: mergeResult ? 'Blog post published and auto-merged successfully' : 'Blog post published successfully',
        slug,
        branchName,
        prUrl: pr.url,
        prNumber: pr.number,
        merged: !!mergeResult,
        mergeSha: mergeResult?.sha,
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to publish blog post',
        error: error.message,
      };
    }
  }

  /**
   * Publishes multiple blog posts
   * Each blog gets its own branch and PR
   */
  async publishMultipleBlogs(
    blogs: BlogInput[],
    options?: PublishOptions
  ): Promise<PublishResult[]> {
    const results: PublishResult[] = [];

    for (const blog of blogs) {
      const result = await this.publishBlog(blog, options);
      results.push(result);
      
      // Add a small delay between requests to avoid rate limiting
      if (blogs.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * Publishes multiple blogs in a single PR (all in one commit)
   */
  async publishMultipleBlogsInSinglePR(
    blogs: BlogInput[],
    prTitle: string,
    options?: PublishOptions
  ): Promise<PublishResult> {
    try {
      // Generate unique branch name
      const timestamp = Date.now();
      const branchName = `blog/batch-${timestamp}`;
      const baseBranch = options?.baseBranch || 'main';

      // Create new branch
      await this.fileService.createBranch(branchName, baseBranch);

      // Prepare all files
      const files = blogs.map(blog => {
        const slug = generateSlug(blog.title);
        const fileName = `${slug}.md`;
        const filePath = `${this.contentPath}/${fileName}`;
        const markdownContent = convertJsonToMarkdown(blog);

        return {
          path: filePath,
          content: markdownContent,
          message: `Add ${blog.title}`,
        };
      });

      // Create all files in a single commit
      await this.fileService.createMultipleFiles(
        files,
        branchName,
        `feat: Add ${blogs.length} new blog post(s)`
      );

      // Create Pull Request
      const pr = await this.githubService.createPullRequest({
        title: prTitle || `📝 New Blog Posts (${blogs.length})`,
        body: this.generateBatchPRBody(blogs),
        head: branchName,
        base: baseBranch,
      });

      // Add labels if provided
      if (options?.labels && options.labels.length > 0) {
        await this.githubService.addLabels(pr.number, options.labels);
      }

      // Add reviewers if provided
      if (options?.reviewers && options.reviewers.length > 0) {
        await this.githubService.addReviewers(pr.number, options.reviewers);
      }

      // Auto-merge if requested
      let mergeResult = null;
      if (options?.autoMerge) {
        try {
          // Wait a moment for any potential CI checks
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          mergeResult = await this.githubService.mergePullRequest(pr.number, {
            commit_title: `Auto-merge: ${prTitle}`,
            commit_message: `Automatically merged batch of ${blogs.length} blog posts: ${prTitle}`,
            merge_method: 'merge',
          });
        } catch (mergeError: any) {
          console.warn('Batch auto-merge failed:', mergeError.message);
          // Continue with PR creation even if auto-merge fails
        }
      }

      return {
        success: true,
        message: mergeResult ? `Successfully published and auto-merged ${blogs.length} blog posts` : `Successfully published ${blogs.length} blog posts`,
        branchName,
        prUrl: pr.url,
        prNumber: pr.number,
        merged: !!mergeResult,
        mergeSha: mergeResult?.sha,
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to publish batch of blog posts',
        error: error.message,
      };
    }
  }

  /**
   * Generates the Pull Request body for a single blog
   */
  private generatePRBody(blog: BlogInput, slug: string): string {
    return `
## 📝 New Blog Post

**Title:** ${blog.title}  
**Author:** ${blog.author}  
**Date:** ${blog.date}  
**Slug:** ${slug}  
**Published:** ${blog.published ?? true}

### Description
${blog.description}

### Preview
This PR adds a new blog post to the content collection. The post will be available at \`/blog/${slug}\` once merged.

### Checklist
- [ ] Content reviewed for accuracy
- [ ] Grammar and spelling checked
- [ ] Links verified
- [ ] Images optimized (if any)
- [ ] SEO metadata is complete

---
*This PR was automatically generated by the Blog Publishing System*
    `.trim();
  }

  /**
   * Generates the Pull Request body for multiple blogs
   */
  private generateBatchPRBody(blogs: BlogInput[]): string {
    const blogList = blogs
      .map((blog, index) => {
        const slug = generateSlug(blog.title);
        return `${index + 1}. **${blog.title}** by ${blog.author} - \`/blog/${slug}\``;
      })
      .join('\n');

    return `
## 📚 Batch Blog Post Publishing

This PR adds **${blogs.length}** new blog post(s) to the content collection.

### Posts Included:
${blogList}

### Checklist
- [ ] All content reviewed for accuracy
- [ ] Grammar and spelling checked
- [ ] Links verified
- [ ] Images optimized (if any)
- [ ] SEO metadata is complete

---
*This PR was automatically generated by the Blog Publishing System*
    `.trim();
  }

  /**
   * Checks if a blog post already exists
   */
  async blogExists(title: string, branch: string = 'main'): Promise<boolean> {
    const slug = generateSlug(title);
    const fileName = `${slug}.md`;
    const filePath = `${this.contentPath}/${fileName}`;
    
    return this.fileService.fileExists(filePath, branch);
  }

  /**
   * Lists all blog posts in the repository
   */
  async listBlogs(branch: string = 'main'): Promise<string[]> {
    return this.fileService.listFiles(this.contentPath, branch);
  }
}

