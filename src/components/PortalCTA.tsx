import { useEffect, useRef, useState } from "react";

const fade = (p: number, a: number, b: number, c: number, d: number) => {
  if (p < a || p > d) return 0;
  if (p < b) return (p - a) / (b - a);
  if (p < c) return 1;
  return 1 - (p - c) / (d - c);
};

const PortalCTA = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;
      const p = Math.max(0, Math.min(1, scrolled / total));
      setProgress(p);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setMouse({ x, y });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // Portal grows from tiny dot (~12px) to massive (~140vh)
  const portalSize =
    progress < 0.3
      ? 12 + progress * 200 // 12 -> 72px
      : progress < 0.65
      ? 72 + (progress - 0.3) * 1400 // 72 -> ~560
      : 560 + (progress - 0.65) * 2000; // 560 -> ~1260

  const eyebrowOp = fade(progress, 0, 0.05, 0.92, 1.0);
  const titleOp = fade(progress, 0.30, 0.45, 1.1, 1.2);
  const subOp = fade(progress, 0.62, 0.75, 1.1, 1.2);
  const ctaOp = fade(progress, 0.68, 0.82, 1.1, 1.2);

  // Particles inside portal
  const particles = [0, 1, 2, 3, 4, 5];

  return (
    <section
      ref={sectionRef}
      className="relative w-full"
      style={{ height: "150vh" }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        <style>{`
          @keyframes portal-orbit {
            from { transform: rotate(0deg) translateX(var(--orbit-r)) rotate(0deg); }
            to { transform: rotate(360deg) translateX(var(--orbit-r)) rotate(-360deg); }
          }
          @keyframes portal-pulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
          }
        `}</style>

        {/* Eyebrow */}
        <div
          className="absolute top-10 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
          style={{ opacity: eyebrowOp }}
        >
          <span className="text-[10px] tracking-[0.4em] uppercase text-foreground/50 font-light">
            Capítulo final · El umbral
          </span>
        </div>

        {/* Portal */}
        <div
          className="absolute left-1/2 top-1/2 rounded-full pointer-events-none"
          style={{
            width: `${portalSize}px`,
            height: `${portalSize}px`,
            transform: `translate(calc(-50% + ${mouse.x * 8}px), calc(-50% + ${mouse.y * 8}px))`,
            background:
              "radial-gradient(circle, hsl(var(--primary) / 0.55) 0%, hsl(var(--primary) / 0.25) 30%, hsl(var(--primary) / 0.08) 55%, transparent 75%)",
            boxShadow:
              "0 0 120px 40px hsl(var(--primary) / 0.35), 0 0 240px 80px hsl(var(--primary) / 0.2)",
            transition: "width 200ms ease-out, height 200ms ease-out",
          }}
        >
          {/* Orbiting particles */}
          {particles.map((i) => {
            const r = 60 + i * 18;
            return (
              <span
                key={i}
                className="absolute left-1/2 top-1/2 w-1 h-1 rounded-full bg-foreground/80"
                style={
                  {
                    boxShadow: "0 0 8px hsl(var(--primary))",
                    animation: `portal-orbit ${18 + i * 4}s linear infinite, portal-pulse ${3 + i}s ease-in-out infinite`,
                    ["--orbit-r" as string]: `${r}px`,
                  } as React.CSSProperties
                }
              />
            );
          })}
        </div>

        {/* Content layer */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 pointer-events-none">
          <h2
            className="text-5xl md:text-7xl lg:text-8xl font-extralight uppercase tracking-[0.15em] text-foreground"
            style={{
              opacity: titleOp,
              transform: `scale(${0.92 + titleOp * 0.08})`,
              textShadow: "0 4px 40px rgba(0,0,0,0.6)",
            }}
          >
            ¿Listos
            <br />
            para cruzar?
          </h2>

          <p
            className="mt-8 text-base md:text-lg text-foreground/70 font-light max-w-md"
            style={{ opacity: subOp, textShadow: "0 2px 20px rgba(0,0,0,0.7)" }}
          >
            Contanos qué querés romper.
          </p>

          <a
            href="/contacto"
            className="mt-10 inline-flex items-center gap-3 px-10 py-4 border border-foreground/40 text-foreground text-sm tracking-[0.2em] uppercase font-light transition-colors duration-300 hover:bg-primary hover:border-primary hover:text-primary-foreground pointer-events-auto"
            style={{ opacity: ctaOp }}
          >
            Iniciar contacto
            <span aria-hidden>→</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default PortalCTA;
