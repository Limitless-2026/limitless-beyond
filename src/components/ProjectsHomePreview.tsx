import { Link } from "react-router-dom";
import { PROJECTS } from "@/data/projects";

const ProjectsHomePreview = () => {
  const featured = PROJECTS.slice(0, 3);

  return (
    <section className="relative bg-black text-foreground py-32 md:py-48 px-6 md:px-12 overflow-hidden">
      {/* eyebrow + title */}
      <div className="max-w-7xl mx-auto mb-20 md:mb-32">
        <p className="text-[10px] md:text-xs tracking-[0.45em] uppercase text-primary font-light mb-6">
          Proyectos · 04
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

      {/* lista */}
      <ul className="max-w-7xl mx-auto divide-y divide-foreground/10 border-y border-foreground/10">
        {featured.map((p) => (
          <li key={p.id}>
            <Link
              to={`/proyectos/${p.slug}`}
              className="group grid grid-cols-12 items-center gap-6 py-8 md:py-12 transition-colors hover:bg-foreground/[0.02]"
            >
              <span className="col-span-2 md:col-span-1 text-[10px] md:text-xs tracking-[0.3em] text-foreground/40 font-light">
                {p.id}
              </span>

              <div className="col-span-10 md:col-span-5">
                <h3 className="text-3xl md:text-5xl font-extralight tracking-tight text-foreground transition-transform duration-500 group-hover:translate-x-2">
                  {p.name}
                </h3>
                <p className="mt-2 text-xs md:text-sm text-foreground/50 font-light">
                  {p.tipo} · {p.año}
                </p>
              </div>

              <div className="hidden md:block col-span-4 relative aspect-[16/10] overflow-hidden rounded-sm">
                <img
                  src={p.cover}
                  alt={p.name}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-transparent to-transparent" />
              </div>

              <span className="col-span-12 md:col-span-2 text-right text-[10px] md:text-xs tracking-[0.3em] uppercase text-primary font-light">
                Ver caso →
              </span>
            </Link>
          </li>
        ))}
      </ul>

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
