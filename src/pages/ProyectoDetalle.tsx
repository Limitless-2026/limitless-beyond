import { useEffect, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import HamburgerMenu from "@/components/HamburgerMenu";
import StarfieldParallax from "@/components/StarfieldParallax";
import CosmicFooterV2 from "@/components/CosmicFooterV2";
import CaseGallery from "@/components/CaseGallery";
import { getProjectBySlug, getNextProject } from "@/data/projects";

const ProyectoDetalle = () => {
  const { slug = "" } = useParams<{ slug: string }>();
  const project = getProjectBySlug(slug);
  const next = getNextProject(slug);
  const [heroIn, setHeroIn] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    const t = requestAnimationFrame(() => setHeroIn(true));
    return () => cancelAnimationFrame(t);
  }, [slug]);

  if (!project) return <Navigate to="/proyectos" replace />;

  const stateColor =
    project.estado === "EN CONSTRUCCIÓN"
      ? "hsl(var(--secondary))"
      : project.estado === "EN ÓRBITA"
      ? "hsl(var(--primary))"
      : "hsl(var(--foreground) / 0.7)";

  return (
    <main className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
      <HamburgerMenu />

      <div className="fixed inset-0 z-0 pointer-events-none">
        <StarfieldParallax visible={true} />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% 10%, hsl(var(--primary) / 0.10) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Back */}
      <div className="relative z-10 px-6 md:px-12 lg:px-20 pt-24">
        <Link
          to="/proyectos"
          className="group inline-flex items-center gap-3 text-[10px] md:text-xs tracking-[0.4em] uppercase text-foreground/60 hover:text-foreground font-light transition-colors"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          Volver a constelación
        </Link>
      </div>

      {/* HERO */}
      <section
        className="relative z-10 px-6 md:px-12 lg:px-20 pt-12 pb-16"
        style={{
          opacity: heroIn ? 1 : 0,
          transform: heroIn ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 800ms ease-out, transform 800ms ease-out",
        }}
      >
        <div className="flex items-center gap-3 mb-8">
          <span className="text-[10px] md:text-xs tracking-[0.4em] uppercase text-foreground/55 font-light">
            Caso {project.id}
          </span>
          <span className="w-1 h-1 rounded-full bg-foreground/30" />
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: stateColor, boxShadow: `0 0 8px ${stateColor}` }}
          />
          <span
            className="text-[10px] md:text-xs tracking-[0.4em] uppercase font-light"
            style={{ color: stateColor }}
          >
            {project.estado}
          </span>
        </div>

        <h1
          className="font-extralight tracking-[0.06em] uppercase leading-[0.9] text-foreground"
          style={{ fontSize: "clamp(3rem, 12vw, 10rem)" }}
        >
          {project.name}
        </h1>

        <p className="mt-10 text-base md:text-xl text-foreground/70 font-light max-w-2xl leading-relaxed">
          {project.descripcion}
        </p>

        {/* Meta row */}
        <dl className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-8 max-w-4xl">
          {[
            ["CLIENTE", project.cliente],
            ["AÑO", project.año],
            ["TIPO", project.tipo],
            ["STACK", project.stack],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-[9px] tracking-[0.4em] uppercase text-foreground/40 font-light mb-2">
                {k}
              </dt>
              <dd className="text-sm md:text-base text-foreground/90 font-light">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* COVER */}
      <section className="relative z-10 px-6 md:px-12 lg:px-20 mb-24 md:mb-32">
        <div className="relative aspect-[16/9] overflow-hidden bg-surface">
          <img
            src={project.cover}
            alt={`${project.name} — cover`}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.45) 100%)",
            }}
          />
        </div>
      </section>

      {/* PROBLEM + SOLUTION */}
      <section className="relative z-10 px-6 md:px-12 lg:px-20 mb-24 md:mb-32">
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 max-w-6xl">
          <div>
            <h3 className="text-[10px] md:text-xs tracking-[0.4em] uppercase text-primary font-light mb-6">
              — El desafío
            </h3>
            <p className="text-base md:text-lg text-foreground/80 font-light leading-relaxed">
              {project.problema}
            </p>
          </div>
          <div>
            <h3 className="text-[10px] md:text-xs tracking-[0.4em] uppercase text-primary font-light mb-6">
              — La solución
            </h3>
            <p className="text-base md:text-lg text-foreground/80 font-light leading-relaxed">
              {project.solucion}
            </p>
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section className="relative z-10 px-6 md:px-12 lg:px-20 mb-24 md:mb-32">
        <h3 className="text-[10px] md:text-xs tracking-[0.4em] uppercase text-primary font-light mb-10">
          — Galería
        </h3>
        <CaseGallery images={project.gallery} alt={project.name} />
      </section>

      {/* RESULTS */}
      <section className="relative z-10 px-6 md:px-12 lg:px-20 mb-24 md:mb-32">
        <h3 className="text-[10px] md:text-xs tracking-[0.4em] uppercase text-primary font-light mb-10">
          — Resultados
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {project.resultados.map((r) => (
            <div key={r.label}>
              <div
                className="font-extralight tracking-tight text-foreground"
                style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
              >
                {r.value}
              </div>
              <div className="mt-2 text-[10px] tracking-[0.4em] uppercase text-foreground/50 font-light">
                {r.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CREDITS */}
      <section className="relative z-10 px-6 md:px-12 lg:px-20 mb-24 md:mb-32">
        <h3 className="text-[10px] md:text-xs tracking-[0.4em] uppercase text-primary font-light mb-8">
          — Créditos
        </h3>
        <ul className="space-y-3 max-w-2xl">
          {project.creditos.map((c) => (
            <li
              key={c.role}
              className="flex items-baseline justify-between gap-6 border-b border-foreground/10 pb-3"
            >
              <span className="text-[10px] md:text-xs tracking-[0.3em] uppercase text-foreground/50 font-light">
                {c.role}
              </span>
              <span className="text-sm md:text-base text-foreground/90 font-light text-right">
                {c.name}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* NEXT */}
      {next && (
        <section className="relative z-10 px-6 md:px-12 lg:px-20 py-20 md:py-32 border-t border-foreground/10">
          <p className="text-[10px] md:text-xs tracking-[0.4em] uppercase text-foreground/45 font-light mb-6">
            — Próximo caso
          </p>
          <Link
            to={`/proyectos/${next.slug}`}
            className="group inline-flex items-baseline gap-6"
          >
            <h3
              className="font-extralight tracking-[0.06em] uppercase leading-[0.95] text-foreground group-hover:text-primary transition-colors"
              style={{ fontSize: "clamp(2.5rem, 8vw, 6rem)" }}
            >
              {next.name}
            </h3>
            <span className="text-3xl md:text-5xl text-foreground/60 group-hover:text-primary group-hover:translate-x-2 transition-all">
              →
            </span>
          </Link>
        </section>
      )}

      <div className="relative z-10">
        <CosmicFooterV2 />
      </div>
    </main>
  );
};

export default ProyectoDetalle;
