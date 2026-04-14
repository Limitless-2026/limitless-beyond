import { useEffect, useRef, useCallback } from "react";

interface Crack {
  x: number;
  y: number;
  angle: number;
  length: number;
  maxLength: number;
  speed: number;
  width: number;
  hue: number;
  opacity: number;
  branches: Crack[];
  depth: number;
  growing: boolean;
  points: { x: number; y: number }[];
}

const HeroCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, moving: false, lastMove: 0 });
  const cracksRef = useRef<Crack[]>([]);
  const fadeRef = useRef(0);
  const rafRef = useRef<number>(0);

  const createCrack = useCallback(
    (x: number, y: number, angle: number, depth: number, parentWidth = 2.5): Crack => {
      const maxLen = depth === 0
        ? 80 + Math.random() * 120
        : depth === 1
          ? 40 + Math.random() * 60
          : 15 + Math.random() * 30;
      return {
        x,
        y,
        angle: angle + (Math.random() - 0.5) * 0.4,
        length: 0,
        maxLength: maxLen,
        speed: depth === 0 ? 4 + Math.random() * 3 : 2 + Math.random() * 2,
        width: parentWidth * (depth === 0 ? 1 : 0.5),
        hue: Math.random() > 0.4 ? 270 + Math.random() * 15 : 315 + Math.random() * 20,
        opacity: 1,
        branches: [],
        depth,
        growing: true,
        points: [{ x, y }],
      };
    },
    []
  );

  const spawnCracksAt = useCallback(
    (x: number, y: number) => {
      const count = 3 + Math.floor(Math.random() * 4);
      const baseAngle = Math.random() * Math.PI * 2;
      for (let i = 0; i < count; i++) {
        const angle = baseAngle + (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
        cracksRef.current.push(createCrack(x, y, angle, 0));
      }
    },
    [createCrack]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const W = () => window.innerWidth;
    const H = () => window.innerHeight;

    let spawnAccum = 0;

    const onMouseMove = (e: MouseEvent) => {
      const prev = { x: mouseRef.current.x, y: mouseRef.current.y };
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.moving = true;
      mouseRef.current.lastMove = performance.now();

      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      const speed = Math.sqrt(dx * dx + dy * dy);
      spawnAccum += speed;

      const threshold = 25;
      while (spawnAccum >= threshold) {
        spawnAccum -= threshold;
        const t = Math.random();
        const sx = prev.x + dx * t + (Math.random() - 0.5) * 8;
        const sy = prev.y + dy * t + (Math.random() - 0.5) * 8;
        spawnCracksAt(sx, sy);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) {
        onMouseMove({
          clientX: touch.clientX,
          clientY: touch.clientY,
        } as MouseEvent);
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove, { passive: true });

    const growCrack = (c: Crack) => {
      if (!c.growing) return;
      const step = c.speed;
      // Add slight wandering
      c.angle += (Math.random() - 0.5) * 0.15;
      const nx = c.points[c.points.length - 1].x + Math.cos(c.angle) * step;
      const ny = c.points[c.points.length - 1].y + Math.sin(c.angle) * step;
      c.points.push({ x: nx, y: ny });
      c.length += step;

      // Branch
      if (c.depth < 2 && c.length > 20 && Math.random() < 0.06) {
        const branchAngle = c.angle + (Math.random() > 0.5 ? 1 : -1) * (0.4 + Math.random() * 0.8);
        c.branches.push(createCrack(nx, ny, branchAngle, c.depth + 1, c.width));
      }

      if (c.length >= c.maxLength) {
        c.growing = false;
      }

      // Grow branches
      for (const b of c.branches) {
        growCrack(b);
      }
    };

    const drawCrack = (c: Crack, globalFade: number) => {
      if (c.points.length < 2) return;
      const alpha = c.opacity * globalFade;
      if (alpha < 0.005) return;

      // Core bright line
      ctx.beginPath();
      ctx.moveTo(c.points[0].x, c.points[0].y);
      for (let i = 1; i < c.points.length; i++) {
        ctx.lineTo(c.points[i].x, c.points[i].y);
      }
      ctx.strokeStyle = `hsla(${c.hue}, 85%, 75%, ${alpha * 0.9})`;
      ctx.lineWidth = c.width * 0.4 * alpha;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();

      // Wide glow
      ctx.strokeStyle = `hsla(${c.hue}, 80%, 55%, ${alpha * 0.3})`;
      ctx.lineWidth = c.width * 1.8 * alpha;
      ctx.stroke();

      // Outer soft glow
      ctx.strokeStyle = `hsla(${c.hue}, 70%, 45%, ${alpha * 0.08})`;
      ctx.lineWidth = c.width * 5 * alpha;
      ctx.stroke();

      // Draw branches
      for (const b of c.branches) {
        drawCrack(b, globalFade);
      }
    };

    const fadeCrack = (c: Crack, rate: number) => {
      c.opacity -= rate;
      if (c.opacity < 0) c.opacity = 0;
      for (const b of c.branches) {
        fadeCrack(b, rate * 1.2);
      }
    };

    const drawFrame = () => {
      const now = performance.now();
      const ww = W();
      const hh = H();

      // Detect if cursor stopped
      const timeSinceMove = now - mouseRef.current.lastMove;
      if (timeSinceMove > 80) {
        mouseRef.current.moving = false;
      }

      // Black canvas — absolute black, always
      ctx.fillStyle = "rgb(2, 1, 5)";
      ctx.fillRect(0, 0, ww, hh);

      // Grow active cracks
      for (const c of cracksRef.current) {
        if (c.growing) growCrack(c);
      }

      // Fade cracks — faster when cursor stops
      const fadeRate = mouseRef.current.moving ? 0.008 : 0.025;
      for (const c of cracksRef.current) {
        fadeCrack(c, fadeRate);
      }

      // Remove fully faded
      cracksRef.current = cracksRef.current.filter((c) => c.opacity > 0.005);

      // Draw all cracks
      ctx.globalCompositeOperation = "lighter";
      for (const c of cracksRef.current) {
        drawCrack(c, 1);
      }
      ctx.globalCompositeOperation = "source-over";

      // Subtle glow around cursor when cracks are active
      if (cracksRef.current.length > 0 && mouseRef.current.x > -500) {
        const mx = mouseRef.current.x;
        const my = mouseRef.current.y;
        const intensity = Math.min(cracksRef.current.length / 30, 1);
        const glow = ctx.createRadialGradient(mx, my, 0, mx, my, 100);
        glow.addColorStop(0, `hsla(280, 80%, 50%, ${0.04 * intensity})`);
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.fillRect(mx - 100, my - 100, 200, 200);
      }

      rafRef.current = requestAnimationFrame(drawFrame);
    };

    ctx.fillStyle = "rgb(2, 1, 5)";
    ctx.fillRect(0, 0, W(), H());
    rafRef.current = requestAnimationFrame(drawFrame);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [createCrack, spawnCracksAt]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full cursor-none"
      style={{ background: "rgb(2, 1, 5)" }}
    />
  );
};

export default HeroCanvas;
