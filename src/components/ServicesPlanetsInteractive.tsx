import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, useState, useEffect, Suspense } from "react";
import * as THREE from "three";
import { SERVICES, type Service } from "@/data/services";
import ServiceModal from "./ServiceModal";

// ─── Shaders ────────────────────────────────────────────────────────
const planetVert = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPos;
  varying vec3 vWorldNormal;
  void main() {
    vNormal = normal;
    vPos = position;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const planetFrag = /* glsl */ `
  precision highp float;
  varying vec3 vNormal;
  varying vec3 vPos;
  varying vec3 vWorldNormal;
  uniform float uTime;
  uniform vec3 uColor;
  uniform vec3 uColorDeep;
  uniform vec3 uLightDir;
  uniform float uHover;

  // hash + fbm
  float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1,311.7,74.7))) * 43758.5453123); }
  float noise(vec3 p) {
    vec3 i = floor(p); vec3 f = fract(p);
    f = f*f*(3.0-2.0*f);
    return mix(mix(mix(hash(i+vec3(0,0,0)), hash(i+vec3(1,0,0)), f.x),
                   mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x),
                   mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) {
    float v = 0.0; float a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.07; a *= 0.5; }
    return v;
  }

  void main() {
    vec3 p = vPos * 1.6 + vec3(uTime * 0.05, 0.0, uTime * 0.03);
    float n = fbm(p);
    float n2 = fbm(p * 2.3 + n * 1.1);
    vec3 base = mix(uColorDeep, uColor, smoothstep(0.25, 0.85, n + n2 * 0.4));

    // light terminator
    float diff = max(dot(normalize(vWorldNormal), normalize(uLightDir)), 0.0);
    float lit = pow(diff, 0.85);
    vec3 col = base * (0.18 + lit * 1.05);

    // rim / fresnel
    float rim = pow(1.0 - max(dot(normalize(vNormal), vec3(0.0,0.0,1.0)), 0.0), 2.4);
    col += uColor * rim * (0.55 + uHover * 0.7);

    // subtle inner glow
    col += uColorDeep * 0.08;

    gl_FragColor = vec4(col, 1.0);
  }
`;

const atmoVert = planetVert;
const atmoFrag = /* glsl */ `
  precision highp float;
  varying vec3 vNormal;
  uniform vec3 uColor;
  uniform float uHover;
  void main() {
    float rim = pow(1.0 - max(dot(normalize(vNormal), vec3(0.0,0.0,1.0)), 0.0), 3.0);
    float a = rim * (0.55 + uHover * 0.6);
    gl_FragColor = vec4(uColor, a);
  }
`;

// ─── Planet ─────────────────────────────────────────────────────────
interface PlanetProps {
  service: Service;
  basePos: [number, number, number];
  size: number;
  phase: number;
  pointer: { x: number; y: number };
  onSelect: (s: Service) => void;
  exploding: string | null;
}

const Planet = ({ service, basePos, size, phase, pointer, onSelect, exploding }: PlanetProps) => {
  const groupRef = useRef<THREE.Group>(null!);
  const planetRef = useRef<THREE.Mesh>(null!);
  const matRef = useRef<THREE.ShaderMaterial>(null!);
  const atmoMatRef = useRef<THREE.ShaderMaterial>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);
  const { camera, size: viewport } = useThree();
  const [hover, setHover] = useState(false);
  const hoverLerp = useRef(0);
  const offsetLerp = useRef(new THREE.Vector3());
  const explodeProgress = useRef(0);

  const colorMain = useMemo(() => new THREE.Color(service.color), [service.color]);
  const colorDeep = useMemo(() => {
    const c = new THREE.Color(service.color);
    c.multiplyScalar(0.18);
    return c;
  }, [service.color]);

  // Magnetic radius (responsive — shorter on mobile/touch)
  const [magneticRadius, setMagneticRadius] = useState(
    typeof window !== "undefined" && window.innerWidth < 768 ? 110 : 180,
  );
  useEffect(() => {
    const onResize = () =>
      setMagneticRadius(window.innerWidth < 768 ? 110 : 180);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    // Float motion
    const floatY = Math.sin(t * 0.6 + phase) * 0.18;

    // Project planet position to screen for magnetism
    const planetWorld = new THREE.Vector3(basePos[0], basePos[1] + floatY, basePos[2]);
    const projected = planetWorld.clone().project(camera);
    const screenX = (projected.x * 0.5 + 0.5) * viewport.width;
    const screenY = (-projected.y * 0.5 + 0.5) * viewport.height;

    const dx = pointer.x - screenX;
    const dy = pointer.y - screenY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const radius = magneticRadius;
    const near = dist < radius;

    if (near !== hover) setHover(near);

    // Lerp hover
    const targetHover = near ? 1 : 0;
    hoverLerp.current += (targetHover - hoverLerp.current) * 0.12;

    // Magnetic offset (in world space) — convert screen delta to world units near plane
    const maxOffset = 0.45;
    const pull = near ? Math.max(0, 1 - dist / radius) : 0;
    // Simple mapping: screen direction → world direction
    const worldDx = (dx / viewport.width) * 4.0 * pull;
    const worldDy = -(dy / viewport.height) * 3.0 * pull;
    const targetOffset = new THREE.Vector3(
      THREE.MathUtils.clamp(worldDx, -maxOffset, maxOffset),
      THREE.MathUtils.clamp(worldDy, -maxOffset, maxOffset),
      0,
    );
    offsetLerp.current.lerp(targetOffset, 0.12);

    // Explosion animation
    const isExploding = exploding === service.id;
    if (isExploding) {
      explodeProgress.current = Math.min(1, explodeProgress.current + delta * 3.0);
    } else {
      explodeProgress.current = 0;
    }
    const ex = explodeProgress.current;
    const explodeScale = 1 + ex * 0.6;

    // Apply transforms
    groupRef.current.position.set(
      basePos[0] + offsetLerp.current.x,
      basePos[1] + floatY + offsetLerp.current.y,
      basePos[2] + offsetLerp.current.z,
    );
    const baseScale = 1 + hoverLerp.current * 0.15;
    groupRef.current.scale.setScalar(baseScale * explodeScale);

    if (planetRef.current) {
      planetRef.current.rotation.y += 0.0035 + hoverLerp.current * 0.004;
      planetRef.current.rotation.x = Math.sin(t * 0.2 + phase) * 0.05;
    }

    if (ringRef.current) {
      ringRef.current.rotation.z += 0.0015;
    }

    if (matRef.current) {
      matRef.current.uniforms.uTime.value = t;
      matRef.current.uniforms.uHover.value = hoverLerp.current + ex * 0.6;
    }
    if (atmoMatRef.current) {
      atmoMatRef.current.uniforms.uHover.value = hoverLerp.current + ex * 0.6;
    }

    document.body.style.cursor = near ? "pointer" : "";
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    onSelect(service);
  };

  return (
    <group ref={groupRef} position={basePos}>
      {/* Halo ring (pulsating) — visible on hover */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[size * 1.45, size * 1.5, 64]} />
        <meshBasicMaterial
          color={service.color}
          transparent
          opacity={hover ? 0.35 : 0}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Saturn-style ring */}
      {service.hasRing && (
        <mesh ref={ringRef} rotation={[Math.PI / 2.4, 0, 0]}>
          <ringGeometry args={[size * 1.35, size * 1.85, 96]} />
          <meshBasicMaterial
            color={service.color}
            transparent
            opacity={0.32}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Planet */}
      <mesh ref={planetRef} onClick={handleClick}>
        <sphereGeometry args={[size, 64, 64]} />
        <shaderMaterial
          ref={matRef}
          vertexShader={planetVert}
          fragmentShader={planetFrag}
          uniforms={{
            uTime: { value: 0 },
            uColor: { value: colorMain },
            uColorDeep: { value: colorDeep },
            uLightDir: { value: new THREE.Vector3(1, 0.6, 0.8).normalize() },
            uHover: { value: 0 },
          }}
        />
      </mesh>

      {/* Atmosphere */}
      <mesh scale={1.18}>
        <sphereGeometry args={[size, 48, 48]} />
        <shaderMaterial
          ref={atmoMatRef}
          vertexShader={atmoVert}
          fragmentShader={atmoFrag}
          uniforms={{
            uColor: { value: colorMain },
            uHover: { value: 0 },
          }}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Explosion particles */}
      {exploding === service.id && <ExplosionParticles color={service.color} />}
    </group>
  );
};

