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

// Cosmic singularity / spatial rupture shader.
// Inspired by nk.studio — atmospheric, photographic, infinite depth.
// No hard geometry. Pure light, gas, dust, stars.
const fragmentShader = /* glsl */ `
precision highp float;

uniform float uTime;
uniform vec2 uMouse;
uniform vec2 uResolution;
uniform float uReveal; // 0 → 1 over time

varying vec2 vUv;

// ─── Hash / Noise ───
float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
vec2 hash22(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}
float hash31(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// 3D value noise — gives volumetric feel
float vnoise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = hash31(i + vec3(0,0,0));
  float n100 = hash31(i + vec3(1,0,0));
  float n010 = hash31(i + vec3(0,1,0));
  float n110 = hash31(i + vec3(1,1,0));
  float n001 = hash31(i + vec3(0,0,1));
  float n101 = hash31(i + vec3(1,0,1));
  float n011 = hash31(i + vec3(0,1,1));
  float n111 = hash31(i + vec3(1,1,1));
  return mix(
    mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
    mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
    f.z
  );
}

// FBM — fractal brownian motion (cloud-like)
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 6; i++) {
    v += a * vnoise(p);
    p = rot * p * 2.0;
    a *= 0.5;
  }
  return v;
}

float fbm3(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * vnoise3(p);
    p *= 2.02;
    a *= 0.5;
  }
  return v;
}

// Ridged noise — for filament / gas streams
float ridged(vec2 p) {
  return 1.0 - abs(fbm(p) * 2.0 - 1.0);
}

// ─── Main ───
void main() {
  vec2 uv = vUv;
  float aspect = uResolution.x / uResolution.y;
  vec2 st = (uv - 0.5) * vec2(aspect, 1.0);
  
  // Mouse parallax — very subtle, depth illusion
  vec2 mouse = (uMouse - 0.5) * 2.0;
  vec2 parallax = mouse * 0.02;
  
  // Singularity center — slightly above middle, cinematic
  vec2 center = vec2(0.0, 0.04) + parallax * 0.4;
  vec2 p = st - center;
  float r = length(p);
  float ang = atan(p.y, p.x);
  
  // Time
  float t = uTime;
  
  // Reveal envelope — gentle, breath-like growth
  float reveal = uReveal;
  
  // ─── 1) DEEP SPACE BACKGROUND ─────────────────────────────
  // Very subtle violet/indigo ambient, with low-freq cloud variation
  vec3 cVoid     = vec3(0.005, 0.003, 0.012);
  vec3 cDeepBlue = vec3(0.02, 0.015, 0.06);
  vec3 cIndigo   = vec3(0.08, 0.04, 0.18);
  vec3 cViolet   = vec3(0.45, 0.18, 0.85);
  vec3 cMagenta  = vec3(0.95, 0.15, 0.55);
  vec3 cWarm     = vec3(1.0, 0.65, 0.85);
  vec3 cWhiteHot = vec3(1.0, 0.95, 1.0);
  
  // Faint background nebula (always present, very low intensity)
  float bgClouds = fbm(st * 1.2 + vec2(t * 0.005, t * 0.003));
  vec3 color = cVoid + cDeepBlue * bgClouds * 0.6;
  
  // ─── 2) DISTANT STARFIELD (parallax layers) ───────────────
  for (float i = 0.0; i < 4.0; i++) {
    float depth = 1.0 + i * 1.5;
    vec2 starUv = st * (50.0 + i * 35.0) + parallax * (10.0 + i * 8.0);
    starUv += vec2(t * 0.003 * (i + 1.0), 0.0); // very slow drift
    vec2 sid = floor(starUv);
    vec2 sf = fract(starUv) - 0.5;
    float sh = hash21(sid + i * 17.3);
    if (sh > 0.972) {
      vec2 sp = (hash22(sid + i) - 0.5) * 0.4;
      float sd = length(sf - sp);
      float twk = sin(t * (0.5 + sh * 2.0) + sh * 6.28) * 0.4 + 0.6;
      float brightness = smoothstep(0.05, 0.0, sd) * twk;
      // Star color — mostly white, occasional warm/cool tints
      vec3 sc = mix(cWhiteHot, mix(cViolet, cWarm, sh), 0.4);
      color += sc * brightness * (0.4 + sh * 0.6) / depth;
    }
  }
  
  // ─── 3) VOLUMETRIC NEBULA (the big one) ───────────────────
  // Multiple layers of gas, each with different scale & motion
  
  // Outer halo — soft, expansive
  vec3 q = vec3(p * 1.4, t * 0.04);
  float n_outer = fbm3(q + vec3(parallax * 0.5, 0.0));
  
  // Mid gas — turbulent
  vec3 q2 = vec3(p * 2.6 + vec2(t * 0.02, -t * 0.015), t * 0.06);
  float n_mid = fbm3(q2);
  
  // Inner hot gas — fast, swirling
  // Convert to polar and add rotation for spiral feel
  float spiralAng = ang + r * 1.8 + t * 0.05;
  vec2 spiralP = vec2(cos(spiralAng), sin(spiralAng)) * r;
  vec3 q3 = vec3(spiralP * 4.5, t * 0.1);
  float n_inner = fbm3(q3);
  
  // Filaments / gas streams — ridged noise gives stringy structure
  float fil = ridged(p * 6.0 + vec2(t * 0.03, 0.0) + parallax);
  fil = pow(fil, 2.5);
  
  // Distance-based density falloff — nebula concentrates near center
  float halo     = exp(-r * 1.6) * 1.2;
  float midDens  = exp(-r * 2.8) * 1.4;
  float innerDens = exp(-r * 5.0) * 1.8;
  float coreDens = exp(-r * 12.0) * 2.0;
  
  // Reveal: nebula expands from a point
  float expandR = reveal * 1.6 + 0.05;
  float reveal_falloff = smoothstep(expandR, expandR * 0.4, r);
  
  // Outer cool halo — indigo / deep violet
  vec3 outerColor = mix(cIndigo, cViolet, n_outer);
  color += outerColor * halo * n_outer * 0.45 * reveal_falloff;
  
  // Mid layer — violet with magenta accents
  vec3 midColor = mix(cViolet, cMagenta, n_mid * n_mid);
  color += midColor * midDens * n_mid * 0.7 * reveal_falloff;
  
  // Filament gas — bright magenta/pink threads
  vec3 filColor = mix(cMagenta, cWarm, fil);
  color += filColor * fil * midDens * 0.55 * reveal_falloff;
  
  // Inner hot gas — warm pink to white-hot
  vec3 innerColor = mix(cMagenta, cWarm, n_inner);
  innerColor = mix(innerColor, cWhiteHot, smoothstep(0.5, 0.9, n_inner));
  color += innerColor * innerDens * pow(n_inner, 1.2) * 1.0 * reveal_falloff;
  
  // ─── 4) THE SPARK — singularity core ──────────────────────
  // Bright pulsing core, slightly offset by mouse
  float pulse = 1.0 + sin(t * 1.3) * 0.08 + sin(t * 3.7) * 0.03;
  float core = exp(-r * 38.0 / pulse) * reveal;
  float coreGlow = exp(-r * 14.0 / pulse) * reveal;
  float coreBloom = exp(-r * 5.5 / pulse) * reveal;
  
  // Anisotropic cross-flare (lens spike)
  float flareH = exp(-abs(p.y) * 90.0) * exp(-abs(p.x) * 4.0);
  float flareV = exp(-abs(p.x) * 110.0) * exp(-abs(p.y) * 5.0);
  float flare = (flareH + flareV * 0.7) * reveal;
  
  color += cWhiteHot * core * 2.5;
  color += mix(cWarm, cWhiteHot, 0.5) * coreGlow * 0.9;
  color += cMagenta * coreBloom * 0.5;
  color += cViolet * coreBloom * coreBloom * 0.3;
  color += cWhiteHot * flare * 0.6;
  
  // ─── 5) DUST PARTICLES (foreground motes) ─────────────────
  for (float i = 0.0; i < 2.0; i++) {
    vec2 du = st * (12.0 + i * 8.0) + vec2(t * 0.015 * (i + 1.0), t * 0.008) + parallax * (3.0 + i * 2.0);
    float dn = fbm(du);
    float mote = smoothstep(0.7, 0.88, dn) * 0.3;
    color += mote * mix(cViolet, cMagenta, hash21(vec2(i, 1.7))) * 0.15;
  }
  
  // ─── 6) ATMOSPHERIC GRADIENT ──────────────────────────────
  // Subtle radial wash adding depth
  float atmo = exp(-r * 1.2) * 0.15 * reveal;
  color += cViolet * atmo;
  
  // ─── 7) VIGNETTE ──────────────────────────────────────────
  float vigDist = length(st);
  float vig = smoothstep(1.2, 0.15, vigDist);
  color *= mix(0.15, 1.0, vig);
  
  // ─── 8) FILM GRAIN ────────────────────────────────────────
  float grain = (hash21(uv * uResolution + fract(t)) - 0.5) * 0.022;
  color += grain;
  
  // ─── 9) TONE MAPPING (filmic) ─────────────────────────────
  // Soft shoulder — preserves highlights without clipping
  color = color / (1.0 + color * 0.7);
  
  // Slight cool shadows / warm highlights
  vec3 shadow = vec3(0.95, 0.97, 1.05);
  vec3 highlight = vec3(1.05, 1.0, 0.98);
  float lum = dot(color, vec3(0.299, 0.587, 0.114));
  color *= mix(shadow, highlight, smoothstep(0.0, 0.6, lum));
  
  // Gamma
  color = pow(max(color, 0.0), vec3(0.92));
  
  gl_FragColor = vec4(color, 1.0);
}
`;

const FragmentShaderMesh = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { size } = useThree();
  const startTime = useRef(Date.now());
  const smoothMouse = useRef(new THREE.Vector2(0.5, 0.5));

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uReveal: { value: 0 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useFrame(() => {
    const elapsed = (Date.now() - startTime.current) / 1000;
    uniforms.uTime.value = elapsed;
    uniforms.uResolution.value.set(size.width, size.height);

    // Smooth mouse follow (lerp for cinematic feel)
    uniforms.uMouse.value.lerp(smoothMouse.current, 0.06);

    // Reveal: 0 → 1 over ~3.5s with ease-out, then stays at 1
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
