import { useEffect, useRef, useState } from "react";
import { useScrollProgress } from "@/hooks/useScrollProgress";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

const win = (p: number, a: number, b: number) => {
  if (p <= a) return 0;
  if (p >= b) return 1;
  return (p - a) / (b - a);
};

const QUESTION_WORDS_TOP = ["¿LISTOS"];
const QUESTION_WORDS_BOT = ["PARA", "CRUZAR?"];

/**
 * Footer V2 — explosión en tres tiempos, más larga y orgánica.
 * Stage 360vh. Continuidad cromática con el shader del hero.
 */
const CosmicFooterV2 = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const progress = useScrollProgress(sectionRef);

  // Halo rotation — tick lento (≈30ms) sin re-renders en cascada.
  const [haloAngle, setHaloAngle] = useState(0);
  useEffect(() => {
    let raf = 0;
    let last = 0;
    const tick = (t: number) => {
      if (t - last > 30) {
        last = t;
        setHaloAngle((a) => (a + 0.4) % 360);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Vibración orgánica del punto durante el colapso (±0.5px).
  const [jitter, setJitter] = useState({ x: 0, y: 0 });
  useEffect(() => {
    let raf = 0;
    let last = 0;
    const tick = (t: number) => {
      if (t - last > 60) {
        last = t;
        setJitter({
          x: (Math.random() - 0.5),
          y: (Math.random() - 0.5),
        });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // ─── Fases reescaladas ──────────────────────────────────────────────
  const collapseP = win(progress, 0.0, 0.24);   // colapso lento
  const chargeP = win(progress, 0.24, 0.40);    // carga profunda
  const blastP = win(progress, 0.40, 0.56);     // estallido (ventana general)
  const dustP = win(progress, 0.56, 0.72);      // polvo + nebulosa residual
  const overlayP = win(progress, 0.0, 0.40);    // overlay negro creciendo

  // Tres tiempos del estallido
  const preFlashP = win(progress, 0.40, 0.43);  // pre-flash suave (peak 0.5)
  const corePhase = win(progress, 0.43, 0.50);  // núcleo expuesto
  const shockPhase = win(progress, 0.46, 0.56); // shockwave principal
  const shardsPhase = win(progress, 0.43, 0.55); // esquirlas

  // Pre-flash (peak 0.5)
  const preFlashCenter = 0.415;
  const preFlashWidth = 0.018;
  const preFlashDist = Math.abs(progress - preFlashCenter);
  const preFlashOpacity =
    preFlashDist >= preFlashWidth
      ? 0
      : Math.pow(1 - preFlashDist / preFlashWidth, 1.8) * 0.5;

  // Flash blanco principal (más suave)
  const flashCenter = 0.49;
  const flashWidth = 0.08;
  const flashDist = Math.abs(progress - flashCenter);
  const flashOpacity =
    flashDist >= flashWidth ? 0 : Math.pow(1 - flashDist / flashWidth, 2.6);

  // Grano residual (solo durante dust)
  const grainOpacity =
    progress > 0.56 && progress < 0.72
      ? Math.sin(((progress - 0.56) / 0.16) * Math.PI) * 0.08
      : 0;

  // Vignette de colapso — gradiente negro creciendo desde los bordes
  const vignetteOpacity = collapseP;

  // ─── Contenido (rango más comprimido tras silencio largo) ───────────
  const eyebrowP = win(progress, 0.68, 0.78);
  const ctaP = win(progress, 0.82, 0.92);
  const wordmarkP = win(progress, 0.84, 0.97);
  const metaP = win(progress, 0.90, 1.0);

  const questionStart = 0.70;
  const stagger = 0.04;
  const wordProgress = (idx: number) => {
    const a = questionStart + idx * stagger;
    const b = a + 0.18;
    return win(progress, a, b);
  };

  // Mount flags
  const explosionLive = progress < 0.58;
  const dustLive = progress > 0.54 && progress < 0.74;

  // Punto central
  const breath =
    chargeP > 0 && chargeP < 1
      ? 1 + Math.sin(chargeP * Math.PI * 3) * 0.18 // 3 ciclos
      : 1;
  const pointScale = explosionLive
    ? blastP > 0
      ? 0.5 + Math.pow(blastP, 0.7) * 5
      : (1 - collapseP * 0.6) * breath
    : 0;
  const pointGlow = 40 + chargeP * 320;
  const pointOpacity = explosionLive
    ? blastP < 0.6
      ? 1
      : Math.max(0, 1 - (blastP - 0.6) * 2.5)
    : 0;
  const jitterX = collapseP > 0 && collapseP < 1 ? jitter.x : 0;
  const jitterY = collapseP > 0 && collapseP < 1 ? jitter.y : 0;

  // Anillo de cierre
  const ringEase = 1 - Math.pow(1 - collapseP, 2);
  const ringSize = `${(1 - ringEase) * 220}vw`;
  const ringOpacity = collapseP > 0 && collapseP < 1 ? 0.32 : 0;

  // Onda de presión (inversa, durante carga)
  const pressureSize = `${(1 - chargeP) * 60}vmax`;
  const pressureOpacity = chargeP > 0 && chargeP < 0.9 ? chargeP * 0.4 : 0;

  // Núcleo expuesto (blanco puro)
  const coreSize = `${corePhase * 35}vmax`;
  const coreOpacity =
    corePhase > 0 && corePhase < 1
      ? Math.sin(corePhase * Math.PI) // sube y baja
      : 0;

  // Shockwave (anillo violeta)
  const shockEase = 1 - Math.pow(1 - shockPhase, 1.6);
  const shockSize = `${shockEase * 320}vmax`;
  const shockOpacity =
    shockPhase > 0 && shockPhase < 1 ? 1 - shockPhase * 0.85 : 0;

  const shardOpacity =
    shardsPhase > 0 ? Math.max(0, 1 - shardsPhase * 1.1) : 0;

  const revealStyle = (p: number, translatePx = 40): React.CSSProperties => ({
    clipPath: `inset(${(1 - p) * 100}% 0 0 0)`,
    transform: `translateY(${(1 - p) * translatePx}px)`,
    transition: `clip-path 600ms ${EASE}, transform 600ms ${EASE}`,
    willChange: "clip-path, transform",
  });

  const lineReveal = (p: number): React.CSSProperties => ({
    clipPath: `inset(0 ${(1 - p) * 50}% 0 ${(1 - p) * 50}%)`,
    transition: `clip-path 800ms ${EASE}`,
    willChange: "clip-path",
  });

  return (
    <section
      ref={sectionRef}
      className="relative w-full"
      style={{ height: "360vh" }}
    >
      <style>{`
        @keyframes cf2-twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes cf2-drift {
          0% { transform: translate(-50%, -50%) translate(0, 0) rotate(0deg); }
          100% { transform: translate(-50%, -50%) translate(20px, -10px) rotate(8deg); }
        }
      `}</style>
      <div
        className="sticky top-0 left-0 w-full h-screen overflow-hidden bg-background"
        style={{
          contain: "layout paint",
          transform: "translateZ(0)",
        }}
      >
        {/* Overlay negro creciendo durante colapso */}
        <div
          className="absolute inset-0 bg-background pointer-events-none"
          style={{
            opacity: overlayP,
            zIndex: 1,
            transition: "opacity 200ms linear",
          }}
        />

        {/* Vignette de colapso — gravedad visual desde los bordes */}
        {vignetteOpacity > 0 && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at center, transparent 0%, transparent 30%, rgba(0,0,0,0.95) 90%)",
              opacity: vignetteOpacity,
              zIndex: 2,
            }}
          />
        )}

        {/* Halos nebulosos rotantes (4) */}
        {explosionLive && collapseP > 0 && blastP < 0.4 && (
          <>
            {[
              { scale: 1.4, rot: haloAngle, hue: "primary", a: 0.55 },
              { scale: 1.0, rot: -haloAngle * 0.7, hue: "primary", a: 0.45 },
              { scale: 0.7, rot: haloAngle * 1.3, hue: "primary", a: 0.55 },
              { scale: 0.5, rot: -haloAngle * 0.9, hue: "magenta", a: 0.40 },
            ].map((h, i) => {
              const scale = h.scale * (1 - collapseP * 0.7);
              const opacity = (1 - collapseP) * h.a;
              const bg =
                h.hue === "magenta"
                  ? "radial-gradient(ellipse 70% 40%, hsl(330 100% 39% / 0.4) 0%, transparent 65%)"
                  : "radial-gradient(ellipse 70% 50%, hsl(var(--primary) / 0.45) 0%, transparent 70%)";
              return (
                <div
                  key={i}
                  className="absolute left-1/2 top-1/2 pointer-events-none rounded-full"
                  style={{
                    width: "60vmax",
                    height: "60vmax",
                    transform: `translate(-50%, -50%) rotate(${h.rot}deg) scale(${scale})`,
                    background: bg,
                    filter: "blur(45px)",
                    opacity,
                    zIndex: 3,
                    willChange: "transform, opacity",
                    mixBlendMode: "screen",
                  }}
                />
              );
            })}
            {/* Aberración cromática magenta durante carga */}
            {chargeP > 0 && (
              <div
                className="absolute left-1/2 top-1/2 pointer-events-none rounded-full"
                style={{
                  width: "40vmax",
                  height: "40vmax",
                  transform: `translate(calc(-50% + 8px), -50%) scale(${0.4 + chargeP * 0.4})`,
                  background:
                    "radial-gradient(circle, hsl(330 100% 39% / 0.42) 0%, transparent 60%)",
                  filter: "blur(50px)",
                  opacity: chargeP * 0.7,
                  zIndex: 3,
                  willChange: "transform, opacity",
                  mixBlendMode: "screen",
                }}
              />
            )}
          </>
        )}

        {/* Anillo de cierre — universo colapsando */}
        {explosionLive && (
          <div
            className="absolute left-1/2 top-1/2 pointer-events-none rounded-full"
            style={{
              width: ringSize,
              height: ringSize,
              transform: "translate(-50%, -50%)",
              border: "1px solid hsl(var(--primary) / 0.5)",
              opacity: ringOpacity,
              zIndex: 4,
              willChange: "width, height, opacity",
            }}
          />
        )}

        {/* Onda de presión (inversa) durante carga */}
        {explosionLive && chargeP > 0 && chargeP < 0.95 && (
          <div
            className="absolute left-1/2 top-1/2 pointer-events-none rounded-full"
            style={{
              width: pressureSize,
              height: pressureSize,
              transform: "translate(-50%, -50%)",
              border: "1px solid hsl(var(--primary) / 0.6)",
              opacity: pressureOpacity,
              zIndex: 4,
              willChange: "width, height, opacity",
            }}
          />
        )}

        {/* Núcleo expuesto — momento de luz pura */}
        {explosionLive && corePhase > 0 && corePhase < 1 && (
          <>
            <div
              className="absolute left-1/2 top-1/2 pointer-events-none rounded-full bg-foreground"
              style={{
                width: coreSize,
                height: coreSize,
                transform: "translate(-50%, -50%)",
                opacity: coreOpacity,
                filter: "blur(0px)",
                zIndex: 7,
                willChange: "width, height, opacity",
              }}
            />
            <div
              className="absolute left-1/2 top-1/2 pointer-events-none rounded-full"
              style={{
                width: `${corePhase * 55}vmax`,
                height: `${corePhase * 55}vmax`,
                transform: "translate(-50%, -50%)",
                background:
                  "radial-gradient(circle, hsl(var(--foreground) / 0.6) 0%, transparent 60%)",
                filter: "blur(20px)",
                opacity: coreOpacity * 0.8,
                zIndex: 6,
                willChange: "width, height, opacity",
                mixBlendMode: "screen",
              }}
            />
          </>
        )}

        {/* Shockwave — anillo violeta */}
        {explosionLive && shockPhase > 0 && (
          <div
            className="absolute left-1/2 top-1/2 pointer-events-none rounded-full"
            style={{
              width: shockSize,
              height: shockSize,
              transform: "translate(-50%, -50%)",
              background:
                "radial-gradient(circle, transparent 45%, hsl(var(--primary) / 0.7) 52%, transparent 60%)",
              opacity: shockOpacity,
              zIndex: 5,
              willChange: "width, height, opacity",
            }}
          />
        )}

        {/* Esquirlas — 20 en 3 categorías */}
        {explosionLive && shardsPhase > 0 && (
          <div
            className="absolute left-1/2 top-1/2 pointer-events-none"
            style={{ width: 0, height: 0, zIndex: 6 }}
          >
            {Array.from({ length: 20 }).map((_, i) => {
              const angle = (360 / 20) * i + (i % 3) * 6;
              // 3 categorías: cortas (8), medias (8), largas (4)
              let len: number;
              let reach: number;
              let speed: number;
              if (i < 8) {
                len = 22;
                reach = 30;
                speed = 1.2;
              } else if (i < 16) {
                len = 40;
                reach = 50;
                speed = 1.5;
              } else {
                len = 80;
                reach = 90;
                speed = 2.2;
              }
              const shardOffset = (i % 6) * 0.012;
              const localP = Math.max(0, shardsPhase - shardOffset);
              const localEase =
                1 - Math.pow(1 - Math.min(localP, 1), speed);
              const dist = `${localEase * reach}vmax`;
              return (
                <span
                  key={i}
                  className="absolute block bg-foreground"
                  style={{
                    top: 0,
                    left: 0,
                    width: `${len}px`,
                    height: "1px",
                    transformOrigin: "0 50%",
                    transform: `rotate(${angle}deg) translateX(${dist})`,
                    opacity: shardOpacity,
                    boxShadow: "0 0 8px hsl(var(--foreground) / 0.6)",
                    willChange: "transform, opacity",
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Punto central */}
        {explosionLive && (
          <div
            className="absolute left-1/2 top-1/2 pointer-events-none rounded-full"
            style={{
              width: 24,
              height: 24,
              transform: `translate(calc(-50% + ${jitterX}px), calc(-50% + ${jitterY}px)) scale(${pointScale})`,
              background:
                "radial-gradient(circle, hsl(var(--foreground)) 0%, hsl(var(--primary)) 45%, transparent 75%)",
              boxShadow: `0 0 ${pointGlow}px ${pointGlow * 0.4}px hsl(var(--primary) / 0.8)`,
              opacity: pointOpacity,
              zIndex: 7,
              willChange: "transform, opacity, box-shadow",
            }}
          />
        )}

        {/* Pre-flash suave */}
        {preFlashOpacity > 0.001 && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, hsl(var(--foreground) / 0.9) 0%, transparent 60%)",
              opacity: preFlashOpacity,
              zIndex: 8,
              mixBlendMode: "screen",
            }}
          />
        )}

        {/* Flash blanco principal */}
        {flashOpacity > 0.001 && (
          <div
            className="absolute inset-0 pointer-events-none bg-foreground"
            style={{
              opacity: flashOpacity,
              zIndex: 9,
              mixBlendMode: "screen",
            }}
          />
        )}

        {/* Polvo + nebulosa residual */}
        {dustLive && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 4 }}
          >
            {/* 3 nubes violetas derivando con rotación */}
            {[
              { x: 38, y: 44, scale: 1.0, dur: 5 },
              { x: 58, y: 52, scale: 1.3, dur: 6 },
              { x: 50, y: 60, scale: 0.9, dur: 7 },
            ].map((c, i) => (
              <div
                key={`cloud-${i}`}
                className="absolute rounded-full"
                style={{
                  left: `${c.x}%`,
                  top: `${c.y}%`,
                  width: "50vmax",
                  height: "50vmax",
                  transform: `translate(-50%, -50%) scale(${c.scale})`,
                  background:
                    "radial-gradient(circle, hsl(var(--primary) / 0.25) 0%, transparent 65%)",
                  filter: "blur(60px)",
                  mixBlendMode: "screen",
                  animation: `cf2-drift ${c.dur}s ease-out forwards`,
                  opacity: (1 - dustP) * 0.85,
                }}
              />
            ))}
            {/* 12 partículas de ceniza estelar */}
            {Array.from({ length: 12 }).map((_, i) => {
              const seedX = (i * 37) % 100;
              const seedY = (i * 53) % 100;
              return (
                <span
                  key={i}
                  className="absolute block rounded-full bg-foreground"
                  style={{
                    left: `${25 + seedX * 0.5}%`,
                    top: `${25 + seedY * 0.5}%`,
                    width: 2,
                    height: 2,
                    boxShadow: "0 0 4px hsl(var(--foreground) / 0.8)",
                    animation: `cf2-twinkle ${1.2 + (i % 3) * 0.4}s ease-out infinite`,
                    animationDelay: `${i * 80}ms`,
                    opacity: 1 - dustP,
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Grano residual — textura de continuidad con el shader del hero */}
        {grainOpacity > 0.001 && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              opacity: grainOpacity,
              zIndex: 10,
              mixBlendMode: "overlay",
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.55'/></svg>\")",
              backgroundSize: "200px 200px",
            }}
          />
        )}

        {/* Wordmark de fondo */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
          style={{ zIndex: 0 }}
        >
          <span
            className="block text-foreground/[0.08] whitespace-nowrap"
            style={{
              fontFamily: "Arkitech, system-ui, sans-serif",
              fontWeight: 200,
              fontSize: "clamp(6rem, 22vw, 22rem)",
              letterSpacing: "0.05em",
              lineHeight: 0.9,
              ...revealStyle(wordmarkP, 80),
            }}
          >
            LIMITLESS
          </span>
        </div>

        {/* Eyebrow + línea guía */}
        <div
          className="absolute top-[12vh] left-1/2 -translate-x-1/2 flex items-center gap-4 pointer-events-none"
          style={{ zIndex: 5 }}
        >
          <span
            className="text-[10px] tracking-[0.4em] uppercase text-foreground/50 font-light"
            style={{
              opacity: eyebrowP,
              transform: `translateY(${(1 - eyebrowP) * 10}px)`,
              transition: `opacity 500ms ${EASE}, transform 500ms ${EASE}`,
            }}
          >
            Capítulo final
          </span>
          <span
            className="block h-px w-24 bg-foreground/30"
            style={lineReveal(eyebrowP)}
          />
        </div>

        {/* Pregunta gigante */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center pointer-events-none"
          style={{ zIndex: 4 }}
        >
          <h2
            className="font-extralight text-foreground"
            style={{
              fontFamily: "Arkitech, system-ui, sans-serif",
              fontSize: "clamp(4rem, 12vw, 12rem)",
              lineHeight: 0.9,
              letterSpacing: "0.05em",
            }}
          >
            <span className="block overflow-hidden">
              {QUESTION_WORDS_TOP.map((w, i) => (
                <span
                  key={w}
                  className="inline-block"
                  style={revealStyle(wordProgress(i), 50)}
                >
                  {w}
                </span>
              ))}
            </span>
            <span className="block overflow-hidden">
              {QUESTION_WORDS_BOT.map((w, i) => (
                <span
                  key={w}
                  className="inline-block mx-[0.2em]"
                  style={revealStyle(
                    wordProgress(QUESTION_WORDS_TOP.length + i),
                    50,
                  )}
                >
                  {w}
                </span>
              ))}
            </span>
          </h2>

          {/* CTA */}
          <div
            className="mt-12 md:mt-16 overflow-hidden"
            style={{ pointerEvents: ctaP > 0.3 ? "auto" : "none" }}
          >
            <a
              href="/contacto"
              className="group inline-flex items-center gap-3 border border-foreground/30 px-8 py-4 text-xs tracking-[0.3em] uppercase text-foreground font-light transition-colors duration-300 hover:bg-primary hover:border-primary hover:text-primary-foreground"
              style={{
                ...revealStyle(ctaP, 30),
                fontFamily: "DM Sans, system-ui, sans-serif",
              }}
            >
              <span>Iniciar contacto</span>
              <span
                className="inline-block transition-transform duration-300 group-hover:translate-x-2"
                aria-hidden
              >
                →
              </span>
            </a>
          </div>
        </div>

        {/* Meta footer */}
        <div
          className="absolute bottom-0 left-0 w-full px-6 md:px-12 pb-8 pt-10"
          style={{ zIndex: 6 }}
        >
          <div
            className="max-w-7xl mx-auto"
            style={{
              opacity: metaP,
              transform: `translateY(${(1 - metaP) * 30}px)`,
              transition: `opacity 600ms ${EASE}, transform 600ms ${EASE}`,
            }}
          >
            <span
              className="block h-px mb-4"
              style={{ width: 60, background: "#C8007A" }}
            />
            <div
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs tracking-[0.2em] uppercase text-foreground/40 font-light"
              style={{ fontFamily: "DM Sans, system-ui, sans-serif", fontWeight: 300 }}
            >
              <span>© 2026 Limitless · Buenos Aires</span>
              <span>Los límites están para romperse</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CosmicFooterV2;