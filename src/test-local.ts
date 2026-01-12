import { loadConfig } from './config';
import { createContainer } from './container';
import { ProjectIdentifier } from './domain/entities/Project';
import { AnalysisState } from './domain/value-objects/AnalysisState';

async function testLocal(projectName: string): Promise<void> {
  console.log('════════════════════════════════════════════════════');
  console.log(`  Alpha Screener - Local Test for ${projectName}`);
  console.log('════════════════════════════════════════════════════\n');

  try {
    // Load configuration
    console.log('→ Loading configuration...');
    const config = loadConfig();
    console.log('✓ Configuration loaded\n');

    // Create container with all services
    console.log('→ Initializing services...');
    const container = createContainer(config);
    console.log('✓ Services initialized\n');

    // Test GitHub token first
    console.log('→ Testing GitHub token...');
    try {
      const tokenInfo = await container.githubAdapter.getTokenInfo();
      console.log(`✓ GitHub authenticated: ${tokenInfo.authenticated}`);
      console.log(`  Token type: ${tokenInfo.tokenType || 'N/A'}`);
      console.log(`  Rate limit: ${tokenInfo.rateLimit.remaining}/${tokenInfo.rateLimit.limit}`);
      console.log('');
    } catch (error) {
      console.log('⚠ GitHub token test failed (will use unauthenticated)');
      console.log('');
    }

    // Prepare project identifier based on project name
    const identifier: ProjectIdentifier = {
      name: projectName,
    };

    // Set known GitHub URLs for common projects
    const knownProjects: Record<string, ProjectIdentifier> = {
      ethereum: {
        name: 'Ethereum',
        githubUrl: 'https://github.com/ethereum/go-ethereum',
        docsUrl: 'https://ethereum.org/en/whitepaper/',
      },
      bitcoin: {
        name: 'Bitcoin',
        githubUrl: 'https://github.com/bitcoin/bitcoin',
        docsUrl: 'https://bitcoin.org/bitcoin.pdf',
      },
      solana: {
        name: 'Solana',
        githubUrl: 'https://github.com/solana-labs/solana',
        docsUrl: 'https://solana.com/solana-whitepaper.pdf',
      },
      uniswap: {
        name: 'Uniswap',
        githubUrl: 'https://github.com/Uniswap/v3-core',
        docsUrl: 'https://uniswap.org/whitepaper-v3.pdf',
      },
    };

    const projectKey = projectName.toLowerCase();
    if (knownProjects[projectKey]) {
      Object.assign(identifier, knownProjects[projectKey]);
      console.log(`✓ Using known project configuration for ${identifier.name}`);
    } else {
      console.log(`⚠ Unknown project "${projectName}" - will analyze with limited data`);
    }

    console.log(`  GitHub URL: ${identifier.githubUrl || 'Not provided'}`);
    console.log(`  Docs URL: ${identifier.docsUrl || 'Not provided'}`);
    console.log('');

    // Run analysis
    console.log('════════════════════════════════════════════════════');
    console.log('  Starting Analysis');
    console.log('════════════════════════════════════════════════════\n');

    const result = await container.orchestrator.analyze(
      identifier,
      async (state: AnalysisState) => {
        console.log(`→ State: ${state}`);
      }
    );

    // Display results
    console.log('\n════════════════════════════════════════════════════');
    console.log('  Analysis Complete');
    console.log('════════════════════════════════════════════════════\n');

    const analysis = result.analysis;

    console.log('FINAL GRADE:', analysis.rating.finalGrade);
    console.log('\n--- SCORES ---');
    console.log('Consistency Score:', analysis.rating.consistencyScore);
    console.log('Opportunity Score:', analysis.rating.opportunityScore);
    console.log('Execution Credibility:', analysis.rating.executionCredibilityScore);

    console.log('\n--- DETAILED ANALYSIS ---\n');

    if (analysis.documentation) {
      console.log('📄 DOCUMENTATION');
      console.log('  Narrative:', analysis.documentation.narrative);
      console.log('  Has Funding Signal:', analysis.documentation.hasFundingSignal);
      console.log('  Writing Quality:');
      console.log('    Context Consistency:', analysis.documentation.writingQuality.contextConsistency);
      console.log('    Logical Flow:', analysis.documentation.writingQuality.logicalFlow);
      console.log('    Human vs AI Score:', analysis.documentation.writingQuality.humanVsAIScore);
      console.log('');
    }

    if (analysis.funding) {
      console.log('💰 FUNDING');
      console.log('  Stage:', analysis.funding.stage);
      console.log('  Total Raised (USD):', `$${analysis.funding.totalRaisedUsd.toLocaleString()}`);
      console.log('  Investor Quality:', analysis.funding.investorQuality);
      console.log('  Funding Rounds:', analysis.funding.rounds.length);
      console.log('');
    }

    if (analysis.market) {
      console.log('📊 MARKET');
      console.log('  Problem Type:', analysis.market.problemType);
      console.log('  Market Cap:', analysis.market.marketCap ? `$${analysis.market.marketCap.toLocaleString()}` : 'N/A');
      console.log('  Differentiation Clarity:', analysis.market.differentiationClarity);
      console.log('  Market Saturation:', analysis.market.marketSaturation);
      console.log('  Narrative Cycle:', analysis.market.narrativeCycleTiming);
      console.log('  Competitors:', analysis.market.competitors.length);
      console.log('');
    }

    if (analysis.team) {
      console.log('👥 TEAM');
      console.log('  Team Members:', analysis.team.members.length);
      console.log('  Builder Portfolio Strength:', analysis.team.builderPortfolioStrength);
      console.log('  Years in Crypto:', analysis.team.yearsInCrypto);
      console.log('  Skillset Alignment:', analysis.team.skillsetAlignment);
      console.log('');
    }

    if (analysis.code) {
      console.log('💻 CODE');
      console.log('  Total Commits:', analysis.code.totalCommits);
      console.log('  Total Contributors:', analysis.code.totalContributors);
      console.log('  Commit Frequency:', analysis.code.commitFrequency);
      console.log('  Activity Level:', analysis.code.activityLevel);
      console.log('  Architecture Clarity:', analysis.code.architectureClarity);
      console.log('  Mechanism Originality:', analysis.code.mechanismOriginality);
      console.log('  Repo Age (days):', analysis.code.repoAge);
      console.log('');
    }

    console.log('\n--- RATING DETAILS ---');
    console.log('\n✓ STRENGTHS:');
    analysis.rating.strengths.forEach((s) => console.log(`  • ${s}`));
    console.log('\n⚠ RISKS:');
    analysis.rating.risks.forEach((r) => console.log(`  • ${r}`));
    if (analysis.rating.redFlags.length > 0) {
      console.log('\n🚩 RED FLAGS:');
      analysis.rating.redFlags.forEach((rf) => console.log(`  • ${rf}`));
    }
    console.log('\n💎 ASYMMETRIC UPSIDE:');
    console.log(`  ${analysis.rating.asymmetricUpside}`);
    console.log('\n--- EXECUTIVE SUMMARY ---');
    console.log(analysis.rating.executiveSummary);

    console.log('\n════════════════════════════════════════════════════');
    console.log('  Test Complete ✓');
    console.log('════════════════════════════════════════════════════\n');

    // Check rate limit after analysis
    try {
      const finalRateLimit = await container.githubAdapter.getRateLimitInfo();
      console.log(`GitHub API - Remaining: ${finalRateLimit.remaining}/${finalRateLimit.limit}`);
    } catch (error) {
      // Ignore
    }

    process.exit(0);
  } catch (error: unknown) {
    console.error('\n❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Get project name from command line
const projectName = process.argv[2];

if (!projectName) {
  console.error('Usage: npm run test:local <project-name>');
  console.error('');
  console.error('Example: npm run test:local Ethereum');
  console.error('');
  console.error('Known projects: Ethereum, Bitcoin, Solana, Uniswap');
  process.exit(1);
}

testLocal(projectName);
