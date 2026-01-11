import { ProjectNarrative } from './Project';

export interface DocumentationAnalysis {
  narrative: ProjectNarrative;
  writingQuality: WritingQuality;
  hasFundingSignal: boolean;
  fundingSignals: string[];
  summary: string;
}

export interface WritingQuality {
  contextConsistency: number;
  logicalFlow: number;
  marketingLanguageDensity: number;
  aiWritingSignals: AIWritingSignals;
  humanVsAIScore: number;
}

export interface AIWritingSignals {
  emojiOveruse: boolean;
  longDashUsage: number;
  repetitivePhrases: string[];
  genericPhraseCount: number;
}

export interface FundingAnalysis {
  stage: FundingStage;
  totalRaisedUsd: number;
  rounds: FundingRound[];
  investorQuality: InvestorQuality;
  timelineConsistency: number;
}

export type FundingStage =
  | 'Bootstrapped'
  | 'Pre-Seed'
  | 'Seed'
  | 'Series A'
  | 'Series B'
  | 'Series C'
  | 'Public'
  | 'Unknown';

export interface FundingRound {
  stage: string;
  amountUsd: number;
  date: Date;
  investors: string[];
}

export type InvestorQuality = 'Tier-1' | 'Strategic' | 'Angels' | 'Mixed' | 'Unknown';

export interface MarketAnalysis {
  problemType: 'Niche' | 'Broad';
  competitors: Competitor[];
  differentiationClarity: number;
  marketSaturation: number;
  narrativeCycleTiming: 'Early' | 'Mid' | 'Late' | 'Post-Peak';
  marketCap?: number;
  volume24h?: number;
  priceChange7d?: number;
}

export interface Competitor {
  name: string;
  marketCap?: number;
  similarity: number;
}

export interface TeamAnalysis {
  members: TeamMember[];
  builderPortfolioStrength: number;
  previousOutcomes: string[];
  yearsInCrypto: number;
  skillsetAlignment: number;
}

export interface TeamMember {
  name: string;
  role: string;
  linkedIn?: string;
  twitter?: string;
  previousProjects: string[];
}

export interface CodeAnalysis {
  commitFrequency: number;
  commitConsistency: number;
  prefersManySmallCommits: boolean;
  repoAge: number;
  activityLevel: 'High' | 'Medium' | 'Low' | 'Inactive';
  contributorDiversity: number;
  architectureClarity: number;
  mechanismOriginality: 'Common' | 'Iterative' | 'Pioneering';
  similarProjectsCount: number;
  totalCommits: number;
  totalContributors: number;
  lastCommitDate?: Date;
}

export interface FullAnalysis {
  projectId: string;
  documentation: DocumentationAnalysis;
  funding?: FundingAnalysis;
  market: MarketAnalysis;
  team: TeamAnalysis;
  code: CodeAnalysis;
  rating: FinalRating;
  analyzedAt: Date;
}

export interface FinalRating {
  consistencyScore: number;
  opportunityScore: number;
  executionCredibilityScore: number;
  finalGrade: 'A' | 'B' | 'C' | 'D';
  strengths: string[];
  risks: string[];
  redFlags: string[];
  asymmetricUpside: string;
  executiveSummary: string;
}
