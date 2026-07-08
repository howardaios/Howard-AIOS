import { randomUUID } from 'node:crypto';

// ─── Recording Types ─────────────────────────────────────────────────────────

export type RecordingStatus = 'UPLOADED' | 'TRANSCRIBING' | 'TRANSCRIBED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface Recording {
  id: string;
  meetingId: string;
  title: string;
  fileUrl?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  duration?: number;
  speakerCount?: number;
  language?: string;
  transcript?: string;
  transcriptJson?: unknown;
  status: RecordingStatus;
  metadata?: Record<string, unknown>;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRecordingInput {
  meetingId: string;
  title: string;
  fileUrl?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  duration?: number;
  speakerCount?: number;
  language?: string;
}

export interface UploadProgress {
  recordingId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'transcribing' | 'processing' | 'completed' | 'failed';
  error?: string;
}

// ─── Recording Service (In-memory for demo) ──────────────────────────────────

export class RecordingService {
  private store = new Map<string, Recording>();
  private progressStore = new Map<string, UploadProgress>();

  async create(orgId: string, input: CreateRecordingInput): Promise<Recording> {
    const now = new Date();
    const recording: Recording = {
      id: randomUUID(),
      meetingId: input.meetingId,
      title: input.title,
      fileUrl: input.fileUrl,
      fileName: input.fileName,
      mimeType: input.mimeType,
      fileSize: input.fileSize,
      duration: input.duration,
      speakerCount: input.speakerCount,
      language: input.language ?? 'en',
      status: 'UPLOADED',
      metadata: {},
      organizationId: orgId,
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(recording.id, recording);

    // Track upload progress
    this.progressStore.set(recording.id, {
      recordingId: recording.id,
      fileName: input.fileName ?? input.title,
      progress: 100,
      status: 'completed',
    });

    return recording;
  }

  async findById(id: string): Promise<Recording | null> {
    return this.store.get(id) ?? null;
  }

  async findByMeetingId(meetingId: string): Promise<Recording[]> {
    return Array.from(this.store.values()).filter(r => r.meetingId === meetingId);
  }

  async listByOrg(orgId: string): Promise<Recording[]> {
    return Array.from(this.store.values()).filter(r => r.organizationId === orgId);
  }

  async updateTranscript(id: string, transcript: string, transcriptJson?: unknown): Promise<Recording | null> {
    const recording = this.store.get(id);
    if (!recording) return null;
    recording.transcript = transcript;
    recording.transcriptJson = transcriptJson;
    recording.status = 'TRANSCRIBED';
    recording.updatedAt = new Date();
    return recording;
  }

  async updateStatus(id: string, status: RecordingStatus): Promise<Recording | null> {
    const recording = this.store.get(id);
    if (!recording) return null;
    recording.status = status;
    recording.updatedAt = new Date();
    return recording;
  }

  async delete(id: string): Promise<boolean> {
    this.progressStore.delete(id);
    return this.store.delete(id);
  }

  getProgress(id: string): UploadProgress | null {
    return this.progressStore.get(id) ?? null;
  }

  /**
   * Simulate upload for demo purposes.
   */
  async simulateUpload(orgId: string, meetingId: string, fileName: string, mimeType: string, duration: number): Promise<Recording> {
    const fileSize = Math.ceil(duration * 16000); // ~16KB per second for audio
    return this.create(orgId, {
      meetingId,
      title: fileName.replace(/\.[^.]+$/, ''),
      fileName,
      mimeType,
      fileSize,
      duration,
      speakerCount: 2,
      language: 'en',
      fileUrl: `/mock-recordings/${fileName}`,
    });
  }
}
