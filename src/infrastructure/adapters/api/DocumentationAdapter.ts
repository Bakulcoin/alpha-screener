import axios from 'axios';
import {
  IDocumentationPort,
  DocumentationContent,
  DocumentationSection,
} from '../../../application/ports/IDocumentationPort';

export class DocumentationAdapter implements IDocumentationPort {
  async fetchDocumentation(url: string): Promise<DocumentationContent> {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Alpha-Screener/1.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 30000,
    });

    const html = response.data;
    const content = this.stripHtml(html);
    const sections = this.extractSections(html);
    const title = this.extractTitle(html);

    return {
      url,
      title,
      content,
      sections,
      fetchedAt: new Date(),
    };
  }

  async fetchWebsiteContent(url: string): Promise<string> {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Alpha-Screener/1.0',
      },
      timeout: 30000,
    });

    return this.stripHtml(response.data);
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractTitle(html: string): string {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return titleMatch ? titleMatch[1].trim() : 'Unknown';
  }

  private extractSections(html: string): DocumentationSection[] {
    const sections: DocumentationSection[] = [];
    const headingRegex = /<h([1-6])[^>]*>([^<]+)<\/h[1-6]>/gi;

    let match;
    while ((match = headingRegex.exec(html)) !== null) {
      sections.push({
        heading: this.stripHtml(match[2]),
        content: '',
        level: parseInt(match[1]),
      });
    }

    return sections;
  }
}
