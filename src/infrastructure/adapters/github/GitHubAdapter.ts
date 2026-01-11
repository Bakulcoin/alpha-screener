import axios, { AxiosInstance } from 'axios';
import {
  IGitHubPort,
  RepositoryInfo,
  CommitInfo,
  ContributorInfo,
  RawCodeData,
  RateLimitInfo,
  GitHubTokenInfo,
} from '../../../application/ports/IGitHubPort';
import {
  GitHubTokenUtils,
  RateLimitError,
  AuthenticationError,
} from './GitHubTokenUtils';

export class GitHubAdapter implements IGitHubPort {
  private client: AxiosInstance;
  private tokenUtils: GitHubTokenUtils;

  constructor(token?: string) {
    this.client = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        Accept: 'application/vnd.github.v3+json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      timeout: 30000,
    });
    this.tokenUtils = new GitHubTokenUtils(token);

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 401) {
            throw new AuthenticationError('GitHub authentication failed. Please check your token.');
          }
          if (error.response?.status === 403) {
            const rateLimitRemaining = error.response.headers['x-ratelimit-remaining'];
            if (rateLimitRemaining === '0') {
              const rateLimit = await this.tokenUtils.getRateLimitInfo();
              throw new RateLimitError(rateLimit);
            }
            throw new AuthenticationError(
              'GitHub API access forbidden. Token may lack required permissions.'
            );
          }
        }
        throw error;
      }
    );
  }

  async fetchRepository(owner: string, repo: string): Promise<RepositoryInfo> {
    const response = await this.client.get(`/repos/${owner}/${repo}`);
    const data = response.data;

    return {
      name: data.name,
      fullName: data.full_name,
      description: data.description,
      url: data.html_url,
      stars: data.stargazers_count,
      forks: data.forks_count,
      openIssues: data.open_issues_count,
      language: data.language,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      pushedAt: new Date(data.pushed_at),
    };
  }

  async fetchCommits(owner: string, repo: string, limit = 100): Promise<CommitInfo[]> {
    const response = await this.client.get(`/repos/${owner}/${repo}/commits`, {
      params: { per_page: limit },
    });

    return response.data.map(
      (commit: {
        sha: string;
        commit: { message: string; author: { name: string; date: string } };
        stats?: { additions: number; deletions: number };
      }) => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: commit.commit.author.name,
        date: new Date(commit.commit.author.date),
        additions: commit.stats?.additions || 0,
        deletions: commit.stats?.deletions || 0,
      })
    );
  }

  async fetchContributors(owner: string, repo: string): Promise<ContributorInfo[]> {
    const response = await this.client.get(`/repos/${owner}/${repo}/contributors`, {
      params: { per_page: 100 },
    });

    return response.data.map(
      (contributor: { login: string; contributions: number; html_url: string }) => ({
        username: contributor.login,
        contributions: contributor.contributions,
        profileUrl: contributor.html_url,
      })
    );
  }

  async fetchLanguages(owner: string, repo: string): Promise<Record<string, number>> {
    const response = await this.client.get(`/repos/${owner}/${repo}/languages`);
    return response.data;
  }

  async fetchReadme(owner: string, repo: string): Promise<string | null> {
    try {
      const response = await this.client.get(`/repos/${owner}/${repo}/readme`, {
        headers: { Accept: 'application/vnd.github.raw+json' },
      });
      return response.data;
    } catch {
      return null;
    }
  }

  async fetchFullCodeData(owner: string, repo: string): Promise<RawCodeData> {
    const [repository, commits, contributors, languages, readme] = await Promise.all([
      this.fetchRepository(owner, repo),
      this.fetchCommits(owner, repo, 100),
      this.fetchContributors(owner, repo),
      this.fetchLanguages(owner, repo),
      this.fetchReadme(owner, repo),
    ]);

    const totalCommitsResponse = await this.client.get(`/repos/${owner}/${repo}/commits`, {
      params: { per_page: 1 },
    });

    let totalCommits = commits.length;
    const linkHeader = totalCommitsResponse.headers.link;
    if (linkHeader) {
      const lastMatch = linkHeader.match(/page=(\d+)>; rel="last"/);
      if (lastMatch) {
        totalCommits = parseInt(lastMatch[1]);
      }
    }

    return {
      repository,
      commits,
      contributors,
      languages,
      totalCommits,
      readme: readme || undefined,
    };
  }

  async getTokenInfo(): Promise<GitHubTokenInfo> {
    return this.tokenUtils.getTokenInfo();
  }

  async getRateLimitInfo(): Promise<RateLimitInfo> {
    return this.tokenUtils.getRateLimitInfo();
  }

  async checkRateLimitAvailable(minimumRemaining = 10): Promise<boolean> {
    return this.tokenUtils.checkRateLimitAvailable(minimumRemaining);
  }
}