const ExplosionParticles = ({ color }: { color: string }) => {
  const ref = useRef<THREE.Points>(null!);
  const startTime = useRef<number | null>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(60 * 3);
    return arr;
  }, []);
  const dirs = useMemo(() => {
    const arr: THREE.Vector3[] = [];
    for (let i = 0; i < 60; i++) {
      const v = new THREE.Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
      );
      v.normalize().multiplyScalar(0.5 + Math.random() * 1.2);
      arr.push(v);
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    if (startTime.current === null) startTime.current = state.clock.getElapsedTime();
    const t = state.clock.getElapsedTime() - startTime.current;
    const ease = 1 - Math.pow(1 - Math.min(t / 0.45, 1), 2);
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < 60; i++) {
      pos.setXYZ(i, dirs[i].x * ease * 2.5, dirs[i].y * ease * 2.5, dirs[i].z * ease * 2.5);
    }
    pos.needsUpdate = true;
    const mat = ref.current.material as THREE.PointsMaterial;
    mat.opacity = Math.max(0, 1 - t / 0.45);
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={60}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.08}
        transparent
        opacity={1}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// ─── Scene ──────────────────────────────────────────────────────────
const Scene = ({
  pointer,
  onSelect,
  exploding,
}: {
  pointer: { x: number; y: number };
  onSelect: (s: Service) => void;
  exploding: string | null;
}) => {
  const { camera, size } = useThree();
  const isMobile = size.width < 768;

  // Two layouts: organic horizontal (desktop) vs compact 2x3 vertical (mobile)
  const layout: { pos: [number, number, number]; size: number }[] = isMobile
    ? [
        { pos: [-1.6, 2.4, 0], size: 0.62 },
        { pos: [1.6, 2.4, 0], size: 0.7 },
        { pos: [-1.6, 0.1, 0], size: 0.55 },
        { pos: [1.6, 0.1, 0], size: 0.68 },
        { pos: [-1.6, -2.2, 0], size: 0.62 },
        { pos: [1.6, -2.2, 0], size: 0.58 },
      ]
    : [
        { pos: [-3.6, 1.4, 0], size: 0.78 },
        { pos: [-1.0, 1.9, 0], size: 0.62 },
        { pos: [2.6, 1.5, 0], size: 0.85 },
        { pos: [-2.6, -1.2, 0], size: 0.68 },
        { pos: [0.6, -1.7, 0], size: 0.92 },
        { pos: [3.4, -1.0, 0], size: 0.7 },
      ];

  // Adjust camera distance per viewport
  useEffect(() => {
    const targetZ = isMobile ? 9 : 7;
    if (Math.abs(camera.position.z - targetZ) > 0.01) {
      camera.position.z = targetZ;
      camera.updateProjectionMatrix();
    }
  }, [isMobile, camera]);

  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[5, 4, 3]} intensity={0.6} />
      {SERVICES.map((s, i) => (
        <Planet
          key={s.id}
          service={s}
          basePos={layout[i].pos}
          size={layout[i].size}
          phase={i * 1.37}
          pointer={pointer}
          onSelect={onSelect}
          exploding={exploding}
        />
      ))}
    </>
  );
};

