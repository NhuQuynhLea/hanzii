/**
 * Tone-curve canvas (scene-pron.js TRAINER_TPL `draw`).
 * Red band = model tone contour per syllable; cyan line = learner pitch;
 * optional white/red playback dot.
 */
import { useEffect, useRef } from "react";
import type { Syl } from "./sylls";
import { toneTarget, tMean, type PitchPoint } from "./tone";

export function drawChart(
  cv: HTMLCanvasElement,
  S: Syl[],
  curve: PitchPoint[] | null,
  dot: number,
  small?: boolean,
): void {
  const r = window.devicePixelRatio || 1,
    Wd = cv.clientWidth || 300,
    H = cv.clientHeight || 200;
  cv.width = Wd * r;
  cv.height = H * r;
  const g = cv.getContext("2d");
  if (!g) return;
  g.setTransform(r, 0, 0, r, 0, 0);
  g.clearRect(0, 0, Wd, H);
  const L = small ? 4 : 34,
    R = small ? 4 : 14,
    Tp = small ? 4 : 14,
    B = small ? 4 : S.length > 1 ? 34 : 22,
    X = (t: number) => L + t * (Wd - L - R),
    Y = (v: number) => Tp + ((5 - v) / 4) * (H - Tp - B),
    n = S.length || 1;
  if (!small) {
    g.font = '600 12px "Be Vietnam Pro",sans-serif';
    g.textAlign = "right";
    g.textBaseline = "middle";
    for (let v = 1; v <= 5; v++) {
      g.strokeStyle = "rgba(255,255,255,.12)";
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(L, Y(v));
      g.lineTo(Wd - R, Y(v));
      g.stroke();
      g.fillStyle = "#C9C8F2";
      g.fillText(String(v), L - 10, Y(v));
    }
    if (n > 1) {
      g.textAlign = "center";
      for (let i = 0; i < n; i++) {
        if (i) {
          g.strokeStyle = "rgba(255,255,255,.25)";
          g.setLineDash([4, 4]);
          g.beginPath();
          g.moveTo(X(i / n), Tp);
          g.lineTo(X(i / n), H - B);
          g.stroke();
          g.setLineDash([]);
        }
        g.fillStyle = "#fff";
        g.font = '700 13px "Be Vietnam Pro",sans-serif';
        g.fillText(S[i].s, X((i + 0.5) / n), H - 12);
      }
    }
  }
  const path = () => {
    g.beginPath();
    for (let s = 0; s < n; s++) {
      for (let j = 0; j <= 24; j++) {
        const t = (s + (j / 24) * 0.94 + 0.03) / n,
          v = toneTarget(S, Math.min(0.999, t));
        if (j) g.lineTo(X(t), Y(v));
        else g.moveTo(X(t), Y(v));
      }
    }
  };
  g.lineCap = "round";
  g.lineJoin = "round";
  g.strokeStyle = "rgba(234,0,0,.32)";
  g.lineWidth = small ? 8 : 24;
  path();
  g.stroke();
  g.strokeStyle = "rgba(234,0,0,.85)";
  g.lineWidth = small ? 2 : 4;
  path();
  g.stroke();
  if (curve && curve.length > 1) {
    const off = tMean(S) - 3;
    g.strokeStyle = "#7FD6FF";
    g.lineWidth = small ? 2.5 : 5;
    g.beginPath();
    curve.forEach((p, i) => {
      const x = X(p[0]),
        y = Y(Math.max(0.6, Math.min(5.4, p[1] + off)));
      if (i) g.lineTo(x, y);
      else g.moveTo(x, y);
    });
    g.stroke();
  }
  if (dot >= 0) {
    const y = Y(toneTarget(S, Math.min(0.999, dot)));
    g.fillStyle = "#fff";
    g.beginPath();
    g.arc(X(dot), y, 9, 0, 7);
    g.fill();
    g.fillStyle = "#EA0000";
    g.beginPath();
    g.arc(X(dot), y, 6, 0, 7);
    g.fill();
  }
}

export function ToneChart({
  S,
  curve = null,
  dot = -1,
  small = false,
  ariaLabel,
  className = "",
}: {
  S: Syl[];
  curve?: PitchPoint[] | null;
  dot?: number;
  small?: boolean;
  ariaLabel?: string;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const paint = () => drawChart(cv, S, curve, dot, small);
    paint();
    window.addEventListener("resize", paint);
    return () => window.removeEventListener("resize", paint);
  }, [S, curve, dot, small]);

  return (
    <canvas
      ref={ref}
      aria-label={ariaLabel}
      className={
        small
          ? `block bg-[#0B0A3B] ${className}`
          : `mt-2 block h-[260px] w-full ${className}`
      }
    />
  );
}
