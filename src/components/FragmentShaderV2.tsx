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

// COSMIC SINGULARITY v2 — INTERACTIVE
// Mouse drives nebula gravity & gas distortion
// Scroll zooms INTO the singularity, then crossfades to deep space starfield
const fragmentShader = /* glsl */ `
precision highp float;

uniform float uTime;
uniform vec2  uMouse;
uniform vec2  uMouseVel;
uniform vec2  uResolution;
uniform float uScroll;       // 0..1
uniform float uStarfield;    // 0..1 — crossfade nebula → black starfield

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
  return mix(mix(hash21(i), hash21(i+vec2(1,0)), f.x),
             mix(hash21(i+vec2(0,1)), hash21(i+vec2(1,1)), f.x), f.y);
}

float vnoise3(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f*f*(3.0 - 2.0*f);
  float n000=hash31(i),                n100=hash31(i+vec3(1,0,0));
  float n010=hash31(i+vec3(0,1,0)),    n110=hash31(i+vec3(1,1,0));
  float n001=hash31(i+vec3(0,0,1)),    n101=hash31(i+vec3(1,0,1));
  float n011=hash31(i+vec3(0,1,1)),    n111=hash31(i+vec3(1,1,1));
  return mix(
    mix(mix(n000,n100,f.x), mix(n010,n110,f.x), f.y),
    mix(mix(n001,n101,f.x), mix(n011,n111,f.x), f.y), f.z);
}

float fbm3(vec3 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * vnoise3(p); p *= 2.0; a *= 0.5; }
  return v;
}

// ─── Star field (multi-layer) ───────────────────────────────
vec3 starLayer(vec2 uv, float density, float brightness, float twinkleSpeed, float seed) {
  vec2 g = floor(uv * density);
  vec2 f = fract(uv * density) - 0.5;
  float h = hash21(g + seed);
  if (h < 0.965) return vec3(0.0);
  vec2 offset = vec2(hash21(g + seed + 1.7), hash21(g + seed + 3.3)) - 0.5;
  offset *= 0.6;
  float d = length(f - offset);
  float star = smoothstep(0.04, 0.0, d);
  float tw = 0.5 + 0.5 * sin(uTime * twinkleSpeed + h * 30.0);
  star *= mix(0.4, 1.0, tw);
  float tint = hash21(g + seed + 7.7);
  vec3 color = mix(vec3(1.0, 0.95, 0.9), vec3(0.75, 0.85, 1.0), tint);
  return color * star * brightness;
}

vec3 deepSpaceStars(vec2 p) {
  vec3 col = vec3(0.0);
  float drift = uTime * 0.003 + uScroll * 0.4;
  vec2 parallax = uMouse * 0.015;
  col += starLayer(p + vec2(drift * 0.3, 0.0)  + parallax * 0.3, 60.0,  0.7, 1.5, 1.0);
  col += starLayer(p + vec2(drift * 0.6, 0.05) + parallax * 0.6, 110.0, 0.55, 2.5, 2.0);
  col += starLayer(p + vec2(drift * 1.0, -0.03)+ parallax * 1.0, 200.0, 0.4, 3.5, 3.0);
  float vig = smoothstep(1.2, 0.3, length(p));
  col *= mix(0.85, 1.0, vig);
  return col;
}

// ─── Nebula / singularity scene ─────────────────────────────
vec3 nebulaScene(vec2 p) {
  // Camera zoom driven by scroll (infinite dive)
  float zoom = 1.0 + uScroll * 4.5;
  vec2 q = p * (1.0 / zoom);

  // Mouse acts as gravity well
  vec2 mp = (uMouse * 0.5);
  vec2 toMouse = q - mp;
  float dM = length(toMouse);

  // Domain warping with mouse pull
  float t = uTime * 0.04 + uScroll * 0.6;
  vec3 wp = vec3(q * 1.6, t);
  float warp1 = fbm3(wp);
  float warp2 = fbm3(wp + 7.3);
  vec2 warped = q + vec2(warp1, warp2) * 0.55 - toMouse * exp(-dM * 2.5) * 0.35;

  // Gas density (FBM)
  float gas = fbm3(vec3(warped * 1.8, t * 0.7));
  gas = pow(gas, 1.6);

  // Distance to singularity center
  float dC = length(p);

  // Color palette — violeta / magenta / azul profundo
  vec3 violet  = vec3(0.48, 0.18, 0.95);
  vec3 magenta = vec3(0.78, 0.05, 0.50);
  vec3 deepBlue= vec3(0.08, 0.04, 0.22);
  vec3 hot     = vec3(1.0, 0.75, 0.95);

  vec3 col = mix(deepBlue, violet, gas);
  col = mix(col, magenta, smoothstep(0.45, 0.85, gas) * 0.7);

  // Singularity core glow
  float core = exp(-dC * 5.5) * 1.6;
  col += hot * core;

  // Inner bright disc
  float disc = exp(-dC * 12.0);
  col += vec3(1.0, 0.9, 1.0) * disc * 0.9;

  // Anisotropic lens flare (cross + diagonal)
  vec2 ap = p;
  float flare = 0.0;
  flare += exp(-abs(ap.x) * 35.0) * exp(-abs(ap.y) * 1.5);
  flare += exp(-abs(ap.y) * 35.0) * exp(-abs(ap.x) * 1.5);
  vec2 dp = vec2(ap.x + ap.y, ap.x - ap.y) * 0.7071;
  flare += exp(-abs(dp.x) * 50.0) * exp(-abs(dp.y) * 2.5) * 0.55;
  flare += exp(-abs(dp.y) * 50.0) * exp(-abs(dp.x) * 2.5) * 0.55;
  col += vec3(0.95, 0.7, 1.0) * flare * 0.35 * smoothstep(0.0, 0.4, 1.0 - dC);

  // Energy ring
  float ring = smoothstep(0.18, 0.16, abs(dC - 0.22));
  col += vec3(0.95, 0.55, 1.0) * ring * 0.45;

  // Subtle atmospheric stars over nebula
  col += deepSpaceStars(p) * 0.4;

  // Vignette tightens with scroll (tunnel)
  float vig = smoothstep(1.0 + (1.0 - uScroll) * 0.6, 0.2, length(p));
  col *= mix(0.7, 1.0, vig);

  // Chromatic aberration vibe via slight scroll-driven shift on red
  float ca = uScroll * 0.04;
  col.r = mix(col.r, col.r * 1.05, ca);

  return col;
}

void main() {
  vec2 uv = vUv;
  float aspect = uResolution.x / uResolution.y;
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

  vec3 nebula = nebulaScene(p);
  vec3 stars  = deepSpaceStars(p);

  // Crossfade nebula → deep starfield
  vec3 col = mix(nebula, stars, clamp(uStarfield, 0.0, 1.0));

  // Tone-map (compress)
  col *= 0.78;
  col = col / (1.0 + col);
  col = pow(col, vec3(0.95));

  gl_FragColor = vec4(col, 1.0);
}
`;

