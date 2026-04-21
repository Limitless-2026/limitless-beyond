import { useRef, useState } from "react";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { useMouseParallax } from "@/hooks/useMouseParallax";

interface Service {
  id: string;
  title: string;
  description: string;
  orbit: "inner" | "outer";
  angleOffset: number;
  impact?: boolean;
}

const SERVICES: Service[] = [
  { id: "01", title: "Diseño Web",      description: "Sitios que sienten el peso de cada pixel.", orbit: "inner", angleOffset: 0   },
  { id: "02", title: "Desarrollo Web",  description: "Código limpio, performance de élite.",      orbit: "inner", angleOffset: 120 },
  { id: "03", title: "Apps Mobile",     description: "iOS y Android con identidad propia.",       orbit: "inner", angleOffset: 240 },
  { id: "04", title: "Software / SaaS", description: "Productos digitales escalables a medida.",  orbit: "outer", angleOffset: 60  },
  { id: "05", title: "Branding",        description: "Identidades que rompen la inercia visual.", orbit: "outer", angleOffset: 180, impact: true },
  { id: "06", title: "Publicidad",      description: "Campañas con dirección de arte propia.",    orbit: "outer", angleOffset: 300 },
];

const innerR = 180;
const outerR = 320;

const ServicesOrbit = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const progress = useScrollProgress(sectionRef);
  const mouse = useMouseParallax();
  const [hovered, setHovered] = useState<string | null>(null);

  const enter = Math.min(1, Math.max(0, (progress - 0.05) / 0.2));
  const exit  = Math.min(1, Math.max(0, (progress - 0.78) / 0.2));
  const systemScale = 0.6 + enter * 0.4 - exit * 0.5;
  const systemOpacity = enter * (1 - exit * 0.85);
  const coreFlash = exit > 0.5 ? Math.pow((exit - 0.5) / 0.5, 1.4) : 0;

  const paused = hovered ? "paused" : "running";

  return (
    <section
      ref={sectionRef}
      className="relative w-full z-10"
      style={{ height: "240vh" }}
    >
      <style>{`
        @keyframes orbit-spin-inner { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes orbit-spin-outer { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes orbit-counter-inner { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes orbit-counter-outer { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <div
        className="sticky top-0 left-0 w-full h-screen overflow-hidden"
        style={{ contain: "layout paint", transform: "translateZ(0)" }}
      >
        <div
          className="absolute top-10 left-0 w-full text-center pointer-events-none z-20"
          style={{ opacity: enter }}
        >
          <p className="text-[10px] md:text-xs tracking-[0.4em] uppercase text-foreground/50 font-light">
            Capacidades · En órbita
          </p>
        </div>

        <div
          className="absolute top-24 left-0 w-full text-center px-6 pointer-events-none z-20"
          style={{ opacity: enter * (1 - exit) }}
        >
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-light tracking-tight text-foreground leading-tight">
            Todo lo que rompe
            <br />
            <span className="italic font-extralight bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
              lo conocido
            </span>
          </h2>
        </div>

        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ perspective: "1400px", perspectiveOrigin: "50% 50%" }}
        >
          <div
            className="relative"
            style={{
              width: outerR * 2,
              height: outerR * 2,
              transformStyle: "preserve-3d",
              transform: `rotateX(${mouse.y * -8}deg) rotateY(${mouse.x * 8}deg) scale(${systemScale})`,
              opacity: systemOpacity,
              transition: "opacity 200ms linear",
            }}
          >
            {/* Anillos guía */}
            <div
              className="absolute top-1/2 left-1/2 rounded-full border border-foreground/10"
              style={{ width: innerR * 2, height: innerR * 2, marginLeft: -innerR, marginTop: -innerR }}
            />
            <div
              className="absolute top-1/2 left-1/2 rounded-full border border-foreground/[0.06]"
              style={{ width: outerR * 2, height: outerR * 2, marginLeft: -outerR, marginTop: -outerR }}
            />

            {/* Núcleo */}
            <div
              className="absolute top-1/2 left-1/2 rounded-full"
              style={{
                width: 60, height: 60, marginLeft: -30, marginTop: -30,
                background: "radial-gradient(circle, hsl(var(--primary) / 0.95) 0%, hsl(var(--primary) / 0.5) 35%, transparent 70%)",
                boxShadow: "0 0 80px hsl(var(--primary) / 0.7), 0 0 160px hsl(var(--primary) / 0.35)",
                transform: `scale(${1 + coreFlash * 3})`,
                opacity: 1 - coreFlash * 0.3,
              }}
            />
            <div
              className="absolute top-1/2 left-1/2 rounded-full pointer-events-none"
              style={{
                width: 12, height: 12, marginLeft: -6, marginTop: -6,
                background: "hsl(var(--foreground))",
                boxShadow: `0 0 ${20 + coreFlash * 200}px hsl(var(--foreground) / ${0.8 + coreFlash * 0.2})`,
              }}
            />

            {/* Anillos rotantes (CSS) — uno para cada órbita */}
            {(["inner", "outer"] as const).map((orbit) => {
              const r = orbit === "inner" ? innerR : outerR;
              const spin = orbit === "inner" ? "orbit-spin-inner" : "orbit-spin-outer";
              const counter = orbit === "inner" ? "orbit-counter-inner" : "orbit-counter-outer";
              return (
                <div
                  key={orbit}
                  className="absolute top-1/2 left-1/2"
                  style={{
                    width: 0,
                    height: 0,
                    animation: `${spin} 52s linear infinite`,
                    animationPlayState: paused,
                    willChange: "transform",
                  }}
                >
                  {SERVICES.filter((s) => s.orbit === orbit).map((s) => {
                    const isHovered = hovered === s.id;
                    return (
                      <div
                        key={s.id}
                        className="absolute pointer-events-auto"
                        style={{
                          top: 0,
                          left: 0,
                          transform: `rotate(${s.angleOffset}deg) translateX(${r}px)`,
                        }}
                      >
                        <div
                          style={{
                            animation: `${counter} 52s linear infinite`,
                            animationPlayState: paused,
                            willChange: "transform",
                          }}
                        >
                          <div
                            style={{
                              transform: `rotate(${-s.angleOffset}deg) scale(${isHovered ? 1.15 : 1})`,
                              transition: "transform 300ms cubic-bezier(0.2,0.8,0.2,1)",
                            }}
                            onMouseEnter={() => setHovered(s.id)}
                            onMouseLeave={() => setHovered(null)}
                          >
                            <div
                              className="relative -translate-x-1/2 -translate-y-1/2 px-4 py-3 rounded-md"
                              style={{
                                background: isHovered ? "rgba(8,6,14,0.92)" : "rgba(8,6,14,0.78)",
                                border: `1px solid hsl(var(--foreground) / ${isHovered ? 0.25 : 0.1})`,
                                boxShadow: isHovered
                                  ? "0 0 40px hsl(var(--primary) / 0.4)"
                                  : "0 0 20px hsl(var(--primary) / 0.12)",
                                minWidth: 160,
                                textShadow: "0 1px 8px rgba(0,0,0,0.6)",
                              }}
                            >
                              <div className="flex items-baseline gap-2 mb-1">
                                <span className="text-[9px] tracking-[0.3em] text-primary/80 font-light">{s.id}</span>
                                <span className="text-[9px] tracking-[0.3em] uppercase text-foreground/40 font-light">
                                  {orbit === "inner" ? "Núcleo" : "Órbita"}
                                </span>
                              </div>
                              <h3
                                className="text-sm md:text-base font-light tracking-tight text-foreground whitespace-nowrap"
                                style={{ fontFamily: "Arkitech, system-ui, sans-serif", letterSpacing: "0.05em" }}
                              >
                                {s.title.toUpperCase()}
                              </h3>
                              <div
                                className="overflow-hidden transition-all duration-300"
                                style={{ maxHeight: isHovered ? 60 : 0, opacity: isHovered ? 1 : 0 }}
                              >
                                <p className="text-[11px] mt-2 text-foreground/70 font-light leading-snug">
                                  {s.description}
                                </p>
                              </div>
                              {s.impact && isHovered && (
                                <div
                                  className="absolute left-3 right-3 bottom-1 h-px"
                                  style={{ background: "#C8007A" }}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        <div
          className="absolute bottom-16 left-0 w-full text-center px-6 pointer-events-none z-20"
          style={{ opacity: enter * (1 - exit) }}
        >
          <p className="text-xs md:text-sm tracking-[0.3em] uppercase text-foreground/55 font-light">
            Un solo equipo · Disciplinas que se cruzan
          </p>
        </div>

        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
          style={{ opacity: enter * (1 - exit) * 0.6 }}
        >
          <span className="text-[9px] tracking-[0.3em] uppercase text-foreground/40">Continuar</span>
          <div className="w-px h-8 bg-gradient-to-b from-foreground/40 to-transparent" />
        </div>
      </div>
    </section>
  );
};

export default ServicesOrbit;