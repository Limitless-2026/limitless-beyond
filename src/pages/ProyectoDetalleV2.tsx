import { useEffect, useRef, useState } from "react";
import { Link, useParams, Navigate, useLocation } from "react-router-dom";
import HamburgerMenu from "@/components/HamburgerMenu";
import StarfieldParallax from "@/components/StarfieldParallax";
import CaseGallery from "@/components/CaseGallery";
import { getProjectBySlug, getNextProject } from "@/data/projects";
import SEO from "@/components/SEO";
import PageTransition from "@/components/PageTransition";

const useReveal = <T extends HTMLElement = HTMLDivElement>(threshold = 0.18) => {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            obs.disconnect();
          }
        });
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
};

const useCounter = (target: string, start: boolean, duration = 1400) => {
  const [value, setValue] = useState(target);
  useEffect(() => {
    if (!start) return;
    // Extract leading number, keep prefix/suffix
    const match = target.match(/^([^\d-]*)(-?[\d.,]+)(.*)$/);
    if (!match) {
      setValue(target);
      return;
    }
    const prefix = match[1] ?? "";
    const numStr = match[2].replace(/,/g, "");
    const suffix = match[3] ?? "";
    const isFloat = numStr.includes(".");
    const end = parseFloat(numStr);
    if (isNaN(end)) {
      setValue(target);
      return;
    }
    const startTs = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - startTs) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const cur = end * eased;
      const formatted = isFloat ? cur.toFixed(1) : Math.round(cur).toString();
      setValue(`${prefix}${formatted}${suffix}`);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, start, duration]);
  return value;
};

const ResultStat = ({ label, value, delay }: { label: string; value: string; delay: number }) => {
  const { ref, visible } = useReveal<HTMLDivElement>(0.4);
  const animated = useCounter(value, visible);
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 900ms ease-out ${delay}ms, transform 900ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
      }}
    >
      <div
        className="font-extralight tracking-tight text-foreground tabular-nums"
        style={{
          fontSize: "clamp(2.25rem, 4.5vw, 4rem)",
          background:
            "linear-gradient(180deg, hsl(var(--foreground)) 0%, hsl(var(--foreground) / 0.55) 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {animated}
      </div>
      <div className="mt-3 text-[10px] tracking-[0.4em] uppercase text-foreground/50 font-light">
        {label}
      </div>
    </div>
  );
};

const SplitTitle = ({
  text,
  visible,
  delay = 0,
  fontSize,
  className = "",
}: {
  text: string;
  visible: boolean;
  delay?: number;
  fontSize: string;
  className?: string;
}) => {
  const words = text.split(" ");
  return (
    <h1
      className={`font-extralight uppercase leading-[0.9] tracking-[0.04em] text-foreground ${className}`}
      style={{ fontSize }}
    >
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom mr-[0.2em]">
          <span
            className="inline-block"
            style={{
              transform: visible ? "translateY(0)" : "translateY(110%)",
              opacity: visible ? 1 : 0,
              filter: visible ? "blur(0)" : "blur(10px)",
              transition: `transform 1100ms cubic-bezier(0.22, 1, 0.36, 1) ${
                delay + i * 80
              }ms, opacity 1100ms ease-out ${delay + i * 80}ms, filter 1100ms ease-out ${
                delay + i * 80
              }ms`,
            }}
          >
            {w}
          </span>
        </span>
      ))}
    </h1>
  );
};

const SectionLabel = ({ children, visible }: { children: React.ReactNode; visible: boolean }) => (
  <div
    className="flex items-center gap-3 mb-10"
    style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(12px)",
      transition: "all 800ms ease-out",
    }}
  >
    <span
      className="h-px bg-primary"
      style={{
        width: visible ? "32px" : "0px",
        transition: "width 700ms cubic-bezier(0.22, 1, 0.36, 1) 200ms",
      }}
    />
    <span className="text-[10px] md:text-xs tracking-[0.4em] uppercase text-primary font-light">
      {children}
    </span>
  </div>
);

