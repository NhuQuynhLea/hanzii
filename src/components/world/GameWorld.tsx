/**
 * Game world — scene background + overlay canvas + avatar layer inside a
 * camera-transformed world div. Replaces the original <canvas id="cv">.
 */
import { useEffect, useRef, type ReactElement } from "react";
import { me } from "@/game/engine/state";
import { startLoop, stopLoop, onFrame } from "@/game/engine/loop";
import { useGameInput, onWorldPointer } from "@/game/engine/input";
import { cameraCampus, cameraRoom } from "@/game/engine/camera";
import { W, H } from "@/game/world/geometry";
import { CW, CH } from "@/game/scenes/geometry-rooms";
import {
  drawKoi, drawPetals, drawFair, drawTargetRing,
  drawClassOverlay, drawPronOverlay, drawRoomOverlay,
} from "@/game/render/painters";
import { AvatarLayer } from "@/game/entities/AvatarLayer";
import { usePlayer } from "@/stores/player";
import { callHook } from "@/services/hooks";
import { Minimap } from "@/components/hud/Minimap";
import { asset } from "@/lib/utils";

const SCENE_BG: Record<number, string> = {
  0: asset("assets/map.png"),
  1: asset("assets/room-lop.png"),
  2: asset("assets/room-am.png"),
  3: asset("assets/room-thu.png"),
  4: asset("assets/room-tuvan.png"),
  5: asset("assets/room-cd.png"),
};

const DPR = 1.5;

export function GameWorld(): ReactElement {
  const viewport = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLCanvasElement>(null);
  const scene = usePlayer((s) => (s.meSeq, s.me.sc));

  useGameInput();

  // Preload all scene backgrounds after the first paint so the <img> swap on
  // room entry is instant — otherwise the old map keeps painting while the
  // new PNG downloads (must-revalidate assets fetch on every entry).
  useEffect(() => {
    const load = () =>
      Object.values(SCENE_BG).forEach((src) => {
        const i = new Image();
        i.src = src;
      });
    const t = window.setTimeout(load, 1500);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    startLoop();
    const off = onFrame((now, dt) => {
      const vp = viewport.current;
      const w = world.current;
      const ov = overlay.current;
      if (!vp || !w || !ov) return;
      const cw = vp.clientWidth;
      const ch = vp.clientHeight;
      const cam = me.sc === 0 ? cameraCampus(me.x, me.y, cw, ch) : cameraRoom(me.x, me.y, cw, ch);
      w.style.transform = `scale(${cam.s}) translate(${-cam.ox}px,${-cam.oy}px)`;

      const ctx = ov.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.clearRect(0, 0, ov.width / DPR, ov.height / DPR);
      if (me.sc === 0) {
        drawKoi(ctx, now);
        drawFair(ctx, now);
        drawTargetRing(ctx, now);
        callHook("drawQuest", ctx, now);
        drawPetals(ctx, dt, now);
      } else if (me.sc === 1) drawClassOverlay(ctx, now);
      else if (me.sc === 2) drawPronOverlay(ctx, now);
      else drawRoomOverlay(ctx, now);
    });
    return () => {
      off();
      stopLoop();
    };
  }, [scene]);

  const worldW = scene === 0 ? W : CW;
  const worldH = scene === 0 ? H : CH;

  return (
    <div
      ref={viewport}
      className="fixed inset-0 overflow-hidden"
      style={{ background: scene === 0 ? "#3F6B33" : "#E7E1D6" }}
      onPointerDown={onWorldPointer}
    >
      <div
        ref={world}
        className="absolute left-0 top-0"
        style={{ width: worldW, height: worldH, transformOrigin: "0 0" }}
      >
        <img
          src={SCENE_BG[scene]}
          alt=""
          draggable={false}
          style={{ position: "absolute", left: 0, top: 0, width: worldW, height: worldH }}
        />
        <canvas
          ref={overlay}
          width={worldW * DPR}
          height={worldH * DPR}
          style={{ position: "absolute", left: 0, top: 0, width: worldW, height: worldH }}
        />
        <AvatarLayer key={scene} />
      </div>
      {/* vignette */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{ background: "radial-gradient(ellipse at center, rgba(10,20,10,0) 45%, rgba(10,20,10,.32) 100%)" }}
      />
      <Minimap visible={scene === 0} />
    </div>
  );
}
