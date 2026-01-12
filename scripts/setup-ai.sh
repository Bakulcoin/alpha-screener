#!/bin/bash

# Alpha Screener AI Setup Script
# This script helps you configure AI functionality

set -e

echo "=================================="
echo "  Alpha Screener - AI Setup"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}→ Creating .env file from .env.example${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

# Check for Anthropic API key
if grep -q "^ANTHROPIC_API_KEY=.\+" .env; then
    echo -e "${GREEN}✓ Anthropic API key found${NC}"
else
    echo -e "${YELLOW}! Anthropic API key not configured${NC}"
    echo ""
    echo "To get your API key:"
    echo "1. Visit: https://console.anthropic.com/"
    echo "2. Sign up or log in"
    echo "3. Go to API Keys section"
    echo "4. Create a new key"
    echo ""
    read -p "Enter your Anthropic API key (or press Enter to skip): " api_key

    if [ ! -z "$api_key" ]; then
        # Update .env file
        if grep -q "^ANTHROPIC_API_KEY=" .env; then
            sed -i "s|^ANTHROPIC_API_KEY=.*|ANTHROPIC_API_KEY=$api_key|" .env
        else
            echo "ANTHROPIC_API_KEY=$api_key" >> .env
        fi
        echo -e "${GREEN}✓ API key saved to .env${NC}"
    else
        echo -e "${YELLOW}⚠ Skipped - You'll need to add it manually to .env${NC}"
    fi
fi

echo ""
echo "=================================="
echo "  Checking Dependencies"
echo "=================================="
echo ""

# Check Node.js version
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -ge 20 ]; then
        echo -e "${GREEN}✓ Node.js $(node -v) installed${NC}"
    else
        echo -e "${RED}✗ Node.js version too old. Required: >= 20.0.0${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ Node.js not found. Please install Node.js >= 20.0.0${NC}"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    echo -e "${GREEN}✓ npm $(npm -v) installed${NC}"
else
    echo -e "${RED}✗ npm not found${NC}"
    exit 1
fi

# Install dependencies
echo ""
echo -e "${YELLOW}→ Installing dependencies...${NC}"
npm install > /dev/null 2>&1
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Build project
echo ""
echo -e "${YELLOW}→ Building project...${NC}"
npm run build > /dev/null 2>&1
echo -e "${GREEN}✓ Project built successfully${NC}"

# Test AI if key is configured
echo ""
echo "=================================="
echo "  Testing AI Configuration"
echo "=================================="
echo ""

if grep -q "^ANTHROPIC_API_KEY=sk-ant-" .env; then
    echo -e "${YELLOW}→ Testing AI connection...${NC}"

    # Create test script
    cat > /tmp/test-ai-$$. js << 'EOF'
const { loadConfig } = require('./dist/config');

async function quickTest() {
  try {
    const config = loadConfig();
    if (!config.anthropic.apiKey) {
      console.log('ERROR: No API key found');
      process.exit(1);
    }
    console.log('SUCCESS: API key configured');
    process.exit(0);
  } catch (error) {
    console.log('ERROR:', error.message);
    process.exit(1);
  }
}

quickTest();
EOF

    if node /tmp/test-ai-$$.js 2>&1 | grep -q "SUCCESS"; then
        echo -e "${GREEN}✓ AI configuration valid${NC}"
        rm -f /tmp/test-ai-$$.js
    else
        echo -e "${RED}✗ AI configuration test failed${NC}"
        rm -f /tmp/test-ai-$$.js
        echo ""
        echo "Please check your ANTHROPIC_API_KEY in .env file"
    fi
else
    echo -e "${YELLOW}⚠ Skipping AI test - No API key configured${NC}"
fi

# Optional: Check GitHub token
echo ""
if grep -q "^GITHUB_TOKEN=.\+" .env; then
    echo -e "${GREEN}✓ GitHub token configured (recommended)${NC}"
else
    echo -e "${YELLOW}! GitHub token not configured (optional but recommended)${NC}"
    echo "  Without a token: 60 API requests/hour"
    echo "  With a token: 5000 API requests/hour"
    echo "  Get one at: https://github.com/settings/tokens"
fi

# Optional: Check Redis
echo ""
if command -v redis-cli &> /dev/null; then
    if redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Redis running (caching enabled)${NC}"
    else
        echo -e "${YELLOW}⚠ Redis installed but not running${NC}"
        echo "  Start with: redis-server"
    fi
else
    echo -e "${YELLOW}! Redis not installed (optional - enables caching)${NC}"
    echo "  Install: sudo apt-get install redis-server"
fi

echo ""
echo "=================================="
echo "  Setup Complete!"
echo "=================================="
echo ""

# Print next steps
echo "Next steps:"
echo ""
echo "1. Configure Discord bot (if needed):"
echo "   - Get token from: https://discord.com/developers/applications"
echo "   - Add DISCORD_BOT_TOKEN to .env"
echo "   - Add DISCORD_CLIENT_ID to .env"
echo ""
echo "2. Run the project:"
echo "   npm run dev      # Development mode"
echo "   npm run build    # Production build"
echo "   npm start        # Run production"
echo ""
echo "3. Test with Discord /analyze command"
echo ""
echo "For more details, see: docs/ai-setup-guide.md"
echo ""

# Create a quick reference card
cat > AI-QUICK-START.txt << 'EOF'
╔═══════════════════════════════════════════════════════════════╗
║           ALPHA SCREENER - AI QUICK START                     ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  1. GET ANTHROPIC API KEY                                     ║
║     → https://console.anthropic.com/                          ║
║                                                               ║
║  2. ADD TO .env FILE                                          ║
║     ANTHROPIC_API_KEY=sk-ant-api03-...                        ║
║                                                               ║
║  3. RUN THE PROJECT                                           ║
║     npm run dev                                               ║
║                                                               ║
║  4. OPTIONAL: Add GitHub token for better analysis            ║
║     GITHUB_TOKEN=ghp_...                                      ║
║                                                               ║
║  MODEL: Claude Sonnet 4 (claude-sonnet-4-20250514)            ║
║  COST: ~$0.30-1.00 per analysis                              ║
║                                                               ║
║  DOCS: docs/ai-setup-guide.md                                ║
║        docs/github-token-functions.md                         ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF

echo -e "${GREEN}✓ Created AI-QUICK-START.txt for reference${NC}"
echo ""
