/** Mở dialog phòng chung (dlg.showModal + keys/target reset trong bản gốc). */
import type { ReactNode } from "react";
import { keys, setTarget } from "@/game/engine/state";
import { useUi, type RoomVariant } from "@/stores/ui";

export function openNvRoom(
  mark: string,
  title: string,
  sub: string,
  body: ReactNode,
  variant: RoomVariant = "default",
): void {
  keys.clear();
  setTarget(null);
  useUi.getState().openRoom({ mark, title, sub, body, variant });
}
