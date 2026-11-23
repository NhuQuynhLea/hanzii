/**
 * Feature hook wiring — registers dialog openers so engine/navigation code
 * can stay feature-free (replaces ui.js/nav.js globals).
 */
import type { ReactNode } from "react";
import { registerHook, callHook, hasHook } from "@/services/hooks";
import { useUi } from "@/stores/ui";
import { me, keys, setTarget } from "@/game/engine/state";
import { FLR } from "@/game/world/geometry";
import { getCurLevel, driveUrl } from "@/lib/curriculum";
import { campusActive } from "@/services/entitlement";
import { PER_DAY } from "@/lib/curriculum";
import "@/features/pron"; // registers callHook("openPron") — pron.js Phòng phát âm
import { LessonList } from "./lesson/LessonList";
import { Library } from "./library/Library";
import { Board } from "./board/Board";
import { Progress } from "./progress/Progress";
import { Lotus } from "./lotus/Lotus";
import { TeacherChat } from "./ai/TeacherChat";
import { Admissions } from "./admissions/Admissions";
import { GameDialog } from "./games/Games";
import { GAMES } from "@/data/games-data";
import "./pron-trainer"; // scene-pron.js trainer: registers "openTrainer"/"openPronLevel" at import
import { openBm, registerBmHooks } from "./bm";
import { registerMissionHooks } from "./missions";
import "./gm";
import "./td"; // td.js thách đấu: registers tdPanel/tdProg/tdActive/tdDone/tdAbsorb at import
import { registerGtLibraryHooks } from "./gt/library";
import { registerGtCoreHooks } from "./gt/core";
import { registerGtSceneHooks } from "./gt/scene";
import { registerDuoHooks } from "./duo";

let registered = false;

function open(mark: string, title: string, sub: string, body: ReactNode, variant?: "wb" | "duo"): void {
  keys.clear();
  setTarget(null);
  useUi.getState().openRoom({ mark, title, sub, body, variant: variant ?? "default" });
}

export function registerFeatureHooks(): void {
  if (registered) return;
  registered = true;
  registerBmHooks();
  registerMissionHooks();
  registerGtCoreHooks();
  (window as unknown as { __hook?: unknown }).__hook = (n: string, ...a: unknown[]) => callHook(n, ...a);
  registerGtLibraryHooks();
  registerGtSceneHooks();
  registerDuoHooks();

  // bm.js `_openLessonList` — the original word-list dialog, no classroom routing.
  const openList = () => {
    const paid = campusActive();
    open("课", "Bài học hôm nay", paid ? "Thẻ học viên: học bao nhiêu từ tuỳ bạn" : `Bản miễn phí: ${PER_DAY} từ mới mỗi ngày`, <LessonList />);
  };
  registerHook("openLessonList", openList);

  registerHook("openLesson", () => {
    // bm.js openLesson override: inside the classroom the board/seat opens
    // the GT class sheet on the Giao tiếp floor, else the 6-step bài mới.
    if (me.sc === 1) {
      const lv = me.cl || getCurLevel();
      if (FLR.lop === "gt" && hasHook("openGTClass")) return void callHook("openGTClass", lv);
      return void openBm(lv);
    }
    openList();
  });

  registerHook("openBoard", (tab?: unknown) => {
    open("🏆", "Bảng thành tích", "Huy hiệu, chuỗi ngày học và xếp hạng", <Board tab={tab as string | undefined} />);
  });

  registerHook("openProgress", () => {
    open("进", "Tiến độ học", "Theo lộ trình NowHanzi, chưa phải điểm thi HSK", <Progress />);
  });

  registerHook("openLotus", () => {
    open("荷", "Hồ sen 荷塘", "Hai câu trong “荷塘月色” của Chu Tự Thanh (1927)", <Lotus />);
  });

  registerHook("openAI", () => {
    open("师", "Thầy Vương", "Chọn điều con muốn hỏi thầy", <TeacherChat />);
  });

  registerHook("openGame", (id?: unknown) => {
    const G = GAMES[String(id)];
    if (!G) return;
    open(G.mark, G.name, G.sub, <GameDialog id={String(id)} />);
  });

  registerHook("openRoom", (id?: unknown, lv?: unknown) => {
    const rid = String(id);
    if (rid === "lop") {
      useUi.getState().closeRoom();
      const paid = campusActive();
      open("课", "Bài học hôm nay", paid ? "Thẻ học viên: học bao nhiêu từ tuỳ bạn" : `Bản miễn phí: ${PER_DAY} từ mới mỗi ngày`, <LessonList />);
      return;
    }
    if (rid === "thu") {
      open("书", "Thư viện", "Tài liệu miễn phí, tài liệu trả phí và thẻ từ", <Library startLv={(lv as number) || getCurLevel()} />);
      return;
    }
    if (rid === "am") {
      callHook("openPron");
      return;
    }
    if (rid === "tuvan") {
      open("师", "Văn phòng tuyển sinh", "Chọn cách học và mở khoá", <Admissions />);
    }
  });

  registerHook("openRoomLib", (lv?: unknown) => {
    open("书", "Thư viện", "Tài liệu miễn phí, tài liệu trả phí và thẻ từ", <Library startLv={(lv as number) || getCurLevel()} />);
  });

  registerHook("driveOrLibrary", () => {
    const u = driveUrl(getCurLevel());
    if (u) window.open(u, "_blank", "noopener");
    else open("书", "Thư viện", "Tài liệu miễn phí, tài liệu trả phí và thẻ từ", <Library startLv={getCurLevel()} />);
  });
}
