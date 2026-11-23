/**
 * Answer-feedback effects — port of duo.js `nhBurst`/`nhFx`.
 * Original used CSS classes (nh-ok/nh-bad/nh-quake/nh-p); here the same
 * pop/shake/particle motion is driven with the Web Animations API so no
 * stylesheet is needed. Correct/wrong *state* styling lives in the React
 * components themselves.
 */

const reduced = (): boolean => {
  try {
    return matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
};

/** Confetti-ish particle burst around an element (nhBurst). */
export function nhBurst(el: Element | null): void {
  try {
    if (reduced() || !el) return;
    const r = el.getBoundingClientRect(),
      cx = r.left + r.width / 2,
      cy = r.top + r.height / 2,
      C = ["#C8102E", "#1C1A6B", "#0F766E", "#FF6B6B", "#4F46E5"];
    for (let i = 0; i < 14; i++) {
      const d = document.createElement("i");
      const a = (Math.PI * 2 * i) / 14 + Math.random() * 0.4,
        R = 50 + Math.random() * 50;
      d.style.cssText = `position:fixed;z-index:9999;left:${cx}px;top:${cy}px;width:7px;height:7px;border-radius:50%;pointer-events:none;background:${C[i % C.length]};${
        i % 3 ? "" : "border-radius:2px;width:9px;height:4px;"
      }`;
      document.body.append(d);
      d.animate(
        [
          { transform: "translate(-50%,-50%)", opacity: 1 },
          {
            transform: `translate(calc(-50% + ${Math.cos(a) * R}px), calc(-50% + ${Math.sin(a) * R}px))`,
            opacity: 0,
          },
        ],
        { duration: 700, easing: "cubic-bezier(.2,.8,.3,1)" },
      );
      setTimeout(() => d.remove(), 750);
    }
  } catch {
    /* fx optional */
  }
}

/**
 * nhFx: ok → pop + burst; bad → shake the element (the original shook the
 * whole .duo-main/.ms-act wrapper — we shake the control itself).
 */
export function nhFx(el: Element | null, ok: boolean): void {
  if (!el || reduced()) return;
  try {
    if (ok) {
      el.animate(
        [
          { transform: "scale(1)" },
          { transform: "scale(1.06)" },
          { transform: "scale(1)" },
        ],
        { duration: 380, easing: "cubic-bezier(.3,1.6,.5,1)" },
      );
      nhBurst(el);
    } else {
      el.animate(
        [
          { transform: "translateX(0)" },
          { transform: "translateX(-7px)" },
          { transform: "translateX(6px)" },
          { transform: "translateX(-4px)" },
          { transform: "translateX(3px)" },
          { transform: "translateX(0)" },
        ],
        { duration: 420, easing: "ease-out" },
      );
    }
  } catch {
    /* fx optional */
  }
}
