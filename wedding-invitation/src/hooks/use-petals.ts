import { useEffect, useRef, type RefObject } from "react";

export type PetalMode = "burst" | "soft" | "finale";

/** Petal tones are the global CSS tokens; the hex values only cover a stylesheet that has not loaded. */
const TONES = ["--blush", "--blush-2", "--petal", "--white", "--petal-soft"];
const FALLBACK = ["#F6DEE2", "#EFC9D0", "#E9AFB9", "#FFFFFF", "#F3D3D9"];

type Petal = {
  x: number;
  y: number;
  w: number;
  h: number;
  a: number;
  va: number;
  vx: number;
  vy: number;
  col: string;
  sw: number;
  ss: number;
  life: number;
};

/**
 * Canvas petals.
 *  burst  → a shower flung from the seal when the gate opens (call the returned ref)
 *  soft   → a few petals drifting down a photo scene
 *  finale → a fuller shower
 * Drawing pauses while the page scrolls and stops while the canvas is off screen.
 */
export function usePetals(canvas: RefObject<HTMLCanvasElement | null>, mode: PetalMode) {
  const burst = useRef<() => void>(() => {});

  useEffect(() => {
    const el = canvas.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const css = getComputedStyle(document.documentElement);
    const tones = TONES.map((token) => css.getPropertyValue(token).trim()).filter(Boolean);
    const colours = tones.length === TONES.length ? tones : FALLBACK;
    let W = 0;
    let H = 0;
    let raf = 0;
    let lastScroll = 0;
    let running = false;
    let parts: Petal[] = [];

    const size = () => {
      const r = el.getBoundingClientRect();
      W = el.width = Math.floor(r.width * dpr);
      H = el.height = Math.floor(r.height * dpr);
    };
    const make = (fromTop: boolean): Petal => ({
      x: Math.random() * W,
      y: fromTop ? -20 : Math.random() * H,
      w: (5 + Math.random() * 5) * dpr,
      h: (3 + Math.random() * 3) * dpr,
      a: Math.random() * Math.PI * 2,
      va: (Math.random() - 0.5) * 0.04,
      vx: (Math.random() - 0.5) * 0.35 * dpr,
      vy: (0.35 + Math.random() * 0.55) * dpr,
      col: colours[Math.floor(Math.random() * colours.length)] ?? "#F6DEE2",
      sw: Math.random() * Math.PI * 2,
      ss: 0.01 + Math.random() * 0.02,
      life: 1,
    });
    const init = () => {
      size();
      parts = [];
      if (mode === "burst") return;
      const n = Math.round(W / (mode === "soft" ? 60 : 30) / dpr);
      for (let i = 0; i < n; i++) parts.push(make(false));
    };
    const draw = () => {
      // petals pause while the page scrolls
      if (mode !== "burst" && performance.now() - lastScroll < 200) {
        raf = requestAnimationFrame(draw);
        return;
      }
      ctx.clearRect(0, 0, W, H);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        if (!p) continue;
        p.sw += p.ss;
        p.x += p.vx + Math.sin(p.sw) * 0.6 * dpr;
        p.y += p.vy;
        p.a += p.va;
        if (mode === "burst") {
          p.vy += 0.035 * dpr;
          p.vx *= 0.985;
          p.life -= 0.007;
          if (p.life <= 0 || p.y > H + 30) {
            parts.splice(i, 1);
            continue;
          }
        } else if (p.y > H + 20 || p.x < -20 || p.x > W + 20) {
          parts[i] = make(true);
          continue;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.a);
        ctx.globalAlpha = 0.85 * Math.max(0, Math.min(1, p.life));
        ctx.fillStyle = p.col;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.w, p.h * (0.55 + 0.45 * Math.abs(Math.cos(p.sw))), 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      if (mode === "burst" && !parts.length) {
        running = false;
        return;
      }
      if (running) raf = requestAnimationFrame(draw);
    };

    const onScroll = () => {
      lastScroll = performance.now();
    };
    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(init, 250);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    init();

    let observer: IntersectionObserver | undefined;
    if (mode === "burst") {
      burst.current = () => {
        size();
        for (let i = 0; i < 160; i++) {
          const p = make(false);
          const angle = Math.random() * Math.PI * 2;
          const speed = (2 + Math.random() * 7) * dpr;
          p.x = W / 2;
          p.y = H * 0.46;
          p.vx = Math.cos(angle) * speed;
          p.vy = Math.sin(angle) * speed - 2 * dpr;
          parts.push(p);
        }
        if (!running) {
          running = true;
          draw();
        }
      };
    } else if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !running) {
              running = true;
              draw();
            } else if (!entry.isIntersecting) {
              running = false;
              cancelAnimationFrame(raf);
            }
          });
        },
        { threshold: 0.05 },
      );
      observer.observe(el);
    } else {
      running = true;
      draw();
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      observer?.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      burst.current = () => {};
    };
  }, [canvas, mode]);

  return burst;
}
