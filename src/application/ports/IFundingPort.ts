export interface RawFundingRound {
  stage: string;
  amountUsd: number;
  date: string;
  investors: string[];
  source: string;
}

export interface RawFundingData {
  projectName: string;
  totalRaised: number;
  rounds: RawFundingRound[];
  lastUpdated: Date;
}

export interface IFundingPort {
  fetchFromMessari(projectName: string): Promise<RawFundingData | null>;
  fetchFromCryptoRank(projectName: string): Promise<RawFundingData | null>;
}
