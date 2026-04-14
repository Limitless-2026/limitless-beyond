import { useEffect, useRef, useState, lazy, Suspense } from "react";

// Check WebGL support
function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    return !!gl;
  } catch {
    return false;
  }
}

// Lazy load the WebGL version
const WebGLHero = lazy(() => import("./HeroWebGL"));

const HeroCanvas = () => {
  const [useWebGL, setUseWebGL] = useState<boolean | null>(null);

  useEffect(() => {
    setUseWebGL(isWebGLAvailable());
  }, []);

  if (useWebGL === null) {
    return <div className="fixed inset-0" style={{ background: "rgb(2, 1, 3)" }} />;
  }

  if (useWebGL) {
    return (
      <Suspense fallback={<div className="fixed inset-0" style={{ background: "rgb(2, 1, 3)" }} />}>
        <WebGLHero />
      </Suspense>
    );
  }

  return <CanvasFallback />;
};

export default HeroCanvas;

// ─── Canvas 2D Fallback ───
const CanvasFallback = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const startRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let W = window.innerWidth;
    let H = window.innerHeight;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const onMouse = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX / W;
      mouseRef.current.y = e.clientY / H;
    };
    window.addEventListener("mousemove", onMouse);
    startRef.current = performance.now();

    // Simple hash
    const hash = (x: number, y: number) => {
      let h = x * 127.1 + y * 311.7;
      return ((Math.sin(h) * 43758.5453) % 1 + 1) % 1;
    };

    // Simple noise
    const noise = (x: number, y: number) => {
      const ix = Math.floor(x), iy = Math.floor(y);
      const fx = x - ix, fy = y - iy;
      const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
      const a = hash(ix, iy), b = hash(ix + 1, iy);
      const c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
      return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
    };

    const fbm = (x: number, y: number) => {
      let v = 0, a = 0.5, f = 1;
      for (let i = 0; i < 4; i++) { v += noise(x * f, y * f) * a; a *= 0.5; f *= 2; }
      return v;
    };

    // Generate fragments
    interface Frag {
      verts: { x: number; y: number }[];
      cx: number; cy: number;
      dx: number; dy: number;
      depth: number; delay: number;
      hue: number; size: number;
    }

    const frags: Frag[] = [];
    const cx = W / 2, cy = H * 0.45;
    const maxR = Math.max(W, H) * 0.7;

    for (let i = 0; i < 100; i++) {
      const ang = Math.random() * Math.PI * 2;
      const dist = Math.pow(Math.random(), 0.6) * maxR * 0.9 + 10;
      const sx = cx + Math.cos(ang) * dist + (Math.random() - 0.5) * 60;
      const sy = cy + Math.sin(ang) * dist * 0.7 + (Math.random() - 0.5) * 40;
      const size = 8 + Math.random() * 50;
      const vc = 4 + Math.floor(Math.random() * 4);
      const verts: { x: number; y: number }[] = [];
      const ba = Math.random() * Math.PI * 2;
      for (let v = 0; v < vc; v++) {
        const va = ba + (v / vc) * Math.PI * 2;
        const vr = size * (0.4 + Math.random() * 0.6);
        verts.push({ x: Math.cos(va) * vr, y: Math.sin(va) * vr });
      }
      const ddx = sx - cx, ddy = sy - cy;
      const dl = Math.sqrt(ddx * ddx + ddy * ddy) + 1;
      frags.push({
        verts, cx: sx, cy: sy, size,
        dx: ddx / dl, dy: ddy / dl,
        depth: Math.random(), delay: (dist / maxR) * 1.2 + Math.random() * 0.3,
        hue: Math.random() > 0.4 ? 271 : 320,
      });
    }

    const draw = () => {
      const t = (performance.now() - startRef.current) / 1000;
      const prog = Math.max(0, Math.min(1, (t - 0.5) / 2.5));
      const ease = 1 - Math.pow(1 - prog, 3);
      const mx = (mouseRef.current.x - 0.5) * 2;
      const my = (mouseRef.current.y - 0.5) * 2;

      // Energy field
      ctx.fillStyle = "rgb(2, 1, 3)";
      ctx.fillRect(0, 0, W, H);

      // Draw energy glow at center
      const bloomP = Math.min(1, ease * 1.5);
      if (bloomP > 0) {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 250 * bloomP);
        g.addColorStop(0, `hsla(270, 50%, 90%, ${bloomP * 0.25})`);
        g.addColorStop(0.3, `hsla(271, 80%, 55%, ${bloomP * 0.12})`);
        g.addColorStop(0.6, `hsla(320, 70%, 40%, ${bloomP * 0.05})`);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.fillRect(cx - 300, cy - 300, 600, 600);

        // Noise energy tendrils
        ctx.globalCompositeOperation = "lighter";
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2 + t * 0.05;
          const len = 80 + Math.sin(t * 0.7 + i * 2) * 30 + bloomP * 100;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          for (let s = 1; s <= 8; s++) {
            const p2 = s / 8;
            const n = fbm(i * 3 + t * 0.3, p2 * 3 + t * 0.2) - 0.5;
            ctx.lineTo(
              cx + Math.cos(a + n * 0.5) * len * p2,
              cy + Math.sin(a + n * 0.5) * len * p2 * 0.7
            );
          }
          ctx.strokeStyle = `hsla(280, 70%, 60%, ${bloomP * 0.08})`;
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.strokeStyle = `hsla(271, 50%, 85%, ${bloomP * 0.12})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        ctx.globalCompositeOperation = "source-over";
      }

      // Draw fragments
      for (const f of frags) {
        const fp = Math.max(0, Math.min(1, (ease - f.delay * 0.5) / (1 - f.delay * 0.4)));
        const sp = fp * fp;
        const drift = sp * 40;
        const cont = Math.max(0, t - 0.5 - f.delay) * 3;
        const px = mx * f.depth * 20 * Math.min(1, ease * 2);
        const py = my * f.depth * 20 * Math.min(1, ease * 2);
        const fx = f.cx + f.dx * (drift + cont) + px;
        const fy = f.cy + f.dy * (drift + cont) + py;

        ctx.save();
        ctx.translate(fx, fy);
        ctx.rotate(mx * f.depth * 0.03 * ease);
        ctx.beginPath();
        for (let i = 0; i < f.verts.length; i++) {
          if (i === 0) ctx.moveTo(f.verts[i].x, f.verts[i].y);
          else ctx.lineTo(f.verts[i].x, f.verts[i].y);
        }
        ctx.closePath();
        const dt = Math.floor(f.depth * 8);
        ctx.fillStyle = `rgb(${2 + dt}, ${1 + dt}, ${5 + dt * 2})`;
        ctx.fill();
        if (sp > 0.05) {
          ctx.strokeStyle = `hsla(${f.hue}, 90%, 65%, ${sp * f.depth * 0.4})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.strokeStyle = `hsla(${f.hue}, 80%, 50%, ${sp * f.depth * 0.15})`;
          ctx.lineWidth = 4;
          ctx.stroke();
        }
        ctx.restore();
      }

      // Vignette
      const vig = ctx.createRadialGradient(cx, cy, H * 0.25, cx, H * 0.5, H);
      vig.addColorStop(0, "transparent");
      vig.addColorStop(0.7, "rgba(2,1,3,0.3)");
      vig.addColorStop(1, "rgba(2,1,3,0.85)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouse);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{ background: "rgb(2, 1, 3)" }}
    />
  );
};
