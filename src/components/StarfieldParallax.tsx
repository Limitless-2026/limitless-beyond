import { useEffect, useRef } from "react";

interface Star {
  x: number; // 0..1
  y: number; // 0..1
  size: number; // px
  baseAlpha: number;
  twinkleDelay: number;
  twinkleDuration: number;
  glow: boolean;
}

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function genLayer(
  count: number,
  sizeRange: [number, number],
  alphaRange: [number, number],
  seed: number,
  glow: boolean
): Star[] {
  const rnd = seeded(seed);
  return Array.from({ length: count }, () => ({
    x: rnd(),
    y: rnd(),
    size: sizeRange[0] + rnd() * (sizeRange[1] - sizeRange[0]),
    baseAlpha: alphaRange[0] + rnd() * (alphaRange[1] - alphaRange[0]),
    twinkleDelay: rnd() * 6,
    twinkleDuration: 3 + rnd() * 4,
    glow,
  }));
}

const ALL_STARS: Star[] = [
  ...genLayer(160, [0.6, 1.2], [0.25, 0.55], 7, false),
  ...genLayer(80, [1.2, 2], [0.4, 0.75], 23, false),
  ...genLayer(35, [2, 3.2], [0.7, 1], 91, true),
];

interface Props {
  visible: boolean;
}

/**
 * Single-canvas starfield. ~30fps RAF. Replaces 275 spans + box-shadows.
 */
const StarfieldParallax = ({ visible }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visibleRef = useRef(visible);

  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let raf = 0;
    let lastDraw = 0;
    const FRAME_MS = 1000 / 30; // throttle to 30fps

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Cache one radial gradient sprite per glow size for the near layer
    const glowSprites = new Map<number, HTMLCanvasElement>();
    const getGlowSprite = (size: number) => {
      const key = Math.round(size * 4);
      const cached = glowSprites.get(key);
      if (cached) return cached;
      const r = size * 4;
      const off = document.createElement("canvas");
      off.width = off.height = Math.ceil(r * 2);
      const octx = off.getContext("2d")!;
      const g = octx.createRadialGradient(r, r, 0, r, r, r);
      g.addColorStop(0, "rgba(123, 47, 255, 0.55)");
      g.addColorStop(0.4, "rgba(123, 47, 255, 0.18)");
      g.addColorStop(1, "rgba(123, 47, 255, 0)");
      octx.fillStyle = g;
      octx.beginPath();
      octx.arc(r, r, r, 0, Math.PI * 2);
      octx.fill();
      glowSprites.set(key, off);
      return off;
    };

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (now - lastDraw < FRAME_MS) return;
      lastDraw = now;
      if (!visibleRef.current) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);
      const t = now / 1000;

      for (let i = 0; i < ALL_STARS.length; i++) {
        const s = ALL_STARS[i];
        const phase = (t + s.twinkleDelay) / s.twinkleDuration;
        // twinkle: bounce 0.25..1
        const tw = 0.625 + 0.375 * Math.sin(phase * Math.PI * 2);
        const alpha = s.baseAlpha * tw;

        const cx = s.x * w;
        const cy = s.y * h;

        if (s.glow) {
          const sprite = getGlowSprite(s.size);
          const sw = sprite.width;
          ctx.globalAlpha = alpha;
          ctx.drawImage(sprite, cx - sw / 2, cy - sw / 2);
        }

        ctx.globalAlpha = alpha;
        ctx.fillStyle = "#EDECE8";
        ctx.beginPath();
        ctx.arc(cx, cy, s.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 1,
        opacity: visible ? 1 : 0,
        transition: "opacity 800ms ease-out",
      }}
    />
  );
};

export default StarfieldParallax;