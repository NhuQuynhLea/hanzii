import type { PresencePayload } from "@/types/player";

/** Peer envelope (claude room peer shape, kept for Supabase adapter). */
export interface PeerInfo {
  peer: string;
  presence?: Partial<PresencePayload> & Record<string, unknown>;
  sameTab?: boolean;
  kind?: string;
}

export interface PeerChanges {
  joined: PeerInfo[];
  updated: PeerInfo[];
  left: PeerInfo[];
}

/**
 * Room/presence transport — replaces `window.claude.use("room")`.
 * Supabase implementation lives in supabase.ts; solo fallback in solo.ts.
 */
export interface PresenceService {
  readonly connected: boolean;
  connect(): Promise<boolean>;
  disconnect(): void;
  /** Broadcast own state (throttled by caller). */
  send(payload: Record<string, unknown>): Promise<void> | void;
  /** Subscribe to peer join/update/leave. onError on channel loss. */
  onPeers(cb: (changes: PeerChanges) => void, onError?: () => void): void;
}
