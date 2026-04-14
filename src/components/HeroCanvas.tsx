import { useEffect, useRef, useCallback } from "react";

// ─── Noise helper (simplex-like) ───
const permutation = new Uint8Array(512);
(() => {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) permutation[i] = p[i & 255];
})();

function fade(t: number) { return t * t * t * (t * (t * 6 - 15) + 10); }
function lerp(a: number, b: number, t: number) { return a + t * (b - a); }
function grad(hash: number, x: number, y: number) {
  const h = hash & 3;
  const u = h < 2 ? x : y;
  const v = h < 2 ? y : x;
  return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
}
function perlin(x: number, y: number) {
  const xi = Math.floor(x) & 255, yi = Math.floor(y) & 255;
  const xf = x - Math.floor(x), yf = y - Math.floor(y);
  const u = fade(xf), v = fade(yf);
  const aa = permutation[permutation[xi] + yi];
  const ab = permutation[permutation[xi] + yi + 1];
  const ba = permutation[permutation[xi + 1] + yi];
  const bb = permutation[permutation[xi + 1] + yi + 1];
  return lerp(
    lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u),
    lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u),
    v
  );
}
function fbm(x: number, y: number, octaves = 4) {
  let val = 0, amp = 0.5, freq = 1;
  for (let i = 0; i < octaves; i++) {
    val += perlin(x * freq, y * freq) * amp;
    amp *= 0.5;
    freq *= 2;
  }
  return val;
}

// ─── Types ───
interface CrackSegment {
  points: { x: number; y: number }[];
  width: number;
  hue: number;
  opacity: number;
  growing: boolean;
  angle: number;
  speed: number;
  maxLength: number;
  length: number;
  depth: number;
  branches: CrackSegment[];
  birthTime: number;
  openWidth: number; // how wide the crack "opens" to reveal energy
  targetOpenWidth: number;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
}

interface ImpactFlash {
  x: number;
  y: number;
  radius: number;
  opacity: number;
}

const HeroCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const energyCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, moving: false, lastMove: 0 });
  const cracksRef = useRef<CrackSegment[]>([]);
  const sparksRef = useRef<Spark[]>([]);
  const flashesRef = useRef<ImpactFlash[]>([]);
  const timeRef = useRef(0);
  const rafRef = useRef<number>(0);
  const scrollRef = useRef(0);

  const createCrack = useCallback(
    (x: number, y: number, angle: number, depth: number, parentWidth = 3): CrackSegment => {
      const maxLen = depth === 0
        ? 100 + Math.random() * 160
        : depth === 1
          ? 50 + Math.random() * 80
          : 20 + Math.random() * 40;
      return {
        points: [{ x, y }],
        width: parentWidth * (depth === 0 ? 1 : depth === 1 ? 0.6 : 0.3),
        hue: Math.random() > 0.35 ? 271 : 320,
        opacity: 1,
        growing: true,
        angle: angle + (Math.random() - 0.5) * 0.3,
        speed: depth === 0 ? 5 + Math.random() * 4 : 3 + Math.random() * 3,
        maxLength: maxLen,
        length: 0,
        depth,
        branches: [],
        birthTime: timeRef.current,
        openWidth: 0,
        targetOpenWidth: depth === 0 ? 6 + Math.random() * 10 : depth === 1 ? 3 + Math.random() * 5 : 1 + Math.random() * 2,
      };
    },
    []
  );

  const spawnCracksAt = useCallback(
    (x: number, y: number) => {
      const count = 4 + Math.floor(Math.random() * 4);
      const baseAngle = Math.random() * Math.PI * 2;
      for (let i = 0; i < count; i++) {
        const angle = baseAngle + (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
        cracksRef.current.push(createCrack(x, y, angle, 0));
      }
      // Impact flash
      flashesRef.current.push({ x, y, radius: 5, opacity: 0.8 });
      // Impact sparks
      for (let i = 0; i < 12; i++) {
        const a = Math.random() * Math.PI * 2;
        const spd = 2 + Math.random() * 5;
        sparksRef.current.push({
          x, y,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd,
          life: 0,
          maxLife: 30 + Math.random() * 40,
          size: 1 + Math.random() * 2,
          hue: Math.random() > 0.5 ? 271 : 320,
        });
      }
    },
    [createCrack]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    // Energy field offscreen canvas
    const energyCanvas = document.createElement("canvas");
    energyCanvasRef.current = energyCanvas;
    const ectx = energyCanvas.getContext("2d");
    if (!ectx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Energy canvas at lower res for performance
      energyCanvas.width = Math.floor(w / 2);
      energyCanvas.height = Math.floor(h / 2);
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

      const threshold = 35;
      while (spawnAccum >= threshold) {
        spawnAccum -= threshold;
        const t = Math.random();
        const sx = prev.x + dx * t + (Math.random() - 0.5) * 6;
        const sy = prev.y + dy * t + (Math.random() - 0.5) * 6;
        spawnCracksAt(sx, sy);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) onMouseMove({ clientX: touch.clientX, clientY: touch.clientY } as MouseEvent);
    };

    const onScroll = () => {
      scrollRef.current = window.scrollY;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    // ─── Render energy field to offscreen canvas ───
    const renderEnergyField = (t: number) => {
      const ew = energyCanvas.width;
      const eh = energyCanvas.height;
      const imageData = ectx.createImageData(ew, eh);
      const data = imageData.data;

      const scale = 0.006;
      const tSlow = t * 0.4;

      for (let y = 0; y < eh; y++) {
        for (let x = 0; x < ew; x++) {
          const n1 = fbm(x * scale + tSlow, y * scale + tSlow * 0.7, 3);
          const n2 = fbm(x * scale * 1.5 - tSlow * 0.5, y * scale * 1.3 + tSlow * 0.3, 3);
          const n3 = fbm(x * scale * 0.8 + tSlow * 0.2, y * scale * 0.8 - tSlow * 0.4, 2);
          
          const swirl = Math.sin(n1 * 4 + t * 0.3) * 0.5 + 0.5;
          const intensity = Math.max(0, (n1 + n2 * 0.6 + n3 * 0.3) * 0.8 + 0.3);
          
          // Violet: #7B2FFF → rgb(123, 47, 255)
          // Magenta: #C8007A → rgb(200, 0, 122)
          const blend = swirl;
          const r = Math.floor(lerp(200, 123, blend) * intensity);
          const g = Math.floor(lerp(0, 47, blend) * intensity);
          const b = Math.floor(lerp(122, 255, blend) * intensity);

          // Add bright highlights
          const highlight = Math.max(0, n1 * 2 - 0.5) * 0.6;
          
          const idx = (y * ew + x) * 4;
          data[idx] = Math.min(255, r + highlight * 200);
          data[idx + 1] = Math.min(255, g + highlight * 100);
          data[idx + 2] = Math.min(255, b + highlight * 150);
          data[idx + 3] = 255;
        }
      }
      ectx.putImageData(imageData, 0, 0);
    };

    // ─── Grow a crack ───
    const growCrack = (c: CrackSegment) => {
      if (!c.growing) return;
      c.angle += (Math.random() - 0.5) * 0.2;
      // Jagged: occasional sharp turns
      if (Math.random() < 0.08) c.angle += (Math.random() - 0.5) * 1.0;
      const last = c.points[c.points.length - 1];
      const nx = last.x + Math.cos(c.angle) * c.speed;
      const ny = last.y + Math.sin(c.angle) * c.speed;
      c.points.push({ x: nx, y: ny });
      c.length += c.speed;

      // Spawn sparks along growing tip
      if (Math.random() < 0.3) {
        sparksRef.current.push({
          x: nx + (Math.random() - 0.5) * 4,
          y: ny + (Math.random() - 0.5) * 4,
          vx: (Math.random() - 0.5) * 3,
          vy: (Math.random() - 0.5) * 3,
          life: 0,
          maxLife: 20 + Math.random() * 25,
          size: 0.5 + Math.random() * 1.5,
          hue: c.hue,
        });
      }

      // Branch
      if (c.depth < 2 && c.length > 25 && Math.random() < 0.04) {
        const ba = c.angle + (Math.random() > 0.5 ? 1 : -1) * (0.5 + Math.random() * 0.7);
        c.branches.push(createCrack(nx, ny, ba, c.depth + 1, c.width));
      }

      if (c.length >= c.maxLength) c.growing = false;
      for (const b of c.branches) growCrack(b);
    };

    // ─── Draw crack with energy reveal ───
    const drawCrackEnergy = (c: CrackSegment, ctx: CanvasRenderingContext2D, ww: number, hh: number) => {
      if (c.points.length < 2 || c.opacity < 0.01) return;

      // Animate open width
      if (c.opacity > 0.3) {
        c.openWidth += (c.targetOpenWidth - c.openWidth) * 0.08;
      } else {
        c.openWidth *= 0.95;
      }

      const alpha = c.opacity;
      const ow = c.openWidth * alpha;

      if (ow > 0.5) {
        // Create a path that represents the "opening" of the crack
        // Draw thick stroke with energy canvas as fill (using clip)
        ctx.save();
        ctx.beginPath();
        // Build a thick path around the crack line
        for (let i = 0; i < c.points.length; i++) {
          const p = c.points[i];
          const progressRatio = i / c.points.length;
          const taper = Math.sin(progressRatio * Math.PI); // taper at ends
          const w = ow * taper;
          if (i === 0) {
            ctx.moveTo(p.x, p.y - w);
          } else {
            ctx.lineTo(p.x, p.y - w);
          }
        }
        for (let i = c.points.length - 1; i >= 0; i--) {
          const p = c.points[i];
          const progressRatio = i / c.points.length;
          const taper = Math.sin(progressRatio * Math.PI);
          const w = ow * taper;
          ctx.lineTo(p.x, p.y + w);
        }
        ctx.closePath();
        ctx.clip();

        // Draw energy field through the crack opening
        if (energyCanvasRef.current) {
          ctx.drawImage(energyCanvasRef.current, 0, 0, ww, hh);
        }
        ctx.restore();
      }

      // Draw branches' energy
      for (const b of c.branches) drawCrackEnergy(b, ctx, ww, hh);
    };

    const drawCrackGlow = (c: CrackSegment, ctx: CanvasRenderingContext2D) => {
      if (c.points.length < 2 || c.opacity < 0.01) return;
      const alpha = c.opacity;

      // Outer glow (wide, soft)
      ctx.beginPath();
      ctx.moveTo(c.points[0].x, c.points[0].y);
      for (let i = 1; i < c.points.length; i++) {
        ctx.lineTo(c.points[i].x, c.points[i].y);
      }
      ctx.strokeStyle = `hsla(${c.hue}, 80%, 40%, ${alpha * 0.06})`;
      ctx.lineWidth = c.width * 12 * alpha;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();

      // Mid glow
      ctx.strokeStyle = `hsla(${c.hue}, 85%, 50%, ${alpha * 0.15})`;
      ctx.lineWidth = c.width * 5 * alpha;
      ctx.stroke();

      // Bright glow
      ctx.strokeStyle = `hsla(${c.hue}, 85%, 65%, ${alpha * 0.4})`;
      ctx.lineWidth = c.width * 2 * alpha;
      ctx.stroke();

      // White-hot core
      ctx.strokeStyle = `hsla(${c.hue}, 40%, 90%, ${alpha * 0.7})`;
      ctx.lineWidth = c.width * 0.5 * alpha;
      ctx.stroke();

      for (const b of c.branches) drawCrackGlow(b, ctx);
    };

    const fadeCrack = (c: CrackSegment, rate: number) => {
      c.opacity -= rate;
      if (c.opacity < 0) c.opacity = 0;
      for (const b of c.branches) fadeCrack(b, rate * 1.1);
    };

    let energyFrameCounter = 0;

    const drawFrame = () => {
      timeRef.current += 0.016;
      const t = timeRef.current;
      const ww = W();
      const hh = H();
      const now = performance.now();

      // Detect if cursor stopped
      if (now - mouseRef.current.lastMove > 100) {
        mouseRef.current.moving = false;
      }

      // Update energy field every 3 frames for performance
      energyFrameCounter++;
      if (energyFrameCounter % 3 === 0) {
        renderEnergyField(t);
      }

      // ─── BLACK ABSOLUTE ───
      ctx.fillStyle = "rgb(2, 1, 3)";
      ctx.fillRect(0, 0, ww, hh);

      // Grow active cracks
      for (const c of cracksRef.current) {
        if (c.growing) growCrack(c);
      }

      // Fade
      const fadeRate = mouseRef.current.moving ? 0.005 : 0.02;
      for (const c of cracksRef.current) fadeCrack(c, fadeRate);
      cracksRef.current = cracksRef.current.filter((c) => c.opacity > 0.005);

      // ─── Draw energy through cracks (additive) ───
      ctx.globalCompositeOperation = "lighter";
      for (const c of cracksRef.current) {
        drawCrackEnergy(c, ctx, ww, hh);
      }

      // ─── Draw crack glow lines ───
      for (const c of cracksRef.current) {
        drawCrackGlow(c, ctx);
      }

      // ─── Sparks ───
      const aliveSparks: Spark[] = [];
      for (const s of sparksRef.current) {
        s.life++;
        if (s.life >= s.maxLife) continue;
        s.x += s.vx;
        s.y += s.vy;
        s.vx *= 0.96;
        s.vy *= 0.96;
        s.vy += 0.03; // slight gravity

        const lifeRatio = s.life / s.maxLife;
        const alpha = (1 - lifeRatio) * (1 - lifeRatio);

        // Spark glow
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${s.hue}, 80%, 50%, ${alpha * 0.15})`;
        ctx.fill();

        // Spark core
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * alpha, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${s.hue}, 60%, 85%, ${alpha * 0.9})`;
        ctx.fill();

        aliveSparks.push(s);
      }
      sparksRef.current = aliveSparks;

      // ─── Impact flashes ───
      const aliveFlashes: ImpactFlash[] = [];
      for (const f of flashesRef.current) {
        f.radius += 8;
        f.opacity -= 0.04;
        if (f.opacity <= 0) continue;

        const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius);
        grad.addColorStop(0, `hsla(280, 80%, 80%, ${f.opacity * 0.5})`);
        grad.addColorStop(0.3, `hsla(271, 90%, 55%, ${f.opacity * 0.2})`);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.fillRect(f.x - f.radius, f.y - f.radius, f.radius * 2, f.radius * 2);

        aliveFlashes.push(f);
      }
      flashesRef.current = aliveFlashes;

      ctx.globalCompositeOperation = "source-over";

      // ─── Subtle ambient cursor glow ───
      if (mouseRef.current.x > -500) {
        const mx = mouseRef.current.x;
        const my = mouseRef.current.y;
        const grad = ctx.createRadialGradient(mx, my, 0, mx, my, 60);
        grad.addColorStop(0, "hsla(271, 80%, 50%, 0.02)");
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.fillRect(mx - 60, my - 60, 120, 120);
      }

      rafRef.current = requestAnimationFrame(drawFrame);
    };

    ctx.fillStyle = "rgb(2, 1, 3)";
    ctx.fillRect(0, 0, W(), H());
    renderEnergyField(0);
    rafRef.current = requestAnimationFrame(drawFrame);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [createCrack, spawnCracksAt]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full cursor-none"
      style={{ background: "rgb(2, 1, 3)" }}
    />
  );
};

export default HeroCanvas;
