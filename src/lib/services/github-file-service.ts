/**
 * GitHub File Service
 * Handles file operations via GitHub API (serverless-friendly)
 * No local file system or git CLI required
 */

import { Octokit } from '@octokit/rest';

export interface FileContent {
  path: string;
  content: string;
  message: string;
}

export interface CreateBranchResult {
  branchName: string;
  sha: string;
}

export class GitHubFileService {
  private octokit: Octokit;
  private owner: string;
  private repo: string;

  constructor(token: string, owner: string, repo: string) {
    this.octokit = new Octokit({ auth: token });
    this.owner = owner;
    this.repo = repo;
  }

  /**
   * Gets the SHA of the latest commit on a branch
   */
  async getBranchSHA(branch: string = 'main'): Promise<string> {
    try {
      const { data } = await this.octokit.repos.getBranch({
        owner: this.owner,
        repo: this.repo,
        branch,
      });
      return data.commit.sha;
    } catch (error: any) {
      // Try 'master' if 'main' doesn't exist
      if (branch === 'main') {
        return this.getBranchSHA('master');
      }
      throw new Error(`Failed to get branch SHA: ${error.message}`);
    }
  }

  /**
   * Creates a new branch from the base branch
   */
  async createBranch(branchName: string, baseBranch: string = 'main'): Promise<CreateBranchResult> {
    try {
      const baseSha = await this.getBranchSHA(baseBranch);

      await this.octokit.git.createRef({
        owner: this.owner,
        repo: this.repo,
        ref: `refs/heads/${branchName}`,
        sha: baseSha,
      });

      return {
        branchName,
        sha: baseSha,
      };
    } catch (error: any) {
      throw new Error(`Failed to create branch: ${error.message}`);
    }
  }

  /**
   * Creates or updates a file in the repository
   */
  async createOrUpdateFile(
    path: string,
    content: string,
    message: string,
    branch: string
  ): Promise<void> {
    try {
      // Encode content to base64
      const contentEncoded = Buffer.from(content).toString('base64');

      // Try to get existing file to see if it exists
      let sha: string | undefined;
      try {
        const { data } = await this.octokit.repos.getContent({
          owner: this.owner,
          repo: this.repo,
          path,
          ref: branch,
        });

        if ('sha' in data) {
          sha = data.sha;
        }
      } catch (error) {
        // File doesn't exist, which is fine for creation
      }

      // Create or update the file
      await this.octokit.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path,
        message,
        content: contentEncoded,
        branch,
        ...(sha && { sha }), // Include SHA if updating existing file
      });
    } catch (error: any) {
      throw new Error(`Failed to create/update file: ${error.message}`);
    }
  }

  /**
   * Creates multiple files in a single commit using a tree
   */
  async createMultipleFiles(
    files: FileContent[],
    branch: string,
    commitMessage: string
  ): Promise<void> {
    try {
      // Get the current commit SHA
      const { data: refData } = await this.octokit.git.getRef({
        owner: this.owner,
        repo: this.repo,
        ref: `heads/${branch}`,
      });

      const currentCommitSha = refData.object.sha;

      // Get the tree SHA of the current commit
      const { data: commitData } = await this.octokit.git.getCommit({
        owner: this.owner,
        repo: this.repo,
        commit_sha: currentCommitSha,
      });

      const currentTreeSha = commitData.tree.sha;

      // Create blobs for each file
      const tree = await Promise.all(
        files.map(async (file) => {
          const { data: blob } = await this.octokit.git.createBlob({
            owner: this.owner,
            repo: this.repo,
            content: Buffer.from(file.content).toString('base64'),
            encoding: 'base64',
          });

          return {
            path: file.path,
            mode: '100644' as const,
            type: 'blob' as const,
            sha: blob.sha,
          };
        })
      );

      // Create a new tree
      const { data: newTree } = await this.octokit.git.createTree({
        owner: this.owner,
        repo: this.repo,
        tree,
        base_tree: currentTreeSha,
      });

      // Create a new commit
      const { data: newCommit } = await this.octokit.git.createCommit({
        owner: this.owner,
        repo: this.repo,
        message: commitMessage,
        tree: newTree.sha,
        parents: [currentCommitSha],
      });

      // Update the branch reference
      await this.octokit.git.updateRef({
        owner: this.owner,
        repo: this.repo,
        ref: `heads/${branch}`,
        sha: newCommit.sha,
      });
    } catch (error: any) {
      throw new Error(`Failed to create multiple files: ${error.message}`);
    }
  }

  /**
   * Checks if a file exists in the repository
   */
  async fileExists(path: string, branch: string = 'main'): Promise<boolean> {
    try {
      await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
        ref: branch,
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Lists files in a directory
   */
  async listFiles(path: string = '', branch: string = 'main'): Promise<string[]> {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
        ref: branch,
      });

      if (Array.isArray(data)) {
        return data.map((item) => item.name);
      }

      return [];
    } catch (error: any) {
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  /**
   * Deletes a branch
   */
  async deleteBranch(branchName: string): Promise<void> {
    try {
      await this.octokit.git.deleteRef({
        owner: this.owner,
        repo: this.repo,
        ref: `heads/${branchName}`,
      });
    } catch (error: any) {
      throw new Error(`Failed to delete branch: ${error.message}`);
    }
  }
}

