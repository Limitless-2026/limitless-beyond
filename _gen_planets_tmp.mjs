// Genera texturas equirectangulares procedurales de los planetas reales.
// Salida: public/textures/planets/*.jpg + saturn_ring.png
// Tamaño 2048x1024 (versión @1k 1024x512).
// Usa @napi-rs/canvas (preinstalado o disponible vía nix); fallback a sharp.
import { createCanvas } from 'canvas';
import fs from 'node:fs';

const W = 2048, H = 1024;

// ---- helpers ----
function rand(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}
function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
function mix(a, b, t) { return a + (b - a) * t; }
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function valueNoise2D(seed) {
  const r = rand(seed);
  const SZ = 256;
  const grid = new Float32Array(SZ * SZ);
  for (let i = 0; i < grid.length; i++) grid[i] = r();
  const at = (x, y) => grid[((y % SZ) + SZ) % SZ * SZ + ((x % SZ) + SZ) % SZ];
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    const a = at(xi, yi), b = at(xi + 1, yi);
    const c = at(xi, yi + 1), d = at(xi + 1, yi + 1);
    return mix(mix(a, b, u), mix(c, d, u), v);
  };
}

function fbm(noise, x, y, oct = 5, lac = 2.0, gain = 0.5) {
  let amp = 1, freq = 1, sum = 0, norm = 0;
  for (let i = 0; i < oct; i++) {
    sum += amp * noise(x * freq, y * freq);
    norm += amp;
    amp *= gain;
    freq *= lac;
  }
  return sum / norm;
}

// Equirectangular wrap-safe: usa (cos(lon), sin(lon)) para evitar costura.
// Convierte (u,v) a (lat,lon) y muestrea en 3D pseudo-coords.
function eqSample(noise, u, v, scale, octaves = 5) {
  const lon = u * Math.PI * 2;
  const lat = (v - 0.5) * Math.PI;
  const cl = Math.cos(lat);
  const x = Math.cos(lon) * cl * scale;
  const y = Math.sin(lon) * cl * scale;
  const z = Math.sin(lat) * scale;
  // Combine 3 noise lookups to fake 3D
  return (
    fbm(noise, x, y, octaves) * 0.5 +
    fbm(noise, y, z, octaves) * 0.3 +
    fbm(noise, z, x, octaves) * 0.2
  );
}

function writeJpg(canvas, path, q = 0.85) {
  const buf = canvas.toBuffer('image/jpeg', { quality: q });
  fs.writeFileSync(path, buf);
}
function writePng(canvas, path) {
  fs.writeFileSync(path, canvas.toBuffer('image/png'));
}

