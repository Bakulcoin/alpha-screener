export interface RawMarketData {
  name: string;
  symbol: string;
  marketCap?: number;
  volume24h?: number;
  price?: number;
  priceChange24h?: number;
  priceChange7d?: number;
  priceChange30d?: number;
  circulatingSupply?: number;
  totalSupply?: number;
  maxSupply?: number;
  rank?: number;
  categories?: string[];
  lastUpdated: Date;
}

export interface IMarketPort {
  fetchFromCoinGecko(identifier: string): Promise<RawMarketData | null>;
  fetchFromCoinMarketCap(identifier: string): Promise<RawMarketData | null>;
  searchProjects(query: string): Promise<{ id: string; name: string; symbol: string }[]>;
}
