import type { Parser, ParserInput, ParseResult, ParsedEntity, ParsedRelation } from './parser';
export class DefaultParser implements Parser {
  readonly name = 'default';
  readonly supportedSources = ['MANUAL', 'API', 'WEBHOOK'];
  async parse(input: ParserInput): Promise<ParseResult> {
    const start = Date.now(); const content = input.rawContent;
    const entities: ParsedEntity[] = [];
    const dateRegex = /\d{4}[-/]\d{1,2}[-/]\d{1,2}/g; let m;
    while ((m = dateRegex.exec(content)) !== null) entities.push({ type: 'date', text: m[0], value: m[0], confidence: 0.9, position: [m.index, m.index + m[0].length] });
    const emailRegex = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
    while ((m = emailRegex.exec(content)) !== null) entities.push({ type: 'email', text: m[0], value: m[0].toLowerCase(), confidence: 0.95, position: [m.index, m.index + m[0].length] });
    const urlRegex = /https?:\/\/[^\s<>"]+/g;
    while ((m = urlRegex.exec(content)) !== null) entities.push({ type: 'url', text: m[0], value: m[0], confidence: 0.95, position: [m.index, m.index + m[0].length] });
    const ch = (content.match(/[\u4e00-\u9fff]/g) ?? []).length; const tot = content.replace(/\s/g, '').length;
    return { content, confidence: 0.85, language: tot > 0 && ch / tot > 0.3 ? 'zh' : 'en', entities, relations: [], metadata: { parser: this.name, version: '1.0.0', processingTimeMs: Date.now() - start } };
  }
}
export class ParserRegistry {
  private parsers: Map<string, Parser> = new Map(); private sourceMap: Map<string, string> = new Map();
  constructor() { this.register(new DefaultParser()); }
  register(p: Parser) { this.parsers.set(p.name, p); for (const s of p.supportedSources) this.sourceMap.set(s, p.name); }
  unregister(name: string) { const p = this.parsers.get(name); if (!p) return false; this.parsers.delete(name); for (const [s, n] of this.sourceMap) if (n === name) this.sourceMap.delete(s); return true; }
  getParser(name: string) { return this.parsers.get(name); }
  getParserForSource(sourceType: string) { const n = this.sourceMap.get(sourceType); return n ? this.parsers.get(n) : this.parsers.get('default'); }
  listParsers() { return Array.from(this.parsers.keys()); }
}
export class ParserFactory {
  private registry: ParserRegistry;
  constructor(r?: ParserRegistry) { this.registry = r ?? new ParserRegistry(); }
  create(sourceType: string): Parser { const p = this.registry.getParserForSource(sourceType); if (!p) { const fb = this.registry.getParser('default'); if (!fb) throw new Error('No parser for: ' + sourceType); return fb; } return p; }
  getRegistry() { return this.registry; }
}
export interface PipelineStep { name: string; process(result: ParseResult, input: ParserInput): Promise<ParseResult>; }
export class ParserPipeline {
  private factory: ParserFactory; private steps: PipelineStep[] = [];
  constructor(f?: ParserFactory) { this.factory = f ?? new ParserFactory(); }
  addStep(s: PipelineStep) { this.steps.push(s); }
  async process(input: ParserInput): Promise<ParseResult> { let r = await this.factory.create(input.sourceType).parse(input); for (const s of this.steps) r = await s.process(r, input); return r; }
}
export class MetadataEnrichmentStep implements PipelineStep {
  name = 'metadata-enrichment';
  async process(result: ParseResult, input: ParserInput): Promise<ParseResult> { return { ...result, metadata: { ...result.metadata, raw: { ...result.metadata.raw, sourceType: input.sourceType, pipelineProcessedAt: new Date().toISOString() } } }; }
}
export class ConfidenceNormalizationStep implements PipelineStep {
  name = 'confidence-normalization';
  async process(result: ParseResult): Promise<ParseResult> {
    const entities: ParsedEntity[] = result.entities.map(e => ({ ...e, confidence: Math.min(1, Math.max(0, e.confidence)) }));
    const relations: ParsedRelation[] = result.relations.map(r => ({ ...r, confidence: Math.min(1, Math.max(0, r.confidence)) }));
    return { ...result, confidence: Math.min(1, Math.max(0, result.confidence)), entities, relations };
  }
}
