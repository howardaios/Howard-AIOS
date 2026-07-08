import type { FastifyPluginAsync } from 'fastify';
import { OcrService } from '@howard-aios/ocr';
import { SpeechService } from '@howard-aios/speech';
const ocrSvc = new OcrService();
const speechSvc = new SpeechService();
export const processingRoutes: FastifyPluginAsync = async (app) => {
  app.post('/ocr/recognize', { schema: { description: 'OCR recognize', tags: ['OCR'] } }, async (req, reply) => {
    const b = req.body as { fileUrl?: string; mimeType: string; language?: string };
    const r = await ocrSvc.recognize({ fileUrl: b.fileUrl, mimeType: b.mimeType ?? 'image/png', language: b.language });
    return reply.send({ success: true, code: 200, message: 'OCR done', data: r });
  });
  app.get('/ocr/providers', { schema: { description: 'List OCR providers', tags: ['OCR'] } }, async (_req, reply) => {
    return reply.send({ success: true, code: 200, message: 'OK', data: ocrSvc.listProviders() });
  });
  app.post('/speech/transcribe', { schema: { description: 'Speech transcribe', tags: ['Speech'] } }, async (req, reply) => {
    const b = req.body as { fileUrl?: string; mimeType: string; language?: string; speakerCount?: number };
    const r = await speechSvc.transcribe({ fileUrl: b.fileUrl, mimeType: b.mimeType ?? 'audio/mpeg', language: b.language, speakerCount: b.speakerCount });
    return reply.send({ success: true, code: 200, message: 'Done', data: r });
  });
  app.get('/speech/providers', { schema: { description: 'List speech providers', tags: ['Speech'] } }, async (_req, reply) => {
    return reply.send({ success: true, code: 200, message: 'OK', data: speechSvc.listProviders() });
  });
};
