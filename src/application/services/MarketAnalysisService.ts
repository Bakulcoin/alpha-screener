import { MarketAnalysis, ProjectNarrative } from '../../domain/entities';
import { IMarketPort } from '../ports/IMarketPort';
import { AnthropicClient } from '../../ai/AnthropicClient';
import { MARKET_ANALYSIS_PROMPT } from '../../ai/prompts';

const NARRATIVE_COMPETITORS: Record<ProjectNarrative, string[]> = {
  Infrastructure: ['Ethereum', 'Solana', 'Avalanche', 'Polygon', 'Near'],
  DeFi: ['Uniswap', 'Aave', 'Compound', 'MakerDAO', 'Curve'],
  Modular: ['Celestia', 'Eigenlayer', 'Avail', 'Dymension'],
  Stablecoin: ['USDT', 'USDC', 'DAI', 'FRAX', 'LUSD'],
  AI: ['Render', 'Akash', 'Bittensor', 'Fetch.ai', 'Ocean Protocol'],
  RWA: ['Ondo', 'Centrifuge', 'Maple', 'Goldfinch'],
  Gaming: ['Immutable', 'Axie Infinity', 'Gala', 'The Sandbox', 'Decentraland'],
  Social: ['Lens', 'Farcaster', 'Friend.tech', 'DeSo'],
  Privacy: ['Monero', 'Zcash', 'Secret Network', 'Aztec'],
  L1: ['Ethereum', 'Solana', 'Cardano', 'Aptos', 'Sui'],
  L2: ['Arbitrum', 'Optimism', 'Base', 'zkSync', 'Starknet'],
  Interoperability: ['Chainlink', 'LayerZero', 'Axelar', 'Wormhole'],
  Oracle: ['Chainlink', 'Pyth', 'Band Protocol', 'API3', 'RedStone'],
  Storage: ['Filecoin', 'Arweave', 'Storj', 'Sia'],
  Unknown: [],
};

export class MarketAnalysisService {
  constructor(
    private marketPort: IMarketPort,
    private aiClient: AnthropicClient
  ) {}

  async analyze(
    projectName: string,
    narrative: ProjectNarrative
  ): Promise<MarketAnalysis> {
    const marketData = await this.marketPort.fetchFromCoinMarketCap(projectName).catch(() => null);
    const competitors = NARRATIVE_COMPETITORS[narrative] || [];

    const prompt = MARKET_ANALYSIS_PROMPT
      .replace('{projectName}', projectName)
      .replace('{narrative}', narrative)
      .replace('{marketData}', JSON.stringify(marketData, null, 2))
      .replace('{competitors}', competitors.join(', '));

    const aiAnalysis = await this.aiClient.analyze<{
      problemType: 'Niche' | 'Broad';
      competitors: Array<{ name: string; marketCap: number | null; similarity: number }>;
      differentiationClarity: number;
      marketSaturation: number;
      narrativeCycleTiming: 'Early' | 'Mid' | 'Late' | 'Post-Peak';
    }>(prompt);

    return {
      ...aiAnalysis,
      competitors: aiAnalysis.competitors.map((c) => ({
        ...c,
        marketCap: c.marketCap ?? undefined,
      })),
      marketCap: marketData?.marketCap,
      volume24h: marketData?.volume24h,
      priceChange7d: marketData?.priceChange7d,
    };
  }
}
