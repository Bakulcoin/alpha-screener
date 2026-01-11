import axios from 'axios';
import { IFundingPort, RawFundingData, RawFundingRound } from '../../../application/ports/IFundingPort';

export class FundingAdapter implements IFundingPort {
  constructor(
    private messariApiKey?: string,
    private cryptoRankApiKey?: string
  ) {}

  async fetchFromMessari(projectName: string): Promise<RawFundingData | null> {
    if (!this.messariApiKey) {
      return null;
    }

    try {
      const response = await axios.get('https://api.messari.io/funding/v1/rounds', {
        params: { search: projectName },
        headers: {
          'x-messari-api-key': this.messariApiKey,
        },
        timeout: 15000,
      });

      const data = response.data?.data;
      if (!data || data.length === 0) {
        return null;
      }

      const rounds: RawFundingRound[] = data.map((round: Record<string, unknown>) => ({
        stage: String(round.round_type || 'Unknown'),
        amountUsd: Number(round.amount_raised_usd) || 0,
        date: String(round.announcement_date || new Date().toISOString()),
        investors: ((round.investors as Array<{ name: string }>) || []).map((i) => i.name),
        source: 'messari',
      }));

      const totalRaised = rounds.reduce((sum, r) => sum + r.amountUsd, 0);

      return {
        projectName,
        totalRaised,
        rounds,
        lastUpdated: new Date(),
      };
    } catch {
      return null;
    }
  }

  async fetchFromCryptoRank(projectName: string): Promise<RawFundingData | null> {
    if (!this.cryptoRankApiKey) {
      return null;
    }

    try {
      const searchResponse = await axios.get('https://api.cryptorank.io/v1/coins', {
        params: {
          api_key: this.cryptoRankApiKey,
          search: projectName,
          limit: 1,
        },
        timeout: 15000,
      });

      const projectData = searchResponse.data?.data?.[0];
      if (!projectData) {
        return null;
      }

      const fundingResponse = await axios.get(
        `https://api.cryptorank.io/v1/coins/${projectData.key}/funding-rounds`,
        {
          params: { api_key: this.cryptoRankApiKey },
          timeout: 15000,
        }
      );

      const fundingData = fundingResponse.data?.data;
      if (!fundingData || fundingData.length === 0) {
        return null;
      }

      const rounds: RawFundingRound[] = fundingData.map((round: Record<string, unknown>) => ({
        stage: String(round.type || 'Unknown'),
        amountUsd: Number(round.raise) || 0,
        date: String(round.date || new Date().toISOString()),
        investors: ((round.funds as Array<{ name: string }>) || []).map((f) => f.name),
        source: 'cryptorank',
      }));

      const totalRaised = rounds.reduce((sum, r) => sum + r.amountUsd, 0);

      return {
        projectName,
        totalRaised,
        rounds,
        lastUpdated: new Date(),
      };
    } catch {
      return null;
    }
  }
}
