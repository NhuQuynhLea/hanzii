/**
 * duo.js feedback effects — nhBurst particle burst, nhFx ok/bad flash,
 * quake + progress bump. Original used CSS classes; reimplemented with the
 * Web Animations API so no stylesheet is needed.
 */
const BURST_COLORS = ["#C8102E", "#1C1A6B", "#0F766E", "#FF6B6B", "#4F46E5"];

const REDUCE =
  typeof window !== "undefined" &&
  !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** nhBurst(el) — radial particle burst at element centre. */
export function nhBurst(el: Element | null): void {
  try {
    if (REDUCE || !el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    for (let i = 0; i < 14; i++) {
      const d = document.createElement("i");
      const a = (Math.PI * 2 * i) / 14 + Math.random() * 0.4;
      const R = 50 + Math.random() * 50;
      const rect = i % 3 === 0;
      d.style.cssText = `position:fixed;z-index:9999;left:${cx}px;top:${cy}px;width:${rect ? 9 : 7}px;height:${rect ? 4 : 7}px;border-radius:${rect ? 2 : 50}%;background:${BURST_COLORS[i % BURST_COLORS.length]};pointer-events:none;transform:translate(-50%,-50%)`;
      document.body.append(d);
      d.animate(
        [
          { transform: "translate(-50%,-50%)", opacity: 1 },
          {
            transform: `translate(calc(-50% + ${Math.cos(a) * R}px),calc(-50% + ${Math.sin(a) * R}px))`,
            opacity: 0,
          },
        ],
        { duration: 700, easing: "cubic-bezier(.2,.8,.3,1)", fill: "forwards" },
      );
      setTimeout(() => d.remove(), 750);
    }
  } catch {
    /* noop */
  }
}

export interface NhFxCtx {
  /** .duo-main / .ms-act container — quakes on wrong answers */
  main?: HTMLElement | null;
  /** progress-bar fill — bumps on correct answers */
  bar?: HTMLElement | null;
}

/** nhFx(el, ok) — flash the picked element, burst on ok, quake on bad. */
export function nhFx(el: Element | null, ok: boolean, ctx?: NhFxCtx): void {
  if (!el) return;
  const hel = el as HTMLElement;
  if (ok) {
    hel.style.borderColor = "#0F766E";
    hel.style.background = "#E6F4F1";
    hel.style.boxShadow = "0 0 0 4px rgba(15,118,110,.18)";
    hel.animate(
      [{ transform: "scale(1)" }, { transform: "scale(1.06)" }, { transform: "scale(1)" }],
      { duration: 380, easing: "cubic-bezier(.3,1.6,.5,1)" },
    );
    nhBurst(el);
  } else {
    hel.style.borderColor = "#C8102E";
    hel.style.background = "#FDECEE";
    hel.animate(
      [
        { transform: "translateX(0)" },
        { transform: "translateX(-5px)" },
        { transform: "translateX(5px)" },
        { transform: "translateX(-3px)" },
        { transform: "translateX(0)" },
      ],
      { duration: 420 },
    );
    const w = ctx?.main;
    if (w) {
      w.animate(
        [
          { transform: "translateX(0)" },
          { transform: "translateX(-6px)" },
          { transform: "translateX(6px)" },
          { transform: "translateX(-4px)" },
          { transform: "translateX(0)" },
        ],
        { duration: 350 },
      );
    }
  }
  if (ok && ctx?.bar) {
    ctx.bar.animate(
      [
        { transform: "scaleY(1)", transformOrigin: "center" },
        { transform: "scaleY(1.8)", transformOrigin: "center" },
        { transform: "scaleY(1)", transformOrigin: "center" },
      ],
      { duration: 450, easing: "cubic-bezier(.3,1.8,.5,1)" },
    );
  }
}
