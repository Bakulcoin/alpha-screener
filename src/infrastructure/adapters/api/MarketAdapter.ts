import axios from 'axios';
import { IMarketPort, RawMarketData } from '../../../application/ports/IMarketPort';

export class MarketAdapter implements IMarketPort {
  constructor(
    private coinGeckoApiKey?: string,
    private coinMarketCapApiKey?: string
  ) {}

  async fetchFromCoinGecko(identifier: string): Promise<RawMarketData | null> {
    try {
      const searchId = await this.searchCoinGeckoId(identifier);
      if (!searchId) return null;

      const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${searchId}`, {
        params: {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: false,
          developer_data: false,
        },
        headers: this.coinGeckoApiKey
          ? { 'x-cg-demo-api-key': this.coinGeckoApiKey }
          : undefined,
        timeout: 15000,
      });

      const data = response.data;
      const marketData = data.market_data;

      return {
        name: data.name,
        symbol: data.symbol?.toUpperCase(),
        marketCap: marketData?.market_cap?.usd,
        volume24h: marketData?.total_volume?.usd,
        price: marketData?.current_price?.usd,
        priceChange24h: marketData?.price_change_percentage_24h,
        priceChange7d: marketData?.price_change_percentage_7d,
        priceChange30d: marketData?.price_change_percentage_30d,
        circulatingSupply: marketData?.circulating_supply,
        totalSupply: marketData?.total_supply,
        maxSupply: marketData?.max_supply,
        rank: data.market_cap_rank,
        categories: data.categories,
        lastUpdated: new Date(),
      };
    } catch {
      return null;
    }
  }

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

  async searchProjects(query: string): Promise<{ id: string; name: string; symbol: string }[]> {
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/search', {
        params: { query },
        headers: this.coinGeckoApiKey
          ? { 'x-cg-demo-api-key': this.coinGeckoApiKey }
          : undefined,
        timeout: 10000,
      });

      return (response.data.coins || []).slice(0, 10).map((coin: Record<string, string>) => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol?.toUpperCase(),
      }));
    } catch {
      return [];
    }
  }

  private async searchCoinGeckoId(identifier: string): Promise<string | null> {
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/search', {
        params: { query: identifier },
        headers: this.coinGeckoApiKey
          ? { 'x-cg-demo-api-key': this.coinGeckoApiKey }
          : undefined,
        timeout: 10000,
      });

      const coins = response.data.coins || [];
      if (coins.length === 0) return null;

      const exactMatch = coins.find(
        (c: { name: string; symbol: string }) =>
          c.name.toLowerCase() === identifier.toLowerCase() ||
          c.symbol.toLowerCase() === identifier.toLowerCase()
      );

      return exactMatch?.id || coins[0].id;
    } catch {
      return null;
    }
  }
}
