import { DocumentationAnalysis } from '../../domain/entities';
import { IDocumentationPort } from '../ports/IDocumentationPort';
import { AnthropicClient } from '../../ai/AnthropicClient';
import { DOCUMENTATION_ANALYSIS_PROMPT } from '../../ai/prompts';

export class DocumentationAnalysisService {
  constructor(
    private documentationPort: IDocumentationPort,
    private aiClient: AnthropicClient
  ) {}

  async analyze(docsUrl: string): Promise<DocumentationAnalysis> {
    const documentation = await this.documentationPort.fetchDocumentation(docsUrl);

    const prompt = DOCUMENTATION_ANALYSIS_PROMPT.replace(
      '{content}',
      this.truncateContent(documentation.content, 50000)
    );

    const result = await this.aiClient.analyze<DocumentationAnalysis>(prompt);

    return result;
  }

  async analyzeFromContent(content: string): Promise<DocumentationAnalysis> {
    const prompt = DOCUMENTATION_ANALYSIS_PROMPT.replace(
      '{content}',
      this.truncateContent(content, 50000)
    );

    return this.aiClient.analyze<DocumentationAnalysis>(prompt);
  }

  private truncateContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength) + '\n\n[Content truncated...]';
  }
}
