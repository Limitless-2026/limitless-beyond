import { useEffect, useRef, useState } from "react";

interface Star {
  x: number; // % within stage
  y: number; // % within stage
  size: number;
  isL: boolean; // belongs to "L" shape
  twinkle: number;
}

// "L" shape stars (normalized 0..1 within stage). We'll center horizontally.
// Vertical stroke + horizontal foot.
const L_POINTS: Array<{ x: number; y: number }> = [
  { x: 0.42, y: 0.22 },
  { x: 0.42, y: 0.36 },
  { x: 0.42, y: 0.50 },
  { x: 0.42, y: 0.64 },
  { x: 0.42, y: 0.78 },
  { x: 0.55, y: 0.78 },
  { x: 0.68, y: 0.78 },
];

// Filler stars — random-ish but fixed
const FILLER: Array<{ x: number; y: number; size: number }> = [
  { x: 0.12, y: 0.18, size: 1.4 },
  { x: 0.22, y: 0.62, size: 1.0 },
  { x: 0.32, y: 0.88, size: 1.2 },
  { x: 0.78, y: 0.32, size: 1.6 },
  { x: 0.88, y: 0.55, size: 1.0 },
  { x: 0.84, y: 0.85, size: 1.3 },
  { x: 0.18, y: 0.40, size: 0.9 },
];

const STARS: Star[] = [
  ...L_POINTS.map((p, i) => ({
    x: p.x,
    y: p.y,
    size: 2.2,
    isL: true,
    twinkle: i * 0.7,
  })),
  ...FILLER.map((p, i) => ({
    x: p.x,
    y: p.y,
    size: p.size,
    isL: false,
    twinkle: i * 1.3 + 2,
  })),
];

// Lines drawn between consecutive L points (6 segments)
const L_SEGMENTS = L_POINTS.slice(0, -1).map((p, i) => ({
  from: i,
  to: i + 1,
}));

const BLOCKS = [
  {
    eyebrow: null,
    words: [
      "Somos",
      "un",
      "estudio",
      "de",
      "diseño",
      "y",
      "desarrollo",
      "digital",
      "con",
      "base",
      "en",
      "Argentina",
      "y",
      "mirada",
      "global.",
    ],
    accent: [] as number[],
    inStart: 0.20,
    inEnd: 0.30,
    outStart: 0.40,
    outEnd: 0.48,
  },
  {
    eyebrow: null,
    words: [
      "No",
      "hacemos",
      "sólo",
      "sitios",
      "—",
      "creamos",
      "experiencias",
      "que",
      "transforman",
      "marcas.",
    ],
    accent: [8],
    inStart: 0.45,
    inEnd: 0.55,
    outStart: 0.65,
    outEnd: 0.72,
  },
  {
    eyebrow: null,
    words: [
      "Estrategia,",
      "craft",
      "y",
      "tecnología.",
      "Para",
      "que",
      "cada",
      "lanzamiento",
      "se",
      "sienta",
      "inevitable.",
    ],
    accent: [10],
    inStart: 0.70,
    inEnd: 0.80,
    outStart: 0.90,
    outEnd: 0.95,
  },
];

const fade = (p: number, a: number, b: number, c: number, d: number) => {
  if (p < a || p > d) return 0;
  if (p < b) return (p - a) / (b - a);
  if (p < c) return 1;
  return 1 - (p - c) / (d - c);
};

