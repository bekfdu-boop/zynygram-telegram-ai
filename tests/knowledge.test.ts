import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import { MarkdownKnowledgeRetriever } from '../src/ai/knowledge';

describe('Knowledge Base & Retrieval', () => {
  let retriever: MarkdownKnowledgeRetriever;

  beforeAll(async () => {
    const knowledgeDir = path.resolve(__dirname, '../knowledge');
    retriever = new MarkdownKnowledgeRetriever(knowledgeDir);
    await retriever.loadKnowledgeBase();
  });

  it('should successfully parse markdown documents into sections', () => {
    // Search for general social network information
    const results = retriever.searchKnowledge('Zynygram');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].section.content).toContain('Zynygram');
  });

  it('should find verification guidelines when queried about verification badge', () => {
    const results = retriever.searchKnowledge('tasdiqlash belgisi verification');
    expect(results.length).toBeGreaterThan(0);
    const topResult = results[0];
    expect(topResult.section.sourceFile).toBe('verification.md');
    expect(topResult.section.content).toContain('Zynygram_media');
  });

  it('should find payment guidance when queried about billing or cards', () => {
    const results = retriever.searchKnowledge('to‘lov tolov payment card');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.section.sourceFile === 'payments.md')).toBe(true);
  });

  it('should format relevant context as markdown within character limits', () => {
    const context = retriever.getRelevantContext('AI rasm va video generatsiya', 1000);
    expect(context).toContain('### [');
    expect(context.length).toBeLessThanOrEqual(1000);
  });

  it('should return empty context for non-matching gibberish', () => {
    const context = retriever.getRelevantContext('xyz123987nonexistentterm');
    expect(context).toBe('');
  });
});

