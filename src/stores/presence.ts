import { create } from "zustand";
import type { PlayerState } from "@/types/player";

/**
 * Remote players. `others` is a mutable Map read by the render loop —
 * components should NOT subscribe to it (mutates every frame).
 * Subscribe to `online`/`count` for the HUD.
 */
interface PresenceStore {
  others: Map<string, PlayerState>;
  online: string;
  live: boolean;

  setOnline(text: string, live: boolean): void;
}

export const usePresence = create<PresenceStore>((set) => ({
  others: new Map(),
  online: "Đang kết nối…",
  live: false,

  setOnline: (online, live) => set({ online, live }),
}));

/** presence.js `countText` */
export function countText(entered: boolean): string {
  return `${usePresence.getState().others.size + (entered ? 1 : 0)} người đang online`;
}
