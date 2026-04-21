import { useRef, useMemo, useState, Suspense, lazy } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Line, Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { useMouseParallaxRef } from "@/hooks/useMouseParallax";

const ServicesNebula = lazy(() => import("@/components/ServicesNebula"));

type Service = {
  id: string;
  number: string;
  title: string;
  desc: string;
  position: [number, number, number];
  scale: number;
  color: string;
  impact?: boolean;
};

const SERVICES: Service[] = [
  {
    id: "web-design",
    number: "01",
    title: "DISEÑO WEB",
    desc: "Sitios que respiran. Que duelen. Que ganan.",
    position: [-4, 2, -10],
    scale: 1.2,
    color: "#7B2FFF",
  },
  {
    id: "web-dev",
    number: "02",
    title: "DESARROLLO WEB",
    desc: "Código performante. Arquitectura clara.",
    position: [5, -1, -20],
    scale: 0.8,
    color: "#9A5BFF",
  },
  {
    id: "mobile",
    number: "03",
    title: "APPS MOBILE",
    desc: "Productos nativos. iOS y Android sin compromisos.",
    position: [-3, -3, -30],
    scale: 1.6,
    color: "#5A1FD8",
  },
  {
    id: "saas",
    number: "04",
    title: "SOFTWARE · SAAS",
    desc: "Plataformas que escalan con tu ambición.",
    position: [6, 3, -38],
    scale: 1.0,
    color: "#7B2FFF",
  },
  {
    id: "branding",
    number: "05",
    title: "BRANDING",
    desc: "Identidades que rompen la inercia visual.",
    position: [-2, 1, -48],
    scale: 1.4,
    color: "#C8007A",
    impact: true,
  },
  {
    id: "ads",
    number: "06",
    title: "PUBLICIDAD",
    desc: "Campañas con dirección de arte propia.",
    position: [3, -2, -58],
    scale: 0.9,
    color: "#7B2FFF",
  },
];

const TOTAL_DEPTH = 60;

// Planet shader: fbm noise gas texture
const planetVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const planetFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform vec3 uDark;
  varying vec3 vNormal;
  varying vec3 vPosition;

  // Simple hash & 3D noise
  float hash(vec3 p) {
    p = fract(p * vec3(443.897, 441.423, 437.195));
    p += dot(p, p.yzx + 19.19);
    return fract((p.x + p.y) * p.z);
  }
  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f*f*(3.0-2.0*f);
    return mix(
      mix(mix(hash(i+vec3(0,0,0)), hash(i+vec3(1,0,0)), f.x),
          mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x),
          mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y),
      f.z);
  }
  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
      v += a * noise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 p = vPosition * 1.5 + vec3(uTime * 0.05, uTime * 0.03, 0.0);
    float n = fbm(p);
    float n2 = fbm(p * 2.0 + n);

    // Gas / nebula mix
    vec3 col = mix(uDark, uColor, n * 0.8 + n2 * 0.4);
    col += uColor * pow(n2, 2.0) * 0.6;

    // Fresnel rim
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.0);
    col += uColor * fresnel * 0.9;

    // Radial shade darken
    float radial = 1.0 - length(vPosition) * 0.05;
    col *= clamp(radial, 0.6, 1.2);

    gl_FragColor = vec4(col, 1.0);
  }
