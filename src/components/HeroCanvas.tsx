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
function grad(hash: number, x: number, y: number) {
  const h = hash & 3;
  return ((h & 1) ? -(h < 2 ? x : y) : (h < 2 ? x : y)) + ((h & 2) ? -(h < 2 ? y : x) : (h < 2 ? y : x));
}
function perlin(x: number, y: number) {
  const xi = Math.floor(x) & 255, yi = Math.floor(y) & 255;
  const xf = x - Math.floor(x), yf = y - Math.floor(y);
  const u = fade(xf), v = fade(yf);
  return lerp(
    lerp(grad(perm[perm[xi] + yi], xf, yf), grad(perm[perm[xi + 1] + yi], xf - 1, yf), u),
    lerp(grad(perm[perm[xi] + yi + 1], xf, yf - 1), grad(perm[perm[xi + 1] + yi + 1], xf - 1, yf - 1), u),
    v
  );
}
function fbm(x: number, y: number, oct = 4) {
  let v = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { v += perlin(x * f, y * f) * a; a *= 0.5; f *= 2; }
  return v;
}

// ─── Types ───
interface Fragment {
  originalVerts: { x: number; y: number }[];
  centroid: { x: number; y: number };
  depth: number;
  offsetX: number;
  offsetY: number;
  rotation: number;
  ring: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
  twinklePhase: number;
  hue: number;
}

const HeroCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 }); // normalized 0-1
  const fragmentsRef = useRef<Fragment[]>([]);
  const starsRef = useRef<Star[]>([]);
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
      generateFragments();
      generateStars();
    };

    // ─── Generate radial shatter pattern ───
    const generateFragments = () => {
      const cx = W / 2;
      const cy = H / 2;
      const maxRadius = Math.sqrt(cx * cx + cy * cy) * 1.3;
      const SPOKES = 18;
      const RINGS = 10;
      const fragments: Fragment[] = [];

      // Generate vertices grid: [ring][spoke]
      const verts: { x: number; y: number }[][] = [];

      // Center point
      verts[0] = [{ x: cx, y: cy }];

      for (let r = 1; r <= RINGS; r++) {
        verts[r] = [];
        const baseRadius = (r / RINGS) * maxRadius;
        // Inner rings: smaller, more dense. Outer: larger
        const radiusJitter = r <= 2 ? 0.15 : r <= 5 ? 0.2 : 0.1;
        for (let s = 0; s < SPOKES; s++) {
          const baseAngle = (s / SPOKES) * Math.PI * 2;
          const radius = baseRadius * (1 + (Math.random() - 0.5) * radiusJitter);
          const angleJitter = (Math.random() - 0.5) * (Math.PI * 2 / SPOKES) * 0.35;
          const angle = baseAngle + angleJitter;
          verts[r][s] = {
            x: cx + Math.cos(angle) * radius,
            y: cy + Math.sin(angle) * radius,
          };
        }
      }

      // Inner triangles (center to ring 1)
      for (let s = 0; s < SPOKES; s++) {
        const ns = (s + 1) % SPOKES;
        const v = [verts[0][0], verts[1][s], verts[1][ns]];
        const centX = (v[0].x + v[1].x + v[2].x) / 3;
        const centY = (v[0].y + v[1].y + v[2].y) / 3;
        const dist = Math.sqrt((centX - cx) ** 2 + (centY - cy) ** 2);
        fragments.push({
          originalVerts: v,
          centroid: { x: centX, y: centY },
          depth: 1 - dist / maxRadius,
          offsetX: 0, offsetY: 0, rotation: 0,
          ring: 1,
        });
      }

      // Quad fragments for outer rings
      for (let r = 1; r < RINGS; r++) {
        for (let s = 0; s < SPOKES; s++) {
          const ns = (s + 1) % SPOKES;
          const v = [verts[r][s], verts[r][ns], verts[r + 1][ns], verts[r + 1][s]];
          const centX = (v[0].x + v[1].x + v[2].x + v[3].x) / 4;
          const centY = (v[0].y + v[1].y + v[2].y + v[3].y) / 4;
          const dist = Math.sqrt((centX - cx) ** 2 + (centY - cy) ** 2);
          fragments.push({
            originalVerts: v,
            centroid: { x: centX, y: centY },
            depth: Math.max(0, 1 - dist / maxRadius),
            offsetX: 0, offsetY: 0, rotation: 0,
            ring: r + 1,
          });
        }
      }

      fragmentsRef.current = fragments;
    };

    // ─── Generate stars ───
    const generateStars = () => {
      const stars: Star[] = [];
      const count = Math.floor(W * H / 2000);
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          size: Math.random() < 0.1 ? 1.5 + Math.random() * 1.5 : 0.3 + Math.random() * 1,
          brightness: 0.3 + Math.random() * 0.7,
          twinkleSpeed: 0.5 + Math.random() * 2,
          twinklePhase: Math.random() * Math.PI * 2,
          hue: Math.random() > 0.7 ? 270 + Math.random() * 60 : 0,
        });
      }
      starsRef.current = stars;
    };

    resize();
    window.addEventListener("resize", resize);

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX / W;
      mouseRef.current.y = e.clientY / H;
    };
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) { mouseRef.current.x = t.clientX / W; mouseRef.current.y = t.clientY / H; }
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove, { passive: true });

    startTimeRef.current = performance.now();

    // ─── Offscreen energy canvas ───
    const energyCanvas = document.createElement("canvas");
    const ew = Math.floor(W / 3);
    const eh = Math.floor(H / 3);
    energyCanvas.width = ew;
    energyCanvas.height = eh;
    const ectx = energyCanvas.getContext("2d")!;

    let energyFrame = 0;

    const renderEnergy = (t: number) => {
      const imgData = ectx.createImageData(ew, eh);
      const d = imgData.data;
      const scale = 0.005;
      const ts = t * 0.3;
      for (let y = 0; y < eh; y++) {
        for (let x = 0; x < ew; x++) {
          const n1 = fbm(x * scale + ts, y * scale + ts * 0.7, 3);
          const n2 = fbm(x * scale * 1.3 - ts * 0.4, y * scale * 1.1 + ts * 0.3, 3);
          const swirl = Math.sin(n1 * 5 + t * 0.2) * 0.5 + 0.5;
          const intensity = Math.max(0, (n1 + n2 * 0.5) * 0.7 + 0.35);
          // Violet #7B2FFF (123,47,255) ↔ Magenta #C8007A (200,0,122)
          const r = lerp(200, 123, swirl) * intensity;
          const g = lerp(0, 47, swirl) * intensity;
          const b = lerp(122, 255, swirl) * intensity;
          const bright = Math.max(0, n1 * 3 - 0.8) * 0.5;
          const idx = (y * ew + x) * 4;
          d[idx] = Math.min(255, r + bright * 220);
          d[idx + 1] = Math.min(255, g + bright * 120);
          d[idx + 2] = Math.min(255, b + bright * 180);
          d[idx + 3] = 255;
        }
      }
      ectx.putImageData(imgData, 0, 0);
    };
    renderEnergy(0);

    // ─── Animation ───
    const drawFrame = () => {
      const now = performance.now();
      const elapsed = (now - startTimeRef.current) / 1000; // seconds since load
      const t = elapsed;

      // Crack animation timeline
      // 0-0.8s: black (suspense)
      // 0.8-2.5s: cracks form, fragments separate
      // 2.5+: stable with parallax
      const crackStart = 0.8;
      const crackEnd = 2.8;
      const crackProgress = Math.max(0, Math.min(1, (t - crackStart) / (crackEnd - crackStart)));
      // Easing: ease-out cubic
      const crackEase = 1 - Math.pow(1 - crackProgress, 3);

      // Mouse parallax (centered at 0.5, 0.5)
      const mx = (mouseRef.current.x - 0.5) * 2; // -1 to 1
      const my = (mouseRef.current.y - 0.5) * 2;

      // Update energy every few frames
      energyFrame++;
      if (energyFrame % 4 === 0) renderEnergy(t);

      // ─── Draw background: cosmic energy + stars ───
      ctx.drawImage(energyCanvas, 0, 0, W, H);

      // Stars
      for (const star of starsRef.current) {
        const twinkle = Math.sin(t * star.twinkleSpeed + star.twinklePhase) * 0.3 + 0.7;
        const alpha = star.brightness * twinkle;
        if (star.hue > 0) {
          ctx.fillStyle = `hsla(${star.hue}, 60%, 80%, ${alpha})`;
        } else {
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        }
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        // Subtle glow on bigger stars
        if (star.size > 1.2) {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${star.hue || 270}, 50%, 70%, ${alpha * 0.1})`;
          ctx.fill();
        }
      }

      // ─── Draw fragments (black pieces) on top ───
      const cx = W / 2;
      const cy = H / 2;
      const maxRing = 10;

      for (const frag of fragmentsRef.current) {
        // Fragment separation: based on crack progress and ring
        const ringNorm = frag.ring / maxRing;
        // Inner fragments crack first
        const fragDelay = ringNorm * 0.6;
        const fragProgress = Math.max(0, Math.min(1, (crackEase - fragDelay) / (1 - fragDelay)));
        const sepEase = fragProgress * fragProgress;

        // Direction: away from center
        const dirX = frag.centroid.x - cx;
        const dirY = frag.centroid.y - cy;
        const dirLen = Math.sqrt(dirX * dirX + dirY * dirY) + 1;
        const ndx = dirX / dirLen;
        const ndy = dirY / dirLen;

        // Separation distance: inner = more, outer = less
        const maxSep = frag.depth * 18 + 2;
        const sepX = ndx * maxSep * sepEase;
        const sepY = ndy * maxSep * sepEase;

        // Parallax: depth-based displacement from mouse
        const parallaxStrength = frag.depth * 25 * crackEase;
        const px = mx * parallaxStrength;
        const py = my * parallaxStrength;

        // Total offset
        const totalX = sepX + px;
        const totalY = sepY + py;

        // Slight rotation
        const rot = (mx * frag.depth * 0.03 + ndy * sepEase * 0.02) * crackEase;

        // Draw fragment
        ctx.save();
        ctx.translate(frag.centroid.x + totalX, frag.centroid.y + totalY);
        ctx.rotate(rot);

        ctx.beginPath();
        for (let i = 0; i < frag.originalVerts.length; i++) {
          const vx = frag.originalVerts[i].x - frag.centroid.x;
          const vy = frag.originalVerts[i].y - frag.centroid.y;
          if (i === 0) ctx.moveTo(vx, vy);
          else ctx.lineTo(vx, vy);
        }
        ctx.closePath();

        // Fragment fill: dark with subtle edge lighting
        ctx.fillStyle = "rgb(2, 1, 3)";
        ctx.fill();

        // Edge highlight on inner fragments when cracked
        if (sepEase > 0.05 && frag.ring <= 7) {
          ctx.strokeStyle = `hsla(271, 80%, 60%, ${sepEase * 0.15 * frag.depth})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }

        ctx.restore();
      }

      // ─── Glow along crack gaps (drawn on top) ───
      if (crackEase > 0.01) {
        ctx.globalCompositeOperation = "lighter";

        // Central glow
        const centralIntensity = crackEase * 0.15;
        const cGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 120 * crackEase);
        cGrad.addColorStop(0, `hsla(271, 90%, 70%, ${centralIntensity})`);
        cGrad.addColorStop(0.5, `hsla(300, 80%, 50%, ${centralIntensity * 0.3})`);
        cGrad.addColorStop(1, "transparent");
        ctx.fillStyle = cGrad;
        ctx.fillRect(cx - 150, cy - 150, 300, 300);

        // Crack edge glow: draw thin bright lines between adjacent fragments
        // Simplified: radial glow lines from center
        const spokeCount = 18;
        for (let s = 0; s < spokeCount; s++) {
          const baseAngle = (s / spokeCount) * Math.PI * 2 + (s * 0.17); // stored jitter seed
          const jitter = Math.sin(s * 7.3 + 2.1) * 0.15;
          const angle = baseAngle + jitter;
          const len = (80 + Math.sin(s * 3.7) * 40 + 200 * crackEase);

          // Animate line growth from center
          const lineProgress = Math.min(1, crackEase * 2 - (s % 3) * 0.1);
          if (lineProgress <= 0) continue;

          const endX = cx + Math.cos(angle) * len * lineProgress;
          const endY = cy + Math.sin(angle) * len * lineProgress;

          // Parallax on glow lines too
          const glowPx = mx * 8 * crackEase;
          const glowPy = my * 8 * crackEase;

          ctx.beginPath();
          ctx.moveTo(cx + glowPx * 0.3, cy + glowPy * 0.3);

          // Jagged line
          const steps = 8;
          for (let i = 1; i <= steps; i++) {
            const prog = i / steps;
            const bx = lerp(cx, endX, prog) + glowPx * prog * 0.5;
            const by = lerp(cy, endY, prog) + glowPy * prog * 0.5;
            const jx = Math.sin(s * 13 + i * 5.3) * 3 * prog;
            const jy = Math.cos(s * 11 + i * 4.7) * 3 * prog;
            ctx.lineTo(bx + jx, by + jy);
          }

          // Wide soft glow
          ctx.strokeStyle = `hsla(271, 80%, 50%, ${0.04 * lineProgress * crackEase})`;
          ctx.lineWidth = 12;
          ctx.lineCap = "round";
          ctx.stroke();

          // Mid glow
          ctx.strokeStyle = `hsla(290, 80%, 60%, ${0.1 * lineProgress * crackEase})`;
          ctx.lineWidth = 4;
          ctx.stroke();

          // Bright core
          ctx.strokeStyle = `hsla(280, 50%, 85%, ${0.25 * lineProgress * crackEase})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Concentric crack rings (subtle)
        for (let r = 1; r <= 4; r++) {
          const ringRadius = r * 50 + 20;
          const ringProgress = Math.max(0, crackEase * 1.5 - r * 0.15);
          if (ringProgress <= 0) continue;

          ctx.beginPath();
          // Draw partial arcs with gaps
          const segments = 6 + r * 2;
          for (let s = 0; s < segments; s++) {
            const startA = (s / segments) * Math.PI * 2 + Math.sin(r * 3 + s) * 0.1;
            const arcLen = (0.7 / segments) * Math.PI * 2;
            ctx.arc(
              cx + mx * r * 3 * crackEase,
              cy + my * r * 3 * crackEase,
              ringRadius * ringProgress,
              startA,
              startA + arcLen
            );
          }
          ctx.strokeStyle = `hsla(320, 70%, 55%, ${0.05 * ringProgress})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        ctx.globalCompositeOperation = "source-over";
      }

      // ─── Impact flash at load ───
      if (t > crackStart && t < crackStart + 0.5) {
        const flashProgress = (t - crackStart) / 0.5;
        const flashAlpha = (1 - flashProgress) * 0.3;
        const flashGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 200 * flashProgress);
        flashGrad.addColorStop(0, `hsla(280, 90%, 80%, ${flashAlpha})`);
        flashGrad.addColorStop(0.4, `hsla(271, 80%, 50%, ${flashAlpha * 0.3})`);
        flashGrad.addColorStop(1, "transparent");
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = flashGrad;
        ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = "source-over";
      }

      // ─── Vignette (always) ───
      const vignette = ctx.createRadialGradient(cx, cy, H * 0.3, cx, cy, H * 0.9);
      vignette.addColorStop(0, "transparent");
      vignette.addColorStop(1, "rgba(2, 1, 3, 0.6)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, W, H);

      rafRef.current = requestAnimationFrame(drawFrame);
    };

    // Start with black
    ctx.fillStyle = "rgb(2, 1, 3)";
    ctx.fillRect(0, 0, W, H);

    rafRef.current = requestAnimationFrame(drawFrame);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
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
