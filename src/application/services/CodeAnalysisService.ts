import { CodeAnalysis } from '../../domain/entities';
import { IGitHubPort, RawCodeData } from '../ports/IGitHubPort';
import { AnthropicClient } from '../../ai/AnthropicClient';
import { CODE_ANALYSIS_PROMPT } from '../../ai/prompts';

export class CodeAnalysisService {
  constructor(
    private githubPort: IGitHubPort,
    private aiClient: AnthropicClient
  ) {}

  async analyze(githubUrl: string): Promise<CodeAnalysis> {
    const { owner, repo } = this.parseGitHubUrl(githubUrl);
    const codeData = await this.githubPort.fetchFullCodeData(owner, repo);

    const metrics = this.calculateMetrics(codeData);

    const prompt = CODE_ANALYSIS_PROMPT.replace(
      '{repoData}',
      JSON.stringify(
        {
          repository: codeData.repository,
          totalCommits: codeData.totalCommits,
          contributorCount: codeData.contributors.length,
          languages: codeData.languages,
          recentCommits: codeData.commits.slice(0, 20),
          metrics,
        },
        null,
        2
      )
    );

    const aiAnalysis = await this.aiClient.analyze<{
      commitFrequency: number;
      commitConsistency: number;
      prefersManySmallCommits: boolean;
      activityLevel: 'High' | 'Medium' | 'Low' | 'Inactive';
      contributorDiversity: number;
      architectureClarity: number;
      mechanismOriginality: 'Common' | 'Iterative' | 'Pioneering';
      similarProjectsCount: number;
    }>(prompt);

    return {
      ...aiAnalysis,
      repoAge: metrics.repoAgeDays,
      totalCommits: codeData.totalCommits,
      totalContributors: codeData.contributors.length,
      lastCommitDate: codeData.commits[0]?.date,
    };
  }

  private parseGitHubUrl(url: string): { owner: string; repo: string } {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      throw new Error(`Invalid GitHub URL: ${url}`);
    }
    return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
  }

  private calculateMetrics(data: RawCodeData): {
    repoAgeDays: number;
    avgCommitSize: number;
    commitFrequencyPerWeek: number;
    daysSinceLastCommit: number;
  } {
    const now = new Date();
    const repoAgeDays = Math.floor(
      (now.getTime() - data.repository.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    const daysSinceLastCommit = data.commits[0]
      ? Math.floor((now.getTime() - data.commits[0].date.getTime()) / (1000 * 60 * 60 * 24))
      : repoAgeDays;

    const avgCommitSize =
      data.commits.length > 0
        ? data.commits.reduce((sum, c) => sum + c.additions + c.deletions, 0) / data.commits.length
        : 0;

    const weeksOld = Math.max(1, repoAgeDays / 7);
    const commitFrequencyPerWeek = data.totalCommits / weeksOld;

    return {
      repoAgeDays,
      avgCommitSize,
      commitFrequencyPerWeek,
      daysSinceLastCommit,
    };
  }
}
