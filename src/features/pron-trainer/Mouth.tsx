/**
 * Animated tongue-position diagram (scene-pron.js TRAINER_TPL:
 * P/RING/LIP/CLOSE/CAPS/smooth/mix/ease/airFor/buildMouth/setPose/playMouth).
 * Rendered as real <svg>; play() runs the same rAF timeline as the original.
 */
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { speak } from "@/services/tts";
import type { PoseKey } from "./sylls";

type Pt = [number, number];

const P: Record<PoseKey, Pt[]> = {
  rest: [[152,136],[158,121],[154,110],[140,101],[112,93],[84,95],[60,110],[50,132]],
  sh: [[150,136],[150,116],[146,94],[127,64],[116,70],[96,82],[66,102],[50,132]],
  zh: [[150,136],[150,116],[146,94],[128,56],[116,64],[96,80],[66,102],[50,132]],
  ch: [[150,136],[150,116],[146,94],[128,56],[116,64],[96,80],[66,102],[50,132]],
  r: [[150,136],[150,116],[146,96],[128,74],[116,78],[96,86],[66,102],[50,132]],
  s: [[152,136],[159,121],[157,109],[146,86],[120,80],[90,88],[62,106],[50,132]],
  z: [[152,136],[159,121],[156,100],[151,72],[126,82],[92,88],[62,106],[50,132]],
  q: [[152,136],[159,121],[155,110],[146,90],[124,58],[96,70],[64,100],[50,132]],
  h: [[152,136],[158,121],[154,112],[140,104],[112,90],[82,64],[60,96],[50,132]],
  hv: [[152,136],[158,121],[154,110],[140,101],[112,93],[84,95],[60,110],[50,132]],
  l: [[152,136],[158,120],[156,100],[150,66],[128,86],[96,92],[64,106],[50,132]],
  lab: [[152,136],[158,121],[154,110],[140,101],[112,93],[84,95],[60,110],[50,132]],
  f: [[152,136],[158,121],[154,110],[140,101],[112,93],[84,95],[60,110],[50,132]],
};
const RING: Record<PoseKey, number | null> = {
  sh: 3, zh: 3, ch: 3, r: 3, s: 2, z: 3, q: 4, h: 5, hv: null, l: 3, lab: null, f: null, rest: null,
};
const LIP: Record<PoseKey, number> = {
  rest: 0, sh: 5, zh: 3, ch: 3, r: 3, s: -3, z: -3, q: 7, h: 0, hv: 0, l: 0, lab: 0, f: 0,
};
const CLOSE: Partial<Record<PoseKey, number>> = { lab: 1, f: 0.6 };
const CAPS: Record<PoseKey, [string, string]> = {
  sh: ["Đầu lưỡi cong ngược lên, gần chạm vòm cứng, môi hơi chu.", "Đẩy hơi qua khe hẹp giữa đầu lưỡi và vòm miệng."],
  zh: ["Đầu lưỡi cong lên và chạm vòm cứng, chặn hơi lại.", "Bật đầu lưỡi ra nhẹ, không thổi mạnh."],
  ch: ["Đầu lưỡi cong lên và chạm vòm cứng, chặn hơi lại.", "Bật ra kèm một luồng hơi mạnh."],
  r: ["Lưỡi cong lên gần vòm nhưng không chạm.", "Cho hơi đi qua khe, dây thanh rung."],
  s: ["Đầu lưỡi thẳng, tì sau răng dưới, mặt lưỡi gần lợi trên.", "Đẩy hơi qua khe hẹp, thoát ra giữa hai hàm răng."],
  z: ["Đầu lưỡi thẳng, chạm sau răng cửa trên.", "Bật đầu lưỡi ra, hơi đi qua răng."],
  q: ["Đầu lưỡi tì răng dưới, mặt lưỡi chạm vòm cứng.", "j bật nhẹ, q bật hơi mạnh, x cọ hơi nhẹ."],
  h: ["Cuống lưỡi nâng lên gần vòm mềm.", "g/k chạm rồi bật ra; h cho hơi cọ nhẹ như “kh”."],
  hv: ["Lưỡi nằm yên, không nâng lên.", "Hơi thoát thẳng từ họng ra."],
  l: ["Đầu lưỡi chạm lợi trên.", "Buông đầu lưỡi xuống: t bật hơi mạnh, d nhẹ, n cho hơi ra mũi."],
  lab: ["Hai môi mím lại, chặn hơi.", "Bật môi mở ra: p bật hơi mạnh, b nhẹ, m cho hơi ra mũi."],
  f: ["Răng trên chạm nhẹ môi dưới.", "Thổi hơi qua khe giữa răng và môi."],
  rest: ["Lưỡi thả lỏng, miệng mở tự nhiên.", "Phát nguyên âm, giữ hơi đều."],
};

