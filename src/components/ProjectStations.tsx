import { useEffect, useRef, useState } from "react";

interface Project {
  id: string;
  name: string;
  category: string;
  year: string;
  description: string;
}

const PROJECTS: Project[] = [
  { id: "01", name: "Nebula OS", category: "Plataforma SaaS", year: "2025", description: "Dashboard de gestión orbital para equipos remotos." },
  { id: "02", name: "Aurora Commerce", category: "E-commerce", year: "2024", description: "Tienda inmersiva con realidad aumentada para una marca de diseño." },
  { id: "03", name: "Pulsar Studio", category: "Branding & Web", year: "2024", description: "Identidad visual y site editorial para un estudio de música." },
  { id: "04", name: "Quantum Bank", category: "Fintech", year: "2025", description: "App bancaria con flujos sin fricción y diseño minimalista." },
  { id: "05", name: "Helios Health", category: "Producto digital", year: "2023", description: "Sistema de telemedicina con foco en accesibilidad." },
  { id: "06", name: "Cosmos Travel", category: "Marketplace", year: "2025", description: "Plataforma de experiencias de viaje con storytelling visual." },
];

const ProjectStations = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setMouse({ x: (e.clientX / w - 0.5) * 2, y: (e.clientY / h - 0.5) * 2 });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // Each station has a fixed pseudo-random position in a "constellation" layout
  // Positions are in viewport-relative units (vw/vh). Distributed across multiple screens of scroll.
  const stations = PROJECTS.map((p, i) => {
    // Spread stations vertically across ~3 viewport heights with horizontal variation
    const top = 15 + i * 32; // % of containerHeight
    const left = i % 2 === 0 ? 18 + (i * 7) % 25 : 55 + (i * 5) % 25; // %
    const depth = 0.3 + ((i * 0.17) % 0.7); // 0.3–1 — closer = larger parallax
    return { ...p, top, left, depth };
  });

  return (
    <section
      ref={containerRef}
      className="relative w-full pointer-events-none z-10"
      style={{ height: `${stations.length * 32 + 30}vh` }}
    >
      {/* Section heading */}
      <div className="sticky top-8 left-0 w-full text-center pointer-events-none z-20">
        <p className="text-[10px] md:text-xs tracking-[0.4em] uppercase text-foreground/40 font-light">
          Constelación · Proyectos seleccionados
        </p>
      </div>

      {stations.map((s) => {
        const isActive = active === s.id;
        // Parallax — mouse offset modulated by station depth
        const px = -mouse.x * s.depth * 18;
        const py = -mouse.y * s.depth * 12;
        return (
          <div
            key={s.id}
            className="absolute pointer-events-auto"
            style={{
              top: `${s.top}%`,
              left: `${s.left}%`,
              transform: `translate(-50%, -50%) translate(${px}px, ${py}px) scale(${0.6 + s.depth * 0.5})`,
              transition: "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
              opacity: 0.4 + s.depth * 0.6,
            }}
            onMouseEnter={() => setActive(s.id)}
            onMouseLeave={() => setActive(null)}
          >
            {/* Station node */}
            <div className="relative group cursor-pointer">
              {/* Outer ring */}
              <div
                className="absolute inset-0 rounded-full border border-foreground/20 transition-all duration-500"
                style={{
                  width: isActive ? "120px" : "80px",
                  height: isActive ? "120px" : "80px",
                  transform: "translate(-50%, -50%)",
                  left: "50%",
                  top: "50%",
                  borderColor: isActive ? "hsl(var(--primary) / 0.6)" : "hsl(var(--foreground) / 0.15)",
                  boxShadow: isActive ? "0 0 40px hsl(var(--primary) / 0.25)" : "none",
                }}
              />
              {/* Inner dot */}
              <div
                className="absolute rounded-full transition-all duration-500"
                style={{
                  width: isActive ? "10px" : "6px",
                  height: isActive ? "10px" : "6px",
                  background: isActive ? "hsl(var(--primary))" : "hsl(var(--foreground) / 0.7)",
                  transform: "translate(-50%, -50%)",
                  left: "50%",
                  top: "50%",
                  boxShadow: isActive ? "0 0 20px hsl(var(--primary) / 0.8)" : "0 0 6px hsl(var(--foreground) / 0.3)",
                }}
              />
              {/* Connecting line + label */}
              <div
                className="absolute left-[60px] top-1/2 -translate-y-1/2 flex items-center gap-3 transition-opacity duration-300"
                style={{ opacity: isActive ? 1 : 0.7 }}
              >
                <div
                  className="h-px transition-all duration-500"
                  style={{
                    width: isActive ? "32px" : "20px",
                    background: isActive
                      ? "linear-gradient(to right, hsl(var(--primary) / 0.8), transparent)"
                      : "linear-gradient(to right, hsl(var(--foreground) / 0.35), transparent)",
                  }}
                />
                <div className="whitespace-nowrap">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] tracking-[0.3em] text-foreground/40 font-light">
                      {s.id}
                    </span>
                    <h3
                      className="text-base md:text-lg font-light tracking-tight transition-colors duration-300"
                      style={{ color: isActive ? "hsl(var(--foreground))" : "hsl(var(--foreground) / 0.75)" }}
                    >
                      {s.name}
                    </h3>
                  </div>
                  <p className="text-[10px] md:text-xs tracking-wide text-foreground/45 font-light mt-0.5">
                    {s.category} · {s.year}
                  </p>
                  {isActive && (
                    <p
                      className="text-xs md:text-sm text-foreground/65 font-light mt-2 max-w-[260px] leading-relaxed"
                      style={{ animation: "fade-in 0.4s ease-out" }}
                    >
                      {s.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
};

export default ProjectStations;
