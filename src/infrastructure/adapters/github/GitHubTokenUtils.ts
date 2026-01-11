import axios, { AxiosInstance } from 'axios';

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
  used: number;
  resource: string;
}

export interface TokenValidationResult {
  valid: boolean;
  scopes?: string[];
  rateLimit?: RateLimitInfo;
  error?: string;
}

export interface GitHubTokenInfo {
  authenticated: boolean;
  tokenType?: 'classic' | 'fine-grained';
  scopes?: string[];
  rateLimit: RateLimitInfo;
}

export class GitHubTokenUtils {
  private client: AxiosInstance;
  private token?: string;

  constructor(token?: string) {
    this.token = token;
    this.client = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        Accept: 'application/vnd.github.v3+json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      timeout: 10000,
    });
  }

  async validateToken(): Promise<TokenValidationResult> {
    if (!this.token) {
      return {
        valid: false,
        error: 'No token provided',
      };
    }

    try {
      const response = await this.client.get('/rate_limit');
      const scopes = response.headers['x-oauth-scopes'];
      const rateLimit = this.parseRateLimitHeaders(response.headers);

      return {
        valid: true,
        scopes: scopes ? scopes.split(',').map((s: string) => s.trim()) : [],
        rateLimit,
      };
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          return {
            valid: false,
            error: 'Invalid or expired token',
          };
        }
        if (error.response?.status === 403) {
          return {
            valid: false,
            error: 'Token does not have sufficient permissions',
          };
        }
        return {
          valid: false,
          error: `Token validation failed: ${error.message}`,
        };
      }
      return {
        valid: false,
        error: 'Unknown error during token validation',
      };
    }
  }

  async getRateLimitInfo(): Promise<RateLimitInfo> {
    try {
      const response = await this.client.get('/rate_limit');
      const coreRateLimit = response.data.resources.core;

      return {
        limit: coreRateLimit.limit,
        remaining: coreRateLimit.remaining,
        reset: new Date(coreRateLimit.reset * 1000),
        used: coreRateLimit.used,
        resource: 'core',
      };
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const headers = error.response?.headers;
        if (headers) {
          return this.parseRateLimitHeaders(headers);
        }
      }

      return {
        limit: this.token ? 5000 : 60,
        remaining: 0,
        reset: new Date(Date.now() + 3600000),
        used: 0,
        resource: 'core',
      };
    }
  }

  async getTokenInfo(): Promise<GitHubTokenInfo> {
    if (!this.token) {
      const rateLimit = await this.getRateLimitInfo();
      return {
        authenticated: false,
        rateLimit,
      };
    }

    const validation = await this.validateToken();
    const rateLimit = validation.rateLimit || (await this.getRateLimitInfo());

    return {
      authenticated: validation.valid,
      tokenType: this.detectTokenType(validation.scopes),
      scopes: validation.scopes,
      rateLimit,
    };
  }

  async checkRateLimitAvailable(minimumRemaining = 10): Promise<boolean> {
    const rateLimit = await this.getRateLimitInfo();
    return rateLimit.remaining >= minimumRemaining;
  }

  async waitForRateLimit(): Promise<void> {
    const rateLimit = await this.getRateLimitInfo();
    if (rateLimit.remaining === 0) {
      const waitTime = rateLimit.reset.getTime() - Date.now();
      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime + 1000));
      }
    }
  }

  private parseRateLimitHeaders(headers: Record<string, unknown>): RateLimitInfo {
    const getHeader = (key: string): string => {
      const value = headers[key];
      return typeof value === 'string' ? value : String(value || '');
    };

    const limit = parseInt(getHeader('x-ratelimit-limit') || '60');
    const remaining = parseInt(getHeader('x-ratelimit-remaining') || '0');
    const reset = parseInt(getHeader('x-ratelimit-reset') || String(Date.now() / 1000 + 3600));
    const used = parseInt(getHeader('x-ratelimit-used') || '0');

    return {
      limit,
      remaining,
      reset: new Date(reset * 1000),
      used,
      resource: getHeader('x-ratelimit-resource') || 'core',
    };
  }

  private detectTokenType(scopes?: string[]): 'classic' | 'fine-grained' | undefined {
    if (!scopes || scopes.length === 0) {
      return 'fine-grained';
    }
    return 'classic';
  }

  formatRateLimitInfo(rateLimit: RateLimitInfo): string {
    const resetTime = rateLimit.reset.toLocaleString();
    const percentage = ((rateLimit.remaining / rateLimit.limit) * 100).toFixed(1);

    return [
      `GitHub API Rate Limit:`,
      `  Used: ${rateLimit.used}/${rateLimit.limit} (${percentage}% remaining)`,
      `  Remaining: ${rateLimit.remaining}`,
      `  Resets at: ${resetTime}`,
    ].join('\n');
  }
}

export class RateLimitError extends Error {
  constructor(
    public rateLimit: RateLimitInfo,
    message?: string
  ) {
    super(message || 'GitHub API rate limit exceeded');
    this.name = 'RateLimitError';
  }
}

export class AuthenticationError extends Error {
  constructor(message?: string) {
    super(message || 'GitHub authentication failed');
    this.name = 'AuthenticationError';
  }
}
