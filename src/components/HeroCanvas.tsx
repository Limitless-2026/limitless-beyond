import { useEffect, useRef } from "react";

// ─── Noise ───
const perm = new Uint8Array(512);
(() => {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
})();
function fade(t: number) { return t * t * t * (t * (t * 6 - 15) + 10); }
function lerp(a: number, b: number, t: number) { return a + t * (b - a); }
function grad2(hash: number, x: number, y: number) {
  const h = hash & 3;
  return ((h & 1) ? -(h < 2 ? x : y) : (h < 2 ? x : y)) + ((h & 2) ? -(h < 2 ? y : x) : (h < 2 ? y : x));
}
function perlin(x: number, y: number) {
  const xi = Math.floor(x) & 255, yi = Math.floor(y) & 255;
  const xf = x - Math.floor(x), yf = y - Math.floor(y);
  const u = fade(xf), v = fade(yf);
  return lerp(
    lerp(grad2(perm[perm[xi] + yi], xf, yf), grad2(perm[perm[xi + 1] + yi], xf - 1, yf), u),
    lerp(grad2(perm[perm[xi] + yi + 1], xf, yf - 1), grad2(perm[perm[xi + 1] + yi + 1], xf - 1, yf - 1), u),
    v
  );
}
function fbm(x: number, y: number, oct = 4) {
  let v = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { v += perlin(x * f, y * f) * a; a *= 0.5; f *= 2; }
  return v;
}

// ─── Types ───
interface Shard {
  // Shape
  verts: { x: number; y: number }[]; // relative to centroid
  cx: number; cy: number; // original centroid
  size: number;
  // Movement
  driftX: number; driftY: number; // direction of drift (away from center)
  driftSpeed: number;
  rotationSpeed: number;
  // Depth layer (0 = far/deep, 1 = close/foreground)
  depth: number;
  // Animation state
  currentDrift: number;
  currentRotation: number;
  // Visual
  brightness: number; // edge glow intensity
  delay: number; // animation delay in seconds
}

interface Debris {
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  opacity: number;
  depth: number;
}

const HeroCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const shardsRef = useRef<Shard[]>([]);
  const debrisRef = useRef<Debris[]>([]);
  const startTimeRef = useRef(0);
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
      generateShards();
    };

    // ─── Generate organic irregular shards ───
    const generateShards = () => {
      const cx = W * 0.5;
      const cy = H * 0.45; // slightly above center, like the reference
      const shards: Shard[] = [];
      const debris: Debris[] = [];
      const maxDist = Math.max(W, H) * 0.7;

      // Create shards in clusters around the rift center
      // Large shards at the edges, small and medium scattered throughout
      const count = 120 + Math.floor((W * H) / 8000);

      for (let i = 0; i < count; i++) {
        // Distribution: more near center-ish area, spreading outward
        const angle = Math.random() * Math.PI * 2;
        // Bias toward middle distances (not too center, not too edge)
        const distFactor = Math.pow(Math.random(), 0.6);
        const dist = distFactor * maxDist * 0.9 + 10;

        const shardCx = cx + Math.cos(angle) * dist + (Math.random() - 0.5) * 80;
        const shardCy = cy + Math.sin(angle) * dist * 0.7 + (Math.random() - 0.5) * 60; // squished vertically

        // Size: varies dramatically. Close to center = smaller debris, mid = mixed, far = some large
        const sizeBase = distFactor < 0.3
          ? 5 + Math.random() * 20
          : distFactor < 0.6
            ? 10 + Math.random() * 45
            : 15 + Math.random() * 60;
        const size = sizeBase * (0.5 + Math.random());

        // Generate irregular polygon shape
        const vertCount = 4 + Math.floor(Math.random() * 5);
        const verts: { x: number; y: number }[] = [];
        const baseAngle = Math.random() * Math.PI * 2;

        for (let v = 0; v < vertCount; v++) {
          const va = baseAngle + (v / vertCount) * Math.PI * 2;
          // Irregular radius for each vertex
          const vr = size * (0.4 + Math.random() * 0.6);
          // Make shapes more elongated/jagged
          const stretch = 0.7 + Math.random() * 0.6;
          verts.push({
            x: Math.cos(va) * vr * stretch,
            y: Math.sin(va) * vr,
          });
        }

        // Drift direction: away from center
        const dx = shardCx - cx;
        const dy = shardCy - cy;
        const dLen = Math.sqrt(dx * dx + dy * dy) + 1;

        const depth = Math.random(); // 0-1 random depth layer

        shards.push({
          verts,
          cx: shardCx,
          cy: shardCy,
          size,
          driftX: dx / dLen,
          driftY: dy / dLen,
          driftSpeed: 0.3 + Math.random() * 1.5,
          rotationSpeed: (Math.random() - 0.5) * 0.008,
          depth,
          currentDrift: 0,
          currentRotation: Math.random() * Math.PI * 2,
          brightness: 0.3 + Math.random() * 0.7,
          delay: distFactor * 1.2 + Math.random() * 0.3,
        });
      }

      // Tiny debris particles
      for (let i = 0; i < 200; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * maxDist * 0.8;
        debris.push({
          x: cx + Math.cos(angle) * dist,
          y: cy + Math.sin(angle) * dist * 0.7,
          vx: Math.cos(angle) * (0.1 + Math.random() * 0.5),
          vy: Math.sin(angle) * (0.1 + Math.random() * 0.3),
          size: 0.5 + Math.random() * 2.5,
          opacity: 0.3 + Math.random() * 0.7,
          depth: Math.random(),
        });
      }

      shardsRef.current = shards;
      debrisRef.current = debris;
    };

    resize();
    window.addEventListener("resize", resize);

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX / W;
      mouseRef.current.y = e.clientY / H;
    };
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) { mouseRef.current.x = t.clientX / W; mouseRef.current.y = t.clientY / H; }
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouch, { passive: true });

    startTimeRef.current = performance.now();

    // ─── Energy field offscreen canvas ───
    const eCanvas = document.createElement("canvas");
    const eScale = 3;
    const ew = Math.floor(W / eScale);
    const eh = Math.floor(H / eScale);
    eCanvas.width = ew;
    eCanvas.height = eh;
    const ectx = eCanvas.getContext("2d")!;

    let lastEnergyTime = -1;
    const renderEnergy = (t: number) => {
      const imgData = ectx.createImageData(ew, eh);
      const d = imgData.data;
      const scale = 0.004;
      const ts = t * 0.25;
      const ecx = ew / 2;
      const ecy = eh * 0.45;

      for (let y = 0; y < eh; y++) {
        for (let x = 0; x < ew; x++) {
          const dx = (x - ecx) / ew;
          const dy = (y - ecy) / eh;
          const distFromCenter = Math.sqrt(dx * dx + dy * dy * 2);

          const n1 = fbm(x * scale + ts, y * scale + ts * 0.6, 4);
          const n2 = fbm(x * scale * 1.5 - ts * 0.3, y * scale * 1.2 + ts * 0.4, 3);
          const n3 = fbm(x * scale * 0.7 + ts * 0.15, y * scale * 0.9 - ts * 0.2, 2);

          // Intensity peaks at center, fades outward
          const centerFalloff = Math.max(0, 1 - distFromCenter * 1.8);
          const centerPow = Math.pow(centerFalloff, 1.5);
          const baseIntensity = (n1 * 0.5 + n2 * 0.3 + n3 * 0.2 + 0.5) * centerPow;

          // Color: white-hot center → blue → violet → magenta at edges
          const colorShift = Math.min(1, distFromCenter * 2.5);
          const swirl = Math.sin(n1 * 4 + t * 0.15) * 0.5 + 0.5;

          let r: number, g: number, b: number;

          if (colorShift < 0.2) {
            // White-hot center
            const inner = colorShift / 0.2;
            r = lerp(255, 200, inner) * baseIntensity;
            g = lerp(240, 140, inner) * baseIntensity;
            b = lerp(255, 255, inner) * baseIntensity;
          } else if (colorShift < 0.5) {
            // Blue-violet transition
            const mid = (colorShift - 0.2) / 0.3;
            r = lerp(200, 123, mid) * baseIntensity;
            g = lerp(140, 30, mid) * baseIntensity;
            b = 255 * baseIntensity;
          } else {
            // Violet → magenta at edges
            const outer = Math.min(1, (colorShift - 0.5) / 0.5);
            const mg = lerp(0, 1, swirl * outer);
            r = lerp(123, 200, mg) * baseIntensity;
            g = lerp(30, 0, outer) * baseIntensity;
            b = lerp(255, 150, outer) * baseIntensity;
          }

          // Hot spots
          const hotspot = Math.max(0, n1 * 2.5 - 0.7) * centerPow;
          r = Math.min(255, r + hotspot * 200);
          g = Math.min(255, g + hotspot * 150);
          b = Math.min(255, b + hotspot * 180);

          const idx = (y * ew + x) * 4;
          d[idx] = r;
          d[idx + 1] = g;
          d[idx + 2] = b;
          d[idx + 3] = 255;
        }
      }
      ectx.putImageData(imgData, 0, 0);
    };
    renderEnergy(0);

    // ─── Main render loop ───
    const drawFrame = () => {
      const now = performance.now();
      const t = (now - startTimeRef.current) / 1000;

      // Crack timeline
      const crackStart = 0.6;
      const crackDuration = 2.5;
      const globalProgress = Math.max(0, Math.min(1, (t - crackStart) / crackDuration));
      const easeProgress = 1 - Math.pow(1 - globalProgress, 2.5);

      // Mouse parallax
      const mx = (mouseRef.current.x - 0.5) * 2;
      const my = (mouseRef.current.y - 0.5) * 2;

      // Update energy every ~5 frames
      if (t - lastEnergyTime > 0.08) {
        renderEnergy(t);
        lastEnergyTime = t;
      }

      // ─── 1. Draw energy field (the universe behind) ───
      ctx.drawImage(eCanvas, 0, 0, W, H);

      // Add star points on top of energy
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 60; i++) {
        const sx = ((i * 137.5 + 50) % W);
        const sy = ((i * 97.3 + 30) % H);
        const twinkle = Math.sin(t * (1 + i * 0.1) + i * 2.3) * 0.4 + 0.6;
        const starSize = (i % 5 === 0) ? 2 : 0.8;
        ctx.beginPath();
        ctx.arc(sx, sy, starSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 240, 255, ${twinkle * 0.4})`;
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";

      // ─── 2. Draw black shards on top (the "screen" breaking apart) ───
      for (const shard of shardsRef.current) {
        const shardProgress = Math.max(0, Math.min(1,
          (easeProgress - shard.delay * 0.5) / (1 - shard.delay * 0.4)
        ));
        const sp = Math.pow(shardProgress, 0.8);

        // Drift away from center
        const drift = sp * shard.driftSpeed * 40;
        const dx = shard.driftX * drift;
        const dy = shard.driftY * drift;

        // Continuous slow drift after initial burst
        const continuousDrift = Math.max(0, t - crackStart - shard.delay) * shard.driftSpeed * 3;
        const cdx = shard.driftX * continuousDrift;
        const cdy = shard.driftY * continuousDrift;

        // Rotation
        const rot = shard.currentRotation + shard.rotationSpeed * t * 60;

        // Parallax
        const pStr = shard.depth * 20 * Math.min(1, easeProgress * 2);
        const px = mx * pStr;
        const py = my * pStr;

        const finalX = shard.cx + dx + cdx + px;
        const finalY = shard.cy + dy + cdy + py;

        // Skip if completely off screen
        if (finalX < -shard.size * 2 || finalX > W + shard.size * 2 ||
            finalY < -shard.size * 2 || finalY > H + shard.size * 2) continue;

        ctx.save();
        ctx.translate(finalX, finalY);
        ctx.rotate(rot);

        // Scale slightly based on depth (perspective)
        const perspScale = 0.85 + shard.depth * 0.3;
        ctx.scale(perspScale, perspScale);

        // Draw shard shape
        ctx.beginPath();
        for (let i = 0; i < shard.verts.length; i++) {
          if (i === 0) ctx.moveTo(shard.verts[i].x, shard.verts[i].y);
          else ctx.lineTo(shard.verts[i].x, shard.verts[i].y);
        }
        ctx.closePath();

        // Fill: very dark with slight violet tint for depth
        const depthTint = Math.floor(shard.depth * 8);
        ctx.fillStyle = `rgb(${2 + depthTint}, ${1 + depthTint}, ${5 + depthTint * 2})`;
        ctx.fill();

        // Edge glow: bright violet/magenta edges when cracked
        if (sp > 0.05) {
          const edgeAlpha = sp * shard.brightness * 0.4;
          ctx.strokeStyle = `hsla(271, 90%, 65%, ${edgeAlpha})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Outer glow
          ctx.strokeStyle = `hsla(290, 80%, 50%, ${edgeAlpha * 0.3})`;
          ctx.lineWidth = 4;
          ctx.stroke();
        }

        ctx.restore();
      }

      // ─── 3. Debris particles ───
      ctx.globalCompositeOperation = "lighter";
      for (const d of debrisRef.current) {
        const debrisProgress = Math.max(0, easeProgress * 1.5 - 0.2);
        if (debrisProgress <= 0) continue;

        const dx = d.vx * t * 30 * debrisProgress;
        const dy = d.vy * t * 30 * debrisProgress;
        const px = mx * d.depth * 12;
        const py = my * d.depth * 12;
        const x = d.x + dx + px;
        const y = d.y + dy + py;

        if (x < -10 || x > W + 10 || y < -10 || y > H + 10) continue;

        const alpha = d.opacity * debrisProgress * 0.6;
        ctx.beginPath();
        ctx.arc(x, y, d.size * debrisProgress, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(275, 70%, 70%, ${alpha})`;
        ctx.fill();

        if (d.size > 1.5) {
          ctx.beginPath();
          ctx.arc(x, y, d.size * 3, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(271, 80%, 50%, ${alpha * 0.15})`;
          ctx.fill();
        }
      }

      // ─── 4. Central energy bloom ───
      const bloomProgress = Math.min(1, easeProgress * 1.5);
      if (bloomProgress > 0) {
        const bcx = W * 0.5 + mx * 5;
        const bcy = H * 0.45 + my * 5;
        const bloomSize = (150 + bloomProgress * 200) * (1 + Math.sin(t * 0.5) * 0.05);

        // Bright white-violet core
        const g1 = ctx.createRadialGradient(bcx, bcy, 0, bcx, bcy, bloomSize * 0.3);
        g1.addColorStop(0, `hsla(270, 40%, 95%, ${bloomProgress * 0.4})`);
        g1.addColorStop(0.5, `hsla(271, 80%, 70%, ${bloomProgress * 0.2})`);
        g1.addColorStop(1, "transparent");
        ctx.fillStyle = g1;
        ctx.fillRect(bcx - bloomSize, bcy - bloomSize, bloomSize * 2, bloomSize * 2);

        // Wide violet haze
        const g2 = ctx.createRadialGradient(bcx, bcy, 0, bcx, bcy, bloomSize);
        g2.addColorStop(0, `hsla(271, 90%, 55%, ${bloomProgress * 0.12})`);
        g2.addColorStop(0.4, `hsla(290, 80%, 45%, ${bloomProgress * 0.06})`);
        g2.addColorStop(0.7, `hsla(320, 70%, 35%, ${bloomProgress * 0.02})`);
        g2.addColorStop(1, "transparent");
        ctx.fillStyle = g2;
        ctx.fillRect(bcx - bloomSize, bcy - bloomSize, bloomSize * 2, bloomSize * 2);

        // Energy tendrils (wispy lines radiating from center)
        for (let i = 0; i < 12; i++) {
          const baseAngle = (i / 12) * Math.PI * 2 + t * 0.05;
          const tendrilLen = 80 + Math.sin(t * 0.7 + i * 2) * 40 + bloomProgress * 120;

          ctx.beginPath();
          ctx.moveTo(bcx, bcy);
          const steps = 10;
          for (let s = 1; s <= steps; s++) {
            const prog = s / steps;
            const noiseVal = perlin(i * 3 + t * 0.3, prog * 3 + t * 0.2);
            const tx = bcx + Math.cos(baseAngle + noiseVal * 0.5) * tendrilLen * prog;
            const ty = bcy + Math.sin(baseAngle + noiseVal * 0.5) * tendrilLen * prog * 0.7;
            ctx.lineTo(tx, ty);
          }
          ctx.strokeStyle = `hsla(280, 70%, 65%, ${bloomProgress * 0.06})`;
          ctx.lineWidth = 3;
          ctx.lineCap = "round";
          ctx.stroke();

          ctx.strokeStyle = `hsla(271, 50%, 85%, ${bloomProgress * 0.1})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      ctx.globalCompositeOperation = "source-over";

      // ─── 5. Impact flash at crack start ───
      if (t > crackStart && t < crackStart + 0.6) {
        const fp = (t - crackStart) / 0.6;
        const fa = Math.pow(1 - fp, 2) * 0.5;
        ctx.globalCompositeOperation = "lighter";
        const fg = ctx.createRadialGradient(W * 0.5, H * 0.45, 0, W * 0.5, H * 0.45, 300 * fp);
        fg.addColorStop(0, `hsla(270, 60%, 95%, ${fa})`);
        fg.addColorStop(0.3, `hsla(271, 80%, 60%, ${fa * 0.4})`);
        fg.addColorStop(1, "transparent");
        ctx.fillStyle = fg;
        ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = "source-over";
      }

      // ─── 6. Vignette ───
      const vig = ctx.createRadialGradient(W * 0.5, H * 0.45, H * 0.25, W * 0.5, H * 0.5, H * 1.0);
      vig.addColorStop(0, "transparent");
      vig.addColorStop(0.7, "rgba(2, 1, 3, 0.3)");
      vig.addColorStop(1, "rgba(2, 1, 3, 0.85)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      rafRef.current = requestAnimationFrame(drawFrame);
    };

    // Initial black
    ctx.fillStyle = "rgb(2, 1, 3)";
    ctx.fillRect(0, 0, W, H);
    rafRef.current = requestAnimationFrame(drawFrame);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouch);
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

export default HeroCanvas;
