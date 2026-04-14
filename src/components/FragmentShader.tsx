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

const fragmentShader = /* glsl */ `
precision highp float;

uniform float uTime;
uniform vec2 uMouse;
uniform vec2 uResolution;
uniform float uCrackProgress;

varying vec2 vUv;

// ─── Hash / Noise ───
vec2 hash22(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// Simplex-like noise
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
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = rot * p * 2.0;
    a *= 0.5;
  }
  return v;
}

// ─── Voronoi ───
// Returns: x = min dist, y = edge dist, z = cell id
vec3 voronoi(vec2 uv, float scale) {
  vec2 p = uv * scale;
  vec2 i = floor(p);
  vec2 f = fract(p);
  
  float minDist = 10.0;
  float secondMin = 10.0;
  vec2 minId = vec2(0.0);
  
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 neighbor = vec2(float(x), float(y));
      vec2 cellId = i + neighbor;
      vec2 point = hash22(cellId);
      // Animate points subtly
      point = 0.5 + 0.4 * sin(uTime * 0.15 + 6.2831 * point);
      vec2 diff = neighbor + point - f;
      float dist = length(diff);
      
      if (dist < minDist) {
        secondMin = minDist;
        minDist = dist;
        minId = cellId;
      } else if (dist < secondMin) {
        secondMin = dist;
      }
    }
  }
  
  float edge = secondMin - minDist;
  return vec3(minDist, edge, hash21(minId));
}

void main() {
  vec2 uv = vUv;
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 st = (uv - 0.5) * aspect;
  
  // Mouse parallax (subtle)
  vec2 mouse = (uMouse - 0.5) * 0.03;
  
  // Distance from center
  float centerDist = length(st);
  
  // ─── Multi-scale Voronoi fragmentation ───
  vec2 uvShifted = st + mouse * 0.5;
  
  // Large fragments
  vec3 vor1 = voronoi(uvShifted, 5.0);
  // Medium detail
  vec3 vor2 = voronoi(uvShifted + 0.5, 9.0);
  // Fine cracks
  vec3 vor3 = voronoi(uvShifted + 1.0, 16.0);
  
  // ─── Fragment displacement ───
  // Fragments near center displace more
  float displaceZone = smoothstep(0.6, 0.0, centerDist) * uCrackProgress;
  
  // Each cell gets displacement based on its hash
  float cellDisplace1 = vor1.z * displaceZone * 0.04;
  float cellDisplace2 = vor2.z * displaceZone * 0.015;
  
  // Direction: radially outward + noise-based variation  
  vec2 displaceDir = normalize(st + 0.001) * (cellDisplace1 + cellDisplace2);
  displaceDir += mouse * displaceZone * 0.3;
  
  // Apply displacement to UV for the fragment surface
  vec2 displacedUv = st + displaceDir;
  
  // ─── Edge detection (cracks) ───
  float edge1 = smoothstep(0.05, 0.0, vor1.y); // main cracks
  float edge2 = smoothstep(0.04, 0.0, vor2.y) * 0.6; // secondary
  float edge3 = smoothstep(0.03, 0.0, vor3.y) * 0.3; // fine detail
  
  // Crack visibility: strongest near center, fades at edges
  float crackMask = smoothstep(0.7, 0.1, centerDist) * uCrackProgress;
  float cracks = (edge1 + edge2 * 0.5 + edge3 * 0.3) * crackMask;
  
  // ─── Gap between fragments ───
  float gap = smoothstep(0.08, 0.02, vor1.y) * displaceZone;
  gap += smoothstep(0.06, 0.01, vor2.y) * displaceZone * 0.5;
  
  // ─── Energy field (visible through cracks/gaps) ───
  vec2 energyUv = st * 2.0 + mouse;
  float n1 = fbm(energyUv + uTime * 0.1);
  float n2 = fbm(energyUv * 1.5 - uTime * 0.08);
  float n3 = fbm(energyUv * 0.7 + vec2(uTime * 0.05, -uTime * 0.03));
  float energyField = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;
  
  // Energy color: white center → violet → magenta edges
  vec3 energyWhite = vec3(0.95, 0.9, 1.0);
  vec3 energyViolet = vec3(0.482, 0.184, 1.0); // #7B2FFF
  vec3 energyMagenta = vec3(0.784, 0.0, 0.478); // #C8007A
  
  float colorZone = smoothstep(0.0, 0.4, centerDist);
  vec3 energyColor = mix(energyWhite, energyViolet, smoothstep(0.0, 0.3, colorZone));
  energyColor = mix(energyColor, energyMagenta, smoothstep(0.3, 0.8, colorZone));
  
  // Energy intensity with noise variation
  float energyIntensity = energyField * 0.8 + 0.4;
  energyIntensity *= smoothstep(0.8, 0.0, centerDist); // fade at edges
  
  // Hot spots
  float hotspot = smoothstep(0.6, 0.8, n1) * 0.5;
  energyColor += hotspot * vec3(0.3, 0.2, 0.4);
  
  vec3 energy = energyColor * energyIntensity;
  
  // ─── Stars ───
  float stars = 0.0;
  for (float i = 0.0; i < 3.0; i++) {
    vec2 starUv = st * (15.0 + i * 10.0) + i * 7.3;
    vec2 starId = floor(starUv);
    vec2 starF = fract(starUv) - 0.5;
    float starHash = hash21(starId);
    if (starHash > 0.93) {
      vec2 starPos = (hash22(starId) - 0.5) * 0.6;
      float starDist = length(starF - starPos);
      float twinkle = sin(uTime * (1.0 + starHash * 3.0) + starHash * 6.28) * 0.3 + 0.7;
      stars += smoothstep(0.03, 0.0, starDist) * twinkle * (0.5 + starHash * 0.5);
    }
  }
  
  // ─── Compose ───
  // Fragment surface: very dark
  vec3 fragmentColor = vec3(0.008, 0.005, 0.02);
  
  // Subtle surface variation (depth feel)
  float surfaceNoise = noise(displacedUv * 20.0) * 0.015;
  fragmentColor += surfaceNoise;
  
  // Fragment edge highlight
  float edgeGlow = cracks * 1.5;
  vec3 edgeColor = mix(energyViolet, energyWhite, edgeGlow * 0.3);
  
  // Gap reveals energy behind
  float gapReveal = gap * uCrackProgress;
  
  // Mix: fragment surface + edge glow + energy through gaps
  vec3 color = fragmentColor;
  
  // Add energy visible through gaps
  color = mix(color, energy, gapReveal);
  
  // Add stars through gaps  
  color += stars * gapReveal * vec3(0.8, 0.75, 1.0) * 0.3;
  
  // Add crack edge glow on top
  color += edgeColor * edgeGlow * 0.6;
  
  // Bloom-like glow: add broad energy glow
  float bloomMask = smoothstep(0.5, 0.0, centerDist) * uCrackProgress;
  color += energy * bloomMask * 0.08;
  
  // Vignette
  float vig = smoothstep(0.9, 0.3, centerDist);
  color *= mix(0.3, 1.0, vig);
  
  // Subtle overall violet ambient (like nk.studio darkness with color)
  color += vec3(0.02, 0.005, 0.04) * (1.0 - centerDist * 0.5);
  
  // Gamma
  color = pow(color, vec3(0.95));
  
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

    // Crack animation: starts at 0.5s, takes 2.5s to fully open
    const crackStart = 0.5;
    const crackDuration = 2.5;
    const progress = Math.max(0, Math.min(1, (elapsed - crackStart) / crackDuration));
    // Ease out
    uniforms.uCrackProgress.value = 1 - Math.pow(1 - progress, 3);
  });

  // Mouse tracking
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
