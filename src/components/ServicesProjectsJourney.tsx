import { useRef, useMemo, useState, Suspense, lazy } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Line, Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { useMouseParallaxRef } from "@/hooks/useMouseParallax";

const ServicesNebula = lazy(() => import("@/components/ServicesNebula"));

// Project imagery (renderizadas como cards en 3D durante el Acto II)
import imgNebulaOS from "@/assets/projects/nebula-os.jpg";
import imgAuroraCommerce from "@/assets/projects/aurora-commerce.jpg";
import imgPulsarStudio from "@/assets/projects/pulsar-studio.jpg";
import imgQuantumBank from "@/assets/projects/quantum-bank.jpg";
import imgHeliosHealth from "@/assets/projects/helios-health.jpg";
import imgCosmosTravel from "@/assets/projects/cosmos-travel.jpg";

// ============================================================
// DATA
// ============================================================

type Body = {
  id: string;
  number: string;
  title: string;
  desc: string;
  position: [number, number, number];
  scale: number;
  color: string;
  impact?: boolean;
  act: "I" | "II";
  image?: string;
};

// ACTO I — Servicios. La cámara AVANZA (z pasa de 0 a -55).
// Los cuerpos están en z negativos, ordenados por profundidad.
const SERVICES: Body[] = [
  { id: "web-design", number: "01", title: "DISEÑO WEB",      desc: "Sitios que respiran. Que duelen. Que ganan.",      position: [-4,  2,  -8], scale: 1.2, color: "#7B2FFF", act: "I" },
  { id: "web-dev",    number: "02", title: "DESARROLLO WEB",  desc: "Código performante. Arquitectura clara.",           position: [ 5, -1, -18], scale: 0.8, color: "#9A5BFF", act: "I" },
  { id: "mobile",     number: "03", title: "APPS MOBILE",     desc: "Productos nativos. iOS y Android sin compromisos.", position: [-3, -3, -28], scale: 1.6, color: "#5A1FD8", act: "I" },
  { id: "saas",       number: "04", title: "SOFTWARE · SAAS", desc: "Plataformas que escalan con tu ambición.",          position: [ 3,  1.5, -36], scale: 1.0, color: "#7B2FFF", act: "I" },
  { id: "branding",   number: "05", title: "BRANDING",        desc: "Identidades que rompen la inercia visual.",         position: [-5,  1, -44], scale: 1.2, color: "#7B2FFF", act: "I" },
  { id: "ads",        number: "06", title: "PUBLICIDAD",      desc: "Campañas con dirección de arte propia.",            position: [ 3, -2, -50], scale: 0.9, color: "#9A5BFF", act: "I" },
];

// PIVOTE — cuerpo magenta único. Está MÁS ALLÁ del último servicio.
// La cámara llega, lo rodea y vuelve.
const PIVOT: Body = {
  id: "pivot",
  number: "",
  title: "",
  desc: "",
  position: [0, 0, -58],
  scale: 2.2,
  color: "#C8007A",
  impact: true,
  act: "I",
};

// ACTO II — Proyectos. La cámara VUELVE (z pasa de -55 a -5).
// Los proyectos están en posiciones X/Y DISTINTAS a los servicios
// para no solaparse. Orden del primero encontrado al volver → al final.
const PROJECTS: Body[] = [
  { id: "p1", number: "01", title: "NEBULA OS",       desc: "Plataforma SaaS · 2025",  position: [ 4,  3, -48], scale: 1.1, color: "#7B2FFF", act: "II", image: imgNebulaOS },
  { id: "p2", number: "02", title: "AURORA COMMERCE", desc: "E-commerce · 2024",       position: [-5,  1, -40], scale: 1.3, color: "#9A5BFF", act: "II", image: imgAuroraCommerce },
  { id: "p3", number: "03", title: "PULSAR STUDIO",   desc: "Branding & Web · 2024",   position: [ 3, -3, -32], scale: 0.9, color: "#7B2FFF", act: "II", image: imgPulsarStudio },
  { id: "p4", number: "04", title: "QUANTUM BANK",    desc: "Fintech · 2025",          position: [-6,  2, -24], scale: 1.0, color: "#5A1FD8", act: "II", image: imgQuantumBank },
  { id: "p5", number: "05", title: "HELIOS HEALTH",   desc: "Producto digital · 2023", position: [ 2,  3, -15], scale: 1.2, color: "#9A5BFF", act: "II", image: imgHeliosHealth },
  { id: "p6", number: "06", title: "COSMOS TRAVEL",   desc: "Marketplace · 2025",      position: [-3, -2,  -6], scale: 1.0, color: "#7B2FFF", act: "II", image: imgCosmosTravel },
];

