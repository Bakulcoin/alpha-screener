export interface ProjectIdentifier {
  name: string;
  symbol?: string;
  website?: string;
  docsUrl?: string;
  githubUrl?: string;
}

export interface Project {
  id: string;
  identifier: ProjectIdentifier;
  narrative: ProjectNarrative;
  createdAt: Date;
  analyzedAt?: Date;
}

export type ProjectNarrative =
  | 'Infrastructure'
  | 'DeFi'
  | 'Modular'
  | 'Stablecoin'
  | 'AI'
  | 'RWA'
  | 'Gaming'
  | 'Social'
  | 'Privacy'
  | 'L1'
  | 'L2'
  | 'Interoperability'
  | 'Oracle'
  | 'Storage'
  | 'Unknown';
