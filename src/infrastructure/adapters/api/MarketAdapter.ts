import axios from 'axios';
import { IMarketPort, RawMarketData } from '../../../application/ports/IMarketPort';

export class MarketAdapter implements IMarketPort {
  constructor(private coinMarketCapApiKey?: string) {}

  async fetchFromCoinMarketCap(identifier: string): Promise<RawMarketData | null> {
    if (!this.coinMarketCapApiKey) {
      return null;
    }

    try {
      const infoResponse = await axios.get(
        'https://pro-api.coinmarketcap.com/v1/cryptocurrency/info',
        {
          params: { slug: identifier.toLowerCase() },
          headers: { 'X-CMC_PRO_API_KEY': this.coinMarketCapApiKey },
          timeout: 15000,
        }
      );

      const infoData = Object.values(infoResponse.data.data)[0] as Record<string, unknown>;
      if (!infoData) return null;

      const quotesResponse = await axios.get(
        'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest',
        {
          params: { slug: identifier.toLowerCase() },
          headers: { 'X-CMC_PRO_API_KEY': this.coinMarketCapApiKey },
          timeout: 15000,
        }
      );

      const quotesData = Object.values(quotesResponse.data.data)[0] as Record<string, unknown>;
      const quote = (quotesData?.quote as Record<string, Record<string, number>>)?.USD;

      return {
        name: String(infoData.name),
        symbol: String(infoData.symbol),
        marketCap: quote?.market_cap,
        volume24h: quote?.volume_24h,
        price: quote?.price,
        priceChange24h: quote?.percent_change_24h,
        priceChange7d: quote?.percent_change_7d,
        priceChange30d: quote?.percent_change_30d,
        circulatingSupply: Number(quotesData?.circulating_supply) || undefined,
        totalSupply: Number(quotesData?.total_supply) || undefined,
        maxSupply: Number(quotesData?.max_supply) || undefined,
        rank: Number(quotesData?.cmc_rank) || undefined,
        categories: (infoData.tags as string[]) || [],
        lastUpdated: new Date(),
      };
    } catch {
      return null;
    }
  }
}
