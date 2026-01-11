import { FullAnalysis } from '../../domain/entities';

export class OutputFormatterService {
  formatAsJson(analysis: FullAnalysis): string {
    return JSON.stringify(
      {
        projectId: analysis.projectId,
        analyzedAt: analysis.analyzedAt.toISOString(),
        documentation: {
          narrative: analysis.documentation.narrative,
          writingQuality: analysis.documentation.writingQuality,
          hasFundingSignal: analysis.documentation.hasFundingSignal,
          summary: analysis.documentation.summary,
        },
        funding: analysis.funding
          ? {
              stage: analysis.funding.stage,
              totalRaisedUsd: analysis.funding.totalRaisedUsd,
              rounds: analysis.funding.rounds.map((r) => ({
                stage: r.stage,
                amountUsd: r.amountUsd,
                date: r.date.toISOString(),
                investors: r.investors,
              })),
              investorQuality: analysis.funding.investorQuality,
            }
          : null,
        market: {
          problemType: analysis.market.problemType,
          competitors: analysis.market.competitors,
          differentiationClarity: analysis.market.differentiationClarity,
          marketSaturation: analysis.market.marketSaturation,
          narrativeCycleTiming: analysis.market.narrativeCycleTiming,
          marketCap: analysis.market.marketCap,
          volume24h: analysis.market.volume24h,
        },
        team: {
          members: analysis.team.members,
          builderPortfolioStrength: analysis.team.builderPortfolioStrength,
          yearsInCrypto: analysis.team.yearsInCrypto,
          skillsetAlignment: analysis.team.skillsetAlignment,
        },
        code: {
          commitFrequency: analysis.code.commitFrequency,
          activityLevel: analysis.code.activityLevel,
          contributorDiversity: analysis.code.contributorDiversity,
          architectureClarity: analysis.code.architectureClarity,
          mechanismOriginality: analysis.code.mechanismOriginality,
          totalCommits: analysis.code.totalCommits,
          totalContributors: analysis.code.totalContributors,
        },
        rating: {
          consistencyScore: analysis.rating.consistencyScore,
          opportunityScore: analysis.rating.opportunityScore,
          executionCredibilityScore: analysis.rating.executionCredibilityScore,
          finalGrade: analysis.rating.finalGrade,
          strengths: analysis.rating.strengths,
          risks: analysis.rating.risks,
          redFlags: analysis.rating.redFlags,
          asymmetricUpside: analysis.rating.asymmetricUpside,
          executiveSummary: analysis.rating.executiveSummary,
        },
      },
      null,
      2
    );
  }

