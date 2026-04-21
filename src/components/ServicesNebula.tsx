import { useRef } from "react";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { useMouseParallax } from "@/hooks/useMouseParallax";

interface Service {
  id: string;
  title: string;
  tag: string;
  description: string;
  impact?: boolean;
}

const SERVICES: Service[] = [
  { id: "01", title: "DISEÑO WEB",      tag: "Diseño",     description: "Sitios que respiran. Que duelen. Que ganan." },
  { id: "02", title: "DESARROLLO WEB",  tag: "Ingeniería", description: "Código performante. Arquitectura clara." },
  { id: "03", title: "APPS MOBILE",     tag: "Producto",   description: "Productos nativos. iOS y Android sin compromisos." },
  { id: "04", title: "SOFTWARE / SAAS", tag: "Plataforma", description: "Plataformas que escalan con tu ambición." },
  { id: "05", title: "BRANDING",        tag: "Identidad",  description: "Identidades que rompen la inercia visual.", impact: true },
  { id: "06", title: "PUBLICIDAD",      tag: "Campañas",   description: "Campañas con dirección de arte propia." },
];

const STAR_GAP_VW = 60; // separación horizontal entre estrellas
const TOTAL_TRAVEL_VW = (SERVICES.length - 1) * STAR_GAP_VW;

/**
 * Sección de servicios — constelación horizontal.
 * Sticky 100vh; el scroll vertical se mapea a translateX del strip.
 */
