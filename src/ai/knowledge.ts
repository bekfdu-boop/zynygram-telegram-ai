import fs from 'fs';
import path from 'path';
import logger from '../utils/logger';

export interface KnowledgeSection {
  id: string;
  sourceFile: string;
  topic: string;
  subheading: string;
  content: string;
  keywords: string[];
}

export interface SearchResult {
  section: KnowledgeSection;
  score: number;
}

export interface IKnowledgeRetriever {
  loadKnowledgeBase(): Promise<void>;
  searchKnowledge(query: string, limit?: number): SearchResult[];
  getRelevantContext(query: string, maxChars?: number): string;
}

export class MarkdownKnowledgeRetriever implements IKnowledgeRetriever {
  private sections: KnowledgeSection[] = [];
  private knowledgeDir: string;
  private isLoaded = false;

  constructor(knowledgeDir?: string) {
    this.knowledgeDir =
      knowledgeDir || path.resolve(process.cwd(), 'knowledge');
  }

  /**
   * Loads and parses all markdown files in the knowledge directory into structured sections
   */
  public async loadKnowledgeBase(): Promise<void> {
    try {
      if (!fs.existsSync(this.knowledgeDir)) {
        logger.warn({ dir: this.knowledgeDir }, 'Knowledge directory not found, skipping knowledge base loading');
        this.sections = [];
        this.isLoaded = true;
        return;
      }

      const files = fs
        .readdirSync(this.knowledgeDir)
        .filter((file) => file.endsWith('.md'));

      const loadedSections: KnowledgeSection[] = [];

      for (const file of files) {
        const filePath = path.join(this.knowledgeDir, file);
        const rawContent = fs.readFileSync(filePath, 'utf-8');
        const parsed = this.parseMarkdown(file, rawContent);
        loadedSections.push(...parsed);
      }

      this.sections = loadedSections;
      this.isLoaded = true;
      logger.info(
        { fileCount: files.length, sectionCount: this.sections.length },
        'Knowledge base successfully loaded',
      );
    } catch (error) {
      logger.error({ error }, 'Failed to load knowledge base');
      throw error;
    }
  }

  /**
   * Parses markdown content by `#` and `##` headings
   */
  private parseMarkdown(fileName: string, content: string): KnowledgeSection[] {
    const lines = content.split(/\r?\n/);
    const sections: KnowledgeSection[] = [];

    let currentTopic = fileName.replace('.md', '');
    let currentSubheading = 'Overview';
    let currentContentLines: string[] = [];

    const saveCurrentSection = () => {
      const sectionText = currentContentLines.join('\n').trim();
      if (sectionText.length > 0) {
        const fullText = `${currentTopic} ${currentSubheading} ${sectionText}`;
        sections.push({
          id: `${fileName}#${sections.length + 1}`,
          sourceFile: fileName,
          topic: currentTopic,
          subheading: currentSubheading,
          content: sectionText,
          keywords: this.extractKeywords(fullText),
        });
      }
      currentContentLines = [];
    };

    for (const line of lines) {
      if (line.startsWith('# ')) {
        saveCurrentSection();
        currentTopic = line.replace('# ', '').trim();
        currentSubheading = 'Overview';
      } else if (line.startsWith('## ')) {
        saveCurrentSection();
        currentSubheading = line.replace('## ', '').trim();
      } else {
        currentContentLines.push(line);
      }
    }

    saveCurrentSection();
    return sections;
  }

  /**
   * Tokenizes and extracts keywords from text
   */
  private extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((word) => word.length >= 2);
  }

  /**
   * Searches loaded sections using term-frequency and phrase matching
   */
  public searchKnowledge(query: string, limit = 4): SearchResult[] {
    if (!this.isLoaded) {
      logger.warn('Search attempted before knowledge base was loaded');
    }

    const queryTokens = this.extractKeywords(query);
    if (queryTokens.length === 0) {
      return [];
    }

    const queryLower = query.toLowerCase().trim();
    const scored: SearchResult[] = [];

    for (const section of this.sections) {
      let score = 0;
      const topicLower = section.topic.toLowerCase();
      const subheadingLower = section.subheading.toLowerCase();
      const contentLower = section.content.toLowerCase();

      // Bonus for exact query substring
      if (contentLower.includes(queryLower)) {
        score += 15;
      }
      if (subheadingLower.includes(queryLower) || topicLower.includes(queryLower)) {
        score += 25;
      }

      // Keyword token scoring
      for (const token of queryTokens) {
        if (topicLower.includes(token)) {
          score += 6;
        }
        if (subheadingLower.includes(token)) {
          score += 5;
        }
        const matchesInContent = (contentLower.match(new RegExp(`\\b${token}\\b`, 'g')) || []).length;
        score += Math.min(matchesInContent * 2, 8);
      }

      if (score > 0) {
        scored.push({ section, score });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  }

  /**
   * Retrieves relevant sections joined into a Markdown context string
   */
  public getRelevantContext(query: string, maxChars = 2500): string {
    const results = this.searchKnowledge(query, 5);
    if (results.length === 0) {
      return '';
    }

    const contextParts: string[] = [];
    let currentLength = 0;

    for (const { section } of results) {
      const formatted = `### [${section.topic}] ${section.subheading}\n${section.content}\n`;
      if (currentLength + formatted.length > maxChars) {
        break;
      }
      contextParts.push(formatted);
      currentLength += formatted.length;
    }

    return contextParts.join('\n');
  }
}

// Export singleton instance and convenience functions
export const defaultKnowledgeRetriever = new MarkdownKnowledgeRetriever();

export async function loadKnowledgeBase(): Promise<void> {
  await defaultKnowledgeRetriever.loadKnowledgeBase();
}

export function searchKnowledge(query: string, limit?: number): SearchResult[] {
  return defaultKnowledgeRetriever.searchKnowledge(query, limit);
}

export function getRelevantContext(query: string, maxChars?: number): string {
  return defaultKnowledgeRetriever.getRelevantContext(query, maxChars);
}

