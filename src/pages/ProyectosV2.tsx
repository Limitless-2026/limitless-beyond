import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import HamburgerMenu from "@/components/HamburgerMenu";
import StarfieldParallax from "@/components/StarfieldParallax";
import ProjectStationV2 from "@/components/ProjectStationV2";
import { PROJECTS_ORDERED as PROJECTS } from "@/data/projects";
import SEO from "@/components/SEO";
import PageTransition from "@/components/PageTransition";

const ProyectosV2 = () => {
  const [heroIn, setHeroIn] = useState(false);
  const [count, setCount] = useState(0);
  const total = PROJECTS.length;

  useEffect(() => {
    const t = requestAnimationFrame(() => setHeroIn(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // Odometer counter 0 -> total
  useEffect(() => {
    if (!heroIn) return;
    const start = performance.now();
    const duration = 1400;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setCount(Math.round(eased * total));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [heroIn, total]);

  const heroTitleWords1 = "Constelación".split(" ");
  const heroTitleWords2 = "Limitless".split(" ");

  return (
    <PageTransition>
      <SEO 
        title="Proyectos" 
        description="Casos en órbita. Cada proyecto que desarrollamos rompe un límite distinto." 
      />
      <main className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
      <HamburgerMenu />

      {/* Background starfield */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <StarfieldParallax visible={true} />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 20%, hsl(var(--primary) / 0.12) 0%, transparent 65%), radial-gradient(ellipse 50% 40% at 80% 80%, hsl(var(--secondary) / 0.06) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* HERO */}
      <section className="relative z-10 min-h-[88vh] flex flex-col justify-center px-6 md:px-12 lg:px-20 pt-24 pb-16">
        <p
          className="text-[10px] md:text-xs tracking-[0.4em] uppercase text-primary mb-10 font-light"
          style={{
            opacity: heroIn ? 1 : 0,
            transform: heroIn ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 700ms ease-out, transform 700ms ease-out",
          }}
        >
          Proyectos · {String(count).padStart(2, "0")}
        </p>

        <h1
          className="font-extralight tracking-[0.06em] uppercase leading-[0.92]"
          style={{ fontSize: "clamp(3rem, 11vw, 9rem)" }}
        >
          <span className="block text-foreground">
            {heroTitleWords1.map((w, i) => (
              <span key={i} className="inline-block overflow-hidden align-bottom mr-[0.25em]">
                <span
                  className="inline-block"
                  style={{
                    display: "inline-block",
                    opacity: heroIn ? 1 : 0,
                    filter: heroIn ? "blur(0)" : "blur(12px)",
                    transform: heroIn ? "translateY(0)" : "translateY(40%)",
                    transition: `opacity 1100ms ease-out ${i * 90}ms, filter 1100ms ease-out ${
                      i * 90
                    }ms, transform 1100ms cubic-bezier(0.22, 1, 0.36, 1) ${i * 90}ms`,
                  }}
                >
                  {w}
                </span>
              </span>
            ))}
          </span>
          <span
            className="block"
            style={{
              background:
                "linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 50%, hsl(var(--primary)) 100%)",
              backgroundSize: "200% 100%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animation: heroIn ? "gradient-flow 8s linear infinite" : "none",
            }}
          >
            {heroTitleWords2.map((w, i) => (
              <span key={i} className="inline-block overflow-hidden align-bottom mr-[0.25em]">
                <span
                  className="inline-block"
                  style={{
                    display: "inline-block",
                    opacity: heroIn ? 1 : 0,
                    filter: heroIn ? "blur(0)" : "blur(14px)",
                    transform: heroIn ? "translateY(0)" : "translateY(40%)",
                    transition: `opacity 1200ms ease-out ${300 + i * 90}ms, filter 1200ms ease-out ${
                      300 + i * 90
                    }ms, transform 1200ms cubic-bezier(0.22, 1, 0.36, 1) ${300 + i * 90}ms`,
                  }}
                >
                  {w}
                </span>
              </span>
            ))}
          </span>
        </h1>

        <p
          className="mt-10 text-base md:text-lg text-foreground/60 max-w-md font-light leading-relaxed"
          style={{
            opacity: heroIn ? 1 : 0,
            transform: heroIn ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 1100ms ease-out 600ms, transform 1100ms ease-out 600ms",
          }}
        >
          Casos en órbita. Cada uno rompe un límite distinto.
        </p>

        <div
          className="mt-16 md:mt-24 flex items-center gap-6"
          style={{
            opacity: heroIn ? 1 : 0,
            transition: "opacity 1200ms ease-out 700ms",
          }}
        >
          <div
            className="h-px bg-foreground/15 flex-1"
            style={{
              transform: heroIn ? "scaleX(1)" : "scaleX(0)",
              transformOrigin: "left",
              transition: "transform 1200ms cubic-bezier(0.22, 1, 0.36, 1) 700ms",
            }}
          />
          <span className="text-[10px] md:text-xs tracking-[0.4em] uppercase text-foreground/45 font-light whitespace-nowrap">
            {String(count).padStart(2, "0")} Proyectos · 2024 — 2026
          </span>
        </div>
      </section>

      {/* STATIONS */}
      <section className="relative z-10">
        {PROJECTS.map((p, i) => (
          <ProjectStationV2 key={p.id} project={p} index={i} total={PROJECTS.length} />
        ))}
      </section>

      {/* CLOSING */}
      <section className="relative z-10 min-h-screen flex flex-col justify-between px-6 md:px-12 lg:px-20 pt-24 pb-10">
        <div />
        <div className="text-center">
          <h2
            className="font-extralight tracking-[0.06em] uppercase leading-[0.95] mx-auto max-w-5xl"
            style={{ fontSize: "clamp(2.25rem, 7vw, 5.5rem)" }}
          >
            ¿Tu proyecto es el próximo{" "}
            <span
              style={{
                background:
                  "linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              límite?
            </span>
          </h2>

          <Link to="/contacto" className="mt-14 inline-flex items-center gap-4 group">
            <span className="text-sm md:text-base tracking-[0.4em] uppercase text-foreground font-light border-b border-foreground/30 pb-2 group-hover:border-primary transition-colors">
              Empecemos
            </span>
            <span className="text-foreground group-hover:translate-x-1 transition-transform">
              →
            </span>
          </Link>
        </div>

        <footer className="pt-16">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px flex-1 bg-foreground/10" />
            <span
              className="w-1.5 h-1.5 rounded-full bg-primary"
              style={{
                boxShadow: "0 0 10px hsl(var(--primary) / 0.7)",
                animation: "pulse-dot 2.4s ease-in-out infinite",
              }}
            />
            <div className="h-px flex-1 bg-foreground/10" />
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-[10px] md:text-xs tracking-[0.3em] uppercase text-foreground/40 font-light">
            <span>Limitless · 2025</span>
            <a
              href="mailto:hola@limitless.studio"
              className="hover:text-foreground transition-colors"
            >
              hola@limitless.studio
            </a>
            <span>Argentina · Buenos Aires</span>
          </div>
          <div className="mt-6 text-center">
            <span className="text-[9px] tracking-[0.5em] uppercase text-foreground/25 font-light">
              v2 · Constelación animada
            </span>
          </div>
        </footer>
      </section>
    </main>
    </PageTransition>
  );
};

export default ProyectosV2;