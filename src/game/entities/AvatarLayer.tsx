/**
 * Entity layer — mounts one AvatarSprite per visible entity, drives
 * per-frame updates via the game loop. Mirrors the original y-sorted
 * drawPerson list per scene.
 */
import { useEffect, useMemo, useReducer, useRef } from "react";
import type { PlayerState } from "@/types/player";
import { AvatarSprite, type AvatarHandle } from "./AvatarSprite";
import { onFrame } from "@/game/engine/loop";
import { me, zoneNow } from "@/game/engine/state";
import { navState } from "@/game/engine/navigation";
import { usePlayer } from "@/stores/player";
import { usePresence } from "@/stores/presence";
import { NPC_CAMPUS, FLR } from "@/game/world/geometry";
import { SEATS, NPC_CLASS, MAI, CCH } from "@/game/scenes/geometry-rooms";

interface EntDesc {
  key: string;
  get: () => { o: PlayerState; isMe: boolean; kind: "player" | "npc" | "mai" };
}

const AI_NAME = "Thầy Vương";

function npcObj(x: number, y: number, hint: boolean): PlayerState {
  return {
    x, y, tx: x, ty: y, n: AI_NAME, c: "#050349", d: 0, m: 0, npc: true,
    hint: hint ? "Hỏi thầy nhé!" : "", walk: 0, sc: 0, seat: -1,
    bubble: "", bubbleUntil: 0, emo: "", emoUntil: 0, bowUntil: 0,
  };
}

const campusNpc = npcObj(NPC_CAMPUS.x, NPC_CAMPUS.y, true);
const classNpc = npcObj(NPC_CLASS.x, NPC_CLASS.y, true);
const maiNpc: PlayerState = {
  x: MAI.x, y: MAI.y, tx: MAI.x, ty: MAI.y, n: "Cô Mai", d: 0, m: 0,
  walk: 0, sc: 4, seat: -1, bubble: "", bubbleUntil: 0, emo: "", emoUntil: 0, bowUntil: 0,
};

function sameClass(o: PlayerState): boolean {
  return o.sc === 1 && o.cl === me.cl && (o.fl || "hsk") === (me.fl || "hsk");
}

function seatPlaced(o: PlayerState): PlayerState {
  if (o.seat >= 0 && o.seat < SEATS.length) {
    const p = SEATS[o.seat];
    return Object.assign({}, o, { x: p.x, y: p.y + 18, d: 3 as const, m: 0, sitting: true });
  }
  return o;
}

function mePlaced(): PlayerState {
  if (me.sc === 4 && me.rsit != null) {
    const p = CCH[me.rsit];
    return Object.assign({}, me, { x: p.x, y: p.y - 6, d: 3 as const, m: 0, sitting: true });
  }
  if (me.sc === 1) return seatPlaced(me);
  return me;
}

function buildEntities(): EntDesc[] {
  const others = usePresence.getState().others;
  const { entered } = usePlayer.getState();
  const list: EntDesc[] = [];
  const push = (key: string, o: PlayerState | (() => PlayerState), isMe: boolean, kind: "player" | "npc" | "mai" = "player") =>
    list.push({
      key,
      get: typeof o === "function" ? () => ({ o: (o as () => PlayerState)(), isMe, kind }) : () => ({ o: o as PlayerState, isMe, kind }),
    });

  if (me.sc === 0) {
    others.forEach((o, k) => {
      if (!o.sc) push("p" + k, o, false);
    });
    if (entered) push("me", mePlaced, true);
    campusNpc.hint = zoneNow !== "ai" ? "Hỏi thầy nhé!" : "";
    push("npc", campusNpc, false, "npc");
    return list;
  }

  if (me.sc === 1) {
    others.forEach((o, k) => {
      if (sameClass(o)) push("p" + k, () => seatPlaced(o), false);
    });
    if (entered) push("me", mePlaced, true);
    classNpc.hint = !(navState.cz && navState.cz.k === "ai") ? "Hỏi thầy nhé!" : "";
    push("npc", classNpc, false, "npc");
    return list;
  }

  if (me.sc === 2) {
    others.forEach((o, k) => {
      if (o.sc === 2) push("p" + k, o, false);
    });
    if (entered) push("me", mePlaced, true);
    return list;
  }

  // rooms 3/4/5
  others.forEach((o, k) => {
    if (o.sc === me.sc && (me.sc !== 3 || o.fl === FLR.thu)) push("p" + k, o, false);
  });
  if (entered) push("me", mePlaced, true);
  if (me.sc === 4) push("mai", maiNpc, false, "mai");
  return list;
}

export function AvatarLayer() {
  const handles = useRef(new Map<string, AvatarHandle>());
  const meSeq = usePlayer((s) => s.meSeq);
  const entered = usePlayer((s) => s.entered);
  const [tick, bumpTick] = useReducer((x: number) => x + 1, 0);

  // membership refresh — others map mutates outside React
  useEffect(() => {
    const t = setInterval(bumpTick, 500);
    return () => clearInterval(t);
  }, []);

  const entities = useMemo(buildEntities, [meSeq, entered, tick]);

  useEffect(
    () =>
      onFrame((now) => {
        handles.current.forEach((h) => h.update(now));
      }),
    [],
  );

  return (
    <>
      {entities.map((e) => (
        <AvatarSprite
          key={e.key}
          get={e.get}
          ref={(h) => {
            if (h) handles.current.set(e.key, h);
            else handles.current.delete(e.key);
          }}
        />
      ))}
    </>
  );
}
