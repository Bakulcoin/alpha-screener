# GitHub Token Functions

This document describes the GitHub token utility functions implemented in the Alpha Screener project.

## Overview

The GitHub token functionality provides comprehensive utilities for:
- Token validation
- Rate limit monitoring
- Authentication error handling
- Token information retrieval

## Components

### GitHubTokenUtils

Location: `src/infrastructure/adapters/github/GitHubTokenUtils.ts`

A utility class that provides token management and rate limit checking capabilities.

#### Methods

##### `validateToken(): Promise<TokenValidationResult>`

Validates whether the GitHub token is valid and has the necessary permissions.

**Returns:**
- `valid: boolean` - Whether the token is valid
- `scopes?: string[]` - OAuth scopes (for classic tokens)
- `rateLimit?: RateLimitInfo` - Current rate limit information
- `error?: string` - Error message if validation failed

**Example:**
```typescript
const tokenUtils = new GitHubTokenUtils(process.env.GITHUB_TOKEN);
const validation = await tokenUtils.validateToken();

if (validation.valid) {
  console.log('Token is valid');
  console.log('Scopes:', validation.scopes);
} else {
  console.error('Token validation failed:', validation.error);
}
```

##### `getRateLimitInfo(): Promise<RateLimitInfo>`

Retrieves the current rate limit information for the GitHub API.

**Returns:**
- `limit: number` - Maximum requests per hour
- `remaining: number` - Remaining requests in current window
- `reset: Date` - When the rate limit resets
- `used: number` - Number of requests used
- `resource: string` - Resource type (usually 'core')

**Example:**
```typescript
const rateLimit = await tokenUtils.getRateLimitInfo();
console.log(`${rateLimit.remaining}/${rateLimit.limit} requests remaining`);
console.log(`Resets at: ${rateLimit.reset}`);
```

##### `getTokenInfo(): Promise<GitHubTokenInfo>`

Gets comprehensive information about the token and authentication status.

**Returns:**
- `authenticated: boolean` - Whether authentication is successful
- `tokenType?: 'classic' | 'fine-grained'` - Type of GitHub token
- `scopes?: string[]` - OAuth scopes (classic tokens only)
- `rateLimit: RateLimitInfo` - Current rate limit information

**Example:**
```typescript
const info = await tokenUtils.getTokenInfo();
console.log('Authenticated:', info.authenticated);
console.log('Token type:', info.tokenType);
console.log('Rate limit:', info.rateLimit.remaining);
```

##### `checkRateLimitAvailable(minimumRemaining = 10): Promise<boolean>`

Checks if there are enough API requests available before making calls.

**Parameters:**
- `minimumRemaining` - Minimum number of requests required (default: 10)

**Returns:** `boolean` - True if enough requests are available

**Example:**
```typescript
const canProceed = await tokenUtils.checkRateLimitAvailable(50);
if (canProceed) {
  // Safe to make API calls
  await fetchRepositoryData();
}
```

##### `waitForRateLimit(): Promise<void>`

Waits until the rate limit resets if currently at zero remaining requests.

**Example:**
```typescript
const hasRequests = await tokenUtils.checkRateLimitAvailable(1);
if (!hasRequests) {
  console.log('Rate limit exceeded, waiting for reset...');
  await tokenUtils.waitForRateLimit();
  console.log('Rate limit reset, continuing...');
}
```

##### `formatRateLimitInfo(rateLimit: RateLimitInfo): string`

Formats rate limit information into a human-readable string.

**Example:**
```typescript
const rateLimit = await tokenUtils.getRateLimitInfo();
console.log(tokenUtils.formatRateLimitInfo(rateLimit));
// Output:
// GitHub API Rate Limit:
//   Used: 42/5000 (99.2% remaining)
//   Remaining: 4958
//   Resets at: 1/11/2026, 3:45:00 PM
```

## Enhanced GitHubAdapter

Location: `src/infrastructure/adapters/github/GitHubAdapter.ts`

