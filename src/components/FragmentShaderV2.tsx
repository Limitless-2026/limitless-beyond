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

// DEEP SPACE — black starfield with subtle parallax & mouse drift
// No nebula. Multi-layer stars + occasional faint dust. Pure void aesthetic.
const fragmentShader = /* glsl */ `
precision highp float;

uniform float uTime;
uniform vec2  uMouse;        // smoothed mouse, -1..1
uniform vec2  uResolution;
uniform float uScroll;       // 0..1 — accelerates star drift

varying vec2 vUv;

#define PI 3.14159265359

float hash21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

// Single star layer at given density and brightness scale
vec3 starLayer(vec2 uv, float density, float brightness, float twinkleSpeed, float seed) {
  vec2 g = floor(uv * density);
  vec2 f = fract(uv * density) - 0.5;

  float h = hash21(g + seed);
  // Only some cells host a star
  if (h < 0.965) return vec3(0.0);

  // Star position jitter inside cell
  vec2 offset = vec2(hash21(g + seed + 1.7), hash21(g + seed + 3.3)) - 0.5;
  offset *= 0.6;

  float d = length(f - offset);
  // Soft point: small radius, sharp falloff
  float star = smoothstep(0.04, 0.0, d);

  // Twinkle
  float tw = 0.5 + 0.5 * sin(uTime * twinkleSpeed + h * 30.0);
  star *= mix(0.4, 1.0, tw);

  // Slight chromatic tint per star
  float tint = hash21(g + seed + 7.7);
  vec3 color = mix(vec3(1.0, 0.95, 0.9), vec3(0.75, 0.85, 1.0), tint);

  return color * star * brightness;
}

void main() {
  vec2 uv = vUv;
  float aspect = uResolution.x / uResolution.y;
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

  // Subtle mouse parallax (very gentle)
  vec2 parallax = uMouse * 0.015;

  // Slow drift accelerating with scroll
  float drift = uTime * 0.003 + uScroll * 0.4;

  vec3 col = vec3(0.0);

  // 3 depth layers — closer = bigger drift
  col += starLayer(p + vec2(drift * 0.3, 0.0)  + parallax * 0.3, 60.0,  0.7, 1.5, 1.0);
  col += starLayer(p + vec2(drift * 0.6, 0.05) + parallax * 0.6, 110.0, 0.55, 2.5, 2.0);
  col += starLayer(p + vec2(drift * 1.0, -0.03)+ parallax * 1.0, 200.0, 0.4, 3.5, 3.0);

  // Very faint cosmic dust — barely visible warm/cool gradient
  float dust = pow(hash21(floor(p * 8.0)), 8.0) * 0.015;
  col += vec3(dust * 0.6, dust * 0.5, dust * 0.7);

  // Slight vignette to enhance depth
  float vig = smoothstep(1.2, 0.3, length(p));
  col *= mix(0.85, 1.0, vig);

  // Pure black background
  gl_FragColor = vec4(col, 1.0);
}
`;

const FragmentShaderMeshV2 = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { size, viewport } = useThree();
  const mouseTarget = useRef(new THREE.Vector2(0, 0));
  const mouseSmoothed = useRef(new THREE.Vector2(0, 0));
  const scrollRef = useRef(0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uScroll: { value: 0 },
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
      const max = window.innerHeight * 2.5;
      scrollRef.current = Math.max(0, Math.min(1, window.scrollY / max));
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

    mouseSmoothed.current.lerp(mouseTarget.current, 0.05);

    mat.uniforms.uTime.value += delta;
    mat.uniforms.uMouse.value.copy(mouseSmoothed.current);
    mat.uniforms.uResolution.value.set(size.width, size.height);
    mat.uniforms.uScroll.value += (scrollRef.current - mat.uniforms.uScroll.value) * 0.06;
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
