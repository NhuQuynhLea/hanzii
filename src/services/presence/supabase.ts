import type { SupabaseClient, RealtimeChannel } from "@supabase/supabase-js";
import type { PeerChanges, PeerInfo, PresenceService } from "./types";
import { supaUid } from "../supabase";

/**
 * Supabase Realtime presence — replaces `window.claude.use("room")`.
 * Each client `track()`s its payload on a shared channel; join/update/leave
 * diffs are derived from presence sync events.
 */
export class SupabasePresence implements PresenceService {
  private client: SupabaseClient;
  private channel: RealtimeChannel | null = null;
  private key: string;
  private peerCb: ((changes: PeerChanges) => void) | null = null;
  private errCb: (() => void) | null = null;
  connected = false;

  constructor(client: SupabaseClient) {
    this.client = client;
    this.key = `${supaUid()}:${crypto.randomUUID()}`;
  }

  async connect(): Promise<boolean> {
    try {
      this.channel = this.client.channel("campus", {
        config: { presence: { key: this.key } },
      });
      // Handlers must be attached before subscribe() (supabase-js requirement).
      const seen = new Map<string, Record<string, unknown>>();
      this.channel.on("presence", { event: "sync" }, () => {
        const state = this.channel!.presenceState<Record<string, unknown>>();
        const next = new Map<string, Record<string, unknown>>();
        const joined: PeerInfo[] = [];
        const updated: PeerInfo[] = [];
        const left: PeerInfo[] = [];
        Object.entries(state).forEach(([key, presences]) => {
          if (key === this.key) return;
          // newest presence per key
          const pr = presences[presences.length - 1] as Record<string, unknown>;
          if (!pr) return;
          next.set(key, pr);
          const prev = seen.get(key);
          if (!prev) joined.push({ peer: key, presence: pr });
          else if (JSON.stringify(prev) !== JSON.stringify(pr))
            updated.push({ peer: key, presence: pr });
        });
        seen.forEach((_v, key) => {
          if (!next.has(key)) left.push({ peer: key });
        });
        seen.clear();
        next.forEach((v, k) => seen.set(k, v));
        if ((joined.length || updated.length || left.length) && this.peerCb)
          this.peerCb({ joined, updated, left });
      });
      this.channel.on("system", {}, (pkt) => {
        if (pkt.status === "CHANNEL_ERROR" || pkt.status === "TIMED_OUT") this.errCb?.();
      });
      const ok = await new Promise<boolean>((resolve) => {
        this.channel!.subscribe((status) => resolve(status === "SUBSCRIBED"));
      });
      this.connected = ok;
      return ok;
    } catch {
      return false;
    }
  }

  disconnect(): void {
    if (this.channel) this.client.removeChannel(this.channel);
    this.channel = null;
    this.connected = false;
  }

  async send(payload: Record<string, unknown>): Promise<void> {
    if (!this.channel || !this.connected) return;
    await this.channel.track(payload);
  }

  onPeers(cb: (changes: PeerChanges) => void, onError?: () => void): void {
    this.peerCb = cb;
    this.errCb = onError || null;
  }
}
