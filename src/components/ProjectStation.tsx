import { useEffect, useRef, useState } from "react";
import type { Project } from "@/data/projects";

interface Props {
  project: Project;
  index: number;
}

const ProjectStation = ({ project, index }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [hover, setHover] = useState(false);
  const reverse = index % 2 === 1;

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
      { threshold: 0.18 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const stateColor =
    project.estado === "EN CONSTRUCCIÓN"
      ? "hsl(var(--secondary))" // magenta — única aparición
      : project.estado === "EN ÓRBITA"
      ? "hsl(var(--primary))"
      : "hsl(var(--foreground) / 0.7)";

  return (
    <div
      ref={ref}
      className="relative w-full px-6 md:px-12 lg:px-20 py-20 md:py-32"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(40px)",
        transition: `opacity 800ms ease-out ${index * 80}ms, transform 800ms ease-out ${
          index * 80
        }ms`,
      }}
    >
      {/* Row header: number + line + status */}
      <div className="flex items-center gap-4 mb-10 md:mb-14">
        <span className="text-[11px] md:text-xs tracking-[0.4em] text-foreground/60 font-light">
          {project.id}
        </span>
        <div className="flex-1 h-px bg-foreground/15" />
        <div className="flex items-center gap-2">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: stateColor,
              boxShadow: `0 0 8px ${stateColor}`,
            }}
          />
          <span
            className="text-[10px] tracking-[0.4em] uppercase font-light"
            style={{ color: stateColor }}
          >
            {project.estado}
          </span>
        </div>
      </div>

      {/* Content row */}
      <div
        className={`grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-start ${
          reverse ? "md:[direction:rtl]" : ""
        }`}
      >
        {/* Visual */}
        <div
          className="md:col-span-7 [direction:ltr]"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          <div className="relative aspect-[4/3] overflow-hidden bg-surface group cursor-pointer">
            {/* Placeholder: gradient + name */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 80% 70% at 30% 30%, hsl(var(--primary) / 0.35) 0%, transparent 60%), radial-gradient(ellipse 70% 60% at 80% 80%, hsl(var(--secondary) / 0.25) 0%, transparent 60%), linear-gradient(135deg, hsl(260 12% 8%), hsl(260 14% 5%))",
                transform: hover ? "scale(1.04)" : "scale(1)",
                transition: "transform 800ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            />
            {/* Center name */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span
                className="text-3xl md:text-5xl lg:text-6xl font-extralight tracking-[0.2em] uppercase"
                style={{
                  color: "hsl(var(--foreground) / 0.22)",
                  textShadow: "0 0 30px rgba(0,0,0,0.6)",
                }}
              >
                {project.name}
              </span>
            </div>

            {/* Animated ring corners (clip-path style) */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                border: "1px solid hsl(var(--primary) / 0.7)",
                clipPath: hover
                  ? "polygon(0 0, 100% 0, 100% 100%, 0 100%)"
                  : "polygon(0 0, 0 0, 0 0, 0 0)",
                transition: "clip-path 700ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            />

            {/* Hover overlay label */}
            <div
              className="absolute bottom-4 right-4 text-[10px] tracking-[0.4em] uppercase font-light text-foreground/80"
              style={{
                opacity: hover ? 1 : 0,
                transform: hover ? "translateY(0)" : "translateY(8px)",
                transition: "opacity 300ms ease-out, transform 300ms ease-out",
              }}
            >
              Explorar →
            </div>
          </div>
        </div>

        {/* Sidebar: title + meta + cta */}
        <div className="md:col-span-5 [direction:ltr] flex flex-col">
          <h2
            className="font-extralight tracking-[0.08em] uppercase leading-[0.95] mb-6"
            style={{
              fontSize: "clamp(2.25rem, 5vw, 4.5rem)",
              background: hover
                ? "linear-gradient(90deg, hsl(var(--foreground)) 0%, hsl(var(--primary)) 50%, hsl(var(--secondary)) 100%)"
                : "none",
              WebkitBackgroundClip: hover ? "text" : "border-box",
              WebkitTextFillColor: hover ? "transparent" : "hsl(var(--foreground))",
              transition: "all 500ms ease-out",
            }}
          >
            {project.name}
          </h2>

          {/* Underline */}
          <div className="relative h-px bg-foreground/10 mb-8 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0"
              style={{
                width: hover ? "100%" : "0%",
                background: "hsl(var(--primary))",
                transition: "width 500ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            />
          </div>

          {/* Meta grid */}
          <dl className="grid grid-cols-2 gap-y-4 gap-x-6 mb-8">
            {[
              ["CLIENTE", project.cliente],
              ["AÑO", project.año],
              ["STACK", project.stack],
              ["TIPO", project.tipo],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[9px] tracking-[0.4em] uppercase text-foreground/40 font-light mb-1.5">
                  {k}
                </dt>
                <dd className="text-xs md:text-sm text-foreground/85 font-light">{v}</dd>
              </div>
            ))}
          </dl>

          {/* Description */}
          <p className="text-sm md:text-base text-foreground/65 font-light leading-relaxed mb-10 max-w-md">
            {project.descripcion}
          </p>

          {/* CTA */}
          <button
            type="button"
            disabled
            className="self-start group/cta flex items-center gap-3 cursor-not-allowed"
            aria-label={`Ver caso ${project.name} (próximamente)`}
          >
            <span className="text-[11px] tracking-[0.4em] uppercase text-foreground/70 font-light group-hover/cta:text-foreground transition-colors">
              Ver caso
            </span>
            <span className="text-foreground/70 group-hover/cta:translate-x-1 transition-transform">
              →
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectStation;