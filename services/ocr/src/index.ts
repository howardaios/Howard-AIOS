export interface OcrWord { text: string; confidence: number; boundingBox: { x: number; y: number; width: number; height: number }; }
export interface OcrLine { text: string; words: OcrWord[]; confidence: number; }
export interface OcrBlock { text: string; lines: OcrLine[]; blockType: 'text'|'table'|'image'|'header'|'footer'; confidence: number; }
export interface OcrResult { text: string; blocks: OcrBlock[]; language: string; confidence: number; pageCount: number; metadata: Record<string, unknown>; }
export interface OcrProvider { name: string; recognize(input: OcrInput): Promise<OcrResult>; isAvailable(): Promise<boolean>; }
export interface OcrInput { fileUrl?: string; fileBuffer?: Buffer; mimeType: string; language?: string; }
export class MockOcrProvider implements OcrProvider {
  name = 'mock-ocr';
  async recognize(input: OcrInput): Promise<OcrResult> {
    return { text: 'Mock OCR result for testing.\nLine 2 of document.\nLine 3 with data.', blocks: [{ text: 'Mock OCR block', lines: [{ text: 'Mock line', words: [{ text: 'Mock', confidence: 0.95, boundingBox: { x: 0, y: 0, width: 50, height: 15 } }], confidence: 0.95 }], blockType: 'text', confidence: 0.95 }], language: input.language ?? 'en', confidence: 0.95, pageCount: 1, metadata: { provider: this.name, mimeType: input.mimeType, processedAt: new Date().toISOString() } };
  }
  async isAvailable() { return true; }
}
export class OcrService {
  private providers: Map<string, OcrProvider> = new Map();
  private defaultProvider: string;
  constructor(dp?: OcrProvider) { const m = dp ?? new MockOcrProvider(); this.providers.set(m.name, m); this.defaultProvider = m.name; }
  registerProvider(p: OcrProvider) { this.providers.set(p.name, p); }
  async recognize(input: OcrInput, pn?: string): Promise<OcrResult> {
    const n = pn ?? this.defaultProvider; const p = this.providers.get(n);
    if (!p) throw new Error('OCR provider not found: ' + n);
    if (!(await p.isAvailable())) throw new Error('OCR provider not available: ' + n);
    return p.recognize(input);
  }
  listProviders() { return Array.from(this.providers.keys()); }
}
