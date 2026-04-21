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

  // Layer windows
  const eyebrowP = win(progress, 0.0, 0.25);
  const ctaP = win(progress, 0.4, 0.65);
  const wordmarkP = win(progress, 0.55, 0.85);
  const metaP = win(progress, 0.75, 1.0);

  // Question reveal — per word with stagger
  const questionStart = 0.15;
  const questionEnd = 0.45;
  const allWords = [...QUESTION_WORDS_TOP, ...QUESTION_WORDS_BOT];
  const stagger = 0.05; // ~80ms equivalent across the window
  const wordProgress = (idx: number) => {
    const a = questionStart + idx * stagger;
    const b = a + 0.18;
    return win(progress, a, b);
  };

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
      <div
        className="sticky top-0 left-0 w-full h-screen overflow-hidden bg-background"
        style={{
          contain: "layout paint",
          transform: "translateZ(0)",
        }}
      >
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