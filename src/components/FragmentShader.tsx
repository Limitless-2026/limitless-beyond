import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

// COSMIC SINGULARITY v2 — Awwwards-tier
// Volumetric raymarching feel · gravitational lensing · domain warping
// Chromatic aberration · warp-speed stars on scroll · breathing nebula
const fragmentShader = /* glsl */ `
precision highp float;

uniform float uTime;
uniform vec2  uMouse;
uniform vec2  uResolution;
uniform float uReveal;   // 0 → 1 intro
uniform float uScroll;   // 0 → 1 scroll progress
uniform float uPixelRatio;

varying vec2 vUv;

#define PI 3.14159265359
#define TAU 6.28318530718

// ─── Hash / Noise ───────────────────────────────────────────
float hash21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec2  hash22(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}
float hash31(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }

float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f*f*(3.0 - 2.0*f);
  float a = hash21(i);
  float b = hash21(i + vec2(1,0));
  float c = hash21(i + vec2(0,1));
  float d = hash21(i + vec2(1,1));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
}

float vnoise3(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f*f*(3.0 - 2.0*f);
  float n000=hash31(i), n100=hash31(i+vec3(1,0,0));
  float n010=hash31(i+vec3(0,1,0)), n110=hash31(i+vec3(1,1,0));
  float n001=hash31(i+vec3(0,0,1)), n101=hash31(i+vec3(1,0,1));
  float n011=hash31(i+vec3(0,1,1)), n111=hash31(i+vec3(1,1,1));
  return mix(
    mix(mix(n000,n100,f.x), mix(n010,n110,f.x), f.y),
    mix(mix(n001,n101,f.x), mix(n011,n111,f.x), f.y),
    f.z
  );
}

const mat2 ROT = mat2(0.8, 0.6, -0.6, 0.8);

float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 6; i++) { v += a * vnoise(p); p = ROT * p * 2.0; a *= 0.5; }
  return v;
}
float fbm3(vec3 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * vnoise3(p); p *= 2.03; a *= 0.5; }
  return v;
}

// Domain warping — gives organic, painterly gas
vec2 warp(vec2 p, float t) {
  vec2 q = vec2(fbm(p + vec2(0.0, t * 0.05)),
                fbm(p + vec2(5.2, t * 0.04 + 1.3)));
  vec2 r = vec2(fbm(p + 4.0 * q + vec2(1.7, t * 0.03)),
                fbm(p + 4.0 * q + vec2(8.3, t * 0.02 + 2.8)));
  return r;
}

float ridged(vec2 p) { return 1.0 - abs(fbm(p) * 2.0 - 1.0); }

// Smooth max for layering
float smax(float a, float b, float k) {
  float h = clamp(0.5 + 0.5*(a-b)/k, 0.0, 1.0);
  return mix(b, a, h) + k*h*(1.0-h);
}

// Gravitational lensing — bends UVs around a singularity
vec2 lens(vec2 p, vec2 c, float strength) {
  vec2 d = p - c;
  float r2 = dot(d, d) + 0.001;
  return p - d * strength / r2 * 0.05;
}

// Sample one nebula channel (used 3x for chromatic aberration)
float sampleNebula(vec2 p, float t, float zoom, float reveal) {
  // Lens distortion near center
  vec2 lp = lens(p, vec2(0.0), 0.6 + 0.4 * sin(t * 0.2));
  
  // Domain warp for organic gas
  vec2 w = warp(lp * 1.6 * zoom, t * 0.7);
  vec2 p2 = lp + w * 0.35;
  
  // Spiral coordinates — galactic feel
  float r = length(p2);
  float a = atan(p2.y, p2.x);
  float spiral = a + r * 2.4 - t * 0.08;
  vec2 sp = vec2(cos(spiral), sin(spiral)) * r;
  
  // Multi-layer FBM3 with motion
  float n1 = fbm3(vec3(sp * 2.5 * zoom, t * 0.05));
  float n2 = fbm3(vec3(p2 * 4.0 * zoom + w * 0.5, t * 0.08));
  float n3 = ridged(p2 * 7.0 * zoom + w);
  
  float density = n1 * 0.55 + n2 * 0.35 + pow(n3, 2.0) * 0.4;
  
  // Density falloff from center, modulated by reveal
  float falloff = exp(-r * (2.4 / max(zoom, 0.4)));
  return density * falloff * reveal;
}

// Warp-speed stars — stretch with scroll
vec3 warpStars(vec2 p, float t, float scroll, float reveal) {
  vec3 col = vec3(0.0);
  vec3 cWhite = vec3(1.0, 0.96, 1.0);
  vec3 cWarm  = vec3(1.0, 0.7, 0.85);
  vec3 cCool  = vec3(0.7, 0.8, 1.0);
  
  for (float i = 0.0; i < 5.0; i++) {
    float depth = 0.6 + i * 0.6;
    // As we scroll, we move "into" the field — translate inversely with depth
    float zoomIn = 1.0 - scroll * 0.65 / depth;
    vec2 sp = p / max(zoomIn, 0.05);
    
    float scale = 60.0 + i * 45.0;
    vec2 starUv = sp * scale + i * 19.7;
    starUv.x += t * 0.004 * (i + 1.0);
    
    vec2 sid = floor(starUv);
    vec2 sf  = fract(starUv) - 0.5;
    float sh = hash21(sid + i * 17.3);
    
    if (sh > 0.965) {
      vec2 spo = (hash22(sid + i) - 0.5) * 0.4;
      vec2 d = sf - spo;
      
      // Warp-speed streak — direction is radial (outward from center)
      float ang = atan(p.y, p.x);
      vec2 streakDir = vec2(cos(ang), sin(ang));
      // Project distance along streak direction
      float along = abs(dot(d, streakDir));
      float across = length(d - streakDir * dot(d, streakDir));
      
      float streakLen = 0.05 + scroll * scroll * 0.6 / depth;
      float thickness = 0.012 / (1.0 + scroll * 3.0);
      
      float starShape = smoothstep(streakLen, 0.0, along) * smoothstep(thickness, 0.0, across);
      // Add a sharper core
      float coreD = length(d);
      starShape += smoothstep(0.04, 0.0, coreD) * 0.7;
      
      float twk = sin(t * (0.5 + sh * 2.0) + sh * TAU) * 0.35 + 0.65;
      float bright = starShape * twk * (0.5 + sh * 0.5);
      
      vec3 sc = mix(cWhite, mix(cCool, cWarm, sh), 0.35);
      col += sc * bright * reveal / depth;
    }
  }
  return col;
}

void main() {
  vec2 uv = vUv;
  float aspect = uResolution.x / uResolution.y;
  vec2 st = (uv - 0.5) * vec2(aspect, 1.0);
  
  float t = uTime;
  float reveal = uReveal;
  float scroll = uScroll;
  
  // Mouse parallax — subtle, depth illusion
  vec2 mouse = (uMouse - 0.5) * 2.0;
  vec2 parallax = mouse * 0.025 * (1.0 - scroll * 0.7);
  
  // ── Camera "zoom into the singularity" on scroll ──
  // The whole scene zooms toward center, breaking limits
  float zoomFactor = 1.0 - scroll * 0.85; // 1 → 0.15
  vec2 center = vec2(0.0, 0.04 - scroll * 0.04) + parallax * 0.5;
  vec2 p = (st - center) / max(zoomFactor, 0.05);
  
  float r = length(p);
  
  // ── Color palette (carefully tuned) ──
  vec3 cVoid     = vec3(0.004, 0.002, 0.010);
  vec3 cDeepBlue = vec3(0.018, 0.012, 0.055);
  vec3 cIndigo   = vec3(0.10, 0.05, 0.22);
  vec3 cViolet   = vec3(0.50, 0.20, 0.92);
  vec3 cMagenta  = vec3(1.0, 0.15, 0.55);
  vec3 cWarm     = vec3(1.0, 0.65, 0.85);
  vec3 cWhiteHot = vec3(1.0, 0.96, 1.0);
  vec3 cAmber    = vec3(1.0, 0.78, 0.55);
  
  // ── Background atmosphere ──
  float bgClouds = fbm(st * 1.0 + vec2(t * 0.004, t * 0.003));
  vec3 color = cVoid + cDeepBlue * bgClouds * 0.7;
  
  // Add an ambient violet wash that intensifies on scroll
  color += cIndigo * (0.15 + scroll * 0.4);
  
  // ── Warp-speed starfield ──
  color += warpStars(st - parallax * 0.3, t, scroll, reveal);
  
  // ── Volumetric nebula with chromatic aberration ──
  // Each color channel sampled with slightly different lens strength → chroma split
  float zoomNeb = 1.0 / max(zoomFactor * 0.7 + 0.3, 0.1);
  float aberr = 0.012 + scroll * 0.04;
  
  vec2 dir = normalize(p + 0.0001);
  vec2 pR = p - dir * aberr * 0.5;
  vec2 pG = p;
  vec2 pB = p + dir * aberr * 0.5;
  
  float densR = sampleNebula(pR, t, zoomNeb, reveal);
  float densG = sampleNebula(pG, t, zoomNeb, reveal);
  float densB = sampleNebula(pB, t, zoomNeb, reveal);
  
  // Color-graded density — different palette for inner/outer
  vec3 nebOuter = mix(cIndigo, cViolet, smoothstep(0.0, 0.5, densG));
  vec3 nebMid   = mix(cViolet, cMagenta, smoothstep(0.3, 0.8, densG));
  vec3 nebHot   = mix(cMagenta, cWarm, smoothstep(0.6, 1.0, densG));
  
  // Distance-based color blend
  float radialT = smoothstep(0.05, 0.7, r * (zoomFactor + 0.2));
  vec3 nebColor = mix(nebHot, nebMid, radialT);
  nebColor = mix(nebColor, nebOuter, smoothstep(0.4, 0.9, radialT));
  
  // Apply chromatic aberration: add per-channel
  vec3 nebContrib = vec3(densR, densG, densB) * 1.2;
  color += nebColor * nebContrib;
  
  // White-hot inner gas
  float innerHot = pow(densG, 2.5) * exp(-r * 3.0) * reveal;
  color += cWhiteHot * innerHot * 0.6;
  color += cAmber * innerHot * 0.25;
  
  // Filament highlights
  float fil = ridged(p * 5.0 + warp(p * 2.0, t * 0.5));
  fil = pow(fil, 4.0) * exp(-r * 1.8) * reveal;
  color += mix(cMagenta, cWarm, fil) * fil * 0.8;
  
  // ── THE SINGULARITY — central core ──
  float pulse = 1.0 + sin(t * 1.4) * 0.06 + sin(t * 4.1) * 0.02;
  float coreSize = pulse * (1.0 + scroll * 2.5); // grows on scroll
  
  float core      = exp(-r * 38.0 / coreSize) * reveal;
  float coreGlow  = exp(-r * 13.0 / coreSize) * reveal;
  float coreBloom = exp(-r * 5.0  / coreSize) * reveal;
  float coreHalo  = exp(-r * 1.8  / coreSize) * reveal;
  
  // Anisotropic lens flares (cross + diagonal)
  float fH = exp(-abs(p.y) * 95.0) * exp(-abs(p.x) * 3.5);
  float fV = exp(-abs(p.x) * 110.0) * exp(-abs(p.y) * 4.0);
  // Diagonal flares (rotate p by 45°)
  vec2 pR45 = vec2(p.x + p.y, p.y - p.x) * 0.7071;
  float fD1 = exp(-abs(pR45.y) * 130.0) * exp(-abs(pR45.x) * 5.0);
  float fD2 = exp(-abs(pR45.x) * 130.0) * exp(-abs(pR45.y) * 5.0);
  float flare = (fH + fV * 0.85 + (fD1 + fD2) * 0.4) * reveal * (1.0 + scroll * 0.5);
  
  color += cWhiteHot * core * (2.5 + scroll * 4.0);
  color += mix(cWarm, cWhiteHot, 0.6) * coreGlow * 1.0;
  color += cMagenta * coreBloom * 0.6;
  color += cViolet * coreHalo * coreHalo * 0.4;
  color += cWhiteHot * flare * 0.7;
  
  // ── Energy ring shockwave (subtle, breathes) ──
  float ringT = fract(t * 0.12);
  float ringR = ringT * 1.2;
  float ring = exp(-pow((r - ringR) / 0.04, 2.0)) * (1.0 - ringT) * reveal * 0.5;
  color += mix(cViolet, cMagenta, ringT) * ring;
  
  // ── Foreground dust motes (parallax) ──
  for (float i = 0.0; i < 2.0; i++) {
    vec2 du = st * (10.0 + i * 7.0)
            + vec2(t * 0.012 * (i + 1.0), t * 0.008)
            + parallax * (4.0 + i * 3.0);
    float dn = fbm(du);
    float mote = smoothstep(0.72, 0.9, dn) * 0.35;
    color += mote * mix(cViolet, cMagenta, hash21(vec2(i, 1.7))) * 0.18;
  }
  
  // ── Vignette (tightens on scroll for tunnel effect) ──
  float vigDist = length(st);
  float vigRadius = mix(1.2, 0.7, scroll);
  float vig = smoothstep(vigRadius, 0.15, vigDist);
  color *= mix(0.12, 1.0, vig);
  
  // ── Edge glow on scroll (warp tunnel feel) ──
  float edge = smoothstep(0.4, 0.9, vigDist);
  color += cMagenta * edge * scroll * 0.15;
  color += cViolet * edge * scroll * 0.1;
  
  // ── Film grain ──
  float grain = (hash21(uv * uResolution + fract(t)) - 0.5) * 0.024;
  color += grain;
  
  // ── Filmic tone mapping (ACES-approx) ──
  // Soft shoulder preserves bloom
  vec3 x = max(color - 0.004, 0.0);
  color = (x * (6.2 * x + 0.5)) / (x * (6.2 * x + 1.7) + 0.06);
  
  // Subtle color grading — cool shadows, warm highlights
  float lum = dot(color, vec3(0.299, 0.587, 0.114));
  vec3 shadow    = vec3(0.92, 0.96, 1.06);
  vec3 highlight = vec3(1.06, 1.0,  0.96);
  color *= mix(shadow, highlight, smoothstep(0.0, 0.7, lum));
  
  // Final saturation lift
  vec3 grey = vec3(lum);
  color = mix(grey, color, 1.12);
  
  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

const FragmentShaderMesh = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { size, viewport } = useThree();
  const startTime = useRef(Date.now());
  const smoothMouse = useRef(new THREE.Vector2(0.5, 0.5));
  const smoothScroll = useRef(0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uReveal: { value: 0 },
      uScroll: { value: 0 },
      uPixelRatio: { value: viewport.dpr || 1 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useFrame(() => {
    const elapsed = (Date.now() - startTime.current) / 1000;
    uniforms.uTime.value = elapsed;
    uniforms.uResolution.value.set(size.width, size.height);

    // Smooth mouse
    uniforms.uMouse.value.lerp(smoothMouse.current, 0.06);

    // Smooth scroll — read window scroll, normalize over 1.5 viewport heights
    const sy = window.scrollY;
    const max = window.innerHeight * 1.5;
    const target = Math.max(0, Math.min(1, sy / max));
    smoothScroll.current += (target - smoothScroll.current) * 0.08;
    uniforms.uScroll.value = smoothScroll.current;

    // Reveal: 0 → 1 over ~3.5s with ease-out
    const revealStart = 0.2;
    const revealDuration = 3.5;
    const progress = Math.max(0, Math.min(1, (elapsed - revealStart) / revealDuration));
    uniforms.uReveal.value = 1 - Math.pow(1 - progress, 2.5);
  });

  const handlePointerMove = useMemo(() => {
    return (e: { uv?: THREE.Vector2 }) => {
      if (e.uv) {
        smoothMouse.current.copy(e.uv);
      }
    };
  }, []);

  return (
    <mesh ref={meshRef} onPointerMove={handlePointerMove}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
};

export default FragmentShaderMesh;
