import { RefObject, useEffect, useState } from "react";

type Subscriber = {
  ref: RefObject<HTMLElement>;
  cb: (p: number) => void;
};

const subscribers = new Set<Subscriber>();
let rafId = 0;
let initialized = false;
let lenisUnsub: (() => void) | null = null;

function compute() {
  rafId = 0;
  const vh = window.innerHeight;
  subscribers.forEach((s) => {
    const el = s.ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const total = el.offsetHeight - vh;
    if (total <= 0) {
      s.cb(0);
      return;
    }
    const scrolled = Math.min(Math.max(-rect.top, 0), total);
    s.cb(scrolled / total);
  });
}

function schedule() {
  if (rafId) return;
  rafId = requestAnimationFrame(compute);
}

function ensureGlobalListener() {
  if (initialized) return;
  initialized = true;
  // Prefer Lenis if available — single source of truth.
  type LenisLike = { on: (e: string, cb: () => void) => void; off: (e: string, cb: () => void) => void };
  const tryWireLenis = () => {
    const lenis = (window as unknown as { __lenis?: LenisLike }).__lenis;
    if (!lenis || lenisUnsub) return;
    lenis.on("scroll", schedule);
    lenisUnsub = () => lenis.off("scroll", schedule);
  };
  tryWireLenis();
  // Fallback (and complement) — native scroll + resize.
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  // Retry wiring Lenis shortly after init in case provider mounts after.
  setTimeout(tryWireLenis, 0);
}

/**
 * Single-source scroll progress for a section ref. Returns 0..1 based on how
 * much of the element has scrolled past (typical sticky-stage pattern).
 * One global rAF-throttled scroll listener for the whole app.
 */
export function useScrollProgress(ref: RefObject<HTMLElement>): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    ensureGlobalListener();
    const sub: Subscriber = { ref, cb: setProgress };
    subscribers.add(sub);
    schedule();
    return () => {
      subscribers.delete(sub);
    };
  }, [ref]);

  return progress;
}

/**
 * Same as useScrollProgress but writes into a ref instead of state — use when
 * you want to read progress inside an animation loop without re-renders.
 */
export function useScrollProgressRef(ref: RefObject<HTMLElement>) {
  const out = { current: 0 } as { current: number };
  // We expose a stable object via closure inside an effect.
  // Returning a fresh object each render is fine — consumers should keep their own ref.
  useEffect(() => {
    ensureGlobalListener();
    const sub: Subscriber = { ref, cb: (p) => (out.current = p) };
    subscribers.add(sub);
    schedule();
    return () => {
      subscribers.delete(sub);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);
  return out;
}