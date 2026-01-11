import {
  DocumentationAnalysis,
  FundingAnalysis,
  MarketAnalysis,
  TeamAnalysis,
  CodeAnalysis,
  FinalRating,
} from '../../domain/entities';
import { AnthropicClient } from '../../ai/AnthropicClient';
import { FINAL_RATING_PROMPT } from '../../ai/prompts';

export class RatingService {
  constructor(private aiClient: AnthropicClient) {}

  async generateRating(
    projectName: string,
    documentation: DocumentationAnalysis,
    funding: FundingAnalysis | null,
    market: MarketAnalysis,
    team: TeamAnalysis,
    code: CodeAnalysis
  ): Promise<FinalRating> {
    const prompt = FINAL_RATING_PROMPT
      .replace('{projectName}', projectName)
      .replace('{documentationAnalysis}', JSON.stringify(documentation, null, 2))
      .replace(
        '{fundingAnalysis}',
        funding ? JSON.stringify(funding, null, 2) : 'No funding data available'
      )
      .replace('{marketAnalysis}', JSON.stringify(market, null, 2))
      .replace('{teamAnalysis}', JSON.stringify(team, null, 2))
      .replace('{codeAnalysis}', JSON.stringify(code, null, 2));

    return this.aiClient.analyze<FinalRating>(prompt);
  }

  calculateCompositeScore(rating: FinalRating): number {
    return Math.round(
      rating.consistencyScore * 0.3 +
        rating.opportunityScore * 0.35 +
        rating.executionCredibilityScore * 0.35
    );
  }
}
