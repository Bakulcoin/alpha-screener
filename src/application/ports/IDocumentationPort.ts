export interface DocumentationContent {
  url: string;
  title: string;
  content: string;
  sections: DocumentationSection[];
  fetchedAt: Date;
}

export interface DocumentationSection {
  heading: string;
  content: string;
  level: number;
}

export interface IDocumentationPort {
  fetchDocumentation(url: string): Promise<DocumentationContent>;
  fetchWebsiteContent(url: string): Promise<string>;
}
