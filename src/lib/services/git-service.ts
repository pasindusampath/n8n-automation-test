/**
 * Git Service
 * Handles git operations: branching, committing, and pushing
 */

import { simpleGit, SimpleGit } from 'simple-git';
import path from 'path';

export class GitService {
  private git: SimpleGit;
  private repoPath: string;

  constructor(repoPath?: string) {
    this.repoPath = repoPath || process.cwd();
    this.git = simpleGit(this.repoPath);
  }

  /**
   * Creates a new branch for the blog post
   */
  async createBranch(branchName: string): Promise<void> {
    try {
      // Fetch latest changes
      await this.git.fetch();
      
      // Ensure we're on main/master branch
      const branches = await this.git.branchLocal();
      const mainBranch = branches.all.includes('main') ? 'main' : 'master';
      
      await this.git.checkout(mainBranch);
      await this.git.pull('origin', mainBranch);
      
      // Create and checkout new branch
      await this.git.checkoutLocalBranch(branchName);
    } catch (error) {
      throw new Error(`Failed to create branch: ${error}`);
    }
  }

  /**
   * Stages and commits changes
   */
  async commitChanges(filePaths: string[], message: string): Promise<void> {
    try {
      // Stage the files
      await this.git.add(filePaths);
      
      // Commit the changes
      await this.git.commit(message);
    } catch (error) {
      throw new Error(`Failed to commit changes: ${error}`);
    }
  }

  /**
   * Pushes the branch to remote
   */
  async pushBranch(branchName: string): Promise<void> {
    try {
      await this.git.push('origin', branchName, ['--set-upstream']);
    } catch (error) {
      throw new Error(`Failed to push branch: ${error}`);
    }
  }

  /**
   * Gets the current branch name
   */
  async getCurrentBranch(): Promise<string> {
    const branch = await this.git.branchLocal();
    return branch.current;
  }

  /**
   * Checks if there are uncommitted changes
   */
  async hasUncommittedChanges(): Promise<boolean> {
    const status = await this.git.status();
    return status.files.length > 0;
  }

  /**
   * Complete workflow: create branch, commit, and push
   */
  async createCommitAndPush(
    branchName: string,
    filePaths: string[],
    commitMessage: string
  ): Promise<string> {
    await this.createBranch(branchName);
    await this.commitChanges(filePaths, commitMessage);
    await this.pushBranch(branchName);
    return branchName;
  }
}

