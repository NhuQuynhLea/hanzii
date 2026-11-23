/** Zone name pill (top center) + contextual "enter" button. */
import { useUi } from "@/stores/ui";
import { usePlayer } from "@/stores/player";
import { ZONES } from "@/game/world/geometry";
import { enterClick } from "@/game/engine/navigation";

export function ZonePill() {
  const zone = useUi((s) => s.zone);
  const entered = usePlayer((s) => s.entered);
  if (!entered || !zone) return null;
  return (
    <div className="fixed left-1/2 top-3 z-40 -translate-x-1/2 rounded-full bg-[#050349]/90 px-4 py-1.5 text-[13px] font-semibold text-white shadow-lg">
      {ZONES[zone] || zone}
    </div>
  );
}

export function EnterButton() {
  const visible = useUi((s) => s.enterVisible);
  const label = useUi((s) => s.enterLabel);
  const entered = usePlayer((s) => s.entered);
  if (!entered || !visible || !label) return null;
  return (
    <button
      type="button"
      onClick={enterClick}
      className="fixed bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-full bg-[#EA0000] px-5 py-2.5 text-[14px] font-bold text-white shadow-xl transition hover:bg-[#C80000]"
    >
      {label} <kbd className="ml-1 rounded bg-white/20 px-1.5 py-0.5 text-[11px]">E</kbd>
    </button>
  );
}
