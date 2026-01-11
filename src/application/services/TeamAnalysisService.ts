import { TeamAnalysis } from '../../domain/entities';
import { AnthropicClient } from '../../ai/AnthropicClient';
import { TEAM_ANALYSIS_PROMPT } from '../../ai/prompts';

export interface TeamDataSource {
  members: Array<{
    name: string;
    role?: string;
    linkedIn?: string;
    twitter?: string;
    bio?: string;
  }>;
  source: string;
}

export class TeamAnalysisService {
  constructor(private aiClient: AnthropicClient) {}

  async analyze(
    projectName: string,
    teamData: TeamDataSource
  ): Promise<TeamAnalysis> {
    const prompt = TEAM_ANALYSIS_PROMPT
      .replace('{projectName}', projectName)
      .replace('{teamData}', JSON.stringify(teamData, null, 2));

    const result = await this.aiClient.analyze<TeamAnalysis>(prompt);

    return {
      members: result.members.map((m) => ({
        name: m.name,
        role: m.role,
        linkedIn: teamData.members.find((tm) => tm.name === m.name)?.linkedIn,
        twitter: teamData.members.find((tm) => tm.name === m.name)?.twitter,
        previousProjects: m.previousProjects,
      })),
      builderPortfolioStrength: result.builderPortfolioStrength,
      previousOutcomes: result.previousOutcomes,
      yearsInCrypto: result.yearsInCrypto,
      skillsetAlignment: result.skillsetAlignment,
    };
  }

  async analyzeFromDocumentation(
    projectName: string,
    documentationContent: string
  ): Promise<TeamAnalysis> {
    const extractPrompt = `Extract team member information from this documentation.

PROJECT: ${projectName}

DOCUMENTATION:
${documentationContent.substring(0, 20000)}

Return a JSON array of team members found:
{
  "members": [
    {
      "name": "string",
      "role": "string or null",
      "bio": "string or null"
    }
  ]
}

If no team information is found, return {"members": []}`;

    const extracted = await this.aiClient.analyze<{ members: TeamDataSource['members'] }>(
      extractPrompt
    );

    if (extracted.members.length === 0) {
      return {
        members: [],
        builderPortfolioStrength: 0,
        previousOutcomes: [],
        yearsInCrypto: 0,
        skillsetAlignment: 0,
      };
    }

    return this.analyze(projectName, { members: extracted.members, source: 'documentation' });
  }
}
