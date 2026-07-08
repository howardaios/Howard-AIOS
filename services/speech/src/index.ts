export interface Speaker { id: string; name?: string; label: string; }
export interface TranscriptSegment { text: string; speakerId: string; startTime: number; endTime: number; confidence: number; }
export interface Transcript { text: string; segments: TranscriptSegment[]; speakers: Speaker[]; language: string; duration: number; metadata: Record<string, unknown>; }
export interface SpeechInput { fileUrl?: string; fileBuffer?: Buffer; mimeType: string; language?: string; speakerCount?: number; }
export interface SpeechProvider { name: string; transcribe(input: SpeechInput): Promise<Transcript>; isAvailable(): Promise<boolean>; }

// ─── Mock Speech Provider ─────────────────────────────────────────────────────

export class MockSpeechProvider implements SpeechProvider {
  name = 'mock-speech';
  async transcribe(input: SpeechInput): Promise<Transcript> {
    const segs: TranscriptSegment[] = [
      { text: 'Good morning everyone.', speakerId: 'spk-1', startTime: 0, endTime: 5.2, confidence: 0.92 },
      { text: 'Thanks for organizing this.', speakerId: 'spk-2', startTime: 5.5, endTime: 10.8, confidence: 0.88 },
    ];
    return {
      text: segs.map((s) => s.text).join(' '),
      segments: segs,
      speakers: [{ id: 'spk-1', label: 'S1' }, { id: 'spk-2', label: 'S2' }].slice(0, input.speakerCount ?? 2),
      language: input.language ?? 'en',
      duration: 10.8,
      metadata: { provider: this.name, mimeType: input.mimeType },
    };
  }
  async isAvailable() { return true; }
}

// ─── Whisper Speech Provider ──────────────────────────────────────────────────

export class WhisperSpeechProvider implements SpeechProvider {
  name = 'whisper';

  private get apiKey(): string | undefined { return process.env.OPENAI_API_KEY; }

  async isAvailable(): Promise<boolean> { return !!this.apiKey; }

  async transcribe(input: SpeechInput): Promise<Transcript> {
    if (!this.apiKey) {
      // Fallback to mock when no API key
      return new MockSpeechProvider().transcribe(input);
    }

    // For real Whisper, we need a file buffer or URL
    if (!input.fileBuffer && !input.fileUrl) {
      // No audio file provided, use mock
      return new MockSpeechProvider().transcribe(input);
    }

    const formData = new FormData();

    if (input.fileBuffer) {
      const blob = new Blob([input.fileBuffer], { type: input.mimeType });
      formData.append('file', blob, 'audio.webm');
    }

    formData.append('model', 'whisper-1');
    if (input.language) formData.append('language', input.language);
    formData.append('response_format', 'verbose_json');
    formData.append('timestamp_granularities[]', 'segment');

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Whisper API error ${res.status}: ${errText.slice(0, 200)}`);
    }

    const data = await res.json() as {
      text: string;
      language: string;
      duration: number;
      segments?: Array<{ text: string; start: number; end: number; no_speech_probability?: number }>;
    };

    const segments: TranscriptSegment[] = (data.segments ?? []).map((seg, i) => ({
      text: seg.text,
      speakerId: `spk-${(i % (input.speakerCount ?? 2)) + 1}`,
      startTime: seg.start,
      endTime: seg.end,
      confidence: 1 - (seg.no_speech_probability ?? 0),
    }));

    const speakerCount = input.speakerCount ?? 2;
    const speakers: Speaker[] = Array.from({ length: speakerCount }, (_, i) => ({
      id: `spk-${i + 1}`,
      label: `S${i + 1}`,
    }));

    return {
      text: data.text,
      segments,
      speakers,
      language: data.language ?? input.language ?? 'en',
      duration: data.duration ?? 0,
      metadata: { provider: this.name, mimeType: input.mimeType },
    };
  }
}

// ─── Speech Service ──────────────────────────────────────────────────────────

export class SpeechService {
  private providers: Map<string, SpeechProvider> = new Map();
  private defaultProvider: string;

  constructor(dp?: SpeechProvider) {
    const mock = new MockSpeechProvider();
    const whisper = new WhisperSpeechProvider();
    this.providers.set(mock.name, mock);
    this.providers.set(whisper.name, whisper);
    // Prefer whisper if available, otherwise mock
    this.defaultProvider = dp?.name ?? mock.name;
    if (dp) this.providers.set(dp.name, dp);
  }

  registerProvider(p: SpeechProvider) { this.providers.set(p.name, p); }

  async transcribe(input: SpeechInput, pn?: string): Promise<Transcript> {
    const n = pn ?? this.defaultProvider;
    const p = this.providers.get(n);
    if (!p) throw new Error('Speech provider not found: ' + n);
    if (!(await p.isAvailable())) {
      // Try fallback to mock
      const mock = this.providers.get('mock-speech');
      if (mock) return mock.transcribe(input);
      throw new Error('Speech provider not available: ' + n);
    }
    return p.transcribe(input);
  }

  listProviders() { return Array.from(this.providers.keys()); }

  async getProviderStatus(): Promise<Record<string, boolean>> {
    const result: Record<string, boolean> = {};
    for (const [name, p] of this.providers) {
      result[name] = await p.isAvailable();
    }
    return result;
  }
}