  formatAsMarkdown(analysis: FullAnalysis): string {
    const lines: string[] = [];

    lines.push(`# Project Analysis: ${analysis.projectId}`);
    lines.push('');
    lines.push(`**Analyzed:** ${analysis.analyzedAt.toISOString()}`);
    lines.push('');

    lines.push('## Executive Summary');
    lines.push('');
    lines.push(analysis.rating.executiveSummary);
    lines.push('');

    lines.push('## Final Rating');
    lines.push('');
    lines.push(`| Metric | Score |`);
    lines.push(`|--------|-------|`);
    lines.push(`| **Final Grade** | **${analysis.rating.finalGrade}** |`);
    lines.push(`| Consistency | ${analysis.rating.consistencyScore}/100 |`);
    lines.push(`| Opportunity | ${analysis.rating.opportunityScore}/100 |`);
    lines.push(`| Execution Credibility | ${analysis.rating.executionCredibilityScore}/100 |`);
    lines.push('');

    lines.push('### Strengths');
    for (const strength of analysis.rating.strengths) {
      lines.push(`- ${strength}`);
    }
    lines.push('');

    lines.push('### Risks');
    for (const risk of analysis.rating.risks) {
      lines.push(`- ${risk}`);
    }
    lines.push('');

    if (analysis.rating.redFlags.length > 0) {
      lines.push('### Red Flags');
      for (const flag of analysis.rating.redFlags) {
        lines.push(`- ${flag}`);
      }
      lines.push('');
    }

    lines.push('### Asymmetric Upside');
    lines.push(analysis.rating.asymmetricUpside);
    lines.push('');

    lines.push('---');
    lines.push('');

    lines.push('## Documentation Analysis');
    lines.push('');
    lines.push(`**Narrative:** ${analysis.documentation.narrative}`);
    lines.push('');
    lines.push(`**Summary:** ${analysis.documentation.summary}`);
    lines.push('');
    lines.push('### Writing Quality');
    lines.push(`- Context Consistency: ${analysis.documentation.writingQuality.contextConsistency}/100`);
    lines.push(`- Logical Flow: ${analysis.documentation.writingQuality.logicalFlow}/100`);
    lines.push(`- Marketing Language Density: ${analysis.documentation.writingQuality.marketingLanguageDensity}/100`);
    lines.push(`- Human vs AI Score: ${analysis.documentation.writingQuality.humanVsAIScore}/100`);
    lines.push('');

    if (analysis.funding) {
      lines.push('## Funding Analysis');
      lines.push('');
      lines.push(`**Stage:** ${analysis.funding.stage}`);
      lines.push(`**Total Raised:** $${this.formatNumber(analysis.funding.totalRaisedUsd)}`);
      lines.push(`**Investor Quality:** ${analysis.funding.investorQuality}`);
      lines.push('');

      if (analysis.funding.rounds.length > 0) {
        lines.push('### Funding Rounds');
        lines.push('');
        lines.push('| Stage | Amount | Date | Key Investors |');
        lines.push('|-------|--------|------|---------------|');
        for (const round of analysis.funding.rounds) {
          const investors = round.investors.slice(0, 3).join(', ');
          lines.push(
            `| ${round.stage} | $${this.formatNumber(round.amountUsd)} | ${this.formatDate(round.date)} | ${investors} |`
          );
        }
        lines.push('');
      }
    } else {
      lines.push('## Funding Analysis');
      lines.push('');
      lines.push('*No funding data available*');
      lines.push('');
    }

    lines.push('## Market Analysis');
    lines.push('');
    lines.push(`**Problem Type:** ${analysis.market.problemType}`);
    lines.push(`**Differentiation Clarity:** ${analysis.market.differentiationClarity}/100`);
    lines.push(`**Market Saturation:** ${analysis.market.marketSaturation}/100`);
    lines.push(`**Narrative Cycle Timing:** ${analysis.market.narrativeCycleTiming}`);
    if (analysis.market.marketCap) {
      lines.push(`**Market Cap:** $${this.formatNumber(analysis.market.marketCap)}`);
    }
    if (analysis.market.volume24h) {
      lines.push(`**24h Volume:** $${this.formatNumber(analysis.market.volume24h)}`);
    }
    lines.push('');

    if (analysis.market.competitors.length > 0) {
      lines.push('### Competitors');
      lines.push('');
      lines.push('| Project | Market Cap | Similarity |');
      lines.push('|---------|------------|------------|');
      for (const comp of analysis.market.competitors) {
        const mcap = comp.marketCap ? `$${this.formatNumber(comp.marketCap)}` : 'N/A';
        lines.push(`| ${comp.name} | ${mcap} | ${comp.similarity}% |`);
      }
      lines.push('');
    }

    lines.push('## Team Analysis');
    lines.push('');
    lines.push(`**Builder Portfolio Strength:** ${analysis.team.builderPortfolioStrength}/100`);
    lines.push(`**Years in Crypto:** ${analysis.team.yearsInCrypto}`);
    lines.push(`**Skillset Alignment:** ${analysis.team.skillsetAlignment}/100`);
    lines.push('');

    if (analysis.team.members.length > 0) {
      lines.push('### Team Members');
      lines.push('');
      for (const member of analysis.team.members) {
        lines.push(`- **${member.name}** - ${member.role || 'Unknown Role'}`);
        if (member.previousProjects.length > 0) {
          lines.push(`  - Previous: ${member.previousProjects.join(', ')}`);
        }
      }
      lines.push('');
    }

    lines.push('## Code Analysis');
    lines.push('');
    lines.push(`**Activity Level:** ${analysis.code.activityLevel}`);
    lines.push(`**Commit Frequency:** ${analysis.code.commitFrequency.toFixed(1)} commits/week`);
    lines.push(`**Total Commits:** ${analysis.code.totalCommits}`);
    lines.push(`**Total Contributors:** ${analysis.code.totalContributors}`);
    lines.push(`**Contributor Diversity:** ${analysis.code.contributorDiversity}/100`);
    lines.push(`**Architecture Clarity:** ${analysis.code.architectureClarity}/100`);
    lines.push(`**Mechanism Originality:** ${analysis.code.mechanismOriginality}`);
    if (analysis.code.lastCommitDate) {
      lines.push(`**Last Commit:** ${this.formatDate(analysis.code.lastCommitDate)}`);
    }
    lines.push('');

    lines.push('---');
    lines.push('');
    lines.push('*Generated by Alpha Screener*');

    return lines.join('\n');
  }

  private formatNumber(num: number): string {
    if (num >= 1_000_000_000) {
      return (num / 1_000_000_000).toFixed(2) + 'B';
    }
    if (num >= 1_000_000) {
      return (num / 1_000_000).toFixed(2) + 'M';
    }
    if (num >= 1_000) {
      return (num / 1_000).toFixed(2) + 'K';
    }
    return num.toFixed(2);
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
