import { useEffect, useRef, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
  trail: { x: number; y: number }[];
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  hue: number;
}

const HeroCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, prevX: -1000, prevY: -1000 });
  const particlesRef = useRef<Particle[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const frameRef = useRef(0);
  const timeRef = useRef(0);
  const rafRef = useRef<number>(0);

  const createParticle = useCallback((x: number, y: number, burst = false): Particle => {
    const angle = Math.random() * Math.PI * 2;
    const speed = burst ? Math.random() * 4 + 2 : Math.random() * 1.5 + 0.3;
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      maxLife: burst ? 60 + Math.random() * 40 : 120 + Math.random() * 80,
      size: burst ? Math.random() * 3 + 1 : Math.random() * 2 + 0.5,
      hue: Math.random() > 0.5 ? 270 + Math.random() * 20 : 320 + Math.random() * 20,
      trail: [],
    };
  }, []);

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
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const w = () => window.innerWidth;
    const h = () => window.innerHeight;

    // Ambient particles
    const spawnAmbient = () => {
      if (particlesRef.current.length < 300) {
        const p = createParticle(
          Math.random() * w(),
          Math.random() * h()
        );
        p.vx *= 0.3;
        p.vy *= 0.3;
        p.size = Math.random() * 1.5 + 0.3;
        p.maxLife = 200 + Math.random() * 150;
        particlesRef.current.push(p);
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.prevX = mouseRef.current.x;
      mouseRef.current.prevY = mouseRef.current.y;
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;

      // Spawn particles along mouse trail
      const dx = e.clientX - mouseRef.current.prevX;
      const dy = e.clientY - mouseRef.current.prevY;
      const speed = Math.sqrt(dx * dx + dy * dy);
      const count = Math.min(Math.floor(speed / 3), 8);
      for (let i = 0; i < count; i++) {
        particlesRef.current.push(
          createParticle(
            e.clientX + (Math.random() - 0.5) * 20,
            e.clientY + (Math.random() - 0.5) * 20
          )
        );
      }
    };

    const onClick = (e: MouseEvent) => {
      // Burst effect
      for (let i = 0; i < 40; i++) {
        particlesRef.current.push(createParticle(e.clientX, e.clientY, true));
      }
      ripplesRef.current.push({
        x: e.clientX,
        y: e.clientY,
        radius: 0,
        maxRadius: 200 + Math.random() * 100,
        opacity: 0.6,
        hue: Math.random() > 0.5 ? 270 : 320,
      });
    };

    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) {
        onMouseMove({ clientX: touch.clientX, clientY: touch.clientY, ...e } as unknown as MouseEvent);
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("click", onClick);
    window.addEventListener("touchmove", onTouchMove, { passive: true });

    // Noise function (simplex-like)
    const noise = (x: number, y: number, t: number) => {
      return (
        Math.sin(x * 0.01 + t) * Math.cos(y * 0.013 + t * 0.7) +
        Math.sin(x * 0.02 - t * 0.5) * Math.cos(y * 0.008 + t * 0.3) +
        Math.sin((x + y) * 0.005 + t * 0.2) * 0.5
      ) / 2.5;
    };

    const drawFrame = () => {
      timeRef.current += 0.008;
      frameRef.current++;
      const t = timeRef.current;
      const W = w();
      const H = h();

      // Clear with subtle trail
      ctx.fillStyle = "rgba(5, 3, 12, 0.12)";
      ctx.fillRect(0, 0, W, H);

      // Every few frames, add deep background clear to prevent too much buildup
      if (frameRef.current % 4 === 0) {
        ctx.fillStyle = "rgba(5, 3, 12, 0.03)";
        ctx.fillRect(0, 0, W, H);
      }

      // Ambient organic flow field
      if (frameRef.current % 3 === 0) spawnAmbient();

      // Central energy vortex
      const cx = W / 2;
      const cy = H / 2;
      const vortexPulse = Math.sin(t * 0.5) * 0.3 + 0.7;

      // Draw vortex glow
      const gradient = ctx.createRadialGradient(
        cx + Math.sin(t * 0.3) * 30,
        cy + Math.cos(t * 0.4) * 20,
        0,
        cx,
        cy,
        H * 0.6 * vortexPulse
      );
      gradient.addColorStop(0, `hsla(280, 90%, 40%, ${0.06 * vortexPulse})`);
      gradient.addColorStop(0.3, `hsla(270, 80%, 30%, ${0.03 * vortexPulse})`);
      gradient.addColorStop(0.6, `hsla(320, 70%, 25%, ${0.015 * vortexPulse})`);
      gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, W, H);

      // Mouse influence glow
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      if (mx > -500) {
        const mouseGlow = ctx.createRadialGradient(mx, my, 0, mx, my, 180);
        mouseGlow.addColorStop(0, "hsla(290, 90%, 55%, 0.08)");
        mouseGlow.addColorStop(0.4, "hsla(270, 80%, 40%, 0.03)");
        mouseGlow.addColorStop(1, "transparent");
        ctx.fillStyle = mouseGlow;
        ctx.fillRect(0, 0, W, H);
      }

      // Update and draw particles
      const alive: Particle[] = [];
      for (const p of particlesRef.current) {
        p.life++;
        if (p.life >= p.maxLife) continue;

        // Flow field influence
        const n = noise(p.x, p.y, t);
        const angle = n * Math.PI * 2;
        p.vx += Math.cos(angle) * 0.05;
        p.vy += Math.sin(angle) * 0.05;

        // Vortex pull (subtle)
        const dxC = cx - p.x;
        const dyC = cy - p.y;
        const distC = Math.sqrt(dxC * dxC + dyC * dyC) + 1;
        const vortexForce = 0.3 / distC;
        const perpX = -dyC / distC;
        const perpY = dxC / distC;
        p.vx += perpX * vortexForce + dxC / distC * 0.02;
        p.vy += perpY * vortexForce + dyC / distC * 0.02;

        // Mouse repulsion
        if (mx > -500) {
          const dxM = p.x - mx;
          const dyM = p.y - my;
          const distM = Math.sqrt(dxM * dxM + dyM * dyM) + 1;
          if (distM < 150) {
            const force = (150 - distM) / 150 * 0.8;
            p.vx += (dxM / distM) * force;
            p.vy += (dyM / distM) * force;
          }
        }

        // Damping
        p.vx *= 0.98;
        p.vy *= 0.98;

        p.x += p.vx;
        p.y += p.vy;

        // Trail
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 12) p.trail.shift();

        // Life-based opacity
        const lifeRatio = p.life / p.maxLife;
        const fadeIn = Math.min(p.life / 10, 1);
        const fadeOut = 1 - Math.pow(lifeRatio, 3);
        const alpha = fadeIn * fadeOut;

        // Draw trail
        if (p.trail.length > 2) {
          ctx.beginPath();
          ctx.moveTo(p.trail[0].x, p.trail[0].y);
          for (let i = 1; i < p.trail.length; i++) {
            ctx.lineTo(p.trail[i].x, p.trail[i].y);
          }
          ctx.strokeStyle = `hsla(${p.hue}, 80%, 60%, ${alpha * 0.3})`;
          ctx.lineWidth = p.size * 0.5;
          ctx.stroke();
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 85%, 65%, ${alpha * 0.8})`;
        ctx.fill();

        // Glow
        if (p.size > 1.5) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 3 * alpha, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.hue}, 80%, 50%, ${alpha * 0.1})`;
          ctx.fill();
        }

        alive.push(p);
      }
      particlesRef.current = alive;

      // Ripples
      const aliveRipples: Ripple[] = [];
      for (const r of ripplesRef.current) {
        r.radius += 3;
        r.opacity -= 0.008;
        if (r.opacity <= 0) continue;

        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${r.hue}, 80%, 60%, ${r.opacity})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Inner ring
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius * 0.6, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${r.hue + 30}, 70%, 50%, ${r.opacity * 0.5})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();

        aliveRipples.push(r);
      }
      ripplesRef.current = aliveRipples;

      // Floating energy lines (organic curves)
      for (let i = 0; i < 3; i++) {
        const baseY = H * (0.25 + i * 0.25);
        ctx.beginPath();
        const segments = 80;
        for (let s = 0; s <= segments; s++) {
          const x = (s / segments) * W;
          const n1 = noise(x * 0.5, baseY, t + i);
          const n2 = noise(x * 0.3, baseY, t * 0.7 + i * 2);
          const y = baseY + n1 * 60 + n2 * 30;
          if (s === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        const lineHue = 270 + i * 25;
        const lineAlpha = 0.04 + Math.sin(t + i) * 0.02;
        ctx.strokeStyle = `hsla(${lineHue}, 70%, 50%, ${lineAlpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Tiny star-like sparkles
      if (frameRef.current % 5 === 0) {
        for (let i = 0; i < 2; i++) {
          const sx = Math.random() * W;
          const sy = Math.random() * H;
          const sparkleAlpha = Math.random() * 0.6 + 0.2;
          ctx.beginPath();
          ctx.arc(sx, sy, 0.5, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${260 + Math.random() * 70}, 60%, 80%, ${sparkleAlpha})`;
          ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(drawFrame);
    };

    // Initial black fill
    ctx.fillStyle = "rgb(5, 3, 12)";
    ctx.fillRect(0, 0, w(), h());

    rafRef.current = requestAnimationFrame(drawFrame);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("click", onClick);
      window.removeEventListener("touchmove", onTouchMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [createParticle]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full cursor-none"
      style={{ background: "rgb(5, 3, 12)" }}
    />
  );
};

export default HeroCanvas;
