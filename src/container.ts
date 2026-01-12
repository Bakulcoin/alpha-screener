import { Config } from './config';
import { AnthropicClient } from './ai/AnthropicClient';
import { DocumentationAdapter } from './infrastructure/adapters/api/DocumentationAdapter';
import { FundingAdapter } from './infrastructure/adapters/api/FundingAdapter';
import { MarketAdapter } from './infrastructure/adapters/api/MarketAdapter';
import { GitHubAdapter } from './infrastructure/adapters/github/GitHubAdapter';
import { RedisAdapter, InMemoryCache } from './infrastructure/adapters/cache/RedisAdapter';
import { ICachePort } from './application/ports/ICachePort';
import {
  DocumentationAnalysisService,
  FundingAnalysisService,
  MarketAnalysisService,
  TeamAnalysisService,
  CodeAnalysisService,
  RatingService,
  OutputFormatterService,
  AnalysisOrchestrator,
} from './application/services';
import { DiscordBot } from './presentation/discord/DiscordBot';

export interface Container {
  aiClient: AnthropicClient;
  documentationAdapter: DocumentationAdapter;
  fundingAdapter: FundingAdapter;
  marketAdapter: MarketAdapter;
  githubAdapter: GitHubAdapter;
  cache: ICachePort;
  documentationService: DocumentationAnalysisService;
  fundingService: FundingAnalysisService;
  marketService: MarketAnalysisService;
  teamService: TeamAnalysisService;
  codeService: CodeAnalysisService;
  ratingService: RatingService;
  outputFormatter: OutputFormatterService;
  orchestrator: AnalysisOrchestrator;
  discordBot?: DiscordBot;
}

export function createContainer(config: Config): Container {
  const aiClient = new AnthropicClient(config.anthropic.apiKey);

  const documentationAdapter = new DocumentationAdapter();
  const fundingAdapter = new FundingAdapter(
    config.apis.messariApiKey,
    config.apis.cryptoRankApiKey
  );
  const marketAdapter = new MarketAdapter(config.apis.coinMarketCapApiKey);
  const githubAdapter = new GitHubAdapter(config.apis.githubToken);

  const cache: ICachePort = config.redis.enabled
    ? new RedisAdapter(config.redis.url)
    : new InMemoryCache();

  const documentationService = new DocumentationAnalysisService(documentationAdapter, aiClient);
  const fundingService = new FundingAnalysisService(fundingAdapter);
  const marketService = new MarketAnalysisService(marketAdapter, aiClient);
  const teamService = new TeamAnalysisService(aiClient);
  const codeService = new CodeAnalysisService(githubAdapter, aiClient);
  const ratingService = new RatingService(aiClient);
  const outputFormatter = new OutputFormatterService();

  const orchestrator = new AnalysisOrchestrator(
    documentationService,
    fundingService,
    marketService,
    teamService,
    codeService,
    ratingService,
    outputFormatter,
    cache
  );

  let discordBot: DiscordBot | undefined;
  if (config.discord.botToken && config.discord.clientId) {
    discordBot = new DiscordBot(
      config.discord.botToken,
      config.discord.clientId,
      orchestrator
    );
  }

  return {
    aiClient,
    documentationAdapter,
    fundingAdapter,
    marketAdapter,
    githubAdapter,
    cache,
    documentationService,
    fundingService,
    marketService,
    teamService,
    codeService,
    ratingService,
    outputFormatter,
    orchestrator,
    discordBot,
  };
}
