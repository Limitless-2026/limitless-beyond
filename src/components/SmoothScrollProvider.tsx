import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Global smooth-scroll provider powered by Lenis.
 * Mounts a single instance, exposes it on window.__lenis so other hooks
 * (useScrollProgress) can subscribe to its scroll event instead of the
 * native window scroll, keeping a single source of truth.
 */
const SmoothScrollProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    // Respect prefers-reduced-motion — skip Lenis entirely.
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.6,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.7,
      touchMultiplier: 1.5,
      lerp: 0.075,
    });

    // Expose for other hooks to subscribe to.
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      delete (window as unknown as { __lenis?: Lenis }).__lenis;
    };
  }, []);

  return <>{children}</>;
};

export default SmoothScrollProvider;