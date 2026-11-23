/**
 * Keyboard + pointer input (nav.js "ĐIỀU KHIỂN").
 * Arrows/WASD move, click sets walk target, E activates the enter button.
 */
import { useEffect } from "react";
import { me, keys, setTarget, view } from "./state";
import { classClick, pronClick, enterClick } from "./navigation";
import { usePlayer } from "@/stores/player";
import { useUi } from "@/stores/ui";

const KM: Record<string, string> = {
  ArrowUp: "u", KeyW: "u", ArrowDown: "d", KeyS: "d",
  ArrowLeft: "l", KeyA: "l", ArrowRight: "r", KeyD: "r",
};

/** True when a dialog/overlay should swallow input. */
function inputBlocked(target: EventTarget | null): boolean {
  if (target instanceof HTMLElement && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return true;
  const ui = useUi.getState();
  return ui.room.open || ui.buyOpen || ui.acadOpen || !usePlayer.getState().entered;
}

export function useGameInput(): void {
  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      if (inputBlocked(e.target)) return;
      const k = KM[e.code];
      if (k) {
        keys.add(k);
        setTarget(null);
        e.preventDefault();
      }
      if ((e.code === "KeyE" || e.code === "Enter" || e.code === "NumpadEnter") && useUi.getState().enterVisible) enterClick();
    };
    const ku = (e: KeyboardEvent) => {
      const k = KM[e.code];
      if (k) keys.delete(k);
    };
    const blur = () => keys.clear();
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      window.removeEventListener("blur", blur);
    };
  }, []);
}

/** pointerdown on the world viewport → world coords → scene click/target. */
export function onWorldPointer(e: { clientX: number; clientY: number }): void {
  if (!usePlayer.getState().entered) return;
  const wx = e.clientX / view.s + view.ox;
  const wy = e.clientY / view.s + view.oy;
  if (me.sc === 1) return classClick(wx, wy);
  if (me.sc === 2) return pronClick(wx, wy);
  setTarget({ x: wx, y: wy });
}
