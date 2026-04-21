import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import HamburgerMenu from "@/components/HamburgerMenu";
import ProjectStationV3 from "@/components/ProjectStationV3";
import { PROJECTS } from "@/data/projects";

const ProyectosV3 = () => {
  const [heroIn, setHeroIn] = useState(false);
  const [now, setNow] = useState("");
  const noiseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = requestAnimationFrame(() => setHeroIn(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    const update = () => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      const ss = String(d.getSeconds()).padStart(2, "0");
      setNow(`${hh}:${mm}:${ss}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  // Animated noise shift
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const el = noiseRef.current;
    if (!el) return;
    el.style.animation = "noise-shift 600ms steps(2) infinite";
  }, []);

  const heroLine1 = "Casos";
  const heroLine2 = "Sin Reglas.";
  const heroLine3 = "Solo Riesgo.";

  return (
    <main className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
      <HamburgerMenu />

      {/* Grain / noise overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-[5] opacity-[0.06] mix-blend-overlay"
        ref={noiseRef}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.7'/></svg>\")",
          backgroundSize: "240px 240px",
        }}
      />

      {/* Top utility bar */}
      <div
        className="fixed top-0 left-0 right-0 z-30 px-4 md:px-8 py-3 flex items-center justify-between font-mono text-[10px] md:text-[11px] tracking-[0.3em] uppercase text-foreground/55 border-b border-foreground/10 bg-background/60 backdrop-blur-sm"
        style={{
          opacity: heroIn ? 1 : 0,
          transition: "opacity 800ms ease-out 200ms",
        }}
      >
        <span>Limitless / Index</span>
        <span className="hidden md:inline">— Argentina · BA · {now}</span>
        <span>v3.0 / brutal</span>
      </div>

      {/* HERO */}
      <section className="relative z-10 min-h-[100vh] flex flex-col justify-end px-4 md:px-8 pt-24 pb-10 md:pb-16 border-b border-foreground/10">
        {/* Faint grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />

        {/* Diagonal accent bar */}
        <div
          className="absolute top-1/3 -right-20 w-[60vw] h-[8vh] origin-center"
          style={{
            background: "hsl(var(--primary))",
            transform: heroIn ? "rotate(-8deg) translateX(0)" : "rotate(-8deg) translateX(120%)",
            opacity: heroIn ? 0.9 : 0,
            transition: "transform 1400ms cubic-bezier(0.85, 0, 0.15, 1) 600ms, opacity 1000ms ease-out 600ms",
          }}
        />

        {/* Mono header row */}
        <div className="relative grid grid-cols-12 gap-4 mb-12 md:mb-20 font-mono text-[10px] md:text-[11px] tracking-[0.3em] uppercase text-foreground/55">
          <span
            className="col-span-6 md:col-span-3"
            style={{
              opacity: heroIn ? 1 : 0,
              transform: heroIn ? "translateY(0)" : "translateY(10px)",
              transition: "all 700ms ease-out 300ms",
            }}
          >
            ── Index / Proyectos
          </span>
          <span
            className="hidden md:block col-span-3 text-foreground/40"
            style={{
              opacity: heroIn ? 1 : 0,
              transition: "opacity 700ms ease-out 400ms",
            }}
          >
            {String(PROJECTS.length).padStart(2, "0")} entradas
          </span>
          <span
            className="hidden md:block col-span-3 text-foreground/40"
            style={{
              opacity: heroIn ? 1 : 0,
              transition: "opacity 700ms ease-out 500ms",
            }}
          >
            2024 — 2025
          </span>
          <span
            className="col-span-6 md:col-span-3 text-right text-primary"
            style={{
              opacity: heroIn ? 1 : 0,
              transform: heroIn ? "translateY(0)" : "translateY(10px)",
              transition: "all 700ms ease-out 600ms",
            }}
          >
            ▌ EN VIVO
          </span>
        </div>

        {/* Massive title — collision typography */}
        <h1
          className="relative font-extralight uppercase leading-[0.82] tracking-[-0.02em]"
          style={{ fontSize: "clamp(4rem, 18vw, 18rem)" }}
        >
          <span className="block overflow-hidden">
            <span
              className="block"
              style={{
                transform: heroIn ? "translateY(0)" : "translateY(105%)",
                transition: "transform 1200ms cubic-bezier(0.85, 0, 0.15, 1) 200ms",
              }}
            >
              {heroLine1}
            </span>
          </span>
          <span className="block overflow-hidden -mt-[0.04em]">
            <span
              className="block italic font-extralight"
              style={{
                background:
                  "linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 60%, hsl(var(--primary)) 100%)",
                backgroundSize: "200% 100%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: heroIn ? "gradient-flow 9s linear infinite" : "none",
                transform: heroIn ? "translateY(0) skewX(0)" : "translateY(105%) skewX(-6deg)",
                transition: "transform 1300ms cubic-bezier(0.85, 0, 0.15, 1) 380ms",
              }}
            >
              {heroLine2}
            </span>
          </span>
          <span className="block overflow-hidden -mt-[0.04em]">
            <span
              className="block"
              style={{
                transform: heroIn ? "translateY(0)" : "translateY(105%)",
                transition: "transform 1200ms cubic-bezier(0.85, 0, 0.15, 1) 560ms",
                paddingLeft: "12vw",
              }}
            >
              {heroLine3}
            </span>
          </span>
        </h1>

        {/* Bottom hero row */}
        <div className="relative mt-12 md:mt-20 grid grid-cols-12 gap-4 items-end">
          <p
            className="col-span-12 md:col-span-5 text-sm md:text-base text-foreground/70 font-light leading-relaxed"
            style={{
              opacity: heroIn ? 1 : 0,
              transform: heroIn ? "translateY(0)" : "translateY(20px)",
              transition: "all 1100ms ease-out 900ms",
            }}
          >
            Un archivo abierto. Cada proyecto rompe algo distinto: un mercado,
            una expectativa, un molde. Sin trofeos en la pared. Solo el caso.
          </p>
          <div className="hidden md:block col-span-4" />
          <div
            className="col-span-12 md:col-span-3 flex md:justify-end"
            style={{
              opacity: heroIn ? 1 : 0,
              transition: "opacity 1000ms ease-out 1100ms",
            }}
          >
            <a
              href="#index"
              className="font-mono text-[11px] tracking-[0.4em] uppercase border border-foreground/30 px-4 py-3 hover:bg-foreground hover:text-background transition-colors inline-flex items-center gap-3"
            >
              <span>↓ Bajar al index</span>
            </a>
          </div>
        </div>
      </section>

      {/* Marquee divider */}
      <div className="relative overflow-hidden border-b border-foreground/10 py-3 md:py-4 bg-background">
        <div
          className="whitespace-nowrap font-extralight uppercase tracking-[-0.01em]"
          style={{
            fontSize: "clamp(2rem, 6vw, 5rem)",
            animation: "marquee-x 32s linear infinite",
            display: "inline-block",
          }}
        >
          {Array(6)
            .fill(null)
            .map((_, i) => (
              <span key={i} className="inline-flex items-center gap-8 mr-8">
                <span>Index 2024 — 2025</span>
                <span className="text-primary">✦</span>
                <span className="italic" style={{
                  background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}>Sin reglas</span>
                <span className="text-primary">✦</span>
              </span>
            ))}
        </div>
      </div>

      {/* STATIONS */}
      <section id="index" className="relative z-10">
        {PROJECTS.map((p, i) => (
          <ProjectStationV3 key={p.id} project={p} index={i} total={PROJECTS.length} />
        ))}
      </section>

      {/* CLOSING */}
      <section className="relative z-10 border-t border-foreground/10">
        {/* Big CTA */}
        <div className="relative px-4 md:px-8 py-24 md:py-40 overflow-hidden">
          <div
            className="absolute -top-20 -left-10 w-[40vw] h-[40vw] rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, hsl(var(--primary) / 0.3), transparent 70%)",
              filter: "blur(60px)",
            }}
          />
          <div
            className="absolute -bottom-20 -right-10 w-[40vw] h-[40vw] rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, hsl(var(--secondary) / 0.25), transparent 70%)",
              filter: "blur(70px)",
            }}
          />

          <div className="relative">
            <p className="font-mono text-[10px] md:text-[11px] tracking-[0.4em] uppercase text-foreground/45 mb-8">
              ── Próxima entrada
            </p>
            <h2
              className="font-extralight uppercase leading-[0.85] tracking-[-0.01em]"
              style={{ fontSize: "clamp(3rem, 12vw, 12rem)" }}
            >
              <span className="block">El tuyo.</span>
              <span
                className="block italic"
                style={{
                  background:
                    "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)) 60%, hsl(var(--primary)))",
                  backgroundSize: "200% 100%",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  animation: "gradient-flow 9s linear infinite",
                  paddingLeft: "10vw",
                }}
              >
                ¿Empezamos?
              </span>
            </h2>

            <Link
              to="/contacto"
              className="mt-12 inline-flex items-center gap-4 font-mono text-[11px] md:text-xs tracking-[0.4em] uppercase border border-foreground/30 px-6 py-4 hover:bg-primary hover:border-primary hover:text-primary-foreground transition-colors"
            >
              <span>[ Abrir conversación ]</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-4 md:px-8 py-8 border-t border-foreground/10 grid grid-cols-12 gap-4 font-mono text-[10px] tracking-[0.3em] uppercase text-foreground/45">
          <span className="col-span-6 md:col-span-3">Limitless · 2025</span>
          <span className="hidden md:block col-span-3">BA / AR</span>
          <a
            href="mailto:hola@limitless.studio"
            className="col-span-6 md:col-span-3 text-right md:text-left hover:text-foreground transition-colors"
          >
            hola@limitless.studio
          </a>
          <span className="col-span-12 md:col-span-3 text-right text-foreground/30">
            v3 · brutal index
          </span>
        </footer>
      </section>
    </main>
  );
};

export default ProyectosV3;