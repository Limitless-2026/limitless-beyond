import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { Project } from "@/data/projects";

interface Props {
  project: Project;
  index: number;
  total: number;
}

const REVEAL_STEPS = {
  header: 0,
  line: 120,
  cover: 240,
  title: 420,
  underline: 720,
  meta: 820,
  desc: 920,
  cta: 1020,
};

const ProjectStationV2 = ({ project, index, total }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const coverWrapRef = useRef<HTMLDivElement>(null);
  const coverImgRef = useRef<HTMLImageElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const watermarkRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [hover, setHover] = useState(false);
  const [hoverPointer, setHoverPointer] = useState(false);
  const reverse = index % 2 === 1;
  const reduced = useRef(false);
  const isDesktop = useRef(false);
  const cursorPos = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    isDesktop.current = window.matchMedia("(hover: hover)").matches;

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

  // Parallax on scroll
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
        const t = (rect.top - vh / 2) / vh; // -1..1 ish
        const clamped = Math.max(-1.2, Math.min(1.2, t));
        if (coverImgRef.current) {
          coverImgRef.current.style.setProperty("--py", `${clamped * -40}px`);
        }
        if (sidebarRef.current) {
          sidebarRef.current.style.transform = `translateY(${clamped * 20}px)`;
        }
        if (watermarkRef.current) {
          watermarkRef.current.style.transform = `translateY(${clamped * -80}px)`;
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

  // Tilt + magnetic cursor inside cover
  useEffect(() => {
    if (reduced.current || !isDesktop.current) return;
    const wrap = coverWrapRef.current;
    if (!wrap) return;
    let raf = 0;
    let active = false;

    const animate = () => {
      raf = 0;
      cursorPos.current.x += (cursorPos.current.tx - cursorPos.current.x) * 0.18;
      cursorPos.current.y += (cursorPos.current.ty - cursorPos.current.y) * 0.18;
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${cursorPos.current.x - 50}px, ${cursorPos.current.y - 50}px)`;
      }
      if (active) raf = requestAnimationFrame(animate);
    };

    const onMove = (e: MouseEvent) => {
      const rect = wrap.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const rx = ((y - cy) / cy) * -4;
      const ry = ((x - cx) / cx) * 4;
      if (tiltRef.current) {
        tiltRef.current.style.transform = `perspective(1100px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      }
      if (glowRef.current) {
        glowRef.current.style.background = `radial-gradient(circle 220px at ${x}px ${y}px, hsl(var(--primary) / 0.32), transparent 70%)`;
      }
      cursorPos.current.tx = x;
      cursorPos.current.ty = y;
      if (!raf) {
        active = true;
        raf = requestAnimationFrame(animate);
      }
    };

    const onEnter = (e: MouseEvent) => {
      setHoverPointer(true);
      const rect = wrap.getBoundingClientRect();
      cursorPos.current.x = e.clientX - rect.left;
      cursorPos.current.y = e.clientY - rect.top;
      cursorPos.current.tx = cursorPos.current.x;
      cursorPos.current.ty = cursorPos.current.y;
    };

    const onLeave = () => {
      setHoverPointer(false);
      active = false;
      if (tiltRef.current) {
        tiltRef.current.style.transform = `perspective(1100px) rotateX(0deg) rotateY(0deg)`;
      }
      if (glowRef.current) {
        glowRef.current.style.background = "transparent";
      }
    };

    wrap.addEventListener("mouseenter", onEnter);
    wrap.addEventListener("mousemove", onMove);
    wrap.addEventListener("mouseleave", onLeave);
    return () => {
      wrap.removeEventListener("mouseenter", onEnter);
      wrap.removeEventListener("mousemove", onMove);
      wrap.removeEventListener("mouseleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const stateColor =
    project.estado === "EN CONSTRUCCIÓN"
      ? "hsl(var(--secondary))"
      : project.estado === "EN ÓRBITA"
      ? "hsl(var(--primary))"
      : "hsl(var(--foreground) / 0.7)";

  const titleWords = project.name.split(" ");

  const revealStyle = (delay: number, distance = 24): React.CSSProperties => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : `translateY(${distance}px)`,
    transition: `opacity 900ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, transform 900ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
  });

  return (
    <div
      ref={ref}
      className="relative w-full px-6 md:px-12 lg:px-20 py-24 md:py-40"
      data-station={index}
    >
      {/* Giant watermark number */}
      <div
        ref={watermarkRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center select-none"
        style={{ willChange: "transform" }}
      >
        <span
          className="font-extralight tracking-[0.06em]"
          style={{
            fontSize: "clamp(12rem, 28vw, 22rem)",
            color: "hsl(var(--foreground))",
            opacity: visible ? 0.04 : 0,
            transition: "opacity 1400ms ease-out 200ms",
            lineHeight: 1,
          }}
        >
          {project.id}
        </span>
      </div>

      {/* Header */}
      <div className="relative flex items-center gap-4 mb-12 md:mb-16" style={revealStyle(REVEAL_STEPS.header, 12)}>
        <span className="text-[11px] md:text-xs tracking-[0.4em] text-foreground/60 font-light">
          {project.id}
        </span>
        <div className="relative flex-1 h-px overflow-hidden">
          <div
            className="absolute inset-0 bg-foreground/15"
            style={{
              transform: visible ? "scaleX(1)" : "scaleX(0)",
              transformOrigin: "left",
              transition: `transform 900ms cubic-bezier(0.22, 1, 0.36, 1) ${REVEAL_STEPS.line}ms`,
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, transparent 40%, hsl(var(--primary) / 0.7) 50%, transparent 60%, transparent 100%)",
              backgroundSize: "200% 100%",
              animation: visible ? "shimmer 6s ease-in-out infinite" : "none",
              opacity: visible ? 1 : 0,
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: stateColor,
              boxShadow: `0 0 10px ${stateColor}`,
              animation: "pulse-dot 2.4s ease-in-out infinite",
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
        className={`relative grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-start ${
          reverse ? "md:[direction:rtl]" : ""
        }`}
      >
        {/* Visual */}
        <div className="md:col-span-7 [direction:ltr]">
          <div
            ref={coverWrapRef}
            className="relative"
            style={{
              cursor: hoverPointer ? "none" : "auto",
            }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
          >
            <div
              ref={tiltRef}
              style={{
                transition: "transform 600ms cubic-bezier(0.22, 1, 0.36, 1)",
                transformStyle: "preserve-3d",
                willChange: "transform",
              }}
            >
              <Link
                to={`/proyectos/v2/${project.slug}`}
                state={{ from: "v2" }}
                className="relative block aspect-[4/3] overflow-hidden bg-surface group"
                style={{
                  clipPath: visible ? "inset(0 0 0 0)" : "inset(100% 0 0 0)",
                  transition: `clip-path 1100ms cubic-bezier(0.65, 0, 0.35, 1) ${REVEAL_STEPS.cover}ms`,
                }}
              >
                <img
                  ref={coverImgRef}
                  src={project.cover}
                  alt={`${project.name} — cover`}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{
                    transform: `translateY(var(--py, 0px)) scale(${hover ? 1.06 : 1.04})`,
                    transition: "transform 900ms cubic-bezier(0.22, 1, 0.36, 1)",
                    willChange: "transform",
                  }}
                />
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.45) 100%)",
                    opacity: hover ? 0.5 : 0.82,
                    transition: "opacity 600ms ease-out",
                  }}
                />
                <div
                  ref={glowRef}
                  className="absolute inset-0 pointer-events-none"
                  style={{ mixBlendMode: "screen" }}
                />
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
              </Link>
            </div>

            {/* Custom magnetic cursor */}
            <div
              ref={cursorRef}
              aria-hidden
              className="pointer-events-none absolute top-0 left-0 w-[100px] h-[100px] rounded-full flex items-center justify-center"
              style={{
                background: "hsl(var(--primary) / 0.92)",
                boxShadow: "0 0 40px hsl(var(--primary) / 0.45)",
                opacity: hoverPointer ? 1 : 0,
                scale: hoverPointer ? "1" : "0.4",
                transition: "opacity 280ms ease-out, scale 320ms cubic-bezier(0.22, 1, 0.36, 1)",
                willChange: "transform, opacity",
              }}
            >
              <span className="text-[9px] tracking-[0.35em] uppercase font-light text-primary-foreground">
                Ver caso
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div
          ref={sidebarRef}
          className="md:col-span-5 [direction:ltr] flex flex-col"
          style={{ willChange: "transform" }}
        >
          <h2
            className="font-extralight uppercase leading-[0.95] mb-6"
            style={{
              fontSize: "clamp(2.25rem, 5vw, 4.5rem)",
              animation: visible ? "breathe-tracking 8s ease-in-out infinite" : "none",
              background: hover
                ? "linear-gradient(90deg, hsl(var(--foreground)) 0%, hsl(var(--primary)) 50%, hsl(var(--secondary)) 100%)"
                : "none",
              WebkitBackgroundClip: hover ? "text" : "border-box",
              WebkitTextFillColor: hover ? "transparent" : "hsl(var(--foreground))",
              transition: "all 500ms ease-out",
            }}
          >
            {titleWords.map((word, wi) => (
              <span key={wi} className="inline-block overflow-hidden align-bottom mr-[0.25em]">
                <span
                  className="inline-block"
                  style={{
                    transform: visible ? "translateY(0)" : "translateY(110%)",
                    opacity: visible ? 1 : 0,
                    transition: `transform 900ms cubic-bezier(0.22, 1, 0.36, 1) ${
                      REVEAL_STEPS.title + wi * 60
                    }ms, opacity 900ms ease-out ${REVEAL_STEPS.title + wi * 60}ms`,
                  }}
                >
                  {word}
                </span>
              </span>
            ))}
          </h2>

          {/* Underline */}
          <div
            className="relative h-px bg-foreground/10 mb-8 overflow-hidden"
            style={{
              transform: visible ? "scaleX(1)" : "scaleX(0)",
              transformOrigin: "left",
              transition: `transform 700ms cubic-bezier(0.22, 1, 0.36, 1) ${REVEAL_STEPS.underline}ms`,
            }}
          >
            <div
              className="absolute inset-y-0 left-0"
              style={{
                width: hover ? "100%" : "0%",
                background: "hsl(var(--primary))",
                transition: "width 500ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            />
          </div>

          {/* Meta */}
          <dl className="grid grid-cols-2 gap-y-4 gap-x-6 mb-8" style={revealStyle(REVEAL_STEPS.meta)}>
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

          <p
            className="text-sm md:text-base text-foreground/65 font-light leading-relaxed mb-10 max-w-md"
            style={revealStyle(REVEAL_STEPS.desc)}
          >
            {project.descripcion}
          </p>

          <div style={revealStyle(REVEAL_STEPS.cta)}>
            <Link
              to={`/proyectos/v2/${project.slug}`}
              state={{ from: "v2" }}
              className="self-start group/cta inline-flex items-center gap-3"
              aria-label={`Ver caso ${project.name}`}
            >
              <span className="text-[11px] tracking-[0.4em] uppercase text-foreground/80 font-light group-hover/cta:text-primary transition-colors border-b border-foreground/30 group-hover/cta:border-primary pb-1">
                Ver caso
              </span>
              <span className="text-foreground/80 group-hover/cta:text-primary group-hover/cta:translate-x-1 transition-all">
                →
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Orbital connector to next station */}
      {index < total - 1 && (
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 -bottom-16 md:-bottom-24 w-px h-32 md:h-48"
          style={{
            background:
              "repeating-linear-gradient(180deg, hsl(var(--foreground) / 0.18) 0 4px, transparent 4px 10px)",
            opacity: visible ? 1 : 0,
            transition: "opacity 900ms ease-out 800ms",
          }}
        >
          <span
            className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
            style={{
              top: "10%",
              background: "hsl(var(--primary))",
              boxShadow: "0 0 12px hsl(var(--primary) / 0.8)",
              animation: "pulse-dot 2.4s ease-in-out infinite",
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ProjectStationV2;