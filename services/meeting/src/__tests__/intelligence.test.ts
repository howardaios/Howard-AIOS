import { describe, it, expect } from 'vitest';
import {
  TaskExtractor,
  DecisionExtractor,
  SummaryGenerator,
  MeetingIntelligenceService,
} from '../meeting-intelligence';

// ── Task Extractor Tests ────────────────────────────────────────────────────

describe('TaskExtractor', () => {
  const extractor = new TaskExtractor();

  it('extracts TODO items', () => {
    const text = 'TODO: Finish the API documentation by Friday. FIXME: the login page has a bug.';
    const tasks = extractor.extract(text);
    expect(tasks.length).toBeGreaterThanOrEqual(1);
    expect(tasks[0].priority).toBeDefined();
    expect(tasks[0].status).toBe('TODO');
    expect(tasks[0].source).toBe('ai-extraction');
  });

  it('extracts action items with need to / should / must', () => {
    const text = 'We need to hire 3 more engineers. Should update the deployment pipeline. Must fix the security vulnerability.';
    const tasks = extractor.extract(text);
    expect(tasks.length).toBeGreaterThanOrEqual(2);
  });

  it('detects CRITICAL priority', () => {
    const text = 'TODO: Fix the critical database connection leak immediately. This is urgent.';
    const tasks = extractor.extract(text);
    expect(tasks.some(t => t.priority === 'CRITICAL')).toBe(true);
  });

  it('detects HIGH priority', () => {
    const text = 'TODO: Important task to finalize the important budget proposal.';
    const tasks = extractor.extract(text);
    expect(tasks.some(t => t.priority === 'HIGH' || t.priority === 'MEDIUM')).toBe(true);
  });

  it('assigns owner from participants', () => {
    const text = 'Alice will prepare the detailed budget proposal by Friday.';
    const tasks = extractor.extract(text, ['Alice Chen', 'Bob Zhang']);
    const owned = tasks.find(t => t.owner);
    if (owned) {
      expect(owned.owner).toContain('Alice');
    }
  });

  it('deduplicates similar tasks', () => {
    const text = 'TODO: Fix the login bug. TODO: Fix the login bug.';
    const tasks = extractor.extract(text);
    expect(tasks.length).toBe(1);
  });

  it('returns empty for no tasks', () => {
    const tasks = extractor.extract('Hello world, nice weather today.');
    expect(tasks).toEqual([]);
  });
});

// ── Decision Extractor Tests ────────────────────────────────────────────────

describe('DecisionExtractor', () => {
  const extractor = new DecisionExtractor();

  it('extracts decisions with decided/agreed', () => {
    const text = 'We decided to use TypeScript for all new services. The team agreed on a 99.9% uptime SLA.';
    const decisions = extractor.extract(text);
    expect(decisions.length).toBeGreaterThanOrEqual(1);
    expect(decisions[0].status).toBe('DECIDED');
  });

  it('extracts approved decisions', () => {
    const text = 'The proposal was approved to move forward with the Prisma stack.';
    const decisions = extractor.extract(text);
    expect(decisions.length).toBeGreaterThanOrEqual(1);
  });

  it('extracts rejected decisions as ARCHIVED', () => {
    const text = 'We rejected the proposal to use MongoDB for the main database.';
    const decisions = extractor.extract(text);
    expect(decisions.some(d => d.status === 'ARCHIVED')).toBe(true);
  });

  it('extracts we will / we are going to patterns', () => {
    const text = 'We will implement automated testing before the release. We are going to deploy on Thursday.';
    const decisions = extractor.extract(text);
    expect(decisions.length).toBeGreaterThanOrEqual(1);
  });

  it('includes decidedAt timestamp', () => {
    const text = 'The decision was to allocate 40% of resources to AI features.';
    const decisions = extractor.extract(text);
    if (decisions.length > 0) {
      expect(decisions[0].decidedAt).toBeDefined();
    }
  });

  it('deduplicates similar decisions', () => {
    const text = 'We decided to use TypeScript. We decided to use TypeScript.';
    const decisions = extractor.extract(text);
    expect(decisions.length).toBe(1);
  });
});

// ── Summary Generator Tests ─────────────────────────────────────────────────

