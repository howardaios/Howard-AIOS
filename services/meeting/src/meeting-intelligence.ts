import { randomUUID } from 'node:crypto';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MeetingTask {
  id: string;
  title: string;
  owner?: string;
  deadline?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  source: string;
}

export interface MeetingDecision {
  id: string;
  title: string;
  owner?: string;
  decidedAt?: string;
  reason?: string;
  status: 'PROPOSED' | 'DECIDED' | 'ARCHIVED';
}

export interface MeetingRisk {
  id: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  mitigation?: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: number;
  type: 'speech' | 'decision' | 'task' | 'note' | 'recording' | 'summary' | 'knowledge';
  title: string;
  content?: string;
  metadata?: Record<string, unknown>;
}

export interface AISummary {
  executiveSummary: string;
  keyPoints: string[];
  actionItems: MeetingTask[];
  decisions: MeetingDecision[];
  risks: MeetingRisk[];
  openQuestions: string[];
  followUp: string[];
  timeline: TimelineEvent[];
}

export interface RecordingMeta {
  id: string;
  title: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  duration?: number;
  speakerCount?: number;
  language?: string;
  status: string;
  transcript?: string;
}

export interface MeetingProcessingResult {
  meetingId: string;
  summary: AISummary;
  knowledgeNodesCreated: number;
  memoriesCreated: number;
  processingTimeMs: number;
}

// ─── Task Extractor ──────────────────────────────────────────────────────────

export class TaskExtractor {
  extract(text: string, participants: string[] = []): MeetingTask[] {
    const tasks: MeetingTask[] = [];
    const patterns = [
      /(?:TODO|FIXME|ACTION)[:\s]+([^.!\n]{5,120})/gi,
      /(?:need to|should|must|will|plan to|going to)\s+([^.!\n]{5,120})/gi,
      /(?:assign|delegate|responsible)[:\s]*(?:to\s+)?(\w+)[^.!\n]*?for\s+([^.!\n]{5,80})/gi,
      /(?:deadline|due|by)[:\s]*([^\n]{3,30})/gi,
    ];

    for (const pattern of patterns) {
      let m: RegExpExecArray | null;
      while ((m = pattern.exec(text)) !== null) {
        const title = (m[2] ?? m[1] ?? '').trim();
        if (title.length < 5) continue;
        const task: MeetingTask = {
          id: randomUUID(),
          title: title.slice(0, 200),
          priority: this.detectPriority(title),
          status: 'TODO',
          source: 'ai-extraction',
        };
        // Try to assign owner from participants
        if (m[1] && participants.length > 0) {
          const owner = participants.find(p => p.toLowerCase().includes(m![1].toLowerCase()));
          if (owner) task.owner = owner;
        }
        // Detect deadline
        if (pattern.source.includes('deadline') || pattern.source.includes('due')) {
          task.deadline = m[1]?.trim();
        }
        tasks.push(task);
      }
    }

    // Deduplicate by title similarity
    return this.deduplicate(tasks);
  }

  private detectPriority(text: string): MeetingTask['priority'] {
    const lower = text.toLowerCase();
    if (/critical|urgent|asap|immediately|emergency/.test(lower)) return 'CRITICAL';
    if (/important|high|priority/.test(lower)) return 'HIGH';
    if (/low|minor|nice.to.have/.test(lower)) return 'LOW';
    return 'MEDIUM';
  }

