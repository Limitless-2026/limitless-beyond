import { useEffect, useMemo, useRef, useState } from "react";

interface Props {
  onDone: () => void;
}

const ROTATING_TEXTS = [
  "CALIBRANDO COORDENADAS",
  "ABRIENDO PORTAL",
  "ROMPIENDO LÍMITES",
];

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const Preloader = ({ onDone }: Props) => {
  const [progress, setProgress] = useState(0);
  const [textIdx, setTextIdx] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [flash, setFlash] = useState(false);
  const startedRef = useRef(false);

  const reduced = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  // Particles (stable across renders)
  const particles = useMemo(() => {
    const rnd = seeded(42);
    return Array.from({ length: 70 }, (_, i) => ({
      id: i,
      x: rnd() * 100,
      y: rnd() * 100,
      size: 1 + rnd() * 1.6,
      delay: i * 22, // ms
    }));
  }, []);

  // Progress driver (eased: fast → slow, hangs near end)
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    if (reduced) {
      const t = setTimeout(() => {
        setProgress(100);
        setTimeout(() => {
          setExiting(true);
          setTimeout(onDone, 400);
        }, 200);
      }, 600);
      return () => clearTimeout(t);
    }

    const start = performance.now();
    const total = 2200; // ms
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / total);
      // Eased: rapid early, hang near 0.95
      const eased =
        t < 0.85
          ? 1 - Math.pow(1 - t / 0.85, 2.2) // ease-out
          : 0.96 + (t - 0.85) * (0.04 / 0.15); // last 15% creeps
      setProgress(Math.min(100, Math.round(eased * 100)));
      if (t < 1) raf = requestAnimationFrame(tick);
      else {
        setProgress(100);
        setFlash(true);
        setTimeout(() => setFlash(false), 120);
        setTimeout(() => setExiting(true), 220);
        setTimeout(onDone, 220 + 1100);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone, reduced]);

  // Rotating text
  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => {
      setTextIdx((i) => (i + 1) % ROTATING_TEXTS.length);
    }, 620);
    return () => clearInterval(id);
  }, [reduced]);

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col"
      style={{
        background: "rgb(2,1,5)",
        opacity: exiting ? 0 : 1,
        transition: "opacity 400ms ease-out",
        pointerEvents: exiting ? "none" : "auto",
      }}
      aria-hidden={exiting}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 md:px-10 pt-6 md:pt-8">
        <span className="text-[10px] tracking-[0.4em] uppercase text-foreground/50 font-light">
          ⌖ LIMITLESS
        </span>
        <span className="text-[10px] tracking-[0.4em] uppercase text-foreground/40 font-light">
          AR · 25
        </span>
      </div>

      {/* Particles layer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p) => (
          <span
            key={p.id}
            className="absolute rounded-full bg-foreground"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              opacity: 0,
              animation: reduced
                ? "none"
                : `preloader-twinkle 900ms ${p.delay}ms ease-out forwards`,
              boxShadow: "0 0 6px hsl(0 0% 95% / 0.35)",
            }}
          />
        ))}
      </div>

      {/* Center content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        {/* Rotating micro text */}
        <div className="h-4 mb-6 overflow-hidden">
          <p
            key={textIdx}
            className="text-[10px] md:text-xs tracking-[0.4em] uppercase text-foreground/55 font-light"
            style={{
              animation: reduced ? "none" : "preloader-text-in 380ms ease-out",
            }}
          >
            {ROTATING_TEXTS[textIdx]}
          </p>
        </div>

        {/* Progress line */}
        <div className="relative w-[220px] md:w-[280px] h-px bg-foreground/15 mb-8 overflow-hidden">
          <div
            className="absolute inset-y-0 left-0"
            style={{
              width: `${progress}%`,
              background: "hsl(var(--primary))",
              boxShadow: "0 0 12px hsl(var(--primary) / 0.6)",
              transition: "width 80ms linear",
            }}
          />
        </div>

        {/* Counter */}
        <div
          className="font-extralight tracking-[0.15em] text-foreground tabular-nums"
          style={{
            fontSize: "clamp(3.5rem, 10vw, 7rem)",
            lineHeight: 1,
            opacity: exiting ? 0 : 1,
            transition: "opacity 300ms ease-out",
            textShadow: "0 0 40px hsl(var(--primary) / 0.15)",
          }}
        >
          {String(progress).padStart(2, "0")}
        </div>

        {/* Expanding ring on exit */}
        {exiting && (
          <div
            className="absolute left-1/2 top-1/2 rounded-full pointer-events-none"
            style={{
              width: "20px",
              height: "20px",
              border: "1px solid hsl(var(--primary) / 0.8)",
              transform: "translate(-50%, -50%)",
              animation: "preloader-ring-expand 1100ms cubic-bezier(0.22, 1, 0.36, 1) forwards",
            }}
          />
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 md:px-10 pb-6 md:pb-8">
        <span className="text-[10px] tracking-[0.4em] uppercase text-foreground/35 font-light">
          -34.6° / -58.4°
        </span>
        <span className="text-[10px] tracking-[0.4em] uppercase text-foreground/35 font-light">
          v.01 · 2025
        </span>
      </div>

      {/* Magenta flash (one-shot) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "hsl(var(--secondary))",
          opacity: flash ? 0.18 : 0,
          transition: "opacity 80ms linear",
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
};

export default Preloader;