export { CAPS };

function smooth(pts: Pt[]): string {
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)],
      p1 = pts[i],
      p2 = pts[i + 1],
      p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0]} ${p2[1]}`;
  }
  return d + ` Q50 158 96 160 Q140 158 ${pts[0][0]} ${pts[0][1]} Z`;
}

const mix = (a: Pt[], b: Pt[], t: number): Pt[] =>
  a.map((p, i) => [p[0] + (b[i][0] - p[0]) * t, p[1] + (b[i][1] - p[1]) * t]);
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function airFor(k: PoseKey): Pt[] {
  const ri = RING[k];
  if (ri == null)
    return k === "lab" || k === "f"
      ? [[46,170],[46,120],[72,84],[120,74],[150,92],[172,96],[198,98]]
      : [[46,170],[46,120],[72,84],[120,74],[160,96],[198,98]];
  const c = P[k][ri];
  return [[46,170],[50,128],[Math.min(c[0]-30,90),Math.min(c[1]-6,84)],[c[0],c[1]-8],[160,96],[198,98]];
}

/** 9 drifting air dots along the path (setPose `.air` group). */
function airDots(air: Pt[], airT: number): Pt[] {
  const segs: number[] = [];
  let Lt = 0;
  for (let i = 0; i < air.length - 1; i++) {
    const l = Math.hypot(air[i + 1][0] - air[i][0], air[i + 1][1] - air[i][1]);
    segs.push(l);
    Lt += l;
  }
  const out: Pt[] = [];
  for (let k = 0; k < 9; k++) {
    let d = ((airT * 1.6 + k / 9) % 1) * Lt,
      i = 0;
    while (i < segs.length - 1 && d > segs[i]) {
      d -= segs[i];
      i++;
    }
    const f = Math.min(1, d / segs[i]);
    out.push([air[i][0] + (air[i + 1][0] - air[i][0]) * f, air[i][1] + (air[i + 1][1] - air[i][1]) * f]);
  }
  return out;
}

interface PoseState {
  pts: Pt[];
  lip: number;
  air: Pt[] | null;
  airT: number;
  cl: number;
  ringC: Pt;
  ringOp: number;
}

export interface MouthHandle {
  /** playMouth: animate rest → pose → hold(+air+speak) → freeze. */
  play: (k: PoseKey, text?: string | null, onSay?: () => void) => void;
  /** setPose static of pose k (load(): tongue shown, no air). */
  show: (k: PoseKey) => void;
  /** setPose rest (svgB reset on load). */
  rest: () => void;
}

const reduce =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const MouthView = forwardRef<
  MouthHandle,
  { pose?: PoseKey; cap?: string; ariaLabel: string; className?: string }
>(function MouthView({ pose = "rest", cap = "", ariaLabel, className = "" }, ref) {
  const [st, setSt] = useState<PoseState>({
    pts: P[pose],
    lip: LIP[pose],
    air: null,
    airT: 0,
    cl: CLOSE[pose] || 0,
    ringC: [0, 0],
    ringOp: 0,
  });
  const [capText, setCapText] = useState(cap);
  const animRef = useRef(0);

  /* setPose(pts,lip,air,airT,ri,cl) + optional ring opacity (original sets it
     directly in the step fn, not inside setPose). */
  const apply = (
    pts: Pt[],
    lip: number,
    air: Pt[] | null,
    airT: number,
    ri: number | null,
    cl: number,
    ringOp?: number,
  ) => {
    setSt((p) => ({
      pts,
      lip,
      air,
      airT,
      cl,
      ringC: ri != null ? pts[ri] : p.ringC,
      ringOp: ringOp ?? p.ringOp,
    }));
  };

  useImperativeHandle(ref, () => ({
    play(k, text, onSay) {
      const ri = RING[k],
        cl = CLOSE[k] || 0;
      if (animRef.current) cancelAnimationFrame(animRef.current);
      const T = [0, 600, 1400, 2800],
        t0 = performance.now();
      let spoke = false;
      if (reduce) {
        apply(P[k], LIP[k], airFor(k), 0.3, ri, 0);
        setCapText(CAPS[k].join(" "));
        if (text) speak(text, 0.7);
        if (onSay) onSay();
        return;
      }
      const step = (now: number) => {
        const t = now - t0;
        let pts: Pt[] = P.rest,
          lip = 0,
          air: Pt[] | null = null,
          c = 0,
          ringOp: number | undefined;
        if (t < T[1]) {
          pts = P.rest;
          lip = 0;
          setCapText("Lưỡi thả lỏng.");
          ringOp = 0;
        } else if (t < T[2]) {
          const e = ease((t - T[1]) / (T[2] - T[1]));
          pts = mix(P.rest, P[k], e);
          lip = LIP[k] * e;
          c = cl * e;
          setCapText(CAPS[k][0]);
          ringOp = ri == null ? 0 : e;
        } else if (t < T[3]) {
          pts = P[k];
          lip = LIP[k];
          air = airFor(k);
          c = cl * Math.max(0, 1 - (t - T[2]) / 250);
          setCapText(CAPS[k][1]);
          if (!spoke) {
            spoke = true;
            if (text) speak(text, 0.7);
            if (onSay) onSay();
          }
        } else {
          pts = P[k];
          lip = LIP[k];
          ringOp = ri == null ? 0 : 1;
        }
        apply(pts, lip, air, (t - T[2]) / 1000, ri, c, ringOp);
        if (t < T[3] + 50) animRef.current = requestAnimationFrame(step);
        else {
          animRef.current = 0;
          setCapText(CAPS[k][0]);
        }
      };
      animRef.current = requestAnimationFrame(step);
    },
    show(k) {
      apply(P[k], LIP[k], null, 0, null, CLOSE[k] || 0);
    },
    rest() {
      apply(P.rest, 0, null, 0, null, 0);
    },
  }));

  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  const { pts, lip, air, airT, cl, ringC, ringOp } = st;
  const ulD = `M161 ${62 + cl * 6} Q${174 + lip} ${62 + cl * 6} ${177 + lip} ${76 + cl * 8} Q${175 + lip} ${88 + cl * 8} 163 ${90 + cl * 8} Z`;
  const llD = `M163 ${101 - cl * 4} Q${175 + lip} ${102 - cl * 4} ${176 + lip} ${114 - cl * 2} Q${172 + lip} 124 160 123 Z`;

  return (
    <>
      <svg viewBox="0 0 240 190" role="img" aria-label={ariaLabel}
        className={`mx-auto block h-auto w-full rounded-xl bg-[#F3F5FA] text-[#3D3E5C] ${className}`}>
        <path d="M30 70 Q40 30 96 26 Q150 22 170 40 Q186 48 192 62 L180 66" fill="none" stroke="currentColor" strokeWidth={2} opacity={0.35} />
        <path d="M40 186 L40 82 Q44 60 70 56" fill="none" stroke="currentColor" strokeWidth={2} opacity={0.35} />
        <path d="M70 56 Q100 46 128 50 Q146 52 150 62 Q153 66 156 68" fill="none" stroke="currentColor" strokeWidth={3.5} opacity={0.75} />
        <text x="98" y="44" fontSize="10" fill="currentColor" opacity={0.7}>vòm cứng</text>
        <text x="156" y="56" fontSize="10" fill="currentColor" opacity={0.7}>lợi</text>
        <text x="42" y="50" fontSize="10" fill="currentColor" opacity={0.55}>vòm mềm</text>
        <path d="M152 68 L163 68 L161 92 L155 92 Z" fill="#FFFFFF" stroke="currentColor" strokeWidth={1.5} />
        <path d="M154 122 L160 100 L165 102 L160 124 Z" fill="#FFFFFF" stroke="currentColor" strokeWidth={1.5} />
        <path d="M40 186 Q96 176 150 150 Q168 140 176 132" fill="none" stroke="currentColor" strokeWidth={2} opacity={0.35} />
        <path d={smooth(pts)} fill="#EA0000" fillOpacity={0.85} stroke="#B00010" strokeWidth={1.5} strokeLinejoin="round" />
        <g>
          {air
            ? airDots(air, airT).map((c, i) => (
                <circle key={i} cx={c[0]} cy={c[1]} r={2.6} fill="#7FD6FF" />
              ))
            : null}
        </g>
        <path d={ulD} fill="#F7A1A1" stroke="#C06070" strokeWidth={1.5} />
        <path d={llD} fill="#F7A1A1" stroke="#C06070" strokeWidth={1.5} />
        <circle cx={ringC[0]} cy={ringC[1]} r={9} fill="none" stroke="#E2B14A" strokeWidth={3} opacity={ringOp} />
        <text x="44" y="182" fontSize="10" fill="currentColor" opacity={0.7}>họng</text>
      </svg>
      <p className="m-0 mt-1 min-h-[3.1em] text-[14px] leading-[1.55] text-[#5B5A7A]">{capText}</p>
    </>
  );
});