`;

function Planet({ service, cameraZ }: { service: Service; cameraZ: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(service.color) },
      uDark: { value: new THREE.Color(service.color).multiplyScalar(0.15) },
    }),
    [service.color],
  );

  const spinSpeed = useMemo(() => 0.08 + Math.random() * 0.12, []);
  const pulsePhase = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state, delta) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value += delta;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * spinSpeed;
      meshRef.current.rotation.x += delta * spinSpeed * 0.3;
    }
    // Active scale boost
    const dist = Math.abs(cameraZ - service.position[2]);
    const active = 1 - Math.min(dist / 12, 1);
    const targetScale = service.scale * (1 + active * 0.15);
    if (meshRef.current) {
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1,
      );
    }
    // Glow pulse
    if (glowRef.current) {
      const t = state.clock.elapsedTime;
      const pulse = 1 + Math.sin(t * (Math.PI / 3) + pulsePhase) * 0.05;
      const g = targetScale * 1.22 * pulse;
      glowRef.current.scale.set(g, g, g);
    }
  });

  return (
    <group position={service.position}>
      {/* Outer additive glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color={service.color}
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* Core */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <shaderMaterial
          ref={matRef}
          vertexShader={planetVertexShader}
          fragmentShader={planetFragmentShader}
          uniforms={uniforms}
        />
      </mesh>
    </group>
  );
}

function AmbientDust() {
  const positions = useMemo(() => {
    const arr = new Float32Array(800 * 3);
    for (let i = 0; i < 800; i++) {
      arr[i * 3 + 0] = (Math.random() - 0.5) * 30;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 2] = -Math.random() * 70 + 5;
    }
    return arr;
  }, []);

  const ref = useRef<THREE.Points>(null);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.z += delta * 0.005;
  });

  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color="#EDECE8"
        size={0.04}
        sizeAttenuation
        depthWrite={false}
        opacity={0.55}
      />
    </Points>
  );
}

function RouteLine({ progress }: { progress: number }) {
  const { points, total } = useMemo(() => {
    const ctrl: THREE.Vector3[] = [];
    ctrl.push(new THREE.Vector3(0, 0, 0));
    for (const s of SERVICES) {
      ctrl.push(new THREE.Vector3(...s.position));
    }
    ctrl.push(new THREE.Vector3(0, 0, -70));
    const curve = new THREE.CatmullRomCurve3(ctrl, false, "catmullrom", 0.4);
    const pts = curve.getPoints(200);
    return { points: pts, total: pts.length };
  }, []);

  const visiblePoints = useMemo(() => {
    const count = Math.max(2, Math.floor(total * Math.min(1, progress * 1.05 + 0.05)));
    return points.slice(0, count);
  }, [progress, points, total]);

  return (
    <Line
      points={visiblePoints}
      color="#7B2FFF"
      lineWidth={1}
      transparent
      opacity={0.18}
    />
  );
}

function ServiceLabel({
  service,
  cameraZ,
}: {
  service: Service;
  cameraZ: number;
}) {
  // Distance from camera along z-axis: positive = in front of camera
  const depthInFront = cameraZ - service.position[2];
  let opacity = 0;
  if (depthInFront > -2 && depthInFront < 18) {
    // Fade in as camera approaches, fade out as it passes
    if (depthInFront < 4) {
      opacity = Math.max(0, (depthInFront + 2) / 6);
    } else {
      opacity = Math.max(0, 1 - (depthInFront - 4) / 14);
    }
  }

  return (
    <Html
      position={service.position}
      center
      distanceFactor={8}
      style={{
        pointerEvents: "none",
        opacity,
        transition: "opacity 300ms linear",
      }}
    >
      <div
        style={{
          width: "260px",
          textAlign: "center",
          color: "#EDECE8",
          transform: `translateY(${service.position[1] > 0 ? "100px" : "-140px"})`,
        }}
      >
        <div
          style={{
            fontSize: "10px",
            letterSpacing: "0.4em",
            opacity: 0.5,
            fontWeight: 300,
            marginBottom: "12px",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          ★ {service.number}
        </div>
        <div
          style={{
            fontFamily: "'Arkitech', 'Inter', sans-serif",
            fontSize: "32px",
            letterSpacing: "0.12em",
            fontWeight: 300,
            lineHeight: 1,
            marginBottom: "14px",
            textShadow: "0 0 30px rgba(0,0,0,0.8)",
            borderBottom: service.impact
              ? "2px solid #C8007A"
              : "none",
            display: "inline-block",
            paddingBottom: service.impact ? "6px" : "0",
          }}
        >
          {service.title}
        </div>
        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 300,
            fontSize: "13px",
            opacity: 0.75,
            maxWidth: "240px",
            margin: "0 auto",
            lineHeight: 1.5,
          }}
        >
          {service.desc}
        </div>
      </div>
    </Html>
  );
}

function Scene({
  progress,
  onActiveChange,
}: {
  progress: number;
  onActiveChange: (idx: number) => void;
}) {
  const { camera } = useThree();
  const mouse = useMouseParallaxRef();
  const activeIdxRef = useRef(0);

  useFrame(() => {
    const p = progress;
    const targetZ = -p * TOTAL_DEPTH;
    const targetX = Math.sin(p * Math.PI * 3) * 1.5;
    const targetY = Math.cos(p * Math.PI * 2) * 0.8;

    camera.position.x += (targetX - camera.position.x) * 0.1;
    camera.position.y += (targetY - camera.position.y) * 0.1;
    camera.position.z += (targetZ - camera.position.z) * 0.12;

    // Mouse parallax rotation
    const rotY = mouse.current.x * 0.05;
    const rotX = -mouse.current.y * 0.05;
    camera.rotation.x += (rotX - camera.rotation.x) * 0.06;
    camera.rotation.y += (rotY - camera.rotation.y) * 0.06;

    // Find nearest service in front of camera
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < SERVICES.length; i++) {
      const d = Math.abs(camera.position.z - SERVICES[i].position[2]);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    if (bestIdx !== activeIdxRef.current) {
      activeIdxRef.current = bestIdx;
      onActiveChange(bestIdx);
    }
  });

  return (
    <>
      <fog attach="fog" args={["#030208", 15, 50]} />
      <ambientLight intensity={0.3} />
      <AmbientDust />
      <RouteLine progress={progress} />
      {SERVICES.map((s) => (
        <Planet key={s.id} service={s} cameraZ={camera.position.z} />
      ))}
      {SERVICES.map((s) => (
        <ServiceLabel key={`l-${s.id}`} service={s} cameraZ={camera.position.z} />
      ))}
    </>
  );
}

function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

const ServicesCosmos = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const progress = useScrollProgress(sectionRef);
  const [activeIdx, setActiveIdx] = useState(0);
  const [webgl] = useState(() => isWebGLAvailable());

  if (!webgl) {
    return (
      <Suspense fallback={<div className="h-screen" />}>
        <ServicesNebula />
      </Suspense>
    );
  }

  const active = SERVICES[activeIdx];

  return (
    <section
      ref={sectionRef}
      className="relative"
      style={{ height: "500vh", contain: "layout paint" }}
    >
      <div
        className="sticky top-0 w-full h-screen overflow-hidden"
        style={{ transform: "translateZ(0)" }}
      >
        <Canvas
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          camera={{ fov: 55, near: 0.1, far: 200, position: [0, 0, 0] }}
          style={{ background: "transparent" }}
        >
          <Scene progress={progress} onActiveChange={setActiveIdx} />
        </Canvas>

        {/* Overlay 2D */}
        <div className="pointer-events-none absolute inset-0 z-10">
          {/* Eyebrow */}
          <div className="absolute top-8 left-8">
            <span className="text-[10px] tracking-[0.4em] uppercase text-foreground/50 font-light">
              Capacidades · Cosmos 3D
            </span>
          </div>

          {/* Counter */}
          <div className="absolute bottom-8 left-8 flex items-baseline gap-3">
            <span className="text-[10px] tracking-[0.3em] uppercase text-foreground/70 font-light">
              {active.number} / 06
            </span>
            <span className="text-[10px] tracking-[0.3em] uppercase text-foreground/40 font-light">
              {active.title}
            </span>
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-foreground/5">
            <div
              className="h-full bg-primary/60"
              style={{
                width: `${Math.min(100, progress * 100)}%`,
                transition: "width 120ms linear",
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesCosmos;
