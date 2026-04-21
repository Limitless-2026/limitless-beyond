import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { Project } from "@/data/projects";

interface Props {
  project: Project;
  index: number;
  total: number;
}

const ProjectStationV3 = ({ project, index, total }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [hover, setHover] = useState(false);
  const reduced = useRef(false);
  const reverse = index % 2 === 1;

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Scroll-driven parallax & strip translate
  useEffect(() => {
    if (reduced.current) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const t = Math.max(-1.4, Math.min(1.4, (rect.top - vh / 2) / vh));
        if (imgRef.current) {
          imgRef.current.style.transform = `translateY(${t * -60}px) scale(${hover ? 1.08 : 1.05})`;
        }
        if (stripRef.current) {
          stripRef.current.style.transform = `translateX(${t * (reverse ? 80 : -80)}px)`;
        }
        if (numberRef.current) {
          numberRef.current.style.transform = `translate(${t * (reverse ? -30 : 30)}px, ${t * -20}px)`;
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [hover, reverse]);

  const stateColor =
    project.estado === "EN CONSTRUCCIÓN"
      ? "hsl(var(--secondary))"
      : project.estado === "EN ÓRBITA"
      ? "hsl(var(--primary))"
      : "hsl(var(--foreground) / 0.7)";

  // Marquee text repeated
  const marqueeText = `${project.name} — ${project.tipo} — ${project.año} — `;
  const marqueeRepeated = Array(8).fill(marqueeText).join("");

  return (
    <article
      ref={ref}
      className="relative w-full border-t border-foreground/10"
      data-index={index}
    >
      {/* Top mono strip — index / status / year */}
      <div className="relative grid grid-cols-12 gap-4 px-4 md:px-8 py-3 md:py-4 text-[10px] md:text-[11px] font-mono uppercase tracking-[0.25em] text-foreground/55">
        <span className="col-span-2">[ {project.id} / {String(total).padStart(2, "0")} ]</span>
        <span className="col-span-3 hidden md:block">{project.tipo}</span>
        <span className="col-span-3 hidden md:flex items-center gap-2">
          <span
            className="w-1.5 h-1.5 rounded-full inline-block"
            style={{
              background: stateColor,
              boxShadow: `0 0 8px ${stateColor}`,
              animation: "pulse-dot 2.4s ease-in-out infinite",
            }}
          />
          <span style={{ color: stateColor }}>{project.estado}</span>
        </span>
        <span className="col-span-4 md:col-span-2 text-right md:text-left">{project.año}</span>
        <span className="col-span-6 md:col-span-2 text-right">{project.cliente}</span>
      </div>

      {/* Big collision row: huge title + watermark number */}
      <div className="relative px-4 md:px-8 pt-8 md:pt-14 pb-8 md:pb-12 overflow-hidden">
        <span
          ref={numberRef}
          aria-hidden
          className="pointer-events-none absolute font-extralight leading-none select-none"
          style={{
            top: "-2vw",
            [reverse ? "right" : "left"]: "-3vw",
            fontSize: "clamp(14rem, 32vw, 28rem)",
            color: "hsl(var(--primary))",
            opacity: visible ? 0.08 : 0,
            transition: "opacity 1400ms ease-out 200ms, transform 100ms linear",
            willChange: "transform",
          }}
        >
          {project.id}
        </span>

        <h2
          className="relative font-extralight uppercase leading-[0.85] tracking-[-0.01em]"
          style={{
            fontSize: "clamp(3.5rem, 14vw, 13rem)",
            mixBlendMode: "difference",
          }}
        >
          <span className="inline-block overflow-hidden align-bottom">
            <span
              className="inline-block"
              style={{
                transform: visible ? "translateY(0)" : "translateY(110%)",
                transition: "transform 1100ms cubic-bezier(0.85, 0, 0.15, 1)",
              }}
            >
              {project.name}
            </span>
          </span>
        </h2>
      </div>

      {/* Cover + meta sidebar */}
      <div className={`relative grid grid-cols-12 gap-x-4 gap-y-8 px-4 md:px-8 pb-10 md:pb-16 ${reverse ? "md:[direction:rtl]" : ""}`}>
        {/* Cover */}
        <div className="col-span-12 md:col-span-8 [direction:ltr]">
          <div
            ref={coverRef}
            className="relative aspect-[16/10] overflow-hidden bg-surface group"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
              clipPath: visible ? "inset(0 0 0 0)" : "inset(0 100% 0 0)",
              transition: "clip-path 1300ms cubic-bezier(0.85, 0, 0.15, 1) 200ms",
            }}
          >
            <Link
              to={`/proyectos/v3/${project.slug}`}
              state={{ from: "v3" }}
              className="block w-full h-full"
            >
              <img
                ref={imgRef}
                src={project.cover}
                alt={`${project.name} — cover`}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  willChange: "transform",
                  filter: hover ? "grayscale(0) contrast(1.05)" : "grayscale(0.6) contrast(1.05)",
                  transition: "filter 700ms ease-out",
                }}
              />

              {/* Color split overlay (RGB shift hover) */}
              <div
                className="absolute inset-0 pointer-events-none mix-blend-screen"
                style={{
                  background: hover
                    ? "linear-gradient(115deg, hsl(var(--primary) / 0.22), transparent 40%, hsl(var(--secondary) / 0.18))"
                    : "transparent",
                  transition: "background 600ms ease-out",
                }}
              />

              {/* Scanline */}
              <div
                className="absolute inset-0 pointer-events-none overflow-hidden opacity-40"
                style={{ mixBlendMode: "overlay" }}
              >
                <div
                  className="absolute left-0 right-0 h-[2px]"
                  style={{
                    background:
                      "linear-gradient(180deg, transparent, hsl(var(--primary) / 0.6), transparent)",
                    animation: hover ? "scanline 1.6s linear infinite" : "none",
                  }}
                />
              </div>

              {/* Corner ticks */}
              {[
                "top-2 left-2 border-t border-l",
                "top-2 right-2 border-t border-r",
                "bottom-2 left-2 border-b border-l",
                "bottom-2 right-2 border-b border-r",
              ].map((c) => (
                <span
                  key={c}
                  className={`absolute w-3 h-3 ${c}`}
                  style={{
                    borderColor: "hsl(var(--primary) / 0.7)",
                    opacity: hover ? 1 : 0.35,
                    transition: "opacity 300ms ease-out",
                  }}
                />
              ))}

              {/* Bottom strip */}
              <div
                className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2 font-mono text-[10px] tracking-[0.3em] uppercase text-foreground/90"
                style={{
                  background: "linear-gradient(0deg, hsl(var(--background) / 0.8), transparent)",
                  transform: hover ? "translateY(0)" : "translateY(20%)",
                  opacity: hover ? 1 : 0,
                  transition: "all 500ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                <span>{project.stack}</span>
                <span className="text-primary">→ Ver caso</span>
              </div>
            </Link>
          </div>

          {/* Marquee under cover */}
          <div
            ref={stripRef}
            className="relative mt-3 overflow-hidden whitespace-nowrap py-2 border-y border-foreground/10"
            style={{
              willChange: "transform",
            }}
          >
            <div
              className="inline-block font-mono text-[10px] md:text-[11px] tracking-[0.4em] uppercase"
              style={{
                animation: `${reverse ? "marquee-x-reverse" : "marquee-x"} 28s linear infinite`,
                color: "hsl(var(--foreground) / 0.55)",
              }}
            >
              {marqueeRepeated}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="col-span-12 md:col-span-4 [direction:ltr] flex flex-col">
          <div
            className="font-mono text-[10px] tracking-[0.35em] uppercase text-foreground/45 mb-4"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(12px)",
              transition: "all 800ms ease-out 600ms",
            }}
          >
            ── Sinopsis
          </div>
          <p
            className="text-sm md:text-base text-foreground/80 font-light leading-relaxed mb-8"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(16px)",
              transition: "all 900ms ease-out 720ms",
            }}
          >
            {project.descripcion}
          </p>

          <dl
            className="grid grid-cols-2 gap-y-4 gap-x-6 mb-8 font-mono"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(16px)",
              transition: "all 900ms ease-out 820ms",
            }}
          >
            {[
              ["CLIENTE", project.cliente],
              ["AÑO", project.año],
              ["STACK", project.stack],
              ["TIPO", project.tipo],
            ].map(([k, v]) => (
              <div key={k} className="border-l border-foreground/15 pl-3">
                <dt className="text-[9px] tracking-[0.4em] uppercase text-foreground/40 mb-1">
                  {k}
                </dt>
                <dd className="text-xs text-foreground/85">{v}</dd>
              </div>
            ))}
          </dl>

          <Link
            to={`/proyectos/v3/${project.slug}`}
            state={{ from: "v3" }}
            className="self-start group/cta inline-flex items-center gap-3 font-mono text-[11px] tracking-[0.4em] uppercase border border-foreground/30 px-4 py-3 hover:bg-primary hover:border-primary hover:text-primary-foreground transition-colors"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(16px)",
              transition: "all 900ms ease-out 920ms, background 200ms ease-out, color 200ms ease-out",
            }}
          >
            <span>[ Abrir caso ]</span>
            <span className="group-hover/cta:translate-x-1 transition-transform">→</span>
          </Link>
        </aside>
      </div>
    </article>
  );
};

export default ProjectStationV3;