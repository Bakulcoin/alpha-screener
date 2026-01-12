# AI Setup Guide - Alpha Screener

This guide will help you enable and configure AI functionality in the Alpha Screener project.

## Overview

Alpha Screener uses **Anthropic's Claude AI** (specifically Claude Sonnet 4) to analyze crypto projects across multiple dimensions:

- 📄 **Documentation Analysis** - Evaluates whitepapers and project docs
- 💰 **Market Analysis** - Analyzes market positioning and competition
- 👥 **Team Analysis** - Assesses team credibility and experience
- 💻 **Code Analysis** - Reviews GitHub repositories and code quality
- ⭐ **Rating Generation** - Produces final A/B/C/D grades

## Step 1: Get an Anthropic API Key

### Option A: Using Anthropic Console (Recommended)

1. Go to **[Anthropic Console](https://console.anthropic.com/)**
2. Sign up or log in to your account
3. Navigate to **API Keys** section
4. Click **"Create Key"**
5. Copy your API key (starts with `sk-ant-api03-...`)

### Option B: Using Claude for Work/Enterprise

If you have an enterprise account, contact your organization admin for API access.

### Pricing Information

As of January 2025, Claude Sonnet 4 pricing:
- **Input**: ~$3 per million tokens
- **Output**: ~$15 per million tokens

Each crypto analysis typically uses ~10,000-30,000 tokens, costing $0.30-$1.00 per analysis.

## Step 2: Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Copy the example file
cp .env.example .env
```

Edit the `.env` file and add your Anthropic API key:

```bash
# AI Configuration (REQUIRED)
ANTHROPIC_API_KEY=sk-ant-api03-your-actual-api-key-here

# Discord Bot (Required for Discord interface)
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id

# External APIs (Optional but recommended)
MESSARI_API_KEY=
CRYPTORANK_API_KEY=
COINGECKO_API_KEY=
COINMARKETCAP_API_KEY=
GITHUB_TOKEN=your_github_token_here

# Redis Cache (Optional)
REDIS_URL=redis://localhost:6379
```

### Required vs Optional Variables

**Required for AI to work:**
- `ANTHROPIC_API_KEY` - Claude AI access

**Required for Discord bot:**
- `DISCORD_BOT_TOKEN`
- `DISCORD_CLIENT_ID`

**Recommended for better analysis:**
- `GITHUB_TOKEN` - Enables detailed code analysis (5000 requests/hour vs 60)
- Market data APIs - Provides funding and price information

## Step 3: Verify AI Configuration

Run this verification script to test your setup:

```bash
# Build the project
npm run build

# Create a test script
cat > test-ai.js << 'EOF'
const { AnthropicClient } = require('./dist/ai/AnthropicClient');
const { loadConfig } = require('./dist/config');

async function testAI() {
  try {
    console.log('Loading configuration...');
    const config = loadConfig();

    if (!config.anthropic.apiKey) {
      console.error('❌ ANTHROPIC_API_KEY not found in .env file');
      process.exit(1);
    }

    console.log('✓ API key found');
    console.log('\nInitializing Anthropic client...');
    const client = new AnthropicClient(config.anthropic.apiKey);

    console.log('✓ Client initialized');
    console.log('\nTesting AI response...');

    const response = await client.generateText('Respond with exactly: "AI is working correctly"');

    console.log('✓ AI Response:', response);
    console.log('\n✅ AI setup is complete and working!');

  } catch (error) {
    console.error('❌ AI test failed:', error.message);
    process.exit(1);
  }
}

testAI();
EOF

# Run the test
node test-ai.js
```

## Step 4: Understanding AI Usage in the Project

### AI Model Configuration

Located in `src/ai/AnthropicClient.ts:5`:
```typescript
private model = 'claude-sonnet-4-20250514';
```

**Available Models:**
- `claude-sonnet-4-20250514` - Current (balanced performance/cost)
- `claude-opus-4-5-20251101` - Most capable (higher cost)
- `claude-haiku-4-20250514` - Fastest (lower cost, less capable)

To change the model, edit line 5 in `src/ai/AnthropicClient.ts`.

### Where AI is Used

```
AnalysisOrchestrator
├── DocumentationAnalysisService → AI analyzes whitepapers
├── MarketAnalysisService → AI evaluates market positioning
├── TeamAnalysisService → AI assesses team credibility
├── CodeAnalysisService → AI reviews GitHub repositories
└── RatingService → AI generates final A/B/C/D rating
```

### AI Request Flow

1. **User triggers analysis** (via Discord bot)
2. **Data collection** (fetches docs, GitHub, market data)
3. **AI analysis** (Claude processes each dimension)
4. **Rating generation** (Claude assigns final grade)
5. **Format output** (Results sent to Discord)

## Step 5: Running the Project

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

### Expected Output

```
✓ Configuration loaded
✓ AI client initialized
✓ Discord bot initialized
✓ All services ready
→ Discord bot ready! Invite link: https://discord.com/api/oauth2/authorize?...
```

## Step 6: Testing AI with a Real Analysis

Once the bot is running, use Discord slash command:

```
/analyze project_name:Ethereum github:https://github.com/ethereum/go-ethereum
```

The AI will analyze:
1. GitHub repository code quality
2. Commit patterns and activity
3. Team expertise (if docs provided)
4. Overall project rating

## Troubleshooting

### Error: "No API key provided"

**Solution:**
```bash
# Verify .env file exists
ls -la .env

# Check the key is set
grep ANTHROPIC_API_KEY .env
```

### Error: "Invalid API key"

**Causes:**
- API key is incorrect
- API key has expired
- Account has insufficient credits

**Solution:**
1. Verify key in [Anthropic Console](https://console.anthropic.com/)
2. Generate a new key
3. Update `.env` file

### Error: "Rate limit exceeded"

**Solution:**
```bash
# Check your usage at console.anthropic.com
# The project includes automatic rate limiting
# Wait for the limit to reset (usually 1 minute)
```

### Error: "No text response from AI"

**Causes:**
- Prompt is malformed
- Response exceeded token limit
- API timeout

**Solution:**
1. Check `max_tokens` in `AnthropicClient.ts` (currently 4096)
2. Simplify the analysis prompt
3. Add retry logic

## Advanced Configuration

### Adjusting AI Response Length

Edit `src/ai/AnthropicClient.ts`:
```typescript
max_tokens: 4096, // Increase for longer responses (max: 8192)
```

### Adding Temperature Control

For more creative (or deterministic) responses:
```typescript
const response = await this.client.messages.create({
  model: this.model,
  max_tokens: 4096,
  temperature: 0.7, // 0.0 = deterministic, 1.0 = creative
  messages: [...]
});
```

### Caching Responses

Enable Redis caching to avoid re-analyzing the same projects:

```bash
# Install Redis
# Ubuntu/Debian:
sudo apt-get install redis-server

# macOS:
brew install redis

# Start Redis
redis-server

# Update .env
REDIS_URL=redis://localhost:6379
```

The project automatically caches AI responses when Redis is available.

## Cost Optimization Tips

1. **Enable Redis caching** - Avoid duplicate analyses
2. **Use GitHub token** - Reduces need for AI to infer missing data
3. **Batch analyses** - Analyze multiple projects in one session
4. **Use Haiku model** - For simpler analyses, use `claude-haiku-4-20250514`
5. **Monitor usage** - Check [console.anthropic.com](https://console.anthropic.com/) regularly

## Security Best Practices

1. **Never commit `.env`** - Already in `.gitignore`
2. **Rotate keys regularly** - Generate new keys every 90 days
3. **Use environment-specific keys** - Different keys for dev/prod
4. **Monitor API usage** - Set up billing alerts
5. **Restrict key scope** - Use minimum required permissions

## Getting Help

- **Anthropic Documentation**: https://docs.anthropic.com/
- **Discord.js Guide**: https://discord.js.org/
- **Project Issues**: Check `docs/` folder for more guides

## Next Steps

Once AI is working:

1. ✅ Configure Discord bot
2. ✅ Set up external APIs (market data)
3. ✅ Enable Redis caching
4. ✅ Run first analysis
5. ✅ Monitor costs and performance

---

**Status Check:**
- [ ] Anthropic API key obtained
- [ ] `.env` file configured
- [ ] AI test passed
- [ ] Project builds successfully
- [ ] First analysis completed

Good luck! 🚀