// ACTO I bodies = servicios (planetas con shader).
// El pivote magenta se renderiza como overlay 2D DOM (ver PivotPoint2D) para
// seguir visible cuando el Canvas 3D hace fade-out antes del giro.
// Los proyectos del ACTO II se renderizan como cards 2D en ProjectsOverlay.
const ACT_I_BODIES: Body[] = [...SERVICES];

// Fases del viaje
const ACT_I_END = 0.42;
const INFLEXION_END = 0.58;
// ACT_II_END = 1.00

// ============================================================
// SHADERS — heredados de ServicesCosmos (fbm 3 octavas)
// ============================================================

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

    vec3 col = mix(uDark, uColor, n * 0.8 + n2 * 0.4);
    col += uColor * pow(n2, 2.0) * 0.6;

    vec3 viewDir = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.0);
    col += uColor * fresnel * 0.9;

    float radial = 1.0 - length(vPosition) * 0.05;
    col *= clamp(radial, 0.6, 1.2);

    gl_FragColor = vec4(col, 1.0);
  }
`;

// ============================================================
// PLANET
// ============================================================

function Planet({
  body,
  cameraPos,
}: {
  body: Body;
  cameraPos: THREE.Vector3;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(body.color) },
      uDark: { value: new THREE.Color(body.color).multiplyScalar(0.15) },
    }),
    [body.color],
  );

  const spinSpeed = useMemo(() => 0.08 + Math.random() * 0.12, []);
  const pulsePhase = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state, delta) => {
    if (matRef.current) matRef.current.uniforms.uTime.value += delta;
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * spinSpeed;
      meshRef.current.rotation.x += delta * spinSpeed * 0.3;
    }
    // Scale boost based on true 3D distance
    const dx = cameraPos.x - body.position[0];
    const dy = cameraPos.y - body.position[1];
    const dz = cameraPos.z - body.position[2];
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const active = 1 - Math.min(dist / 12, 1);
    const targetScale = body.scale * (1 + active * 0.15);
    if (meshRef.current) {
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1,
      );
    }
    if (glowRef.current) {
      const t = state.clock.elapsedTime;
      const pulse = 1 + Math.sin(t * (Math.PI / 3) + pulsePhase) * 0.05;
      const g = targetScale * (body.impact ? 1.4 : 1.22) * pulse;
      glowRef.current.scale.set(g, g, g);
    }
  });

  return (
    <group position={body.position}>
      <mesh ref={glowRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color={body.color}
          transparent
          opacity={body.impact ? 0.18 : 0.12}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
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

// ============================================================
// AMBIENT DUST
// ============================================================

function AmbientDust() {
  const positions = useMemo(() => {
    const arr = new Float32Array(1200 * 3);
    for (let i = 0; i < 1200; i++) {
      arr[i * 3 + 0] = (Math.random() - 0.5) * 40;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 25;
      arr[i * 3 + 2] = -Math.random() * 75 + 5;
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

// ============================================================
// ROUTE LINE — ida + vuelta
// ============================================================

function RouteLine({ progress }: { progress: number }) {
  const { points, total } = useMemo(() => {
    const ctrl: THREE.Vector3[] = [];
    // Ida: servicios en orden
    ctrl.push(new THREE.Vector3(0, 0, 0));
    for (const s of SERVICES) ctrl.push(new THREE.Vector3(...s.position));
    // Pivote
    ctrl.push(new THREE.Vector3(...PIVOT.position));
    const curve = new THREE.CatmullRomCurve3(ctrl, false, "catmullrom", 0.4);
    const pts = curve.getPoints(300);
    return { points: pts, total: pts.length };
  }, []);

  const visiblePoints = useMemo(() => {
    // La línea se completa al llegar al pivote (INFLEXION_END).
    const lineProgress = Math.min(1, progress / INFLEXION_END);
    const count = Math.max(2, Math.floor(total * Math.min(1, lineProgress * 1.02 + 0.03)));
    return points.slice(0, count);
  }, [progress, points, total]);

  return (
    <Line
      points={visiblePoints}
      color="#7B2FFF"
      lineWidth={1}
      transparent
      opacity={0.16}
    />
  );
}

// ============================================================
// LABEL (solo para planetas del Acto I + pivote)
// ============================================================

function BodyLabel({
  body,
  cameraPos,
  cameraYaw,
}: {
  body: Body;
  cameraPos: THREE.Vector3;
  cameraYaw: number;
}) {
  // Pivote sin texto: no se renderiza label alguno.
  if (!body.title) return null;

  // Direction from camera to body
  const dx = body.position[0] - cameraPos.x;
  const dz = body.position[2] - cameraPos.z;
  // Facing vector of camera (yaw 0 = -Z, yaw π = +Z)
  const fx = -Math.sin(cameraYaw);
  const fz = -Math.cos(cameraYaw);
  // Depth along camera facing direction
  const depthInFront = dx * fx + dz * fz;

  let opacity = 0;
  if (depthInFront > -2 && depthInFront < 18) {
    if (depthInFront < 4) {
      opacity = Math.max(0, (depthInFront + 2) / 6);
    } else {
      opacity = Math.max(0, 1 - (depthInFront - 4) / 14);
    }
  }

  return (
    <Html
      position={body.position}
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
          transform: `translateY(${body.position[1] > 0 ? "100px" : "-140px"})`,
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
          {body.act === "II" ? "◆" : "★"} {body.number}
        </div>
        <div
          style={{
            fontFamily: "'Arkitech', 'Inter', sans-serif",
            fontSize: body.impact ? "40px" : "32px",
            letterSpacing: "0.12em",
            fontWeight: 300,
            lineHeight: 1,
            marginBottom: "14px",
            textShadow: "0 0 30px rgba(0,0,0,0.8)",
            borderBottom: body.impact ? "2px solid #C8007A" : "none",
            display: "inline-block",
            paddingBottom: body.impact ? "6px" : "0",
            color: body.impact ? "#C8007A" : "#EDECE8",
          }}
        >
          {body.title}
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
          {body.desc}
        </div>
      </div>
    </Html>
  );
}

// ============================================================
// PROJECTS OVERLAY 2D — Acto II (estilo V4 ProjectsWarp)
// Las cards se deslizan en Z sobre una capa DOM absoluta,
// reutilizando las imágenes ya existentes en src/assets/projects/.
// ============================================================

// Sub-progress local al Acto II: 0..N (N = cantidad de proyectos).
// -1 antes de entrar, +1 después de salir.
function ProjectsOverlay({ progress }: { progress: number }) {
  // Activar ventana: desde un poco antes de INFLEXION_END para preparar entrada.
  // Mapeamos progress [INFLEXION_END .. 1] a local [-0.6 .. PROJECTS.length + 0.2]
  const pl = (progress - INFLEXION_END) / (1 - INFLEXION_END);
  const clamped = Math.max(-0.1, Math.min(1.1, pl));
  const local = -0.6 + clamped * (PROJECTS.length + 0.8);

  // Fade de entrada del overlay entero: aparece justo al terminar la inflexión.
  const overlayFade =
    progress < INFLEXION_END - 0.01
      ? 0
      : progress < INFLEXION_END + 0.04
      ? (progress - (INFLEXION_END - 0.01)) / 0.05
      : 1;

  if (overlayFade <= 0.001) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        opacity: overlayFade,
        transition: "opacity 180ms linear",
        perspective: "1200px",
        perspectiveOrigin: "50% 50%",
      }}
    >
      <div
        className="relative w-full h-full"
        style={{ transformStyle: "preserve-3d" }}
      >
        {PROJECTS.map((project, i) => {
          const l = local - i;
          // Z: de -2200 (muy lejos) a +200 (pasado de largo)
          const z = -2200 + l * 2400;
          const opacity =
            l < -1.2
              ? 0
              : l < 0
              ? Math.max(0, 1 + l * 0.85)
              : l < 0.55
              ? 1
              : Math.max(0, 1 - (l - 0.55) * 3.5);

          const xOffset = i % 2 === 0 ? -120 : 120;
          const yOffset = i % 3 === 0 ? -80 : i % 3 === 1 ? 60 : -30;
          const visible = opacity > 0.01;

          return (
            <div
              key={project.id}
              className="absolute top-1/2 left-1/2"
              style={{
                width: "min(560px, 70vw)",
                height: "min(360px, 45vh)",
                marginLeft: "calc(min(560px, 70vw) / -2)",
                marginTop: "calc(min(360px, 45vh) / -2)",
                transform: `translate3d(${xOffset}px, ${yOffset}px, ${z}px)`,
                opacity,
                visibility: visible ? "visible" : "hidden",
                transformStyle: "preserve-3d",
                willChange: "transform, opacity",
              }}
            >
              <div
                className="relative w-full h-full rounded-lg overflow-hidden border border-foreground/10"
                style={{
                  background: "rgba(8, 6, 14, 0.85)",
                  boxShadow: `0 0 60px hsl(var(--primary) / ${0.15 + Math.max(0, 1 - Math.abs(l)) * 0.25}), inset 0 0 0 1px hsla(0,0%,100%,0.04)`,
                }}
              >
                <img
                  src={project.image}
                  alt={project.title}
                  loading="lazy"
                  draggable={false}
                  className="absolute inset-0 w-full h-full object-cover opacity-70"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/30 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-[10px] tracking-[0.3em] text-primary/80 font-light">
                      {project.number}
                    </span>
                    <span className="text-[10px] tracking-[0.3em] uppercase text-foreground/50 font-light">
                      {project.desc}
                    </span>
                  </div>
                  <h3 className="text-2xl md:text-4xl font-light tracking-tight text-foreground">
                    {project.title}
                  </h3>
                </div>
                <div className="absolute top-3 left-3 w-4 h-4 border-l border-t border-primary/40" />
                <div className="absolute top-3 right-3 w-4 h-4 border-r border-t border-primary/40" />
                <div className="absolute bottom-3 left-3 w-4 h-4 border-l border-b border-primary/40" />
                <div className="absolute bottom-3 right-3 w-4 h-4 border-r border-b border-primary/40" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// SCENE — cámara en 3 fases
// ============================================================

// Cubic bezier easing (0.7, 0, 0.3, 1)
function easeInflexion(t: number): number {
  // Smoothstep-ish with stronger ends
  return t * t * (3 - 2 * t);
}

type SceneState = {
  act: "I" | "transition" | "II";
  activeBody: Body;
  flash: number;
};

function Scene({
  progress,
  onStateChange,
}: {
  progress: number;
  onStateChange: (s: SceneState) => void;
}) {
  const { camera } = useThree();
  const mouse = useMouseParallaxRef();
  const lastActRef = useRef<SceneState["act"]>("I");
  const lastActiveIdRef = useRef<string>("");
  const cameraPosVec = useRef(new THREE.Vector3());
  const cameraYawRef = useRef(0);
  const [, force] = useState(0);

  useFrame(() => {
    const p = progress;

    let targetX = 0;
    let targetY = 0;
    let targetZ = 0;
    let targetYaw = 0;
    let act: SceneState["act"] = "I";
    let flash = 0;

    if (p < ACT_I_END) {
      // ---- ACT I — avanzar con serpenteo ----
      act = "I";
      const pl = p / ACT_I_END; // 0..1
      targetX = Math.sin(pl * Math.PI * 3) * 1.5;
      targetY = Math.cos(pl * Math.PI * 2) * 0.8;
      targetZ = -pl * 55;
      targetYaw = 0;
    } else if (p < INFLEXION_END) {
      // ---- INFLEXION — llegar al pivote y girar 180° ----
      act = "transition";
      const pl = (p - ACT_I_END) / (INFLEXION_END - ACT_I_END); // 0..1
      const eased = easeInflexion(pl);
      // Z: llega a -58 (pivote) y rebota levemente a -55
      // Curva: acelera hacia el pivote, frena, retrocede suave
      const zCurve = -55 + Math.sin(pl * Math.PI) * -3; // -55 → -58 → -55
      targetZ = zCurve;
      // X/Y: frena el serpenteo
      targetX = Math.sin(Math.PI * 3) * 1.5 * (1 - eased);
      targetY = Math.cos(Math.PI * 2) * 0.8 * (1 - eased);
      // Yaw: 0 → π
      targetYaw = eased * Math.PI;
      // Flash en el pico
      const flashD = Math.abs(pl - 0.5);
      flash = flashD < 0.1 ? Math.pow(1 - flashD / 0.1, 1.6) * 0.4 : 0;
    } else {
      // ---- ACT II — volver mirando atrás ----
      act = "II";
      const pl = (p - INFLEXION_END) / (1 - INFLEXION_END); // 0..1
      targetX = Math.sin(pl * Math.PI * 2.5 + Math.PI) * 1.5;
      targetY = Math.cos(pl * Math.PI * 2 + Math.PI) * 0.8;
      // Z: -55 → -3
      targetZ = -55 + pl * 52;
      targetYaw = Math.PI;
    }

    // Smooth camera
    camera.position.x += (targetX - camera.position.x) * 0.1;
    camera.position.y += (targetY - camera.position.y) * 0.1;
    camera.position.z += (targetZ - camera.position.z) * 0.1;

    // Mouse parallax on rotation — small deltas added to base yaw
    const baseYaw = targetYaw;
    cameraYawRef.current += (baseYaw - cameraYawRef.current) * 0.08;
    const rotY = cameraYawRef.current + mouse.current.x * 0.05;
    const rotX = -mouse.current.y * 0.05;
    camera.rotation.order = "YXZ";
    camera.rotation.y += (rotY - camera.rotation.y) * 0.12;
    camera.rotation.x += (rotX - camera.rotation.x) * 0.1;

    cameraPosVec.current.copy(camera.position);

    // Find active body (closest in front of camera along facing direction)
    const fx = -Math.sin(cameraYawRef.current);
    const fz = -Math.cos(cameraYawRef.current);
    const pool = act === "II" ? PROJECTS : SERVICES;
    let bestBody = pool[0];
    let bestDist = Infinity;
    for (const b of pool) {
      const ddx = b.position[0] - camera.position.x;
      const ddz = b.position[2] - camera.position.z;
      const depth = ddx * fx + ddz * fz;
      if (depth < -3) continue; // behind
      const lateral = Math.hypot(ddx - depth * fx, ddz - depth * fz);
      const score = Math.abs(depth) + lateral * 0.5;
      if (score < bestDist) {
        bestDist = score;
        bestBody = b;
      }
    }

    if (act !== lastActRef.current || bestBody.id !== lastActiveIdRef.current) {
      lastActRef.current = act;
      lastActiveIdRef.current = bestBody.id;
      onStateChange({ act, activeBody: bestBody, flash });
    } else {
      // Only flash changes frequently
      onStateChange({ act, activeBody: bestBody, flash });
    }

    // Force re-render of labels with new cameraPos (labels read from props)
    force((n) => (n + 1) % 1000000);
  });

  return (
    <>
      <fog attach="fog" args={["#030208", 18, 55]} />
      <ambientLight intensity={0.3} />
      <AmbientDust />
      <RouteLine progress={progress} />
      {/* Planetas: solo Acto I (servicios + pivote magenta) */}
      {ACT_I_BODIES.map((b) => (
        <Planet key={b.id} body={b} cameraPos={cameraPosVec.current} />
      ))}
      {ACT_I_BODIES.map((b) => (
        <BodyLabel
          key={`l-${b.id}`}
          body={b}
          cameraPos={cameraPosVec.current}
          cameraYaw={cameraYawRef.current}
        />
      ))}
    </>
  );
}

// ============================================================
// MAIN
// ============================================================

function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

const ServicesProjectsJourney = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const progress = useScrollProgress(sectionRef);
  const [state, setState] = useState<SceneState>({
    act: "I",
    activeBody: SERVICES[0],
    flash: 0,
  });
  const [webgl] = useState(() => isWebGLAvailable());

  if (!webgl) {
    return (
      <Suspense fallback={<div className="h-screen" />}>
        <ServicesNebula />
      </Suspense>
    );
  }

  const isAct2 = state.act === "II";
  const isTransition = state.act === "transition";

  // Índice del proyecto "activo" según el progreso del overlay 2D
  const act2Pl = Math.max(
    -0.1,
    Math.min(1.1, (progress - INFLEXION_END) / (1 - INFLEXION_END)),
  );
  const act2Local = -0.6 + act2Pl * (PROJECTS.length + 0.8);
  const act2Index = Math.max(
    0,
    Math.min(PROJECTS.length - 1, Math.round(act2Local)),
  );
  const act2Project = PROJECTS[act2Index];

  // Fade del Canvas 3D durante Acto II (se oculta para dar espacio a las cards)
  // El Canvas (planetas del Acto I) desaparece ANTES del giro 180°, para que
  // la rotación ocurra sobre un espacio vacío. El pivote magenta y el flash
  // se manejan como overlays 2D DOM para seguir siendo visibles durante el fade.
  const canvasOpacity =
    progress < 0.40 ? 1 : progress < 0.46 ? 1 - (progress - 0.40) / 0.06 : 0;

  // Overlay labels
  const eyebrowText = isAct2
    ? "Pruebas · Atravesando el espacio"
    : isTransition
    ? "Horizonte · Atravesando"
    : "Capacidades · Cosmos 3D";

  const poolSize = isAct2 ? PROJECTS.length : SERVICES.length;
  const activeNumber = isAct2
    ? act2Project.number
    : state.activeBody.impact
    ? "★"
    : state.activeBody.number;
  const activeTitle = isAct2 ? act2Project.title : state.activeBody.title;

  // Fade overlay text during inflexion
  const overlayOpacity = isTransition
    ? Math.abs(((progress - ACT_I_END) / (INFLEXION_END - ACT_I_END)) - 0.5) * 2
    : 1;

  return (
    <section
      ref={sectionRef}
      className="relative"
      style={{ height: "900vh", contain: "layout paint" }}
    >
      <div
        className="sticky top-0 w-full h-screen overflow-hidden"
        style={{ transform: "translateZ(0)" }}
      >
        <div
          className="absolute inset-0"
          style={{
            opacity: canvasOpacity,
            transition: "opacity 200ms linear",
            visibility: canvasOpacity <= 0.001 ? "hidden" : "visible",
          }}
        >
          <Canvas
            dpr={[1, 1.5]}
            gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
            camera={{ fov: 55, near: 0.1, far: 200, position: [0, 0, 0] }}
            style={{ background: "transparent" }}
          >
            <Scene progress={progress} onStateChange={setState} />
          </Canvas>
        </div>

        {/* Overlay 2D de proyectos (estilo V4) — aparece en Acto II */}
        <ProjectsOverlay progress={progress} />

        {/* Flash blanco en la inflexión */}
        <div
          className="pointer-events-none absolute inset-0 z-20"
          style={{
            background: "white",
            opacity: state.flash,
            mixBlendMode: "screen",
          }}
        />

        {/* Overlay 2D */}
        <div className="pointer-events-none absolute inset-0 z-10">
          <div
            className="absolute top-8 left-8"
            style={{ opacity: overlayOpacity, transition: "opacity 200ms linear" }}
          >
            <span
              className="text-[10px] tracking-[0.4em] uppercase font-light"
              style={{ color: isAct2 ? "#C8007A" : "rgba(237,236,232,0.5)" }}
            >
              {eyebrowText}
            </span>
          </div>

          <div
            className="absolute bottom-8 left-8 flex items-baseline gap-3"
            style={{ opacity: overlayOpacity, transition: "opacity 200ms linear" }}
          >
            <span className="text-[10px] tracking-[0.3em] uppercase text-foreground/70 font-light">
              {activeNumber} / {String(poolSize).padStart(2, "0")}
            </span>
            <span className="text-[10px] tracking-[0.3em] uppercase text-foreground/40 font-light">
              {activeTitle}
            </span>
          </div>

          {/* Barra de progreso global con marca de inflexión */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-foreground/5">
            <div
              className="h-full bg-primary/60"
              style={{
                width: `${Math.min(100, progress * 100)}%`,
                transition: "width 120ms linear",
              }}
            />
            {/* Marca del pivote magenta */}
            <div
              className="absolute top-0 h-px w-px"
              style={{
                left: `${ACT_I_END * 100 + (INFLEXION_END - ACT_I_END) * 50}%`,
                boxShadow: "0 0 8px 1px #C8007A",
                background: "#C8007A",
                height: "3px",
                top: "-1px",
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesProjectsJourney;