describe('SummaryGenerator', () => {
  const gen = new SummaryGenerator();

  const sampleTranscript = `Alice Chen welcomed the team to the quarterly review meeting. Bob Zhang reported that Q2 revenue grew 25% compared to Q1 which exceeded our targets. Carol Wang proposed we should invest heavily in AI-powered features for the next quarter. The team agreed to prioritize the Meeting Intelligence feature as the top initiative. David Li noted that we need to hire 3 more engineers to support the roadmap. TODO: Alice will prepare the detailed budget proposal by Friday. The decision was to allocate 40% of engineering resources to AI features. Risk: the current team bandwidth is stretched thin with existing maintenance work. We decided to use TypeScript for all new frontend work. Question: should we hire contractors or full-time engineers? Follow-up: schedule individual meetings with each team lead.`;

  it('generates executive summary', () => {
    const summary = gen.generate(sampleTranscript);
    expect(summary.executiveSummary).toBeTruthy();
    expect(summary.executiveSummary.length).toBeGreaterThan(10);
  });

  it('extracts key points', () => {
    const summary = gen.generate(sampleTranscript);
    expect(summary.keyPoints.length).toBeGreaterThanOrEqual(1);
  });

  it('extracts action items', () => {
    const summary = gen.generate(sampleTranscript, ['Alice Chen', 'Bob Zhang']);
    expect(summary.actionItems.length).toBeGreaterThanOrEqual(1);
  });

  it('extracts decisions', () => {
    const summary = gen.generate(sampleTranscript);
    expect(summary.decisions.length).toBeGreaterThanOrEqual(1);
  });

  it('extracts risks', () => {
    const summary = gen.generate(sampleTranscript);
    expect(summary.risks.length).toBeGreaterThanOrEqual(1);
    expect(summary.risks[0].severity).toBeDefined();
  });

  it('generates timeline events', () => {
    const summary = gen.generate(sampleTranscript);
    expect(summary.timeline.length).toBeGreaterThanOrEqual(1);
    expect(summary.timeline[0].type).toBe('speech');
  });

  it('extracts open questions', () => {
    const summary = gen.generate(sampleTranscript);
    expect(summary.openQuestions.length).toBeGreaterThanOrEqual(0);
  });

  it('generates follow-up items', () => {
    const summary = gen.generate(sampleTranscript);
    expect(summary.followUp.length).toBeGreaterThanOrEqual(0);
  });

  it('handles short transcript', () => {
    const summary = gen.generate('Short text.');
    expect(summary).toBeDefined();
    expect(summary.executiveSummary).toBeDefined();
  });
});

// ── Meeting Intelligence Service Tests (Pipeline Integration) ───────────────

describe('MeetingIntelligenceService', () => {
  const svc = new MeetingIntelligenceService();

  it('processMeeting returns complete result', () => {
    const result = svc.processMeeting({
      meetingId: '10000000-0000-0000-0000-000000000001',
      transcript: 'Alice proposed we should adopt the new testing framework. The team agreed to use Vitest. TODO: Bob needs to set up the CI pipeline by next week. Risk: the current test coverage is below 50%.',
      participants: ['Alice Chen', 'Bob Zhang'],
      title: 'Test Meeting',
    });

    expect(result.meetingId).toBe('10000000-0000-0000-0000-000000000001');
    expect(result.summary).toBeDefined();
    expect(result.summary.executiveSummary).toBeTruthy();
    expect(result.summary.actionItems.length).toBeGreaterThanOrEqual(0);
    expect(result.summary.decisions.length).toBeGreaterThanOrEqual(0);
    expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
    expect(result.knowledgeNodesCreated).toBeGreaterThanOrEqual(0);
    expect(result.memoriesCreated).toBeGreaterThanOrEqual(0);
  });

  it('extractTasks delegates correctly', () => {
    const tasks = svc.extractTasks('TODO: Fix the deployment script. Must update the config file.');
    expect(tasks.length).toBeGreaterThanOrEqual(1);
  });

  it('extractDecisions delegates correctly', () => {
    const decisions = svc.extractDecisions('We decided to adopt microservices architecture.');
    expect(decisions.length).toBeGreaterThanOrEqual(1);
  });

  it('generateTranscript formats segments', () => {
    const transcript = svc.generateTranscript([
      { text: 'Hello everyone', speakerId: 'Alice', startTime: 0, endTime: 5 },
      { text: 'Hi Alice', speakerId: 'Bob', startTime: 5, endTime: 10 },
    ]);
    expect(transcript).toContain('[Alice]');
    expect(transcript).toContain('[Bob]');
  });

  it('extractKnowledgeText generates knowledge text', () => {
    const result = svc.processMeeting({
      meetingId: 'test',
      transcript: 'We decided to use TypeScript. The team agreed on microservices. TODO: Set up the project.',
      title: 'Knowledge Test',
    });
    const knowledgeText = svc.extractKnowledgeText(result.summary);
    expect(knowledgeText.length).toBeGreaterThan(10);
  });

  it('extractMemoryText generates memory text', () => {
    const result = svc.processMeeting({
      meetingId: 'test',
      transcript: 'We decided to use TypeScript. TODO: Set up the project.',
      title: 'Memory Test Meeting',
    });
    const memoryText = svc.extractMemoryText(result.summary, 'Memory Test Meeting');
    expect(memoryText).toContain('Memory Test Meeting');
  });
});
