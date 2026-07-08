/**
 * Parser Interface — defines the contract for all inbox parsers.
 *
 * Each parser transforms raw input from a specific source (Email, WeChat, etc.)
 * into a standardized InboxItem with extracted metadata.
 *
 * Implementations are deferred to future sprints.
 */

// ─── Parse Result ─────────────────────────────────────────────────────────────

export interface ParseResult {
  /** Extracted title (if any) */
  title?: string;
  /** Normalized content */
  content: string;
  /** Confidence score 0-1 */
  confidence: number;
  /** Detected language (ISO 639-1) */
  language: string;
  /** Extracted entities */
  entities: ParsedEntity[];
  /** Extracted relations between entities */
  relations: ParsedRelation[];
  /** Additional metadata */
  metadata: ParserMetadata;
}

// ─── Entity ───────────────────────────────────────────────────────────────────

export interface ParsedEntity {
  /** Entity type: person, organization, location, date, etc. */
  type: string;
  /** Original text */
  text: string;
  /** Normalized value */
  value: string;
  /** Confidence score 0-1 */
  confidence: number;
  /** Position in content [start, end] */
  position?: [number, number];
}

// ─── Relation ─────────────────────────────────────────────────────────────────

export interface ParsedRelation {
  /** Relation type: works_at, located_in, mentioned_with, etc. */
  type: string;
  /** Source entity text */
  source: string;
  /** Target entity text */
  target: string;
  /** Confidence score 0-1 */
  confidence: number;
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export interface ParserMetadata {
  /** Parser name/identifier */
  parser: string;
  /** Parser version */
  version: string;
  /** Processing time in milliseconds */
  processingTimeMs: number;
  /** Source-specific raw metadata */
  raw?: Record<string, unknown>;
}

// ─── Parser Interface ─────────────────────────────────────────────────────────

export interface Parser {
  /** Unique identifier for this parser */
  readonly name: string;

  /** Source types this parser can handle */
  readonly supportedSources: string[];

  /**
   * Parse raw input and return structured result.
   * Implementations should be pure functions where possible.
   */
  parse(input: ParserInput): Promise<ParseResult>;
}

// ─── Parser Input ─────────────────────────────────────────────────────────────

export interface ParserInput {
  /** Source type identifier */
  sourceType: string;
  /** Raw content (text, JSON, base64, etc.) */
  rawContent: string;
  /** Source-specific metadata */
  metadata?: Record<string, unknown>;
}