const ServicesNebula = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const progress = useScrollProgress(sectionRef);
  const mouse = useMouseParallax();

  // Curva de entrada/salida del título y elementos UI
  const enter = Math.min(1, Math.max(0, (progress - 0.02) / 0.12));
  const exit = Math.min(1, Math.max(0, (progress - 0.88) / 0.12));
  const uiOpacity = enter * (1 - exit);

  // Travel progress — la parte central del scroll mueve el strip
  const travel = Math.min(1, Math.max(0, (progress - 0.10) / 0.78));

  // Posición del strip: empieza centrado en estrella 0, termina centrado en estrella 5.
  // Usamos translateX desde 0 a -TOTAL_TRAVEL_VW.
  const stripX = -travel * TOTAL_TRAVEL_VW;

  // Índice activo (estrella en el centro)
  const activeIdx = Math.min(
    SERVICES.length - 1,
    Math.max(0, Math.round(travel * (SERVICES.length - 1))),
  );

  // Línea de constelación: dashoffset según progreso
  const pathLength = 2000; // arbitrario; se normaliza con stroke-dasharray
  const dashOffset = pathLength * (1 - travel);

  // Coordenadas de cada estrella en el strip (en vw, viewBox de 600 unidades = total)
  // El strip tiene ancho de TOTAL_TRAVEL_VW + 100vw (padding lateral). Usamos un viewBox proporcional.
  const VIEW_W = TOTAL_TRAVEL_VW + 100; // unidades = vw
  const VIEW_H = 100;
  const starX = (idx: number) => 50 + idx * STAR_GAP_VW;
  const starY = (idx: number) =>
    50 + Math.sin(idx * 1.2) * 8 + (idx % 2 === 0 ? -4 : 4); // ondulación suave

  // Path bezier que conecta las estrellas
  const path = SERVICES.map((_, idx) => {
    if (idx === 0) return `M ${starX(0)} ${starY(0)}`;
    const prevX = starX(idx - 1);
    const prevY = starY(idx - 1);
    const x = starX(idx);
    const y = starY(idx);
    const cx1 = prevX + (x - prevX) * 0.5;
    const cy1 = prevY;
    const cx2 = prevX + (x - prevX) * 0.5;
    const cy2 = y;
    return `C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x} ${y}`;
  }).join(" ");

  return (
    <section
      ref={sectionRef}
      className="relative w-full z-10"
      style={{ height: "400vh" }}
    >
      <style>{`
        @keyframes sn-pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
          50% { transform: translate(-50%, -50%) scale(1.15); opacity: 0.85; }
        }
      `}</style>

      <div
        className="sticky top-0 left-0 w-full h-screen overflow-hidden bg-background"
        style={{ contain: "layout paint", transform: "translateZ(0)" }}
      >
        {/* Eyebrow superior */}
        <div
          className="absolute top-10 left-0 w-full text-center pointer-events-none z-30"
          style={{ opacity: uiOpacity, transition: "opacity 200ms linear" }}
        >
          <p className="text-[10px] md:text-xs tracking-[0.4em] uppercase text-foreground/50 font-light">
            Capacidades · Constelación
          </p>
        </div>

        {/* Halo violeta de fondo, se mueve sutilmente con el mouse */}
        <div
          className="absolute left-1/2 top-1/2 pointer-events-none rounded-full"
          style={{
            width: "60vmax",
            height: "60vmax",
            transform: `translate(calc(-50% + ${mouse.x * 30}px), calc(-50% + ${mouse.y * 30}px))`,
            background:
              "radial-gradient(circle, hsl(var(--primary) / 0.18) 0%, transparent 60%)",
            filter: "blur(80px)",
            opacity: uiOpacity * 0.9,
            mixBlendMode: "screen",
            zIndex: 1,
          }}
        />

        {/* Strip horizontal con SVG de la constelación + estrellas */}
        <div
          className="absolute top-0 left-0 h-full"
          style={{
            width: `${VIEW_W}vw`,
            transform: `translate3d(calc(50vw - 50vw + ${stripX}vw + ${mouse.x * -8}px), ${mouse.y * -6}px, 0)`,
            willChange: "transform",
            zIndex: 5,
          }}
        >
          {/* SVG con la línea de la constelación */}
          <svg
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            preserveAspectRatio="none"
            style={{ overflow: "visible" }}
          >
            {/* Línea base tenue */}
            <path
              d={path}
              fill="none"
              stroke="hsl(var(--foreground) / 0.08)"
              strokeWidth={0.15}
              vectorEffect="non-scaling-stroke"
            />
            {/* Línea activa que se "dibuja" con el scroll */}
            <path
              d={path}
              fill="none"
              stroke="hsl(var(--primary) / 0.55)"
              strokeWidth={0.25}
              vectorEffect="non-scaling-stroke"
              strokeDasharray={pathLength}
              strokeDashoffset={dashOffset}
              style={{
                filter: "drop-shadow(0 0 4px hsl(var(--primary) / 0.6))",
                transition: "stroke-dashoffset 80ms linear",
              }}
            />
          </svg>

          {/* Estrellas — posicionadas en porcentaje del strip */}
          {SERVICES.map((s, idx) => {
            const isActive = idx === activeIdx;
            const distance = Math.abs(idx - activeIdx);
            const opacity = isActive ? 1 : Math.max(0.3, 1 - distance * 0.35);
            const scale = isActive ? 1.4 : 1;
            const isImpact = !!s.impact;
            const coreColor = isImpact ? "#C8007A" : "hsl(var(--foreground))";
            const glowColor = isImpact
              ? "rgba(200, 0, 122, 0.7)"
              : "hsl(var(--primary) / 0.7)";
            const titleUnderline = isImpact ? "#C8007A" : "transparent";

            const leftPct = (starX(idx) / VIEW_W) * 100;
            const topPct = (starY(idx) / VIEW_H) * 100;

            return (
              <div
                key={s.id}
                className="absolute"
                style={{
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  transform: "translate(-50%, -50%)",
                  zIndex: isActive ? 20 : 10,
                }}
              >
                {/* Anillo orbital pulsante */}
                <div
                  className="absolute left-1/2 top-1/2 rounded-full pointer-events-none"
                  style={{
                    width: 80,
                    height: 80,
                    border: `1px solid ${isImpact ? "rgba(200, 0, 122, 0.4)" : "hsl(var(--primary) / 0.4)"}`,
                    animation: `sn-pulse ${3 + (idx % 3) * 0.6}s ease-in-out infinite`,
                    opacity: opacity * 0.7,
                  }}
                />
                {/* Núcleo */}
                <div
                  className="rounded-full"
                  style={{
                    width: 8,
                    height: 8,
                    background: coreColor,
                    boxShadow: `0 0 60px 8px ${glowColor}, 0 0 18px ${glowColor}`,
                    transform: `scale(${scale})`,
                    transition: "transform 400ms cubic-bezier(0.2,0.8,0.2,1)",
                    opacity,
                  }}
                />

                {/* Número del servicio */}
                <span
                  className="absolute left-1/2 -translate-x-1/2 text-foreground/40 font-light whitespace-nowrap"
                  style={{
                    top: 28,
                    fontFamily: "Arkitech, system-ui, sans-serif",
                    fontSize: "11px",
                    letterSpacing: "0.4em",
                    opacity,
                  }}
                >
                  {s.id}
                </span>

                {/* Panel título + descripción (solo el activo) */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none"
                  style={{
                    top: 60,
                    width: "min(80vw, 540px)",
                    opacity: isActive ? 1 : 0,
                    transform: `translateX(-50%) translateY(${isActive ? 0 : 10}px)`,
                    transition:
                      "opacity 500ms cubic-bezier(0.2,0.8,0.2,1), transform 500ms cubic-bezier(0.2,0.8,0.2,1)",
                  }}
                >
                  <span
                    className="block text-[10px] tracking-[0.35em] uppercase text-foreground/45 font-light mb-3"
                    style={{ fontFamily: "DM Sans, system-ui, sans-serif" }}
                  >
                    {s.tag}
                  </span>
                  <h3
                    className="text-foreground font-extralight"
                    style={{
                      fontFamily: "Arkitech, system-ui, sans-serif",
                      fontSize: "clamp(1.8rem, 4.5vw, 3.5rem)",
                      letterSpacing: "0.05em",
                      lineHeight: 1,
                      borderBottom: `1px solid ${titleUnderline}`,
                      display: "inline-block",
                      paddingBottom: isImpact ? 6 : 0,
                    }}
                  >
                    {s.title}
                  </h3>
                  <p
                    className="mt-5 text-sm md:text-base text-foreground/70 font-light leading-relaxed max-w-md mx-auto"
                    style={{ fontFamily: "DM Sans, system-ui, sans-serif", fontWeight: 300 }}
                  >
                    {s.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Indicador de progreso */}
        <div
          className="absolute bottom-10 left-0 w-full px-6 md:px-12 pointer-events-none z-30"
          style={{ opacity: uiOpacity }}
        >
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            <span
              className="text-[10px] tracking-[0.4em] uppercase text-foreground/55 font-light"
              style={{ fontFamily: "Arkitech, system-ui, sans-serif" }}
            >
              {String(activeIdx + 1).padStart(2, "0")} / {String(SERVICES.length).padStart(2, "0")}
            </span>
            <div className="flex-1 h-px bg-foreground/10 relative">
              <div
                className="absolute top-0 left-0 h-full bg-foreground/60"
                style={{
                  width: `${travel * 100}%`,
                  transition: "width 80ms linear",
                }}
              />
            </div>
            <span className="text-[10px] tracking-[0.3em] uppercase text-foreground/40 font-light">
              Constelación
            </span>
          </div>
        </div>

        {/* Hint de scroll lateral */}
        <div
          className="absolute top-1/2 right-6 -translate-y-1/2 flex flex-col items-center gap-2 pointer-events-none z-30"
          style={{ opacity: uiOpacity * (1 - travel) * 0.8 }}
        >
          <span
            className="text-[9px] tracking-[0.3em] uppercase text-foreground/40 font-light"
            style={{ writingMode: "vertical-rl" }}
          >
            Scroll · Atravesar
          </span>
        </div>
      </div>
    </section>
  );
};

export default ServicesNebula;