const AboutConstellation = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(0);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  // Scroll progress within sticky stage
  useEffect(() => {
    const onScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;
      const p = Math.max(0, Math.min(1, scrolled / total));
      setProgress(p);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Mouse parallax
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setMouse({ x, y });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // Canvas star drawing with continuous twinkle
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let start = performance.now();

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const accent = "123, 47, 255"; // --color-accent rgb-ish
    const text = "237, 236, 232";

    const draw = () => {
      const t = (performance.now() - start) / 1000;
      const rect = canvas.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;
      ctx.clearRect(0, 0, W, H);

      // Stars appear progressively (0..0.15 -> 0..1)
      const starsAppear = Math.min(1, Math.max(0, progress / 0.15));
      // Constellation fade-out near end
      const constFade = progress > 0.92 ? Math.max(0, 1 - (progress - 0.92) / 0.06) : 1;

      // Draw L segments — staggered between 0.18 and 0.38
      const segStart = 0.18;
      const segEnd = 0.38;
      const segP = Math.max(0, Math.min(1, (progress - segStart) / (segEnd - segStart)));
      L_SEGMENTS.forEach((seg, i) => {
        const segLocal = Math.max(
          0,
          Math.min(1, (segP * L_SEGMENTS.length) - i)
        );
        if (segLocal <= 0) return;
        const a = STARS[seg.from];
        const b = STARS[seg.to];
        const ax = a.x * W;
        const ay = a.y * H;
        const bx = a.x * W + (b.x * W - a.x * W) * segLocal;
        const by = a.y * H + (b.y * H - a.y * H) * segLocal;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.strokeStyle = `rgba(${accent}, ${0.35 * constFade})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Draw stars
      STARS.forEach((s, i) => {
        const cx = s.x * W;
        const cy = s.y * H;
        const tw = 0.6 + 0.4 * Math.sin(t * 1.4 + s.twinkle);
        const baseAlpha = (s.isL ? 0.9 : 0.55) * starsAppear * constFade * tw;
        const intensify = progress > 0.7 ? 1 + (progress - 0.7) * 0.8 : 1;
        const r = s.size * intensify;

        // glow
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 6);
        grad.addColorStop(0, `rgba(${text}, ${baseAlpha})`);
        grad.addColorStop(0.4, `rgba(${accent}, ${baseAlpha * 0.4})`);
        grad.addColorStop(1, `rgba(${accent}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 6, 0, Math.PI * 2);
        ctx.fill();

        // core
        ctx.fillStyle = `rgba(${text}, ${baseAlpha})`;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [progress]);

  const closingOpacity = fade(progress, 0.93, 0.97, 1.1, 1.2);

  return (
    <section
      ref={sectionRef}
      className="relative w-full"
      style={{ height: "280vh" }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Eyebrow */}
        <div
          className="absolute top-10 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
          style={{
            opacity: Math.min(1, progress * 6),
            transition: "opacity 200ms linear",
          }}
        >
          <span className="text-[10px] tracking-[0.4em] uppercase text-foreground/50 font-light">
            Sobre nosotros · Capítulo III
          </span>
        </div>

        {/* Canvas constellation with mouse parallax */}
        <div
          className="absolute inset-0"
          style={{
            transform: `perspective(1200px) rotateX(${mouse.y * -2}deg) rotateY(${mouse.x * 2}deg)`,
            transition: "transform 400ms ease-out",
          }}
        >
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        </div>

        {/* Manifesto blocks */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none px-6">
          <div className="relative w-full max-w-4xl text-center">
            {BLOCKS.map((block, bi) => {
              const blockOpacity = fade(
                progress,
                block.inStart,
                block.inEnd,
                block.outStart,
                block.outEnd
              );
              if (blockOpacity <= 0) return null;
              const wordReveal = Math.max(
                0,
                Math.min(1, (progress - block.inStart) / (block.inEnd - block.inStart))
              );
              return (
                <h2
                  key={bi}
                  className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-2xl md:text-4xl lg:text-5xl font-light leading-relaxed text-foreground/90"
                  style={{ opacity: blockOpacity, fontWeight: 300 }}
                >
                  {block.words.map((w, wi) => {
                    const wordP = Math.max(
                      0,
                      Math.min(1, wordReveal * block.words.length - wi)
                    );
                    const isAccent = block.accent.includes(wi);
                    return (
                      <span
                        key={wi}
                        className="inline-block mx-[0.25em]"
                        style={{
                          opacity: wordP,
                          transform: `translateY(${(1 - wordP) * 8}px)`,
                          transition: "opacity 300ms ease-out, transform 300ms ease-out",
                        }}
                      >
                        {isAccent ? (
                          <em className="not-italic bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                            {w}
                          </em>
                        ) : (
                          w
                        )}
                      </span>
                    );
                  })}
                </h2>
              );
            })}

            {/* Closing micro-copy */}
            {closingOpacity > 0 && (
              <div
                className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center"
                style={{ opacity: closingOpacity }}
              >
                <p className="text-sm md:text-base text-foreground/60 font-light max-w-lg mx-auto">
                  Si tu idea pide romper moldes, es el tipo de brief que nos entusiasma.
                </p>
                <span
                  className="block mt-6 h-px"
                  style={{
                    width: "60px",
                    background: "hsl(var(--impact, 322 100% 39%))",
                    backgroundColor: "#C8007A",
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutConstellation;
