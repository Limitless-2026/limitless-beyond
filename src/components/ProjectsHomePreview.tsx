import { Link } from "react-router-dom";
import { PROJECTS_ORDERED } from "@/data/projects";

const ProjectsHomePreview = () => {
  const featured = PROJECTS_ORDERED.slice(0, 6);

  return (
    <section className="relative bg-black text-foreground py-28 md:py-40 px-6 md:px-12 overflow-hidden">
      {/* eyebrow + title */}
      <div className="max-w-7xl mx-auto mb-20 md:mb-32">
        <p className="text-[10px] md:text-xs tracking-[0.45em] uppercase text-primary font-light mb-6">
          Proyectos · {String(PROJECTS_ORDERED.length).padStart(2, "0")}
        </p>
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-extralight tracking-tight leading-[0.95] text-foreground">
          Casos
          <br />
          <span className="italic font-extralight bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
            en órbita
          </span>
        </h2>
        <p className="mt-8 max-w-md text-sm md:text-base text-foreground/60 font-light">
          Una constelación de marcas que rompieron sus límites con nosotros.
        </p>
      </div>

      {/* cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {featured.map((p) => {
          const disabled = p.estado === "EN CONSTRUCCIÓN";
          const Card = (
            <div className="group relative overflow-hidden rounded-xl border border-foreground/10 bg-foreground/[0.02] hover:bg-foreground/[0.03] transition-colors">
              <div className="relative aspect-[16/11] overflow-hidden">
                <img
                  src={p.cover}
                  alt={p.name}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="text-[10px] tracking-[0.3em] uppercase text-foreground/70 font-light">
                    {p.id}
                  </span>
                  <span
                    className="text-[10px] tracking-[0.25em] uppercase font-light px-2 py-1 rounded-full border"
                    style={{
                      borderColor:
                        p.estado === "LANZADO"
                          ? "rgba(237,236,232,0.18)"
                          : "rgba(200,0,122,0.35)",
                      color:
                        p.estado === "LANZADO"
                          ? "rgba(237,236,232,0.55)"
                          : "rgba(200,0,122,0.85)",
                      background:
                        p.estado === "LANZADO"
                          ? "rgba(0,0,0,0.25)"
                          : "rgba(200,0,122,0.08)",
                    }}
                  >
                    {p.estado}
                  </span>
                </div>
              </div>

              <div className="p-5 md:p-6">
                <h3 className="text-2xl md:text-3xl font-extralight tracking-tight text-foreground">
                  {p.name}
                </h3>
                <p className="mt-2 text-xs md:text-sm text-foreground/50 font-light">
                  {p.tipo} · {p.año}
                </p>

                <div className="mt-6 flex items-center justify-between">
                  <span className="text-[10px] tracking-[0.3em] uppercase text-primary font-light">
                    {disabled ? "Próximamente" : "Ver caso →"}
                  </span>
                </div>
              </div>
            </div>
          );

          return (
            <div key={p.id} className={disabled ? "opacity-70" : ""}>
              {disabled ? (
                Card
              ) : (
                <Link to={`/proyectos/${p.slug}`} className="block">
                  {Card}
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="max-w-7xl mx-auto mt-20 md:mt-28 flex justify-center">
        <Link
          to="/proyectos"
          className="group inline-flex items-center gap-4 px-8 py-4 border border-foreground/20 rounded-full text-xs md:text-sm tracking-[0.35em] uppercase text-foreground/80 font-light hover:border-primary hover:text-foreground transition-colors"
        >
          Ver todos los proyectos
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </Link>
      </div>
    </section>
  );
};

export default ProjectsHomePreview;
