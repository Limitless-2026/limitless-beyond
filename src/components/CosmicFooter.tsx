import { useRef } from "react";
import { useScrollProgress } from "@/hooks/useScrollProgress";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

/**
 * Maps progress to 0..1 within a window, clamped.
 */
const win = (p: number, a: number, b: number) => {
  if (p <= a) return 0;
  if (p >= b) return 1;
  return (p - a) / (b - a);
};

const QUESTION_WORDS_TOP = ["¿LISTOS"];
const QUESTION_WORDS_BOT = ["PARA", "CRUZAR?"];

const CosmicFooter = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const progress = useScrollProgress(sectionRef);

  // ─── Phase 0 — Explosion windows ────────────────────────────────────
  const collapseP = win(progress, 0.0, 0.10);   // point contracts, ring closes in
  const chargeP = win(progress, 0.10, 0.16);    // point pulses, glow grows
  // White flash centered at 0.19 with width 0.04 (V2 formula)
  const flashCenter = 0.19;
  const flashWidth = 0.04;
  const flashDist = Math.abs(progress - flashCenter);
  const flashOpacity =
    flashDist >= flashWidth ? 0 : Math.pow(1 - flashDist / flashWidth, 1.6);
  const blastP = win(progress, 0.16, 0.22);     // shockwave + shards
  const dustP = win(progress, 0.22, 0.30);      // stardust fades
  // Black overlay that grows during collapse to "swallow" the starfield
  const overlayP = win(progress, 0.0, 0.18);

  // ─── Content windows (rescaled to start after the blast) ────────────
  const eyebrowP = win(progress, 0.25, 0.42);
  const ctaP = win(progress, 0.55, 0.72);
  const wordmarkP = win(progress, 0.62, 0.88);
  const metaP = win(progress, 0.78, 1.0);

  // Question reveal — per word with stagger (after the blast)
  const questionStart = 0.30;
  const allWords = [...QUESTION_WORDS_TOP, ...QUESTION_WORDS_BOT];
  const stagger = 0.04;
  const wordProgress = (idx: number) => {
    const a = questionStart + idx * stagger;
    const b = a + 0.18;
    return win(progress, a, b);
  };

  // Mount flags — keep DOM light outside active windows
  const explosionLive = progress < 0.32;
  const dustLive = progress > 0.20 && progress < 0.34;

  // ─── Derived styles for the explosion stage ─────────────────────────
  // Collapse point: scale 1 → 0.4 as it contracts, then explodes to 0
  const pointScale = explosionLive
    ? blastP > 0
      ? 0.4 + blastP * 6 // expands violently during blast
      : 1 - collapseP * 0.6
    : 0;
  const pointGlow = 20 + chargeP * 180; // box-shadow blur radius
  const pointOpacity = explosionLive
    ? blastP < 1
      ? 1
      : 1 - dustP
    : 0;

  // Closing ring: width from 200vw → 0
  const ringSize = `${(1 - collapseP) * 200}vw`;
  const ringOpacity = collapseP > 0 && collapseP < 1 ? 0.35 : 0;

  // Shockwave: 0 → 300vmax during blast
  const shockSize = `${blastP * 300}vmax`;
  const shockOpacity = blastP > 0 && blastP < 1 ? 1 - blastP : 0;

  // Shard travel distance during blast
  const shardDist = `${blastP * 60}vmax`;
  const shardOpacity = blastP > 0 ? 1 - blastP : 0;

  // Helper: clip-path reveal style (vertical mask from bottom up)
  const revealStyle = (p: number, translatePx = 40): React.CSSProperties => ({
    clipPath: `inset(${(1 - p) * 100}% 0 0 0)`,
    transform: `translateY(${(1 - p) * translatePx}px)`,
    transition: `clip-path 600ms ${EASE}, transform 600ms ${EASE}`,
    willChange: "clip-path, transform",
  });

  // Horizontal guide line — clip-path expanding from center
  const lineReveal = (p: number): React.CSSProperties => ({
    clipPath: `inset(0 ${(1 - p) * 50}% 0 ${(1 - p) * 50}%)`,
    transition: `clip-path 800ms ${EASE}`,
    willChange: "clip-path",
  });

  return (
    <section
      ref={sectionRef}
      className="relative w-full"
      style={{ height: "180vh" }}
    >
      <style>{`
        @keyframes cf-twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
      <div
        className="sticky top-0 left-0 w-full h-screen overflow-hidden bg-background"
        style={{
          contain: "layout paint",
          transform: "translateZ(0)",
        }}
      >
        {/* ─── Phase 0 — Black overlay swallowing the starfield ───── */}
        <div
          className="absolute inset-0 bg-background pointer-events-none"
          style={{
            opacity: overlayP,
            zIndex: 1,
            transition: "opacity 200ms linear",
          }}
        />

        {/* ─── Phase 0 — Closing ring (universe collapsing inward) ── */}
        {explosionLive && (
          <div
            className="absolute left-1/2 top-1/2 pointer-events-none rounded-full"
            style={{
              width: ringSize,
              height: ringSize,
              transform: "translate(-50%, -50%)",
              border: "1px solid hsl(var(--primary) / 0.5)",
              opacity: ringOpacity,
              zIndex: 2,
              willChange: "width, height, opacity",
            }}
          />
        )}

        {/* ─── Phase 0 — Shockwave (violet expanding ring) ───────── */}
        {explosionLive && blastP > 0 && (
          <div
            className="absolute left-1/2 top-1/2 pointer-events-none rounded-full"
            style={{
              width: shockSize,
              height: shockSize,
              transform: "translate(-50%, -50%)",
              background:
                "radial-gradient(circle, transparent 38%, hsl(var(--primary) / 0.45) 58%, transparent 78%)",
              opacity: shockOpacity,
              zIndex: 3,
              willChange: "width, height, opacity",
            }}
          />
        )}

        {/* ─── Phase 0 — Shards flying out radially ──────────────── */}
        {explosionLive && blastP > 0 && (
          <div
            className="absolute left-1/2 top-1/2 pointer-events-none"
            style={{
              width: 0,
              height: 0,
              zIndex: 4,
            }}
          >
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (360 / 12) * i;
              const len = 40 + (i % 4) * 20; // 40, 60, 80, 100
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
                    transform: `rotate(${angle}deg) translateX(${shardDist})`,
                    opacity: shardOpacity,
                    boxShadow: "0 0 8px hsl(var(--foreground) / 0.6)",
                    willChange: "transform, opacity",
                  }}
                />
              );
            })}
          </div>
        )}

        {/* ─── Phase 0 — Collapse / blast point ──────────────────── */}
        {explosionLive && (
          <div
            className="absolute left-1/2 top-1/2 pointer-events-none rounded-full"
            style={{
              width: 24,
              height: 24,
              transform: `translate(-50%, -50%) scale(${pointScale})`,
              background:
                "radial-gradient(circle, hsl(var(--foreground)) 0%, hsl(var(--primary)) 45%, transparent 75%)",
              boxShadow: `0 0 ${pointGlow}px ${pointGlow * 0.4}px hsl(var(--primary) / 0.8)`,
              opacity: pointOpacity,
              zIndex: 5,
              willChange: "transform, opacity, box-shadow",
            }}
          />
        )}

        {/* ─── Phase 0 — White flash (full screen) ───────────────── */}
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

        {/* ─── Phase 0 — Stardust (post-blast suspended particles) ─ */}
        {dustLive && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 4, opacity: 1 - dustP }}
          >
            {Array.from({ length: 8 }).map((_, i) => {
              const seedX = (i * 37) % 100;
              const seedY = (i * 53) % 100;
              return (
                <span
                  key={i}
                  className="absolute block rounded-full bg-foreground"
                  style={{
                    left: `${30 + seedX * 0.4}%`,
                    top: `${30 + seedY * 0.4}%`,
                    width: 2,
                    height: 2,
                    boxShadow: "0 0 4px hsl(var(--foreground) / 0.8)",
                    animation: `cf-twinkle ${1.2 + (i % 3) * 0.4}s ease-out infinite`,
                    animationDelay: `${i * 80}ms`,
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Wordmark de fondo — telón */}
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

        {/* Capa 1 — Eyebrow + línea guía */}
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

        {/* Capa 2 — Pregunta gigante */}
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
                  style={revealStyle(wordProgress(QUESTION_WORDS_TOP.length + i), 50)}
                >
                  {w}
                </span>
              ))}
            </span>
          </h2>

          {/* Capa 3 — CTA */}
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

        {/* Capa 5 — Meta footer */}
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
              <div>
                <p className="text-[10px] tracking-[0.4em] uppercase text-foreground/40 font-light mb-3">
                  Estudio
                </p>
                <ul className="space-y-2 text-xs text-foreground/70 font-light">
                  <li>Sobre nosotros</li>
                  <li>Manifiesto</li>
                  <li>Equipo</li>
                </ul>
              </div>
              <div>
                <p className="text-[10px] tracking-[0.4em] uppercase text-foreground/40 font-light mb-3">
                  Servicios
                </p>
                <ul className="space-y-2 text-xs text-foreground/70 font-light">
                  <li>Diseño & Desarrollo</li>
                  <li>Branding</li>
                  <li>Software / SaaS</li>
                </ul>
              </div>
              <div>
                <p className="text-[10px] tracking-[0.4em] uppercase text-foreground/40 font-light mb-3">
                  Contacto
                </p>
                <ul className="space-y-2 text-xs text-foreground/70 font-light">
                  <li>
                    <a href="mailto:hola@limitless.studio" className="hover:text-foreground transition-colors">
                      hola@limitless.studio
                    </a>
                  </li>
                  <li>Buenos Aires · AR</li>
                </ul>
              </div>
              <div>
                <p className="text-[10px] tracking-[0.4em] uppercase text-foreground/40 font-light mb-3">
                  Redes
                </p>
                <ul className="space-y-2 text-xs text-foreground/70 font-light">
                  <li>Instagram</li>
                  <li>Behance</li>
                  <li>LinkedIn</li>
                </ul>
              </div>
            </div>

            {/* Línea magenta — único uso del color de impacto en la página */}
            <span
              className="block h-px mb-4"
              style={{ width: 60, background: "#C8007A" }}
            />

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-[10px] tracking-[0.3em] uppercase text-foreground/40 font-light">
              <span>© 2025 Limitless · Buenos Aires</span>
              <span>Los límites están para romperse</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CosmicFooter;