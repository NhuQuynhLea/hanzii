/** Minimap — canvas redrawn each frame (loop.js `mini` block). */
import { useEffect, useRef } from "react";
import { onFrame } from "@/game/engine/loop";
import { me, view } from "@/game/engine/state";
import { W, H } from "@/game/world/geometry";
import { usePlayer } from "@/stores/player";
import { usePresence } from "@/stores/presence";
import { asset } from "@/lib/utils";

const MW = 336;
const MH = Math.round((336 * H) / W);

export function Minimap({ visible }: { visible: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(
    () =>
      onFrame(() => {
        const cv = ref.current;
        if (!cv) return;
        const ctx = cv.getContext("2d");
        if (!ctx) return;
        if (!visible || innerWidth <= 820) {
          cv.style.visibility = "hidden";
          return;
        }
        cv.style.visibility = "visible";
        const img = mapImg();
        if (img) ctx.drawImage(img, 0, 0, cv.width, cv.height);
        const sx = cv.width / W;
        const sy = cv.height / H;
        usePresence.getState().others.forEach((o) => {
          if (o.sc) return;
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.arc(o.x * sx, o.y * sy, 4, 0, 7);
          ctx.fill();
          ctx.fillStyle = o.c || "#fff";
          ctx.beginPath();
          ctx.arc(o.x * sx, o.y * sy, 3, 0, 7);
          ctx.fill();
        });
        if (usePlayer.getState().entered) {
          ctx.fillStyle = "#EA0000";
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(me.x * sx, me.y * sy, 5.5, 0, 7);
          ctx.fill();
          ctx.stroke();
        }
        ctx.strokeStyle = "rgba(255,255,255,.9)";
        ctx.lineWidth = 2;
        const vw = innerWidth / view.s;
        const vh = innerHeight / view.s;
        ctx.strokeRect(view.ox * sx, view.oy * sy, vw * sx, vh * sy);
      }),
    [visible],
  );

  return (
    <canvas
      ref={ref}
      width={MW}
      height={MH}
      className="fixed bottom-3 right-3 rounded-xl border-2 border-white/80 shadow-lg"
      style={{ width: 168, height: Math.round((168 * H) / W), visibility: "hidden" }}
    />
  );
}

let mapImgEl: HTMLImageElement | null = null;
function mapImg(): HTMLImageElement | null {
  if (!mapImgEl) {
    mapImgEl = new Image();
    mapImgEl.src = asset("assets/map.png");
  }
  return mapImgEl.complete && mapImgEl.naturalWidth ? mapImgEl : null;
}