const ProyectoDetalleV2 = () => {
  const { slug = "" } = useParams<{ slug: string }>();
  const location = useLocation();
  const project = getProjectBySlug(slug);
  const next = getNextProject(slug);
  const [heroIn, setHeroIn] = useState(false);
  const [progress, setProgress] = useState(0);

  // Resolve where to go back to (preserve v2/v3 if user came from there)
  const fromVariant = (location.state as { from?: string } | null)?.from;
  const backTo =
    fromVariant === "v3"
      ? "/proyectos/v3"
      : fromVariant === "v2"
      ? "/proyectos/v2"
      : "/proyectos";

  // Section reveals
  const challenge = useReveal<HTMLDivElement>(0.25);
  const solution = useReveal<HTMLDivElement>(0.25);
  const gallery = useReveal<HTMLDivElement>(0.15);
  const results = useReveal<HTMLDivElement>(0.2);
  const credits = useReveal<HTMLDivElement>(0.25);
  const nextRef = useReveal<HTMLDivElement>(0.3);
  const cover = useReveal<HTMLDivElement>(0.15);

  const heroImgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    const t = requestAnimationFrame(() => setHeroIn(true));
    return () => cancelAnimationFrame(t);
  }, [slug]);

  // Top progress bar + cover parallax
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const doc = document.documentElement;
        const max = doc.scrollHeight - window.innerHeight;
        const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
        setProgress(p);
        if (!reduced && heroImgRef.current) {
          const y = Math.min(120, window.scrollY * 0.18);
          heroImgRef.current.style.transform = `translateY(${y}px) scale(1.06)`;
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  if (!project) return <Navigate to="/proyectos" replace />;

  const stateColor =
    project.estado === "EN CONSTRUCCIÓN"
      ? "hsl(var(--secondary))"
      : project.estado === "EN ÓRBITA"
      ? "hsl(var(--primary))"
      : "hsl(var(--foreground) / 0.7)";

  return (
    <PageTransition>
      <SEO 
        title={project.name} 
        description={project.descripcion}
        image={project.cover} 
      />
      <main className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
        <HamburgerMenu />

      {/* Reading progress bar */}
      <div
        className="fixed top-0 left-0 right-0 h-[2px] z-40 pointer-events-none"
        style={{ background: "hsl(var(--foreground) / 0.06)" }}
      >
        <div
          className="h-full"
          style={{
            width: `${progress * 100}%`,
            background:
              "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)))",
            boxShadow: "0 0 12px hsl(var(--primary) / 0.6)",
            transition: "width 80ms linear",
          }}
        />
      </div>

      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <StarfieldParallax visible={true} />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% 10%, hsl(var(--primary) / 0.10) 0%, transparent 70%), radial-gradient(ellipse 40% 30% at 80% 90%, hsl(var(--secondary) / 0.06) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Back */}
      <div
        className="relative z-10 px-6 md:px-12 lg:px-20 pt-24"
        style={{
          opacity: heroIn ? 1 : 0,
          transform: heroIn ? "translateY(0)" : "translateY(-8px)",
          transition: "all 700ms ease-out 100ms",
        }}
      >
        <Link
          to={backTo}
          className="group inline-flex items-center gap-3 text-[10px] md:text-xs tracking-[0.4em] uppercase text-foreground/60 hover:text-foreground font-light transition-colors"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          Volver
        </Link>
      </div>

      {/* HERO */}
      <section className="relative z-10 px-6 md:px-12 lg:px-20 pt-12 pb-16 min-h-[80vh] flex flex-col justify-center">
        <div
          className="flex items-center gap-3 mb-10"
          style={{
            opacity: heroIn ? 1 : 0,
            transform: heroIn ? "translateY(0)" : "translateY(12px)",
            transition: "all 700ms ease-out 200ms",
          }}
        >
          <span className="text-[10px] md:text-xs tracking-[0.4em] uppercase text-foreground/55 font-light">
            Caso {project.id}
          </span>
          <span className="w-1 h-1 rounded-full bg-foreground/30" />
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: stateColor,
              boxShadow: `0 0 10px ${stateColor}`,
              animation: "pulse-dot 2.4s ease-in-out infinite",
            }}
          />
          <span
            className="text-[10px] md:text-xs tracking-[0.4em] uppercase font-light"
            style={{ color: stateColor }}
          >
            {project.estado}
          </span>
        </div>

        <SplitTitle
          text={project.name}
          visible={heroIn}
          delay={300}
          fontSize="clamp(3rem, 13vw, 11rem)"
        />

        <p
          className="mt-12 text-base md:text-xl text-foreground/70 font-light max-w-2xl leading-relaxed"
          style={{
            opacity: heroIn ? 1 : 0,
            transform: heroIn ? "translateY(0)" : "translateY(20px)",
            transition: "all 1000ms ease-out 700ms",
          }}
        >
          {project.descripcion}
        </p>

        <dl
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-8 max-w-4xl"
          style={{
            opacity: heroIn ? 1 : 0,
            transition: "opacity 1000ms ease-out 900ms",
          }}
        >
          {[
            ["CLIENTE", project.cliente],
            ["AÑO", project.año],
            ["TIPO", project.tipo],
            ["STACK", project.stack],
          ].map(([k, v], i) => (
            <div
              key={k}
              style={{
                opacity: heroIn ? 1 : 0,
                transform: heroIn ? "translateY(0)" : "translateY(14px)",
                transition: `all 800ms ease-out ${950 + i * 80}ms`,
              }}
            >
              <dt className="text-[9px] tracking-[0.4em] uppercase text-foreground/40 font-light mb-2">
                {k}
              </dt>
              <dd className="text-sm md:text-base text-foreground/90 font-light">{v}</dd>
            </div>
          ))}
        </dl>

        {/* Scroll cue */}
        <div
          className="mt-20 flex items-center gap-4"
          style={{
            opacity: heroIn ? 1 : 0,
            transition: "opacity 1200ms ease-out 1300ms",
          }}
        >
          <div
            className="h-px bg-foreground/15 flex-1 max-w-[120px]"
            style={{
              transform: heroIn ? "scaleX(1)" : "scaleX(0)",
              transformOrigin: "left",
              transition: "transform 1100ms cubic-bezier(0.22, 1, 0.36, 1) 1300ms",
            }}
          />
          <span className="text-[10px] tracking-[0.4em] uppercase text-foreground/40 font-light">
            ↓ Caso completo
          </span>
        </div>
      </section>

      {/* COVER with curtain reveal + parallax */}
      <section
        className="relative z-10 px-6 md:px-12 lg:px-20 mb-24 md:mb-32"
        ref={cover.ref}
      >
        <div
          className="relative aspect-[16/9] overflow-hidden bg-surface"
          style={{
            clipPath: cover.visible ? "inset(0 0 0 0)" : "inset(0 0 100% 0)",
            transition: "clip-path 1300ms cubic-bezier(0.65, 0, 0.35, 1) 100ms",
          }}
        >
          <img
            ref={heroImgRef}
            src={project.cover}
            alt={`${project.name} — cover`}
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              transform: "scale(1.06)",
              willChange: "transform",
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.45) 100%)",
            }}
          />
          {/* Corner ticks */}
          {[
            "top-3 left-3 border-t border-l",
            "top-3 right-3 border-t border-r",
            "bottom-3 left-3 border-b border-l",
            "bottom-3 right-3 border-b border-r",
          ].map((c) => (
            <span
              key={c}
              className={`absolute w-4 h-4 ${c}`}
              style={{
                borderColor: "hsl(var(--primary) / 0.55)",
                opacity: cover.visible ? 1 : 0,
                transition: "opacity 600ms ease-out 1200ms",
              }}
            />
          ))}
        </div>
      </section>

      {/* PROBLEM + SOLUTION */}
      <section className="relative z-10 px-6 md:px-12 lg:px-20 mb-24 md:mb-32">
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 max-w-6xl">
          <div ref={challenge.ref}>
            <SectionLabel visible={challenge.visible}>El desafío</SectionLabel>
            <p
              className="text-base md:text-lg text-foreground/80 font-light leading-relaxed"
              style={{
                opacity: challenge.visible ? 1 : 0,
                transform: challenge.visible ? "translateY(0)" : "translateY(20px)",
                transition: "all 1000ms ease-out 350ms",
              }}
            >
              {project.problema}
            </p>
          </div>
          <div ref={solution.ref}>
            <SectionLabel visible={solution.visible}>La solución</SectionLabel>
            <p
              className="text-base md:text-lg text-foreground/80 font-light leading-relaxed"
              style={{
                opacity: solution.visible ? 1 : 0,
                transform: solution.visible ? "translateY(0)" : "translateY(20px)",
                transition: "all 1000ms ease-out 350ms",
              }}
            >
              {project.solucion}
            </p>
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section
        ref={gallery.ref}
        className="relative z-10 px-6 md:px-12 lg:px-20 mb-24 md:mb-32"
      >
        <SectionLabel visible={gallery.visible}>Galería</SectionLabel>
        <div
          style={{
            opacity: gallery.visible ? 1 : 0,
            transform: gallery.visible ? "translateY(0)" : "translateY(24px)",
            transition: "all 1100ms ease-out 300ms",
          }}
        >
          <CaseGallery images={project.gallery} alt={project.name} />
        </div>
      </section>

      {/* RESULTS */}
      <section
        ref={results.ref}
        className="relative z-10 px-6 md:px-12 lg:px-20 mb-24 md:mb-32"
      >
        <SectionLabel visible={results.visible}>Resultados</SectionLabel>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {project.resultados.map((r, i) => (
            <ResultStat key={r.label} label={r.label} value={r.value} delay={i * 120} />
          ))}
        </div>
      </section>

      {/* CREDITS */}
      <section
        ref={credits.ref}
        className="relative z-10 px-6 md:px-12 lg:px-20 mb-24 md:mb-32"
      >
        <SectionLabel visible={credits.visible}>Créditos</SectionLabel>
        <ul className="space-y-3 max-w-2xl">
          {project.creditos.map((c, i) => (
            <li
              key={c.role}
              className="relative flex items-baseline justify-between gap-6 pb-3"
              style={{
                opacity: credits.visible ? 1 : 0,
                transform: credits.visible ? "translateY(0)" : "translateY(12px)",
                transition: `all 800ms ease-out ${300 + i * 100}ms`,
              }}
            >
              <span className="text-[10px] md:text-xs tracking-[0.3em] uppercase text-foreground/50 font-light">
                {c.role}
              </span>
              <span className="text-sm md:text-base text-foreground/90 font-light text-right">
                {c.name}
              </span>
              <span
                className="absolute bottom-0 left-0 h-px bg-foreground/10"
                style={{
                  width: credits.visible ? "100%" : "0%",
                  transition: `width 900ms cubic-bezier(0.22, 1, 0.36, 1) ${
                    400 + i * 100
                  }ms`,
                }}
              />
            </li>
          ))}
        </ul>
      </section>

      {/* NEXT — closes the journey */}
      {next && (
        <section
          ref={nextRef.ref}
          className="relative z-10 px-6 md:px-12 lg:px-20 py-24 md:py-40 border-t border-foreground/10 overflow-hidden"
        >
          {/* Ambient gradient */}
          <div
            className="absolute -top-40 left-1/2 -translate-x-1/2 w-[80vw] h-[60vh] pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse, hsl(var(--primary) / 0.18), transparent 70%)",
              filter: "blur(60px)",
              opacity: nextRef.visible ? 1 : 0,
              transition: "opacity 1500ms ease-out",
            }}
          />

          <p
            className="relative text-[10px] md:text-xs tracking-[0.4em] uppercase text-foreground/45 font-light mb-8"
            style={{
              opacity: nextRef.visible ? 1 : 0,
              transform: nextRef.visible ? "translateY(0)" : "translateY(12px)",
              transition: "all 800ms ease-out 100ms",
            }}
          >
            — Próximo caso
          </p>

          <Link
            to={`/proyectos/${next.slug}`}
            state={{ from: fromVariant }}
            className="group relative inline-flex items-baseline gap-6"
          >
            <h3
              className="font-extralight tracking-[0.06em] uppercase leading-[0.95] text-foreground transition-colors"
              style={{
                fontSize: "clamp(2.5rem, 9vw, 7rem)",
                opacity: nextRef.visible ? 1 : 0,
                transform: nextRef.visible ? "translateY(0)" : "translateY(40px)",
                transition: "all 1100ms cubic-bezier(0.22, 1, 0.36, 1) 250ms, color 300ms",
              }}
            >
              <span className="bg-gradient-to-r from-foreground via-foreground to-foreground bg-clip-text group-hover:from-foreground group-hover:via-primary group-hover:to-secondary transition-all">
                {next.name}
              </span>
            </h3>
            <span
              className="text-3xl md:text-5xl text-foreground/60 group-hover:text-primary group-hover:translate-x-3 transition-all"
              style={{
                opacity: nextRef.visible ? 1 : 0,
                transition: "opacity 900ms ease-out 600ms, transform 300ms, color 300ms",
              }}
            >
              →
            </span>
          </Link>

          <div
            className="mt-10 h-px bg-foreground/10 max-w-2xl"
            style={{
              transform: nextRef.visible ? "scaleX(1)" : "scaleX(0)",
              transformOrigin: "left",
              transition: "transform 1100ms cubic-bezier(0.22, 1, 0.36, 1) 500ms",
            }}
          />
        </section>
      )}

      {/* INTEGRATED MINIMAL FOOTER — ends the journey, no more scroll */}
      <footer className="relative z-10 px-6 md:px-12 lg:px-20 py-12">
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
          <Link to={backTo} className="hover:text-foreground transition-colors">
            ← Volver al index
          </Link>
          <a
            href="mailto:hola@limitless.studio"
            className="hover:text-foreground transition-colors"
          >
            hola@limitless.studio
          </a>
        </div>
      </footer>
    </main>
    </PageTransition>
  );
};

export default ProyectoDetalleV2;