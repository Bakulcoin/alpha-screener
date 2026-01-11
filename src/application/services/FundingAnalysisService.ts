import { FundingAnalysis, FundingStage, InvestorQuality } from '../../domain/entities';
import { IFundingPort, RawFundingData } from '../ports/IFundingPort';

const TIER1_INVESTORS = [
  'a16z',
  'andreessen horowitz',
  'paradigm',
  'sequoia',
  'polychain',
  'pantera',
  'dragonfly',
  'multicoin',
  'electric capital',
  'coinbase ventures',
  'binance labs',
  'framework ventures',
  'delphi digital',
  'jump crypto',
  'galaxy digital',
  'blockchain capital',
  'variant',
  'haun ventures',
];

export class FundingAnalysisService {
  constructor(private fundingPort: IFundingPort) {}

  async analyze(projectName: string): Promise<FundingAnalysis | null> {
    const [messariData, cryptoRankData] = await Promise.all([
      this.fundingPort.fetchFromMessari(projectName).catch(() => null),
      this.fundingPort.fetchFromCryptoRank(projectName).catch(() => null),
    ]);

    const fundingData = this.mergeFundingData(messariData, cryptoRankData);

    if (!fundingData || fundingData.rounds.length === 0) {
      return null;
    }

    return this.buildAnalysis(fundingData);
  }

  private mergeFundingData(
    messari: RawFundingData | null,
    cryptoRank: RawFundingData | null
  ): RawFundingData | null {
    if (!messari && !cryptoRank) {
      return null;
    }

    if (!messari) return cryptoRank;
    if (!cryptoRank) return messari;

    const allRounds = [...messari.rounds, ...cryptoRank.rounds];
    const uniqueRounds = this.deduplicateRounds(allRounds);

    return {
      projectName: messari.projectName,
      totalRaised: Math.max(messari.totalRaised, cryptoRank.totalRaised),
      rounds: uniqueRounds,
      lastUpdated: new Date(),
    };
  }

  private deduplicateRounds(rounds: RawFundingData['rounds']): RawFundingData['rounds'] {
    const seen = new Map<string, (typeof rounds)[0]>();

    for (const round of rounds) {
      const key = `${round.stage}-${round.date}`;
      const existing = seen.get(key);

      if (!existing || round.amountUsd > existing.amountUsd) {
        seen.set(key, round);
      }
    }

    return Array.from(seen.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }

  private buildAnalysis(data: RawFundingData): FundingAnalysis {
    const sortedRounds = data.rounds.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const latestRound = sortedRounds[0];
    const stage = this.determineStage(latestRound?.stage);
    const investorQuality = this.assessInvestorQuality(data.rounds);
    const timelineConsistency = this.calculateTimelineConsistency(sortedRounds);

    return {
      stage,
      totalRaisedUsd: data.totalRaised,
      rounds: data.rounds.map((r) => ({
        stage: r.stage,
        amountUsd: r.amountUsd,
        date: new Date(r.date),
        investors: r.investors,
      })),
      investorQuality,
      timelineConsistency,
    };
  }

  private determineStage(stageStr?: string): FundingStage {
    if (!stageStr) return 'Unknown';

    const normalized = stageStr.toLowerCase();

    if (normalized.includes('series c')) return 'Series C';
    if (normalized.includes('series b')) return 'Series B';
    if (normalized.includes('series a')) return 'Series A';
    if (normalized.includes('seed')) return 'Seed';
    if (normalized.includes('pre-seed') || normalized.includes('preseed')) return 'Pre-Seed';
    if (normalized.includes('public') || normalized.includes('ico') || normalized.includes('ido'))
      return 'Public';

    return 'Unknown';
  }

  private assessInvestorQuality(rounds: RawFundingData['rounds']): InvestorQuality {
    const allInvestors = rounds.flatMap((r) => r.investors.map((i) => i.toLowerCase()));

    const tier1Count = allInvestors.filter((investor) =>
      TIER1_INVESTORS.some((t1) => investor.includes(t1))
    ).length;

    if (tier1Count >= 3) return 'Tier-1';
    if (tier1Count >= 1) return 'Strategic';
    if (allInvestors.length > 0) return 'Angels';

    return 'Unknown';
  }

  private calculateTimelineConsistency(
    sortedRounds: RawFundingData['rounds']
  ): number {
    if (sortedRounds.length < 2) return 100;

    const intervals: number[] = [];
    for (let i = 1; i < sortedRounds.length; i++) {
      const days =
        (new Date(sortedRounds[i - 1].date).getTime() -
          new Date(sortedRounds[i].date).getTime()) /
        (1000 * 60 * 60 * 24);
      intervals.push(days);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance =
      intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    const cv = avgInterval > 0 ? stdDev / avgInterval : 0;
    return Math.max(0, Math.min(100, 100 - cv * 50));
  }
}
