import { ProjectIdentifier, FullAnalysis } from '../../domain/entities';
import {
  AnalysisState,
  AnalysisProgress,
  createInitialProgress,
  transitionState,
} from '../../domain/value-objects/AnalysisState';
import { DocumentationAnalysisService } from './DocumentationAnalysisService';
import { FundingAnalysisService } from './FundingAnalysisService';
import { MarketAnalysisService } from './MarketAnalysisService';
import { TeamAnalysisService } from './TeamAnalysisService';
import { CodeAnalysisService } from './CodeAnalysisService';
import { RatingService } from './RatingService';
import { OutputFormatterService } from './OutputFormatterService';
import { ICachePort } from '../ports/ICachePort';

export interface AnalysisResult {
  analysis: FullAnalysis;
  json: string;
  markdown: string;
  noFunding?: boolean;
}

export class AnalysisOrchestrator {
  private progress: AnalysisProgress;

  constructor(
    private documentationService: DocumentationAnalysisService,
    private fundingService: FundingAnalysisService,
    private marketService: MarketAnalysisService,
    private teamService: TeamAnalysisService,
    private codeService: CodeAnalysisService,
    private ratingService: RatingService,
    private outputFormatter: OutputFormatterService,
    private cache: ICachePort
  ) {
    this.progress = createInitialProgress();
  }

  async analyze(
    identifier: ProjectIdentifier,
    onStateChange?: (state: AnalysisState) => Promise<void>
  ): Promise<AnalysisResult> {
    this.progress = createInitialProgress();

    const cacheKey = `analysis:${identifier.name}`;
    const cached = await this.cache.get<AnalysisResult>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      await this.transition('FETCHING_DOCUMENTATION', onStateChange);

      let documentationContent = '';
      if (identifier.docsUrl) {
        const docAdapter = await import('../../infrastructure/adapters/api/DocumentationAdapter');
        const adapter = new docAdapter.DocumentationAdapter();
        const docs = await adapter.fetchDocumentation(identifier.docsUrl);
        documentationContent = docs.content;
      } else if (identifier.website) {
        const docAdapter = await import('../../infrastructure/adapters/api/DocumentationAdapter');
        const adapter = new docAdapter.DocumentationAdapter();
        documentationContent = await adapter.fetchWebsiteContent(identifier.website);
      }

      await this.transition('ANALYZING_DOCUMENTATION', onStateChange);
      const documentation = await this.documentationService.analyzeFromContent(
        documentationContent || `Project: ${identifier.name}`
      );

      await this.transition('CHECKING_FUNDING_SIGNAL', onStateChange);

      let funding = null;
      if (documentation.hasFundingSignal) {
        await this.transition('FETCHING_FUNDING', onStateChange);
        await this.transition('ANALYZING_FUNDING', onStateChange);
        funding = await this.fundingService.analyze(identifier.name);
      } else {
        await this.transition('NO_FUNDING', onStateChange);
      }

      await this.transition('FETCHING_MARKET_DATA', onStateChange);
      await this.transition('ANALYZING_MARKET', onStateChange);
      const market = await this.marketService.analyze(identifier.name, documentation.narrative);

      await this.transition('FETCHING_TEAM_DATA', onStateChange);
      await this.transition('ANALYZING_TEAM', onStateChange);
      const team = await this.teamService.analyzeFromDocumentation(
        identifier.name,
        documentationContent
      );

      let code;
      if (identifier.githubUrl) {
        await this.transition('FETCHING_CODE', onStateChange);
        await this.transition('ANALYZING_CODE', onStateChange);
        code = await this.codeService.analyze(identifier.githubUrl);
      } else {
        code = {
          commitFrequency: 0,
          commitConsistency: 0,
          prefersManySmallCommits: false,
          repoAge: 0,
          activityLevel: 'Inactive' as const,
          contributorDiversity: 0,
          architectureClarity: 0,
          mechanismOriginality: 'Unknown' as 'Common' | 'Iterative' | 'Pioneering',
          similarProjectsCount: 0,
          totalCommits: 0,
          totalContributors: 0,
        };
        code.mechanismOriginality = 'Common';
      }

      await this.transition('GENERATING_RATING', onStateChange);
      const rating = await this.ratingService.generateRating(
        identifier.name,
        documentation,
        funding,
        market,
        team,
        code
      );

      await this.transition('FORMATTING_OUTPUT', onStateChange);

      const fullAnalysis: FullAnalysis = {
        projectId: identifier.name,
        documentation,
        funding: funding || undefined,
        market,
        team,
        code,
        rating,
        analyzedAt: new Date(),
      };

      const json = this.outputFormatter.formatAsJson(fullAnalysis);
      const markdown = this.outputFormatter.formatAsMarkdown(fullAnalysis);

      const result: AnalysisResult = {
        analysis: fullAnalysis,
        json,
        markdown,
        noFunding: !documentation.hasFundingSignal,
      };

      await this.cache.set(cacheKey, result, 3600);

      await this.transition('COMPLETED', onStateChange);

      return result;
    } catch (error) {
      await this.transition('FAILED', onStateChange);
      throw error;
    }
  }

  private async transition(
    state: AnalysisState,
    onStateChange?: (state: AnalysisState) => Promise<void>
  ): Promise<void> {
    this.progress = transitionState(this.progress, state);
    if (onStateChange) {
      await onStateChange(state);
    }
  }

  getProgress(): AnalysisProgress {
    return this.progress;
  }
}
