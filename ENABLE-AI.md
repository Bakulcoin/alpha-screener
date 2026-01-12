# How to Enable AI in Alpha Screener

## Quick Start (2 minutes)

### Option 1: Automated Setup

```bash
./scripts/setup-ai.sh
```

The script will:
- ✓ Create `.env` file
- ✓ Prompt for Anthropic API key
- ✓ Install dependencies
- ✓ Build the project
- ✓ Test AI configuration

### Option 2: Manual Setup

1. **Get API Key**
   - Visit: https://console.anthropic.com/
   - Sign up/login → Create API key

2. **Configure Environment**
   ```bash
   cp .env.example .env
   nano .env  # or use your favorite editor
   ```

3. **Add Your API Key**
   ```bash
   ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
   ```

4. **Install & Build**
   ```bash
   npm install
   npm run build
   ```

5. **Run**
   ```bash
   npm run dev
   ```

## What AI Does in This Project

Alpha Screener uses **Claude Sonnet 4** to analyze crypto projects:

```
┌─────────────────────────────────────────────────┐
│  User Input: Project name + GitHub URL         │
└─────────────┬───────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│  Data Collection Phase                          │
│  • Fetch GitHub repository data                │
│  • Scrape documentation                         │
│  • Get market data (optional APIs)              │
└─────────────┬───────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│  AI Analysis Phase (Claude Sonnet 4)            │
│  ├─ Documentation Analysis → Score              │
│  ├─ Market Positioning → Score                  │
│  ├─ Team Credibility → Score                    │
│  ├─ Code Quality → Score                        │
│  └─ Final Rating → A/B/C/D Grade                │
└─────────────┬───────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│  Output: Comprehensive Report + Rating          │
└─────────────────────────────────────────────────┘
```

## Configuration Files

```
alpha-screener/
├── .env                    ← Your API keys (create this)
├── .env.example            ← Template
├── src/ai/
│   └── AnthropicClient.ts  ← AI client (Claude Sonnet 4)
└── docs/
    └── ai-setup-guide.md   ← Detailed guide
```

## Required Environment Variables

**Minimum (AI only):**
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
```

**Recommended (full features):**
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
GITHUB_TOKEN=ghp_...                    # 5000 req/hr vs 60
DISCORD_BOT_TOKEN=...                   # For Discord bot
DISCORD_CLIENT_ID=...                   # For Discord bot
```

**Optional (enhanced analysis):**
```bash
MESSARI_API_KEY=...
CRYPTORANK_API_KEY=...
COINGECKO_API_KEY=...
COINMARKETCAP_API_KEY=...
REDIS_URL=redis://localhost:6379       # Caching
```

## Testing AI Setup

```bash
# Build first
npm run build

# Quick test
node -e "
const { loadConfig } = require('./dist/config');
const { AnthropicClient } = require('./dist/ai/AnthropicClient');

(async () => {
  const config = loadConfig();
  const ai = new AnthropicClient(config.anthropic.apiKey);
  const response = await ai.generateText('Say: AI is working!');
  console.log('✅', response);
})();
"
```

Expected output: `✅ AI is working!`

## Cost Information

Claude Sonnet 4 pricing (January 2025):
- **Input**: ~$3 per million tokens
- **Output**: ~$15 per million tokens

Typical crypto analysis:
- **Tokens used**: 10,000-30,000
- **Cost per analysis**: $0.30-$1.00

## AI Model Configuration

Current model: **Claude Sonnet 4** (`claude-sonnet-4-20250514`)

To change the model, edit `src/ai/AnthropicClient.ts:5`:

```typescript
private model = 'claude-sonnet-4-20250514';  // Current
// private model = 'claude-opus-4-5-20251101';  // More capable, higher cost
// private model = 'claude-haiku-4-20250514';   // Faster, lower cost
```

## Common Issues

### "No API key provided"
→ Check `.env` file exists and contains `ANTHROPIC_API_KEY`

### "Invalid API key"
→ Verify key at https://console.anthropic.com/
→ Generate new key if needed

### "Rate limit exceeded"
→ Wait 1 minute, limits reset automatically
→ Check usage at console.anthropic.com

## Next Steps

1. ✅ Enable AI (you're here!)
2. [ ] Set up Discord bot → See docs for Discord guide
3. [ ] Add GitHub token → See `docs/github-token-functions.md`
4. [ ] Enable Redis caching (optional)
5. [ ] Run first analysis!

## Resources

- **Detailed Setup**: `docs/ai-setup-guide.md`
- **GitHub Token Guide**: `docs/github-token-functions.md`
- **Anthropic Docs**: https://docs.anthropic.com/
- **Quick Reference**: `AI-QUICK-START.txt` (generated by setup script)

## Support

Check the `docs/` folder for comprehensive guides, or review the code:
- AI Client: `src/ai/AnthropicClient.ts`
- Container: `src/container.ts` (dependency injection)
- Services: `src/application/services/` (AI usage)

---

**Current Status**: AI implementation complete and ready to use! 🚀
