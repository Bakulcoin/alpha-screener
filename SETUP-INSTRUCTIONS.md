# Setup Instructions for Local Testing

## Required API Keys

To run `npm run test:local Ethereum`, you need to configure the following in your `.env` file:

### 1. Anthropic API Key (REQUIRED for AI analysis)

Get your API key from https://console.anthropic.com/

```bash
ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here
```

### 2. Discord Bot Credentials (Required by config, but you can use dummy values for local testing)

If you're only testing locally and not using Discord, you can use placeholder values:

```bash
DISCORD_BOT_TOKEN=dummy_token_for_local_testing_only
DISCORD_CLIENT_ID=dummy_client_id_for_local_testing
```

### 3. GitHub Token (RECOMMENDED for better rate limits)

```bash
GITHUB_TOKEN=ghp_your_github_token_here
```

Without this: 60 GitHub API requests/hour
With this: 5,000 GitHub API requests/hour

Get one at: https://github.com/settings/tokens

### 4. Optional API Keys (for enhanced analysis)

```bash
MESSARI_API_KEY=
CRYPTORANK_API_KEY=
COINGECKO_API_KEY=
COINMARKETCAP_API_KEY=
```

## Quick Setup

```bash
# Edit the .env file
nano .env

# Add at minimum:
ANTHROPIC_API_KEY=sk-ant-api03-YOUR_REAL_KEY
DISCORD_BOT_TOKEN=dummy
DISCORD_CLIENT_ID=dummy
GITHUB_TOKEN=ghp_YOUR_REAL_TOKEN  # Highly recommended

# Save and exit (Ctrl+X, then Y, then Enter)

# Run the test
npm run test:local Ethereum
```

## What the Test Does

The test will:
1. ✓ Load configuration from .env
2. ✓ Initialize all services (AI, GitHub, Market, etc.)
3. ✓ Test GitHub token and show rate limits
4. ✓ Analyze Ethereum project:
   - Fetch GitHub repository data
   - Analyze documentation (from known whitepaper URL)
   - Analyze market positioning
   - Analyze team (from docs)
   - Generate AI-powered rating (A/B/C/D)
5. ✓ Display comprehensive analysis results

## Expected Output

```
════════════════════════════════════════════════════
  Alpha Screener - Local Test for Ethereum
════════════════════════════════════════════════════

→ Loading configuration...
✓ Configuration loaded

→ Initializing services...
✓ Services initialized

→ Testing GitHub token...
✓ GitHub authenticated: true
  Token type: fine-grained
  Rate limit: 4998/5000

✓ Using known project configuration for Ethereum
  GitHub URL: https://github.com/ethereum/go-ethereum
  Docs URL: https://ethereum.org/en/whitepaper/

════════════════════════════════════════════════════
  Starting Analysis
════════════════════════════════════════════════════

→ State: FETCHING_DOCUMENTATION
→ State: ANALYZING_DOCUMENTATION
→ State: CHECKING_FUNDING_SIGNAL
→ State: FETCHING_MARKET_DATA
→ State: ANALYZING_MARKET
→ State: FETCHING_TEAM_DATA
→ State: ANALYZING_TEAM
→ State: FETCHING_CODE
→ State: ANALYZING_CODE
→ State: GENERATING_RATING
→ State: FORMATTING_OUTPUT
→ State: COMPLETED

════════════════════════════════════════════════════
  Analysis Complete
════════════════════════════════════════════════════

FINAL GRADE: A

--- SCORES ---
Consistency Score: 95
Opportunity Score: 88
Execution Credibility: 92

[... detailed analysis results ...]
```

## Troubleshooting

### "String must contain at least 1 character(s)"
→ You need to add API keys to .env file (see above)

### "Invalid API key" from Anthropic
→ Check your ANTHROPIC_API_KEY is correct
→ Generate a new key at https://console.anthropic.com/

### "Rate limit exceeded" from GitHub
→ Add a GITHUB_TOKEN to get 5,000 requests/hour instead of 60

### Redis connection errors
→ Redis is optional, errors can be ignored for local testing
→ Or install Redis: `sudo apt-get install redis-server && redis-server`

## Next Steps

After local testing works:
1. Set up real Discord bot tokens for Discord integration
2. Add market data API keys for enhanced analysis
3. Enable Redis for caching (optional)
4. Deploy to production

For more details:
- AI Setup: `docs/ai-setup-guide.md`
- GitHub Token: `docs/github-token-functions.md`
- Quick Start: `ENABLE-AI.md`