The GitHubAdapter now includes:
- Automatic error handling for authentication failures
- Rate limit detection and specialized error throwing
- Integration with GitHubTokenUtils

### New Methods

##### `getTokenInfo(): Promise<GitHubTokenInfo>`

Delegates to GitHubTokenUtils to get token information.

##### `getRateLimitInfo(): Promise<RateLimitInfo>`

Delegates to GitHubTokenUtils to get rate limit information.

##### `checkRateLimitAvailable(minimumRemaining = 10): Promise<boolean>`

Delegates to GitHubTokenUtils to check rate limit availability.

### Error Handling

The adapter now throws specialized errors:

#### `AuthenticationError`

Thrown when:
- HTTP 401: Invalid or expired token
- HTTP 403 (non-rate-limit): Insufficient permissions

**Example:**
```typescript
try {
  await githubAdapter.fetchRepository('owner', 'repo');
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Authentication failed:', error.message);
    // Handle auth error (e.g., prompt for new token)
  }
}
```

#### `RateLimitError`

Thrown when:
- HTTP 403 with `x-ratelimit-remaining: 0`

Contains a `rateLimit` property with full rate limit information.

**Example:**
```typescript
try {
  await githubAdapter.fetchRepository('owner', 'repo');
} catch (error) {
  if (error instanceof RateLimitError) {
    console.error('Rate limit exceeded');
    console.log('Resets at:', error.rateLimit.reset);
    await new Promise(resolve =>
      setTimeout(resolve, error.rateLimit.reset.getTime() - Date.now())
    );
  }
}
```

## Configuration

Set your GitHub token in the `.env` file:

```bash
GITHUB_TOKEN=ghp_your_token_here
```

### Token Types

The utilities support both types of GitHub personal access tokens:

1. **Classic Personal Access Tokens** (deprecated)
   - Identified by scopes in the response
   - Format: `ghp_...`

2. **Fine-grained Personal Access Tokens** (recommended)
   - No scopes in response (permissions are fine-grained)
   - Format: `github_pat_...`

### Rate Limits

- **Unauthenticated**: 60 requests/hour
- **Authenticated (classic token)**: 5,000 requests/hour
- **Authenticated (fine-grained)**: 5,000 requests/hour
- **GitHub Apps**: Up to 15,000 requests/hour

## Usage Example

See `examples/github-token-example.ts` for a complete working example.

```typescript
import { GitHubAdapter } from './src/infrastructure/adapters/github';
import { loadConfig } from './src/config';

const config = loadConfig();
const githubAdapter = new GitHubAdapter(config.apis.githubToken);

// Check rate limit before making requests
const canProceed = await githubAdapter.checkRateLimitAvailable(100);
if (!canProceed) {
  console.warn('Not enough API requests available');
  return;
}

// Get token information
const tokenInfo = await githubAdapter.getTokenInfo();
console.log('Authenticated:', tokenInfo.authenticated);
console.log('Token type:', tokenInfo.tokenType);

// Make API calls with automatic error handling
try {
  const repo = await githubAdapter.fetchRepository('ethereum', 'go-ethereum');
  console.log('Repository:', repo.fullName);
  console.log('Stars:', repo.stars);
} catch (error) {
  if (error instanceof RateLimitError) {
    console.error('Rate limit exceeded, resets at:', error.rateLimit.reset);
  } else if (error instanceof AuthenticationError) {
    console.error('Authentication failed:', error.message);
  }
}
```

## Best Practices

1. **Always check rate limits** before making bulk API requests
2. **Handle errors gracefully** using the specialized error types
3. **Use fine-grained tokens** when possible for better security
4. **Monitor rate limit usage** in production environments
5. **Implement retry logic** with exponential backoff for rate limit errors
6. **Cache responses** to reduce API calls (see RedisAdapter)

## Integration with Alpha Screener

The GitHub token functions are automatically integrated into the Alpha Screener's:
- Code analysis service
- Repository metadata fetching
- Contributor analysis
- Commit history analysis

The Discord bot will use these functions when analyzing crypto projects with GitHub repositories.
