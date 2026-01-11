export interface RepositoryInfo {
  name: string;
  fullName: string;
  description?: string;
  url: string;
  stars: number;
  forks: number;
  openIssues: number;
  language?: string;
  createdAt: Date;
  updatedAt: Date;
  pushedAt: Date;
}

export interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  date: Date;
  additions: number;
  deletions: number;
}

export interface ContributorInfo {
  username: string;
  contributions: number;
  profileUrl: string;
}

export interface RawCodeData {
  repository: RepositoryInfo;
  commits: CommitInfo[];
  contributors: ContributorInfo[];
  languages: Record<string, number>;
  totalCommits: number;
  readme?: string;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
  used: number;
  resource: string;
}

export interface GitHubTokenInfo {
  authenticated: boolean;
  tokenType?: 'classic' | 'fine-grained';
  scopes?: string[];
  rateLimit: RateLimitInfo;
}

export interface IGitHubPort {
  fetchRepository(owner: string, repo: string): Promise<RepositoryInfo>;
  fetchCommits(owner: string, repo: string, limit?: number): Promise<CommitInfo[]>;
  fetchContributors(owner: string, repo: string): Promise<ContributorInfo[]>;
  fetchLanguages(owner: string, repo: string): Promise<Record<string, number>>;
  fetchReadme(owner: string, repo: string): Promise<string | null>;
  fetchFullCodeData(owner: string, repo: string): Promise<RawCodeData>;
  getTokenInfo(): Promise<GitHubTokenInfo>;
  getRateLimitInfo(): Promise<RateLimitInfo>;
  checkRateLimitAvailable(minimumRemaining?: number): Promise<boolean>;
}
