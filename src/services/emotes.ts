/** Quick-greet emotes (presence.js `EMO`/`emote`). */
import type { PlayerState } from "@/types/player";
import { usePlayer } from "@/stores/player";
import { me } from "@/game/engine/state";
import { speak } from "./tts";
import { onHook } from "./hooks";
import { sendMove } from "./presence/runtime";

export const EMO: Record<string, string> = {
  wave: "你好! 👋",
  xiexie: "谢谢! 🙏",
  jiayou: "加油! 💪",
  bow: "",
};

export function emote(o: PlayerState, k: string): void {
  if (k === "bow") {
    o.bowUntil = performance.now() + 1500;
    return;
  }
  if (k === "wave" || k === "xiexie" || k === "jiayou") {
    o.act = k;
    o.actUntil = performance.now() + 1300;
    o.emo = "";
    return;
  }
  o.emo = EMO[k] || "";
  o.emoUntil = performance.now() + 3000;
}

/** Local player sends a greet — animates me + broadcasts. */
export function sendEmote(k: string): void {
  if (!usePlayer.getState().entered) return;
  usePlayer.getState().bump((S) => {
    S.greet++;
  });
  if (k === "wave") speak("你好");
  if (k === "xiexie") speak("谢谢");
  if (k === "jiayou") speak("加油");
  emote(me, k);
  sendMove(true); // action goes out with next presence broadcast
}

// remote emote events
onHook("emote", (o, k) => emote(o as PlayerState, String(k)));
