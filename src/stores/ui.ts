import { create } from "zustand";
import type { ReactNode } from "react";

/** Room dialog variants (dialog#room classlist in the original). */
export type RoomVariant = "default" | "wb" | "duo";

export interface RoomState {
  open: boolean;
  mark: string;
  title: string;
  sub: string;
  variant: RoomVariant;
  /** Rendered body — feature components mount here. */
  body: ReactNode;
  /** Optional key for routing/analytics (e.g. "library", "board"). */
  key?: string;
}

interface UiStore {
  /** current map zone id */
  zone: string;
  /** enter-button label + visibility */
  enterLabel: string;
  enterVisible: boolean;
  toastText: string;
  toastSeq: number;
  room: RoomState;
  buyOpen: boolean;
  acadOpen: boolean;
  acadHash: string;
  /** greeting card (community greet-newbies) */
  greet: ReactNode;
  greetVisible: boolean;

  setZone(zone: string, enterLabel?: string): void;
  toast(text: string): void;
  hideToast(): void;
  openRoom(r: Omit<RoomState, "open">): void;
  setRoomBody(body: ReactNode): void;
  setRoomVariant(v: RoomVariant): void;
  closeRoom(): void;
  setBuyOpen(v: boolean): void;
  setAcad(open: boolean, hash?: string): void;
  setGreet(node: ReactNode): void;
  hideGreet(): void;
}

const toastQ: string[] = [];
let toastBusy = false;
let roomSeq = 0;

export const useUi = create<UiStore>((set, get) => {
  const nextToast = () => {
    const t = toastQ.shift();
    if (!t) {
      toastBusy = false;
      set({ toastText: "" });
      return;
    }
    toastBusy = true;
    set((s) => ({ toastText: t, toastSeq: s.toastSeq + 1 }));
    setTimeout(() => get().hideToast(), 1900);
  };

  return {
    zone: "cong",
    enterLabel: "Vào lớp học",
    enterVisible: false,
    toastText: "",
    toastSeq: 0,
    room: { open: false, mark: "", title: "", sub: "", variant: "default", body: null },
    buyOpen: false,
    acadOpen: false,
    acadHash: "",
    greet: null,
    greetVisible: false,

    setZone: (zone, enterLabel) =>
      set((s) => ({
        zone,
        enterLabel: enterLabel ?? s.enterLabel,
        enterVisible: enterLabel != null && enterLabel !== "",
      })),

    toast: (text) => {
      toastQ.push(text);
      if (!toastBusy) nextToast();
    },
    hideToast: () => {
      set({ toastText: "" });
      setTimeout(nextToast, 200);
    },

    openRoom: (r) => set({ room: { ...r, open: true, key: r.key ?? `room-${++roomSeq}` } }),
    setRoomBody: (body) => set((s) => ({ room: { ...s.room, body } })),
    setRoomVariant: (variant) => set((s) => ({ room: { ...s.room, variant } })),
    closeRoom: () => set((s) => ({ room: { ...s.room, open: false, variant: "default" } })),
    setBuyOpen: (buyOpen) => set({ buyOpen }),
    setAcad: (acadOpen, hash) =>
      set((s) => ({ acadOpen, acadHash: hash ?? s.acadHash })),
    setGreet: (greet) => set({ greet, greetVisible: greet != null }),
    hideGreet: () => set({ greetVisible: false }),
  };
});

/** Convenience non-hook access (like the original `toast()` global). */
export const toast = (t: string) => useUi.getState().toast(t);