  private deduplicate(tasks: MeetingTask[]): MeetingTask[] {
    const seen = new Set<string>();
    return tasks.filter(t => {
      const key = t.title.toLowerCase().replace(/\s+/g, ' ').trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

// ─── Decision Extractor ──────────────────────────────────────────────────────

export class DecisionExtractor {
  extract(text: string): MeetingDecision[] {
    const decisions: MeetingDecision[] = [];
    const patterns = [
      /(?:decided|decision|agreed|approved|chosen|selected)[:\s]+([^.!?\n]{5,150})/gi,
      /(?:we will|we are going to|the plan is|going forward)[:\s]*([^.!?\n]{5,150})/gi,
      /(?:rejected|declined|not going to)[:\s]+([^.!?\n]{5,150})/gi,
    ];

    for (const pattern of patterns) {
      let m: RegExpExecArray | null;
      while ((m = pattern.exec(text)) !== null) {
        const title = m[1].trim();
        if (title.length < 5) continue;
        decisions.push({
          id: randomUUID(),
          title: title.slice(0, 200),
          status: pattern.source.includes('rejected') ? 'ARCHIVED' : 'DECIDED',
          decidedAt: new Date().toISOString(),
        });
      }
    }

    return this.deduplicate(decisions);
  }

  private deduplicate(decisions: MeetingDecision[]): MeetingDecision[] {
    const seen = new Set<string>();
    return decisions.filter(d => {
      const key = d.title.toLowerCase().replace(/\s+/g, ' ').trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

// ─── AI Summary Generator ────────────────────────────────────────────────────

export class SummaryGenerator {
  private taskExtractor = new TaskExtractor();
  private decisionExtractor = new DecisionExtractor();

  generate(transcript: string, participants: string[] = [], _metadata?: Record<string, unknown>): AISummary {
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 10);

    // Executive Summary: first 3 important sentences
    const executiveSummary = sentences.slice(0, 3).map(s => s.trim()).join('. ') + '.';

    // Key Points: extract important sentences
    const keyPoints = sentences
      .filter(s => {
        const lower = s.toLowerCase();
        return /important|key|critical|main|primary|essential|significant|notable/.test(lower);
      })
      .map(s => s.trim())
      .slice(0, 8);

    // If no key points found, use diverse sentences
    if (keyPoints.length === 0) {
      const step = Math.max(1, Math.floor(sentences.length / 5));
      for (let i = 0; i < sentences.length && keyPoints.length < 5; i += step) {
        keyPoints.push(sentences[i].trim());
      }
    }

    // Extract tasks and decisions
    const actionItems = this.taskExtractor.extract(transcript, participants);
    const decisions = this.decisionExtractor.extract(transcript);

    // Extract risks
    const risks: MeetingRisk[] = [];
    const riskRegex = /(?:risk|concern|warning|danger|issue|problem|blocker|challenge)[:\s]+([^.!?\n]{5,150})/gi;
    let rm: RegExpExecArray | null;
    while ((rm = riskRegex.exec(transcript)) !== null) {
      const desc = rm[1].trim();
      if (desc.length >= 5) {
        risks.push({
          id: randomUUID(),
          description: desc.slice(0, 200),
          severity: /critical|severe|major|high/.test(desc.toLowerCase()) ? 'HIGH' : /minor|low|small/.test(desc.toLowerCase()) ? 'LOW' : 'MEDIUM',
        });
      }
    }

    // Open questions
    const openQuestions: string[] = [];
    const questionRegex = /(?:\?|question|unclear|not sure|need to clarify|wondering)[:\s]*(.{5,150})/gi;
    let qm: RegExpExecArray | null;
    while ((qm = questionRegex.exec(transcript)) !== null) {
      const q = qm[1]?.trim();
      if (q && q.length >= 5) openQuestions.push(q.slice(0, 200));
    }
    // Also find sentences ending with ?
    for (const s of sentences) {
      if (s.includes('?') && openQuestions.length < 10) {
        const trimmed = s.trim();
        if (trimmed.length > 10) openQuestions.push(trimmed);
      }
    }

    // Follow-up items
    const followUp: string[] = [];
    const followUpRegex = /(?:follow.up|next steps|action|after this|subsequently)[:\s]+([^.!?\n]{5,150})/gi;
    let fm: RegExpExecArray | null;
    while ((fm = followUpRegex.exec(transcript)) !== null) {
      followUp.push(fm[1].trim().slice(0, 200));
    }
    if (followUp.length === 0 && actionItems.length > 0) {
      followUp.push(...actionItems.slice(0, 3).map(t => `Complete: ${t.title}`));
    }

    // Generate timeline from transcript
    const timeline: TimelineEvent[] = [];
    const words = transcript.split(/\s+/);
    const chunkSize = Math.max(50, Math.floor(words.length / 5));
    for (let i = 0; i < 5; i++) {
      const chunk = words.slice(i * chunkSize, (i + 1) * chunkSize).join(' ');
      if (chunk.length > 10) {
        timeline.push({
          id: randomUUID(),
          timestamp: i * 60,
          type: 'speech',
          title: `Segment ${i + 1}`,
          content: chunk.slice(0, 200),
        });
      }
    }

    // Add decision and task events to timeline
    for (const d of decisions) {
      timeline.push({
        id: randomUUID(),
        timestamp: timeline.length * 60,
        type: 'decision',
        title: d.title,
      });
    }
    for (const t of actionItems) {
      timeline.push({
        id: randomUUID(),
        timestamp: timeline.length * 60,
        type: 'task',
        title: t.title,
        metadata: { owner: t.owner, priority: t.priority },
      });
    }

    return {
      executiveSummary,
      keyPoints,
      actionItems,
      decisions,
      risks,
      openQuestions: [...new Set(openQuestions)].slice(0, 10),
      followUp: [...new Set(followUp)].slice(0, 10),
      timeline,
    };
  }
}

// ─── Meeting Intelligence Service ────────────────────────────────────────────

export class MeetingIntelligenceService {
  private summaryGen = new SummaryGenerator();
  private taskExtractor = new TaskExtractor();
  private decisionExtractor = new DecisionExtractor();

  /**
   * Process a meeting: generate AI summary, extract tasks, decisions, knowledge, and memories.
   */
  processMeeting(params: {
    meetingId: string;
    transcript: string;
    participants?: string[];
    title?: string;
  }): MeetingProcessingResult {
    const start = Date.now();
    const { meetingId, transcript, participants = [] } = params;

    // Generate comprehensive AI summary
    const summary = this.summaryGen.generate(transcript, participants);

    return {
      meetingId,
      summary,
      knowledgeNodesCreated: summary.keyPoints.length + summary.decisions.length + summary.risks.length,
      memoriesCreated: summary.actionItems.length + summary.decisions.length,
      processingTimeMs: Date.now() - start,
    };
  }

  /**
   * Generate transcript from speech segments (mock for demo).
   */
  generateTranscript(segments: Array<{ text: string; speakerId: string; startTime: number; endTime: number }>): string {
    return segments.map(s => `[${s.speakerId}] ${s.text}`).join('\n');
  }

  extractTasks(text: string, participants?: string[]): MeetingTask[] {
    return this.taskExtractor.extract(text, participants);
  }

  extractDecisions(text: string): MeetingDecision[] {
    return this.decisionExtractor.extract(text);
  }

  /**
   * Generate knowledge extraction text for the Knowledge service.
   */
  extractKnowledgeText(summary: AISummary): string {
    const parts: string[] = [];
    if (summary.executiveSummary) parts.push(summary.executiveSummary);
    parts.push(...summary.keyPoints);
    for (const d of summary.decisions) parts.push(`Decision: ${d.title}`);
    for (const r of summary.risks) parts.push(`Risk: ${r.description}`);
    for (const t of summary.actionItems) parts.push(`Task: ${t.title}`);
    return parts.join('. ');
  }

  /**
   * Generate memory text for the Memory service.
   */
  extractMemoryText(summary: AISummary, meetingTitle?: string): string {
    const parts: string[] = [];
    if (meetingTitle) parts.push(`Meeting: ${meetingTitle}`);
    if (summary.executiveSummary) parts.push(summary.executiveSummary);
    for (const d of summary.decisions) parts.push(`Important decision: ${d.title}`);
    for (const t of summary.actionItems) parts.push(`Action item: ${t.title} (priority: ${t.priority})`);
    return parts.join('. ');
  }
}
