import { useEffect, useState } from "react";

type Listener = (x: number, y: number) => void;

const listeners = new Set<Listener>();
let rafId = 0;
let initialized = false;
let lastX = 0;
let lastY = 0;

function flush() {
  rafId = 0;
  listeners.forEach((cb) => cb(lastX, lastY));
}

function onMove(e: MouseEvent) {
  lastX = (e.clientX / window.innerWidth) * 2 - 1;
  lastY = (e.clientY / window.innerHeight) * 2 - 1;
  if (!rafId) rafId = requestAnimationFrame(flush);
}

function ensureListener() {
  if (initialized) return;
  initialized = true;
  window.addEventListener("mousemove", onMove, { passive: true });
}

/**
 * Mouse parallax in normalized -1..1 coordinates, throttled to a single
 * global rAF-batched listener.
 */
export function useMouseParallax(): { x: number; y: number } {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    ensureListener();
    const cb: Listener = (x, y) => setPos({ x, y });
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  }, []);

  return pos;
}

/**
 * Ref version — write-only, no re-renders. Read inside animation loops.
 */
export function useMouseParallaxRef() {
  const ref = { current: { x: 0, y: 0 } } as { current: { x: number; y: number } };
  useEffect(() => {
    ensureListener();
    const cb: Listener = (x, y) => {
      ref.current.x = x;
      ref.current.y = y;
    };
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return ref;
}