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

// Realistic shattered glass / dimensional crack shader
// Inspired by nk.studio - cinematic, volumetric, photographic
const fragmentShader = /* glsl */ `
precision highp float;

uniform float uTime;
uniform vec2 uMouse;
uniform vec2 uResolution;
uniform float uCrackProgress;

varying vec2 vUv;

// ─── Hash / Noise ───
float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

vec2 hash22(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 6; i++) {
    v += a * noise(p);
    p = rot * p * 2.0;
    a *= 0.5;
  }
  return v;
}

// Distance to a line segment
float sdSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

// Generate a jagged crack line from origin in a direction, with branching
// Returns the minimum distance to any crack segment
float crackBranch(vec2 p, vec2 origin, float angle, float length, float seed) {
  float minDist = 1e9;
  vec2 cur = origin;
  float curAngle = angle;
  
  // Walk the main crack with jagged segments
  for (int i = 0; i < 8; i++) {
    float t = float(i) / 8.0;
    float segLen = length * (0.10 + 0.08 * hash21(vec2(seed, float(i))));
    // Jaggedness — perturb angle each step
    float jag = (hash21(vec2(seed * 3.7, float(i) * 1.3)) - 0.5) * 0.9;
    curAngle += jag;
    vec2 next = cur + vec2(cos(curAngle), sin(curAngle)) * segLen;
    
    float d = sdSegment(p, cur, next);
    minDist = min(minDist, d);
    
    cur = next;
  }
  return minDist;
}

// Full crack network from a single impact point
// x = distance to nearest crack, y = "shard id" for shading
vec2 crackNetwork(vec2 p, vec2 impact) {
  float minDist = 1e9;
  
  // Main radial cracks (6 primary)
  const int N = 7;
  for (int i = 0; i < N; i++) {
    float fi = float(i);
    float baseAngle = (fi / float(N)) * 6.2831853 + hash21(vec2(fi, 1.7)) * 0.6;
    float len = 0.6 + hash21(vec2(fi, 3.1)) * 0.5;
    float d = crackBranch(p, impact, baseAngle, len, fi + 1.0);
    minDist = min(minDist, d);
    
    // Secondary branches off the main crack
    vec2 branchOrigin = impact + vec2(cos(baseAngle), sin(baseAngle)) * len * 0.35;
    float branchAngle = baseAngle + (hash21(vec2(fi, 5.5)) - 0.5) * 1.6;
    float dBranch = crackBranch(p, branchOrigin, branchAngle, len * 0.5, fi + 20.0);
    minDist = min(minDist, dBranch);
    
    // Third tier — fine cracks
    vec2 b2 = impact + vec2(cos(baseAngle), sin(baseAngle)) * len * 0.65;
    float a2 = baseAngle + (hash21(vec2(fi, 9.1)) - 0.5) * 2.0;
    float d3 = crackBranch(p, b2, a2, len * 0.3, fi + 40.0);
    minDist = min(minDist, d3);
  }
  
  // Concentric ring fractures (compression cracks near impact)
  float r = length(p - impact);
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float radius = 0.06 + fi * 0.08;
    float ringDist = abs(r - radius);
    // Break the ring into arcs (not a full circle)
    float ang = atan(p.y - impact.y, p.x - impact.x);
    float arcMask = step(0.3, fract(ang * (2.0 + fi) / 6.2831853 + hash21(vec2(fi, 7.3))));
    if (arcMask > 0.5) {
      minDist = min(minDist, ringDist + 0.005);
    }
  }
  
  return vec2(minDist, hash21(floor(p * 8.0)));
}

void main() {
  vec2 uv = vUv;
  float aspect = uResolution.x / uResolution.y;
  vec2 st = (uv - 0.5) * vec2(aspect, 1.0);
  
  // Mouse parallax (subtle depth shift)
  vec2 mouse = (uMouse - 0.5) * 2.0;
  vec2 parallax = mouse * 0.015;
  
  // Impact point — slightly above center for cinematic framing
  vec2 impact = vec2(0.0, 0.05) + parallax * 0.3;
  
  // Distort coordinates with low-freq noise for organic, hand-broken feel
  vec2 distortP = st + parallax;
  float warp = fbm(distortP * 1.5) * 0.04;
  distortP += vec2(warp, fbm(distortP * 1.5 + 7.3) * 0.04 - 0.02);
  
  // ─── Compute crack distance field ───
  vec2 crack = crackNetwork(distortP, impact);
  float crackDist = crack.x;
  float shardId = crack.y;
  
  float centerDist = length(st - impact);
  
  // ─── Crack rendering ───
  // Crack core (the dark fissure itself, thin)
  float crackCore = smoothstep(0.004, 0.0, crackDist);
  // Crack glow (soft halo of light bleeding from crack)
  float crackGlow = smoothstep(0.04, 0.0, crackDist);
  // Wide bleed (atmospheric scattering)
  float crackBleed = smoothstep(0.15, 0.0, crackDist);
  
  // Animation: cracks spread from impact outward
  float dr = centerDist;
  // Reveal radius grows over time
  float revealRadius = uCrackProgress * 1.8;
  float revealMask = smoothstep(revealRadius, revealRadius - 0.3, dr);
  // Brightness pulse — cracks brighten as they form
  float ageAt = clamp((revealRadius - dr) / 0.4, 0.0, 1.0);
  
  crackCore *= revealMask;
  crackGlow *= revealMask * (0.4 + ageAt * 0.6);
  crackBleed *= revealMask * ageAt;
  
  // ─── Energy emerging from crack ───
  // Volumetric noise behind the crack
  vec2 energyUv = st * 1.8 + parallax * 2.0;
  float n1 = fbm(energyUv + uTime * 0.06);
  float n2 = fbm(energyUv * 2.0 - uTime * 0.04);
  float n3 = fbm(energyUv * 0.5 + uTime * 0.02);
  float energyField = n1 * 0.55 + n2 * 0.30 + n3 * 0.15;
  
  // Color palette — photographic, restrained (not neon)
  vec3 cDeep      = vec3(0.02, 0.01, 0.05);   // deep void
  vec3 cViolet    = vec3(0.35, 0.12, 0.75);   // brand violet
  vec3 cMagenta   = vec3(0.65, 0.05, 0.45);   // brand magenta
  vec3 cHot       = vec3(1.0, 0.85, 1.0);     // white-hot light
  vec3 cWarm      = vec3(1.0, 0.55, 0.85);    // warm pink edge
  
  // Light gradient — hot at impact, cooling outward
  float impactProx = smoothstep(0.5, 0.0, dr);
  vec3 lightCore = mix(cMagenta, cHot, impactProx);
  lightCore = mix(cViolet, lightCore, smoothstep(0.7, 0.0, dr));
  
  // Energy modulation
  float energyVar = energyField * 1.4 - 0.2;
  vec3 energy = lightCore * max(energyVar, 0.0);
  
  // ─── Stars / particles in the void behind cracks ───
  float stars = 0.0;
  for (float i = 0.0; i < 3.0; i++) {
    vec2 starUv = st * (40.0 + i * 25.0) + i * 13.7 + parallax * (5.0 + i * 3.0);
    vec2 sid = floor(starUv);
    vec2 sf = fract(starUv) - 0.5;
    float sh = hash21(sid);
    if (sh > 0.96) {
      vec2 sp = (hash22(sid) - 0.5) * 0.5;
      float sd = length(sf - sp);
      float twk = sin(uTime * (0.8 + sh * 2.5) + sh * 6.28) * 0.4 + 0.6;
      stars += smoothstep(0.04, 0.0, sd) * twk * (0.4 + sh * 0.6);
    }
  }
  
  // Dust motes drifting (large, soft)
  float dust = 0.0;
  for (float i = 0.0; i < 2.0; i++) {
    vec2 du = st * (8.0 + i * 5.0) + vec2(uTime * 0.02, uTime * 0.01) * (1.0 + i);
    float dn = fbm(du);
    dust += smoothstep(0.65, 0.85, dn) * 0.4;
  }
  
  // ─── Glass shard surface (subtle facet shading) ───
  // Each shard gets a slight tonal variation to suggest 3D faceting
  float shardShade = (shardId - 0.5) * 0.025;
  // Specular hint along crack edges (light catching the bevel)
  float specular = smoothstep(0.025, 0.005, crackDist) * smoothstep(0.0, 0.005, crackDist - 0.003);
  
  // ─── Compose ───
  vec3 color = cDeep;
  
  // Base surface — very dark glass with subtle facet variation
  color += shardShade * vec3(0.5, 0.4, 0.7);
  
  // Stars and dust visible everywhere but very faint
  color += stars * vec3(0.85, 0.8, 1.0) * 0.25 * (0.3 + crackBleed * 2.0);
  color += dust * cViolet * 0.04;
  
  // Atmospheric bleed from cracks (soft glow extending into shards)
  color += energy * crackBleed * 0.5;
  color += cViolet * crackBleed * 0.15 * uCrackProgress;
  
  // Crack glow halo
  color += lightCore * crackGlow * (0.6 + energyField * 0.8);
  color += cWarm * crackGlow * 0.2 * impactProx;
  
  // Bright crack core — light pouring through
  vec3 coreColor = mix(cHot, cWarm, 0.3 + energyField * 0.4);
  color += coreColor * crackCore * (0.9 + impactProx * 0.6);
  
  // Specular highlight on shard edges
  color += vec3(0.9, 0.85, 1.0) * specular * 0.15 * uCrackProgress;
  
  // Central impact bloom — the brightest point
  float bloom = smoothstep(0.35, 0.0, dr) * uCrackProgress;
  color += cHot * pow(bloom, 3.0) * 0.4;
  color += cMagenta * pow(bloom, 1.5) * 0.15;
  
  // Vignette for cinematic framing
  float vig = smoothstep(1.1, 0.2, length(st));
  color *= mix(0.25, 1.0, vig);
  
  // Subtle film grain
  float grain = (hash21(uv * uResolution + uTime) - 0.5) * 0.025;
  color += grain;
  
  // Tone mapping — ACES-like soft shoulder
  color = color / (1.0 + color * 0.8);
  // Gamma
  color = pow(color, vec3(0.92));
  
  gl_FragColor = vec4(color, 1.0);
}
`;

const FragmentShaderMesh = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { size } = useThree();
  const startTime = useRef(Date.now());

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uCrackProgress: { value: 0 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useFrame(() => {
    const elapsed = (Date.now() - startTime.current) / 1000;
    uniforms.uTime.value = elapsed;
    uniforms.uResolution.value.set(size.width, size.height);

    // Crack propagation: starts at 0.3s, takes 3s to fully form
    const crackStart = 0.3;
    const crackDuration = 3.0;
    const progress = Math.max(0, Math.min(1, (elapsed - crackStart) / crackDuration));
    // Ease out cubic
    uniforms.uCrackProgress.value = 1 - Math.pow(1 - progress, 3);
  });

  const handlePointerMove = useMemo(() => {
    return (e: { uv?: THREE.Vector2 }) => {
      if (e.uv) {
        uniforms.uMouse.value.copy(e.uv);
      }
    };
  }, [uniforms]);

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
