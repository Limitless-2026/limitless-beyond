import { useEffect, useRef, useState } from "react";

interface Project {
  id: string;
  name: string;
  category: string;
  year: string;
  image: string;
}

// Imágenes placeholder de webs de referencia (Unsplash) — el usuario las cambiará después
const PROJECTS: Project[] = [
  { id: "01", name: "Nebula OS",       category: "Plataforma SaaS",   year: "2025", image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80" },
  { id: "02", name: "Aurora Commerce", category: "E-commerce",        year: "2024", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80" },
  { id: "03", name: "Pulsar Studio",   category: "Branding & Web",    year: "2024", image: "https://images.unsplash.com/photo-1481487196290-c152efe083f5?w=800&q=80" },
  { id: "04", name: "Quantum Bank",    category: "Fintech",           year: "2025", image: "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=800&q=80" },
  { id: "05", name: "Helios Health",   category: "Producto digital",  year: "2023", image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80" },
  { id: "06", name: "Cosmos Travel",   category: "Marketplace",       year: "2025", image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80" },
];

// Cada proyecto ocupa una "ventana" de scroll en la sección.
// El scroll relativo dentro del proyecto controla su Z (de lejos a cerca).
const ProjectsWarp = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0); // 0..PROJECTS.length

  useEffect(() => {
    const onScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      const raw = scrolled / total; // 0..1
      // Buffer: ignorar el primer 30% para dar un "vacío estelar"
      const buffered = Math.max(0, (raw - 0.3) / 0.7);
      const p = buffered * PROJECTS.length;
      setProgress(p);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full z-10"
      style={{ height: `${PROJECTS.length * 100 + 50}vh` }}
    >
      {/* Sticky stage — la perspectiva 3D vive aquí */}
      <div
        className="sticky top-0 left-0 w-full h-screen overflow-hidden flex items-center justify-center"
        style={{ perspective: "1200px", perspectiveOrigin: "50% 50%" }}
      >
        {/* Heading */}
        <div className="absolute top-10 left-0 w-full text-center pointer-events-none z-20">
          <p className="text-[10px] md:text-xs tracking-[0.4em] uppercase text-foreground/50 font-light">
            Proyectos · Atravesando el espacio
          </p>
          <p className="text-[10px] tracking-[0.3em] uppercase text-foreground/30 font-light mt-2">
            {String(Math.min(PROJECTS.length, Math.floor(progress) + 1)).padStart(2, "0")}
            <span className="mx-2">/</span>
            {String(PROJECTS.length).padStart(2, "0")}
          </p>
        </div>

        {/* Cards en 3D */}
        <div
          className="relative w-full h-full"
          style={{ transformStyle: "preserve-3d" }}
        >
          {PROJECTS.map((project, i) => {
            // Cada card empieza muy lejos (z muy negativo) y avanza hasta pasar al viewer.
            // local: -1 (lejos, recién apareciendo) → 0 (en posición ideal) → +1 (pasó al viewer)
            const local = progress - i;

            // Mapeo de Z y opacidad
            const z = -2200 + local * 2400; // de muy lejos (-2200) a pasado (+200)
            const opacity =
              local < -1.2 ? 0 :
              local < 0   ? Math.max(0, 1 + local * 0.85) :
              local < 0.7 ? 1 :
              Math.max(0, 1 - (local - 0.7) * 3);

            // Pequeño desplazamiento lateral alterno para sensación de vuelo
            const xOffset = i % 2 === 0 ? -120 : 120;
            const yOffset = i % 3 === 0 ? -80 : i % 3 === 1 ? 60 : -30;

            const visible = opacity > 0.01;

            return (
              <div
                key={project.id}
                className="absolute top-1/2 left-1/2"
                style={{
                  width: "min(560px, 70vw)",
                  height: "min(360px, 45vh)",
                  marginLeft: "calc(min(560px, 70vw) / -2)",
                  marginTop: "calc(min(360px, 45vh) / -2)",
                  transform: `translate3d(${xOffset}px, ${yOffset}px, ${z}px)`,
                  opacity,
                  visibility: visible ? "visible" : "hidden",
                  transformStyle: "preserve-3d",
                  willChange: "transform, opacity",
                }}
              >
                {/* Card */}
                <div
                  className="relative w-full h-full rounded-lg overflow-hidden border border-foreground/10"
                  style={{
                    background: "rgba(8, 6, 14, 0.85)",
                    boxShadow: `0 0 60px hsl(var(--primary) / ${0.15 + Math.max(0, 1 - Math.abs(local)) * 0.25}), inset 0 0 0 1px hsla(0,0%,100%,0.04)`,
                  }}
                >
                  <img
                    src={project.image}
                    alt={project.name}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover opacity-70"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/30 to-transparent" />

                  {/* Meta */}
                  <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
                    <div className="flex items-baseline gap-3 mb-2">
                      <span className="text-[10px] tracking-[0.3em] text-primary/80 font-light">
                        {project.id}
                      </span>
                      <span className="text-[10px] tracking-[0.3em] uppercase text-foreground/50 font-light">
                        {project.category} · {project.year}
                      </span>
                    </div>
                    <h3 className="text-2xl md:text-4xl font-light tracking-tight text-foreground">
                      {project.name}
                    </h3>
                  </div>

                  {/* Esquinas decorativas estilo HUD */}
                  <div className="absolute top-3 left-3 w-4 h-4 border-l border-t border-primary/40" />
                  <div className="absolute top-3 right-3 w-4 h-4 border-r border-t border-primary/40" />
                  <div className="absolute bottom-3 left-3 w-4 h-4 border-l border-b border-primary/40" />
                  <div className="absolute bottom-3 right-3 w-4 h-4 border-r border-b border-primary/40" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Indicador de scroll */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none">
          <span className="text-[9px] tracking-[0.3em] uppercase text-foreground/40">
            Scroll · Warp
          </span>
          <div className="w-px h-8 bg-gradient-to-b from-foreground/40 to-transparent" />
        </div>
      </div>
    </section>
  );
};

export default ProjectsWarp;
