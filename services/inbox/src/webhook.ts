/**
 * Webhook Interface — defines the contract for all inbound webhook handlers.
 *
 * Each webhook handler transforms platform-specific payloads into
 * standardized InboxItem inputs.
 *
 * Supported platforms: Slack, WeCom, DingTalk, Email, API.
 * Implementations are deferred to future sprints.
 */

import type { CreateInboxItemInput } from './types';

// ─── Webhook Payload ──────────────────────────────────────────────────────────

export interface WebhookPayload {
  /** HTTP headers from the webhook request */
  headers: Record<string, string>;
  /** Raw request body (string or parsed JSON) */
  body: unknown;
  /** Source platform identifier */
  source: string;
  /** Timestamp when webhook was received */
  receivedAt: Date;
}

// ─── Webhook Verification ─────────────────────────────────────────────────────

export interface WebhookVerificationResult {
  valid: boolean;
  error?: string;
}

// ─── Webhook Handler Interface ────────────────────────────────────────────────

export interface WebhookHandler {
  /** Unique identifier for this handler (e.g. 'slack', 'wecom') */
  readonly name: string;

  /** Verify the webhook signature/authenticity */
  verify(payload: WebhookPayload): Promise<WebhookVerificationResult>;

  /** Transform the webhook payload into a standardized InboxItem input */
  transform(payload: WebhookPayload): Promise<CreateInboxItemInput>;
}

// ─── Webhook Registry ─────────────────────────────────────────────────────────

export interface WebhookRegistry {
  /** Register a webhook handler */
  register(handler: WebhookHandler): void;

  /** Get handler by source name */
  getHandler(source: string): WebhookHandler | undefined;

  /** List all registered handler names */
  listSources(): string[];
}

// ─── Simple Registry Implementation ──────────────────────────────────────────

export class SimpleWebhookRegistry implements WebhookRegistry {
  private readonly handlers = new Map<string, WebhookHandler>();

  register(handler: WebhookHandler): void {
    this.handlers.set(handler.name, handler);
  }

  getHandler(source: string): WebhookHandler | undefined {
    return this.handlers.get(source);
  }

  listSources(): string[] {
    return Array.from(this.handlers.keys());
  }
}
