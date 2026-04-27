import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import HamburgerMenu from "@/components/HamburgerMenu";
import StarfieldParallax from "@/components/StarfieldParallax";
import ProjectStation from "@/components/ProjectStation";
import { PROJECTS_ORDERED as PROJECTS } from "@/data/projects";

const Proyectos = () => {
  const [heroIn, setHeroIn] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setHeroIn(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
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
        <div
          style={{
            opacity: heroIn ? 1 : 0,
            transform: heroIn ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 900ms ease-out, transform 900ms ease-out",
          }}
        >
          <p className="text-[10px] md:text-xs tracking-[0.4em] uppercase text-primary mb-10 font-light">
            Proyectos · 0{PROJECTS.length}
          </p>

          <h1
            className="font-extralight tracking-[0.06em] uppercase leading-[0.92]"
            style={{ fontSize: "clamp(3rem, 11vw, 9rem)" }}
          >
            <span className="block text-foreground">Constelación</span>
            <span
              className="block"
              style={{
                background:
                  "linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 50%, hsl(var(--primary)) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Limitless
            </span>
          </h1>

          <p className="mt-10 text-base md:text-lg text-foreground/60 max-w-md font-light leading-relaxed">
            Casos en órbita. Cada uno rompe un límite distinto.
          </p>
        </div>

        <div
          className="mt-16 md:mt-24 flex items-center gap-6"
          style={{
            opacity: heroIn ? 1 : 0,
            transition: "opacity 1200ms ease-out 300ms",
          }}
        >
          <div
            className="h-px bg-foreground/15 flex-1"
            style={{
              transform: heroIn ? "scaleX(1)" : "scaleX(0)",
              transformOrigin: "left",
              transition: "transform 1200ms cubic-bezier(0.22, 1, 0.36, 1) 300ms",
            }}
          />
          <span className="text-[10px] md:text-xs tracking-[0.4em] uppercase text-foreground/45 font-light whitespace-nowrap">
            {PROJECTS.length} Proyectos · 2024 — 2026
          </span>
        </div>
      </section>

      {/* STATIONS */}
      <section className="relative z-10">
        {PROJECTS.map((p, i) => (
          <ProjectStation key={p.id} project={p} index={i} />
        ))}
      </section>

      {/* CLOSING — full viewport + integrated minimal footer */}
      <section className="relative z-10 min-h-screen flex flex-col justify-between px-6 md:px-12 lg:px-20 pt-24 pb-10">
        {/* spacer top */}
        <div />

        {/* Center message */}
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

          <Link
            to="/contacto"
            className="mt-14 inline-flex items-center gap-4 group"
          >
            <span className="text-sm md:text-base tracking-[0.4em] uppercase text-foreground font-light border-b border-foreground/30 pb-2 group-hover:border-primary transition-colors">
              Empecemos
            </span>
            <span className="text-foreground group-hover:translate-x-1 transition-transform">
              →
            </span>
          </Link>
        </div>

        {/* Minimal integrated footer */}
        <footer className="pt-16">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px flex-1 bg-foreground/10" />
            <span
              className="w-1.5 h-1.5 rounded-full bg-primary"
              style={{
                boxShadow: "0 0 10px hsl(var(--primary) / 0.7)",
                animation: "pulse 2s ease-in-out infinite",
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
        </footer>
      </section>
    </main>
  );
};

export default Proyectos;