const FragmentShaderMeshV2 = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { size, viewport } = useThree();
  const mouseTarget = useRef(new THREE.Vector2(0, 0));
  const mouseSmoothed = useRef(new THREE.Vector2(0, 0));
  const mousePrev = useRef(new THREE.Vector2(0, 0));
  const mouseVel = useRef(new THREE.Vector2(0, 0));
  const scrollRef = useRef(0);
  const starfieldRef = useRef(0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uMouseVel: { value: new THREE.Vector2(0, 0) },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uScroll: { value: 0 },
      uStarfield: { value: 0 },
    }),
    []
  );

  useMemo(() => {
    const onMove = (e: MouseEvent) => {
      mouseTarget.current.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -((e.clientY / window.innerHeight) * 2 - 1)
      );
    };
    const onScroll = () => {
      const heroMax = window.innerHeight * 2.5;
      scrollRef.current = Math.max(0, Math.min(1, window.scrollY / heroMax));
      // Starfield kicks in around the singularity threshold (~0.7 of hero scroll)
      const sf = (window.scrollY - window.innerHeight * 1.8) / (window.innerHeight * 0.9);
      starfieldRef.current = Math.max(0, Math.min(1, sf));
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.ShaderMaterial;

    mouseSmoothed.current.lerp(mouseTarget.current, 0.06);
    mouseVel.current.set(
      mouseSmoothed.current.x - mousePrev.current.x,
      mouseSmoothed.current.y - mousePrev.current.y
    );
    mousePrev.current.copy(mouseSmoothed.current);

    mat.uniforms.uTime.value += delta;
    mat.uniforms.uMouse.value.copy(mouseSmoothed.current);
    mat.uniforms.uMouseVel.value.copy(mouseVel.current);
    mat.uniforms.uResolution.value.set(size.width, size.height);
    mat.uniforms.uScroll.value += (scrollRef.current - mat.uniforms.uScroll.value) * 0.06;
    mat.uniforms.uStarfield.value += (starfieldRef.current - mat.uniforms.uStarfield.value) * 0.08;
  });

  return (
    <mesh ref={meshRef} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
};

export default FragmentShaderMeshV2;
