import { GitHubTokenUtils } from '../src/infrastructure/adapters/github/GitHubTokenUtils';
import { GitHubAdapter } from '../src/infrastructure/adapters/github/GitHubAdapter';
import { loadConfig } from '../src/config';

async function demonstrateGitHubTokenFunctions() {
  const config = loadConfig();
  const token = config.apis.githubToken;

  console.log('=== GitHub Token Utility Functions Demo ===\n');

  const tokenUtils = new GitHubTokenUtils(token);

  console.log('1. Validating GitHub Token...');
  const validation = await tokenUtils.validateToken();
  if (validation.valid) {
    console.log('✓ Token is valid');
    console.log(`  Scopes: ${validation.scopes?.join(', ') || 'N/A'}`);
  } else {
    console.log(`✗ Token validation failed: ${validation.error}`);
  }
  console.log();

  console.log('2. Checking Rate Limit Info...');
  const rateLimit = await tokenUtils.getRateLimitInfo();
  console.log(tokenUtils.formatRateLimitInfo(rateLimit));
  console.log();

  console.log('3. Getting Full Token Info...');
  const tokenInfo = await tokenUtils.getTokenInfo();
  console.log(`  Authenticated: ${tokenInfo.authenticated}`);
  console.log(`  Token Type: ${tokenInfo.tokenType || 'N/A'}`);
  console.log(`  Rate Limit: ${tokenInfo.rateLimit.remaining}/${tokenInfo.rateLimit.limit}`);
  console.log();

  console.log('4. Checking Rate Limit Availability...');
  const hasAvailableRequests = await tokenUtils.checkRateLimitAvailable(10);
  console.log(`  Has at least 10 requests available: ${hasAvailableRequests}`);
  console.log();

  console.log('5. Using GitHubAdapter with Token Functions...');
  const githubAdapter = new GitHubAdapter(token);

  try {
    const adapterTokenInfo = await githubAdapter.getTokenInfo();
    console.log(`  Adapter authenticated: ${adapterTokenInfo.authenticated}`);

    const adapterRateLimit = await githubAdapter.getRateLimitInfo();
    console.log(`  Adapter rate limit: ${adapterRateLimit.remaining}/${adapterRateLimit.limit}`);

    const canMakeRequests = await githubAdapter.checkRateLimitAvailable(50);
    console.log(`  Can make requests (50+ available): ${canMakeRequests}`);
    console.log();

    if (canMakeRequests) {
      console.log('6. Fetching a Sample Repository (ethereum/go-ethereum)...');
      const repoInfo = await githubAdapter.fetchRepository('ethereum', 'go-ethereum');
      console.log(`  Repository: ${repoInfo.fullName}`);
      console.log(`  Stars: ${repoInfo.stars.toLocaleString()}`);
      console.log(`  Forks: ${repoInfo.forks.toLocaleString()}`);
      console.log(`  Language: ${repoInfo.language}`);
      console.log(`  Last updated: ${repoInfo.updatedAt.toLocaleDateString()}`);

      const afterRateLimit = await githubAdapter.getRateLimitInfo();
      console.log(
        `\n  Rate limit after fetch: ${afterRateLimit.remaining}/${afterRateLimit.limit}`
      );
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`  Error: ${error.message}`);
    }
  }

  console.log('\n=== Demo Complete ===');
}

if (require.main === module) {
  demonstrateGitHubTokenFunctions().catch(console.error);
}

export { demonstrateGitHubTokenFunctions };