// ============ MERCURY ============
function mercury(w, h, seed) {
  const cv = createCanvas(w, h);
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(w, h);
  const n = valueNoise2D(seed);
  const n2 = valueNoise2D(seed + 7);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / w, v = y / h;
      const base = eqSample(n, u, v, 8, 5);
      const detail = eqSample(n2, u, v, 32, 4);
      // Crater pseudo: dark spots where detail crosses threshold
      let val = base * 0.7 + detail * 0.3;
      const crater = detail > 0.78 ? -0.25 : detail < 0.18 ? 0.15 : 0;
      val = clamp(val + crater, 0, 1);
      // grayscale brown-ish
      const g = 95 + val * 130;
      const i = (y * w + x) * 4;
      img.data[i] = g * 1.05;
      img.data[i+1] = g * 0.98;
      img.data[i+2] = g * 0.88;
      img.data[i+3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return cv;
}

// ============ VENUS ============
function venus(w, h, seed) {
  const cv = createCanvas(w, h);
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(w, h);
  const n = valueNoise2D(seed);
  const n2 = valueNoise2D(seed + 11);
  for (let y = 0; y < h; y++) {
    const lat = (y / h - 0.5) * 2; // -1..1
    for (let x = 0; x < w; x++) {
      const u = x / w, v = y / h;
      // Bandas de nube horizontales suaves
      const bands = Math.sin(lat * 8 + eqSample(n, u, v, 4, 3) * 3) * 0.5 + 0.5;
      const swirl = eqSample(n2, u + Math.sin(v * 6) * 0.05, v, 6, 5);
      const val = clamp(bands * 0.55 + swirl * 0.45, 0, 1);
      // beige/amarillento sulfúrico
      const r = 220 + val * 30;
      const g = 190 + val * 35;
      const b = 130 + val * 25;
      const i = (y * w + x) * 4;
      img.data[i] = clamp(r, 0, 255);
      img.data[i+1] = clamp(g, 0, 255);
      img.data[i+2] = clamp(b, 0, 255);
      img.data[i+3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return cv;
}

// ============ EARTH ============
// Continentes muy estilizados: usamos ruido + threshold para tierra/agua.
function earth(w, h, seed) {
  const cv = createCanvas(w, h);
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(w, h);
  const n = valueNoise2D(seed);
  const nClouds = valueNoise2D(seed + 21);
  const nDetail = valueNoise2D(seed + 13);
  for (let y = 0; y < h; y++) {
    const lat = (y / h - 0.5) * 2;
    const polar = Math.abs(lat); // 0 ecuador → 1 polos
    for (let x = 0; x < w; x++) {
      const u = x / w, v = y / h;
      const continent = eqSample(n, u, v, 3.5, 5);
      const detail = eqSample(nDetail, u, v, 14, 4);
      const land = continent + detail * 0.15;
      const isLand = land > 0.52;
      let r, g, b;
      if (polar > 0.82) {
        // Casquetes polares
        const ice = clamp((polar - 0.82) / 0.18, 0, 1);
        if (isLand) {
          r = 230; g = 235; b = 240;
        } else {
          r = mix(40, 220, ice);
          g = mix(80, 230, ice);
          b = mix(140, 240, ice);
        }
      } else if (isLand) {
        // Tierra: mezcla verde / marrón según altura+latitud
        const elev = (land - 0.52) * 4;
        const desert = clamp(1 - polar * 1.2, 0, 1) * 0.6;
        const greenness = clamp(1 - desert - elev * 0.4, 0, 1);
        r = mix(110, 70, greenness) + elev * 30;
        g = mix(85, 120, greenness) + elev * 10;
        b = mix(40, 50, greenness);
      } else {
        // Océano
        const depth = clamp((0.52 - land) * 2.5, 0, 1);
        r = mix(60, 18, depth);
        g = mix(110, 45, depth);
        b = mix(170, 110, depth);
      }
      // Capa de nubes
      const cloud = clamp(eqSample(nClouds, u, v, 5, 4) * 1.4 - 0.55, 0, 1);
      r = mix(r, 245, cloud * 0.55);
      g = mix(g, 245, cloud * 0.55);
      b = mix(b, 250, cloud * 0.55);
      const i = (y * w + x) * 4;
      img.data[i] = clamp(r, 0, 255);
      img.data[i+1] = clamp(g, 0, 255);
      img.data[i+2] = clamp(b, 0, 255);
      img.data[i+3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return cv;
}

// ============ MARS ============
function mars(w, h, seed) {
  const cv = createCanvas(w, h);
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(w, h);
  const n = valueNoise2D(seed);
  const nDet = valueNoise2D(seed + 31);
  for (let y = 0; y < h; y++) {
    const lat = (y / h - 0.5) * 2;
    const polar = Math.abs(lat);
    for (let x = 0; x < w; x++) {
      const u = x / w, v = y / h;
      const base = eqSample(n, u, v, 5, 5);
      const det = eqSample(nDet, u, v, 18, 4);
      const val = clamp(base * 0.7 + det * 0.3, 0, 1);
      let r = 160 + val * 70;
      let g = 70 + val * 50;
      let b = 40 + val * 25;
      // Casquete polar
      if (polar > 0.85) {
        const ice = (polar - 0.85) / 0.15;
        r = mix(r, 240, ice);
        g = mix(g, 235, ice);
        b = mix(b, 230, ice);
      }
      // Manchas oscuras (Syrtis-like)
      if (val < 0.25) {
        r *= 0.7; g *= 0.7; b *= 0.7;
      }
      const i = (y * w + x) * 4;
      img.data[i] = clamp(r, 0, 255);
      img.data[i+1] = clamp(g, 0, 255);
      img.data[i+2] = clamp(b, 0, 255);
      img.data[i+3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return cv;
}

// ============ JUPITER ============
function jupiter(w, h, seed) {
  const cv = createCanvas(w, h);
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(w, h);
  const n = valueNoise2D(seed);
  const nTurb = valueNoise2D(seed + 41);
  // GRS center
  const grsLat = -0.22;
  const grsLon = 0.65;
  for (let y = 0; y < h; y++) {
    const lat = (y / h - 0.5) * 2;
    for (let x = 0; x < w; x++) {
      const u = x / w, v = y / h;
      // Distorsión turbulenta en X (longitud) basada en ruido del lat
      const turb = eqSample(nTurb, u, v, 3, 4) - 0.5;
      // Bandas: función sinusoidal del lat con distorsión
      const bandIdx = Math.sin(lat * 9 + turb * 2.5);
      const band = bandIdx * 0.5 + 0.5;
      const detail = eqSample(n, u, v, 10, 5);
      // Mezclar 3 colores: marrón oscuro, crema, naranja claro
      const cream = [235, 215, 175];
      const tan   = [200, 160, 110];
      const dark  = [140, 95, 60];
      const t = clamp(band + (detail - 0.5) * 0.4, 0, 1);
      let col;
      if (t < 0.5) {
        const k = t / 0.5;
        col = [mix(dark[0], tan[0], k), mix(dark[1], tan[1], k), mix(dark[2], tan[2], k)];
      } else {
        const k = (t - 0.5) / 0.5;
        col = [mix(tan[0], cream[0], k), mix(tan[1], cream[1], k), mix(tan[2], cream[2], k)];
      }
      // Great Red Spot: óvalo en (grsLon, grsLat)
      let dlon = u - grsLon;
      if (dlon > 0.5) dlon -= 1;
      if (dlon < -0.5) dlon += 1;
      const dlat = lat - grsLat;
      const grsD = Math.hypot(dlon * 5, dlat * 7);
      if (grsD < 1) {
        const k = Math.pow(1 - grsD, 1.5);
        col[0] = mix(col[0], 200, k);
        col[1] = mix(col[1], 70, k * 0.9);
        col[2] = mix(col[2], 50, k * 0.9);
      }
      const i = (y * w + x) * 4;
      img.data[i] = clamp(col[0], 0, 255);
      img.data[i+1] = clamp(col[1], 0, 255);
      img.data[i+2] = clamp(col[2], 0, 255);
      img.data[i+3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return cv;
}

// ============ SATURN ============
function saturn(w, h, seed) {
  const cv = createCanvas(w, h);
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(w, h);
  const n = valueNoise2D(seed);
  for (let y = 0; y < h; y++) {
    const lat = (y / h - 0.5) * 2;
    for (let x = 0; x < w; x++) {
      const u = x / w, v = y / h;
      const detail = eqSample(n, u, v, 6, 4);
      const band = Math.sin(lat * 7 + (detail - 0.5) * 1.5) * 0.5 + 0.5;
      const t = clamp(band * 0.7 + detail * 0.3, 0, 1);
      // Beige dorado pálido
      const r = 220 + t * 25;
      const g = 195 + t * 30;
      const b = 145 + t * 35;
      const i = (y * w + x) * 4;
      img.data[i] = clamp(r, 0, 255);
      img.data[i+1] = clamp(g, 0, 255);
      img.data[i+2] = clamp(b, 0, 255);
      img.data[i+3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return cv;
}

// ============ SATURN RING (PNG transparente, formato anular para ringGeometry mapping radial) ============
function saturnRing(w, h) {
  // Para THREE.RingGeometry el UV es radial (u = ángulo, v = radio).
  // Usamos una textura horizontal donde el eje X = ángulo y el eje Y = bandas radiales.
  const cv = createCanvas(w, h);
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(w, h);
  const n = valueNoise2D(99);
  for (let y = 0; y < h; y++) {
    // y -> radio normalizado 0..1
    const rN = y / h;
    // Bandas concéntricas: alternancia con ruido
    const noise1 = fbm(n, rN * 40, 0, 4) - 0.5;
    const baseBand = Math.sin(rN * 90 + noise1 * 8) * 0.5 + 0.5;
    // Cassini gap simulado
    const gap = Math.exp(-Math.pow((rN - 0.55) / 0.025, 2));
    const innerFade = clamp((rN - 0.05) / 0.1, 0, 1);
    const outerFade = clamp(1 - (rN - 0.92) / 0.08, 0, 1);
    const alpha = clamp(baseBand * 0.85 + 0.1, 0, 1) * (1 - gap * 0.95) * innerFade * outerFade;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      // Color anular: dorado pálido ↔ marrón
      const tone = baseBand;
      img.data[i] = mix(180, 235, tone);
      img.data[i+1] = mix(150, 215, tone);
      img.data[i+2] = mix(110, 175, tone);
      img.data[i+3] = clamp(alpha * 255, 0, 255);
    }
  }
  ctx.putImageData(img, 0, 0);
  return cv;
}

// ============ WRITE ALL ============
const out = 'public/textures/planets';
fs.mkdirSync(out, { recursive: true });

const planets = [
  ['mercury', mercury, 1],
  ['venus',   venus,   2],
  ['earth',   earth,   3],
  ['mars',    mars,    4],
  ['jupiter', jupiter, 5],
  ['saturn',  saturn,  6],
];

for (const [name, fn, seed] of planets) {
  console.log(`→ ${name}@2k`);
  const big = fn(W, H, seed);
  writeJpg(big, `${out}/${name}.jpg`, 0.85);
  console.log(`→ ${name}@1k`);
  const small = fn(1024, 512, seed);
  writeJpg(small, `${out}/${name}@1k.jpg`, 0.82);
}

console.log('→ saturn_ring.png');
const ring = saturnRing(1024, 256);
writePng(ring, `${out}/saturn_ring.png`);

console.log('Done.');
