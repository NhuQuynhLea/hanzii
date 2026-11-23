import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase, supaUid } from "./supabase";
import { registerHook } from "./hooks";
import { ls } from "@/lib/storage";

/**
 * Score/doc store — persists each learner's `hv` doc (the shape community.js
 * synced through `window.claude` Firestore as `hv/<uid>`). Enables league,
 * groups and the weekly school challenge to see offline players too.
 *
 * Schema (run once in the Supabase SQL editor):
 *   create table hv (id text primary key, hsk_level int, week text,
 *     week_points int, total_points int, nickname text, color text,
 *     last_seen bigint, group_code text, group_name text, is_group_owner int,
 *     kicked_members jsonb, joined_at bigint, group_is_public int,
 *     updated_at timestamptz default now());
 *   alter table hv enable row level security;
 *   create policy "hv read"  on hv for select using (true);
 *   create policy "hv write" on hv for insert with check (true);
 *   create policy "hv upd"   on hv for update using (true);
 */
interface HvRow {
  id: string;
  hsk_level?: number;
  week?: string;
  week_points?: number;
  total_points?: number;
  nickname?: string;
  color?: string;
  last_seen?: number;
  group_code?: string;
  group_name?: string;
  is_group_owner?: number;
  kicked_members?: string[];
  joined_at?: number;
  group_is_public?: number;
}

let db: SupabaseClient | null = null;
let cache: Map<string, HvRow> = new Map();
let lastFetch = 0;
let fetching = false;
let lastPush = 0;

/** True once a `hv` row has been fetched at least once (even if empty). */
export const scoresReady = () => lastFetch > 0;

/** Publish my doc — debounced ~5s, upsert keyed by uid. */
export function publishScore(d: Record<string, unknown>): void {
  if (!db) return;
  // QA/test sessions set nh:qa=1 — keep junk rows out of the production table
  if (ls.get("nh:qa")) return;
  const now = Date.now();
  if (now - lastPush < 5000) return;
  lastPush = now;
  const row = { ...d, id: supaUid(), updated_at: new Date().toISOString() };
  void db
    .from("hv")
    .upsert(row, { onConflict: "id" })
    .then(
      ({ error }) => {
        if (!error) cache.set(row.id, row as HvRow);
      },
      () => {
        /* transport failure — keep local doc, retry on next publish */
      },
    );
}

/** All hv rows (table cache + periodic refetch every 30s). */
export function scoreDocs(): Map<string, HvRow> {
  const now = Date.now();
  if (db && !fetching && now - lastFetch > 30000) {
    fetching = true;
    db.from("hv")
      .select("*")
      .then(({ data, error }) => {
        fetching = false;
        if (error || !data) return;
        lastFetch = now;
        cache = new Map((data as HvRow[]).map((r) => [r.id, r]));
      });
  }
  return cache;
}

export function connectScores(): void {
  db = getSupabase();
  if (!db) return;
  registerHook("commPublish", (d) => publishScore(d as Record<string, unknown>));
  registerHook("scoreDocs", () => scoreDocs());
}
