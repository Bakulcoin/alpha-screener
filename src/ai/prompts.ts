export const DOCUMENTATION_ANALYSIS_PROMPT = `You are an expert crypto/Web3 analyst. Analyze the following project documentation and provide a structured assessment.

DOCUMENTATION CONTENT:
{content}

Analyze and return a JSON object with the following structure:
{
  "narrative": "Infrastructure|DeFi|Modular|Stablecoin|AI|RWA|Gaming|Social|Privacy|L1|L2|Interoperability|Oracle|Storage|Unknown",
  "writingQuality": {
    "contextConsistency": 0-100,
    "logicalFlow": 0-100,
    "marketingLanguageDensity": 0-100,
    "aiWritingSignals": {
      "emojiOveruse": true|false,
      "longDashUsage": number,
      "repetitivePhrases": ["phrase1", "phrase2"],
      "genericPhraseCount": number
    },
    "humanVsAIScore": 0-100 (100 = definitely human)
  },
  "hasFundingSignal": true|false,
  "fundingSignals": ["signal1", "signal2"],
  "summary": "2-3 sentence summary of the project"
}

Look for funding signals such as:
- Mentions of investors, VCs, or funding rounds
- References to "backed by", "raised", "Series A/B/C", "seed round"
- Investor logos or partnership announcements with investment firms
- Token sale or ICO references

Be decisive. Return only valid JSON.`;

export const TEAM_ANALYSIS_PROMPT = `Analyze the following team information for a crypto/Web3 project.

PROJECT: {projectName}
TEAM DATA:
{teamData}

Return a JSON object:
{
  "members": [
    {
      "name": "string",
      "role": "string",
      "previousProjects": ["project1", "project2"]
    }
  ],
  "builderPortfolioStrength": 0-100,
  "previousOutcomes": ["outcome1", "outcome2"],
  "yearsInCrypto": number,
  "skillsetAlignment": 0-100
}

Be decisive. Return only valid JSON.`;

export const CODE_ANALYSIS_PROMPT = `Analyze the following repository data for a crypto/Web3 project.

REPOSITORY DATA:
{repoData}

Return a JSON object:
{
  "commitFrequency": number (commits per week average),
  "commitConsistency": 0-100,
  "prefersManySmallCommits": true|false,
  "activityLevel": "High|Medium|Low|Inactive",
  "contributorDiversity": 0-100,
  "architectureClarity": 0-100,
  "mechanismOriginality": "Common|Iterative|Pioneering",
  "similarProjectsCount": number,
  "assessment": "1-2 sentence technical assessment"
}

Be decisive. Return only valid JSON.`;

export const MARKET_ANALYSIS_PROMPT = `Analyze the market opportunity for this crypto/Web3 project.

PROJECT: {projectName}
NARRATIVE: {narrative}
MARKET DATA:
{marketData}

KNOWN COMPETITORS IN SPACE:
{competitors}

Return a JSON object:
{
  "problemType": "Niche|Broad",
  "competitors": [
    {
      "name": "string",
      "marketCap": number|null,
      "similarity": 0-100
    }
  ],
  "differentiationClarity": 0-100,
  "marketSaturation": 0-100,
  "narrativeCycleTiming": "Early|Mid|Late|Post-Peak",
  "assessment": "1-2 sentence market assessment"
}

Be decisive. Return only valid JSON.`;

export const FINAL_RATING_PROMPT = `Generate a final rating for this crypto/Web3 project based on all analyses.

PROJECT: {projectName}

DOCUMENTATION ANALYSIS:
{documentationAnalysis}

FUNDING ANALYSIS:
{fundingAnalysis}

MARKET ANALYSIS:
{marketAnalysis}

TEAM ANALYSIS:
{teamAnalysis}

CODE ANALYSIS:
{codeAnalysis}

Generate a decisive final rating. Return a JSON object:
{
  "consistencyScore": 0-100,
  "opportunityScore": 0-100,
  "executionCredibilityScore": 0-100,
  "finalGrade": "A|B|C|D",
  "strengths": ["strength1", "strength2", "strength3"],
  "risks": ["risk1", "risk2", "risk3"],
  "redFlags": ["flag1", "flag2"] or [],
  "asymmetricUpside": "1-2 sentence description of potential upside",
  "executiveSummary": "3-4 sentence executive summary"
}

Grading criteria:
- A: Exceptional project with strong fundamentals across all dimensions
- B: Good project with minor weaknesses
- C: Average project with notable concerns
- D: Weak project with significant red flags

Be decisive. Return only valid JSON.`;
