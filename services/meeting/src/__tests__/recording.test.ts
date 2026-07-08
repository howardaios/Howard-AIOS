import { describe, it, expect, beforeEach } from 'vitest';
import { RecordingService } from '../recording';

describe('RecordingService', () => {
  let svc: RecordingService;
  const ORG = '10000000-0000-0000-0000-000000000001';
  const MEETING_ID = '00000000-0000-0000-0000-000000000099';

  beforeEach(() => { svc = new RecordingService(); });

  it('creates a recording', async () => {
    const rec = await svc.create(ORG, {
      meetingId: MEETING_ID,
      title: 'Test Recording',
      fileName: 'test.mp3',
      mimeType: 'audio/mpeg',
      duration: 120,
      speakerCount: 2,
      language: 'en',
    });
    expect(rec.id).toBeTruthy();
    expect(rec.title).toBe('Test Recording');
    expect(rec.status).toBe('UPLOADED');
    expect(rec.organizationId).toBe(ORG);
  });

  it('findById returns recording', async () => {
    const rec = await svc.create(ORG, { meetingId: MEETING_ID, title: 'Find Me' });
    const found = await svc.findById(rec.id);
    expect(found).not.toBeNull();
    expect(found!.title).toBe('Find Me');
  });

  it('findById returns null for unknown id', async () => {
    const found = await svc.findById('nonexistent');
    expect(found).toBeNull();
  });

  it('findByMeetingId returns recordings for meeting', async () => {
    await svc.create(ORG, { meetingId: MEETING_ID, title: 'R1' });
    await svc.create(ORG, { meetingId: MEETING_ID, title: 'R2' });
    await svc.create(ORG, { meetingId: 'other-meeting', title: 'R3' });
    const recordings = await svc.findByMeetingId(MEETING_ID);
    expect(recordings).toHaveLength(2);
  });

  it('listByOrg filters by organization', async () => {
    await svc.create(ORG, { meetingId: MEETING_ID, title: 'Org1' });
    await svc.create('other-org', { meetingId: MEETING_ID, title: 'Org2' });
    const recordings = await svc.listByOrg(ORG);
    expect(recordings).toHaveLength(1);
  });

  it('updateTranscript updates transcript and status', async () => {
    const rec = await svc.create(ORG, { meetingId: MEETING_ID, title: 'Transcribe' });
    const updated = await svc.updateTranscript(rec.id, 'Hello world transcript', { segments: [] });
    expect(updated).not.toBeNull();
    expect(updated!.transcript).toBe('Hello world transcript');
    expect(updated!.status).toBe('TRANSCRIBED');
  });

  it('updateStatus changes status', async () => {
    const rec = await svc.create(ORG, { meetingId: MEETING_ID, title: 'Status' });
    const updated = await svc.updateStatus(rec.id, 'TRANSCRIBING');
    expect(updated!.status).toBe('TRANSCRIBING');
  });

  it('delete removes recording', async () => {
    const rec = await svc.create(ORG, { meetingId: MEETING_ID, title: 'Delete Me' });
    const result = await svc.delete(rec.id);
    expect(result).toBe(true);
    const found = await svc.findById(rec.id);
    expect(found).toBeNull();
  });

  it('getProgress returns upload progress', async () => {
    const rec = await svc.create(ORG, { meetingId: MEETING_ID, title: 'Progress', fileName: 'test.mp3' });
    const progress = svc.getProgress(rec.id);
    expect(progress).not.toBeNull();
    expect(progress!.status).toBe('completed');
    expect(progress!.progress).toBe(100);
  });

  it('simulateUpload creates recording with mock data', async () => {
    const rec = await svc.simulateUpload(ORG, MEETING_ID, 'meeting.mp3', 'audio/mpeg', 300);
    expect(rec.duration).toBe(300);
    expect(rec.speakerCount).toBe(2);
    expect(rec.fileUrl).toContain('meeting.mp3');
    expect(rec.fileSize).toBeGreaterThan(0);
  });
});