// ─── Main ───────────────────────────────────────────────────────────
const ServicesPlanetsInteractive = () => {
  const [selected, setSelected] = useState<Service | null>(null);
  const [exploding, setExploding] = useState<string | null>(null);
  const [flash, setFlash] = useState(0);
  const [pointer, setPointer] = useState({ x: -9999, y: -9999 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSelect = (s: Service) => {
    if (exploding) return;
    setExploding(s.id);
    // flash
    let f = 0;
    const interval = setInterval(() => {
      f += 0.1;
      setFlash(Math.sin(f * Math.PI));
      if (f >= 1) {
        clearInterval(interval);
        setFlash(0);
      }
    }, 30);
    setTimeout(() => {
      setSelected(s);
      setExploding(null);
    }, 380);
  };

  const handleClose = () => setSelected(null);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPointer({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    const onLeave = () => setPointer({ x: -9999, y: -9999 });
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative w-full min-h-screen bg-background overflow-hidden"
    >
      {/* Background gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 50%, hsl(var(--primary) / 0.08) 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <div className="relative z-10 px-6 md:px-12 lg:px-20 pt-20 md:pt-32 pointer-events-none">
        <p className="text-[10px] md:text-xs tracking-[0.4em] uppercase text-primary mb-6 font-light">
          Servicios · 06
        </p>
        <h2
          className="font-extralight tracking-[0.06em] uppercase leading-[0.92] text-foreground max-w-4xl"
          style={{ fontSize: "clamp(1.6rem, 7vw, 4.5rem)" }}
        >
          El universo
          <br />
          <span
            style={{
              background:
                "linear-gradient(90deg, hsl(var(--foreground)) 0%, hsl(var(--primary)) 60%, hsl(var(--secondary)) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Limitless
          </span>
        </h2>
      </div>

      {/* Canvas */}
      <div className="absolute inset-0 z-[5]">
        <Canvas
          camera={{ position: [0, 0, 7], fov: 50 }}
          dpr={[1, 1.75]}
          gl={{ antialias: true, alpha: true }}
        >
          <Suspense fallback={null}>
            <Scene pointer={pointer} onSelect={handleSelect} exploding={exploding} />
          </Suspense>
        </Canvas>
      </div>

      {/* Hint */}
      <div className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 z-10 pointer-events-none text-center">
        <p
          className="text-[10px] md:text-xs tracking-[0.4em] uppercase text-foreground/45 font-light"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Tocá un planeta para entrar
        </p>
        <div className="mt-3 mx-auto w-px h-8 bg-gradient-to-b from-foreground/30 to-transparent" />
      </div>

      {/* White flash on click */}
      <div
        className="absolute inset-0 pointer-events-none z-[8] bg-foreground"
        style={{ opacity: flash * 0.35, mixBlendMode: "screen" }}
      />

      <ServiceModal service={selected} onClose={handleClose} />
    </section>
  );
};

export default ServicesPlanetsInteractive;
