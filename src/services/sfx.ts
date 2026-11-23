/** WebAudio synth SFX (gm.js `sfx`). */
import { ls } from "@/lib/storage";

let ac: AudioContext | null = null;

export function gmSfxOn(): boolean {
  return ls.get("nh:sfx") !== "0";
}

export function setSfxOn(on: boolean): void {
  ls.set("nh:sfx", on ? "1" : "0");
}

export type SfxKind = "ok" | "bad" | "combo" | "win";

export function sfx(kind: SfxKind): void {
  if (!gmSfxOn()) return;
  try {
    ac = ac || new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const t = ac.currentTime;
    const tone = (f: number, st: number, du: number, type?: OscillatorType, vol?: number) => {
      const o = ac!.createOscillator();
      const g = ac!.createGain();
      o.type = type || "sine";
      o.frequency.setValueAtTime(f, t + st);
      g.gain.setValueAtTime(0, t + st);
      g.gain.linearRampToValueAtTime(vol || 0.18, t + st + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + st + du);
      o.connect(g);
      g.connect(ac!.destination);
      o.start(t + st);
      o.stop(t + st + du + 0.02);
    };
    if (kind === "ok") {
      tone(880, 0, 0.12, "triangle");
      tone(1320, 0.08, 0.16, "triangle");
    } else if (kind === "bad") {
      tone(196, 0, 0.22, "sawtooth", 0.09);
    } else if (kind === "combo") {
      tone(988, 0, 0.1, "triangle");
      tone(1319, 0.07, 0.1, "triangle");
      tone(1760, 0.14, 0.18, "triangle");
    } else if (kind === "win") {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.1, 0.25, "triangle"));
    }
  } catch {
    /* audio unavailable */
  }
}
