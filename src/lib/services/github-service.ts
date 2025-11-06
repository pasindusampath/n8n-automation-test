/**
 * GitHub Service
 * Handles GitHub API operations, specifically creating Pull Requests
 */

import { Octokit } from '@octokit/rest';

export interface PullRequestOptions {
  title: string;
  body: string;
  head: string; // Branch name
  base?: string; // Default: 'main'
}

export class GitHubService {
  private octokit: Octokit;
  private owner: string;
  private repo: string;

  constructor(token: string, owner: string, repo: string) {
    this.octokit = new Octokit({ auth: token });
    this.owner = owner;
    this.repo = repo;
  }

  /**
   * Creates a pull request
   */
  async createPullRequest(options: PullRequestOptions): Promise<any> {
    try {
      const response = await this.octokit.pulls.create({
        owner: this.owner,
        repo: this.repo,
        title: options.title,
        body: options.body,
        head: options.head,
        base: options.base || 'main',
      });

      return {
        number: response.data.number,
        url: response.data.html_url,
        title: response.data.title,
      };
    } catch (error: any) {
      throw new Error(`Failed to create pull request: ${error.message}`);
    }
  }

  /**
   * Adds labels to a pull request
   */
  async addLabels(prNumber: number, labels: string[]): Promise<void> {
    try {
      await this.octokit.issues.addLabels({
        owner: this.owner,
        repo: this.repo,
        issue_number: prNumber,
        labels,
      });
    } catch (error: any) {
      throw new Error(`Failed to add labels: ${error.message}`);
    }
  }

  /**
   * Adds reviewers to a pull request
   */
  async addReviewers(
    prNumber: number,
    reviewers: string[],
    teamReviewers?: string[]
  ): Promise<void> {
    try {
      await this.octokit.pulls.requestReviewers({
        owner: this.owner,
        repo: this.repo,
        pull_number: prNumber,
        reviewers,
        team_reviewers: teamReviewers,
      });
    } catch (error: any) {
      throw new Error(`Failed to add reviewers: ${error.message}`);
    }
  }

  /**
   * Gets repository information
   */
  async getRepository(): Promise<any> {
    try {
      const response = await this.octokit.repos.get({
        owner: this.owner,
        repo: this.repo,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get repository: ${error.message}`);
    }
  }

  /**
   * Merges a pull request
   */
  async mergePullRequest(
    prNumber: number, 
    options: {
      commit_title?: string;
      commit_message?: string;
      merge_method?: 'merge' | 'squash' | 'rebase';
    } = {}
  ): Promise<any> {
    try {
      const response = await this.octokit.pulls.merge({
        owner: this.owner,
        repo: this.repo,
        pull_number: prNumber,
        commit_title: options.commit_title,
        commit_message: options.commit_message,
        merge_method: options.merge_method || 'merge',
      });

      return {
        merged: response.data.merged,
        sha: response.data.sha,
        message: response.data.message,
      };
    } catch (error: any) {
      throw new Error(`Failed to merge pull request: ${error.message}`);
    }
  }
}

