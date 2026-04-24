import { useRef, useMemo, useState, useEffect, Suspense, lazy } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Line, Points, PointMaterial, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { useMouseParallaxRef } from "@/hooks/useMouseParallax";
import { isLowTier } from "@/hooks/useDeviceTier";
import { SERVICES as SERVICE_DATA, type Service as ServiceMeta } from "@/data/services";
import ServiceModal from "@/components/ServiceModal";

const ServicesNebula = lazy(() => import("@/components/ServicesNebula"));

// Project imagery (usa `public/images/` + placeholder cuando falte)
const PROJECT_IMG = {
  "01": "/images/1-AcerosCas.png",
  "02": "/placeholder.svg", // Beltrán: sin imagen por ahora
  "03": "/images/3-Dolton.png",
  "04": "/images/4-Assitech.png",
  "05": "/images/5-TAOL.png",
  "06": "/placeholder.svg", // Mati Emprendimientos: sin imagen por ahora
  "07": "/images/7-OCC.png",
  "08": "/images/8-ALaTremenda.png",
  "09": "/images/9-Morph.png",
} as const;

// ============================================================
// DATA
// ============================================================

type PlanetKind = "mercury" | "venus" | "earth" | "mars" | "jupiter" | "saturn";

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
  planet?: PlanetKind; // V7: textura real asignada
};

// Mapeo servicio → planeta real
// 01 Diseño Web → Tierra
// 02 Desarrollo Web → Mercurio
// 03 Apps Mobile → Marte
// 04 SaaS → Júpiter
// 05 Branding (impacto magenta) → Saturno (con anillos)
// 06 Publicidad → Venus
const SERVICES: Body[] = [
  { id: "web-design", number: "01", title: "DISEÑO WEB",      desc: "Sitios que respiran. Que duelen. Que ganan.",      position: [-4,  2,  -8], scale: 1.2, color: "#7B2FFF", act: "I", planet: "earth"   },
  { id: "web-dev",    number: "02", title: "DESARROLLO WEB",  desc: "Código performante. Arquitectura clara.",           position: [ 5, -1, -18], scale: 0.8, color: "#9A5BFF", act: "I", planet: "mercury" },
  { id: "mobile",     number: "03", title: "APPS MOBILE",     desc: "Productos nativos. iOS y Android sin compromisos.", position: [-3, -3, -28], scale: 1.6, color: "#5A1FD8", act: "I", planet: "mars"    },
  { id: "saas",       number: "04", title: "SOFTWARE · SAAS", desc: "Plataformas que escalan con tu ambición.",          position: [ 3,  1.5, -36], scale: 1.0, color: "#7B2FFF", act: "I", planet: "jupiter" },
  { id: "branding",   number: "05", title: "BRANDING",        desc: "Identidades que rompen la inercia visual.",         position: [-5,  1, -44], scale: 1.2, color: "#7B2FFF", act: "I", planet: "saturn"  },
  { id: "ads",        number: "06", title: "PUBLICIDAD",      desc: "Campañas con dirección de arte propia.",            position: [ 3, -2, -50], scale: 0.9, color: "#9A5BFF", act: "I", planet: "venus"   },
];

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

const PROJECTS: Body[] = [
  { id: "p1", number: "01", title: "ACEROS CAS",        desc: "Sitio web", position: [ 4,  3, -48], scale: 1.1, color: "#7B2FFF", act: "II", image: PROJECT_IMG["01"] },
  { id: "p2", number: "02", title: "BELTRÁN",           desc: "Próximamente", position: [-5,  1, -40], scale: 1.3, color: "#9A5BFF", act: "II", image: PROJECT_IMG["02"] },
  { id: "p3", number: "03", title: "DOLTON",            desc: "Web publicada", position: [ 3, -3, -32], scale: 0.9, color: "#7B2FFF", act: "II", image: PROJECT_IMG["03"] },
  { id: "p4", number: "04", title: "ASSITECH",          desc: "Web publicada", position: [-6,  2, -24], scale: 1.0, color: "#5A1FD8", act: "II", image: PROJECT_IMG["04"] },
  { id: "p5", number: "05", title: "TAOL",              desc: "Web publicada", position: [ 2,  3, -15], scale: 1.2, color: "#9A5BFF", act: "II", image: PROJECT_IMG["05"] },
  { id: "p6", number: "06", title: "EMPRENDIMIENTOS",   desc: "Próximamente", position: [-3, -2,  -6], scale: 1.0, color: "#7B2FFF", act: "II", image: PROJECT_IMG["06"] },
  { id: "p7", number: "07", title: "OCC",               desc: "Web publicada", position: [ 5,  2, -56], scale: 1.15, color: "#9A5BFF", act: "II", image: PROJECT_IMG["07"] },
  { id: "p8", number: "08", title: "A LA TREMENDA",     desc: "Web publicada", position: [-4, -2, -64], scale: 0.95, color: "#7B2FFF", act: "II", image: PROJECT_IMG["08"] },
  { id: "p9", number: "09", title: "MORPH",             desc: "Web publicada", position: [ 3, -1, -72], scale: 1.05, color: "#5A1FD8", act: "II", image: PROJECT_IMG["09"] },
];

const ACT_I_BODIES: Body[] = [...SERVICES];

const ACT_I_END = 0.42;
const INFLEXION_END = 0.58;

// ============================================================
// TEXTURE LOADER (preload todas en paralelo)
// ============================================================

function usePlanetTextures() {
  const { gl } = useThree();
  const lite = isLowTier();
  const suffix = lite ? "@1k" : "";
  // useTexture acepta record con paths → record con texturas
  const texMap = useTexture({
    mercury: `/textures/planets/mercury${suffix}.jpg`,
    venus:   `/textures/planets/venus${suffix}.jpg`,
    earth:   `/textures/planets/earth${suffix}.jpg`,
    earthNormal: "/textures/planets/earth_normal.jpg",
    mars:    `/textures/planets/mars${suffix}.jpg`,
    jupiter: `/textures/planets/jupiter${suffix}.jpg`,
    saturn:  `/textures/planets/saturn${suffix}.jpg`,
    saturnRing: "/textures/planets/saturn_ring.png",
  }) as unknown as Record<string, THREE.Texture>;

  // Color space, mipmaps y filtrado (mapas esféricos: clamp para evitar costuras)
  useEffect(() => {
    const cap = gl.capabilities.getMaxAnisotropy();
    const aniso = Math.min(lite ? 4 : 12, cap);
    Object.entries(texMap).forEach(([key, tex]) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = aniso;
      tex.needsUpdate = true;
      if (key === "earthNormal") {
        tex.colorSpace = THREE.NoColorSpace;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
      } else if (key === "saturnRing") {
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
      } else {
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
      }
    });
  }, [texMap, lite, gl]);

  return texMap;
}

// ============================================================
// ATMOSPHERE (fresnel halo, Tierra/Venus)
// ============================================================

const atmoVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const atmoFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uHover;
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float rim = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 3.0);
    float a = rim * (0.55 + uHover * 0.6);
    gl_FragColor = vec4(uColor, a);
  }
`;

// ============================================================
// PLANET — V7: textura real + halo Limitless + atmósfera + anillos
// ============================================================

function Planet({
  body,
  cameraPos,
  serviceMeta,
  onSelect,
  pointerRef,
  textures,
}: {
  body: Body;
  cameraPos: THREE.Vector3;
  serviceMeta?: ServiceMeta;
  onSelect?: (s: ServiceMeta) => void;
  pointerRef?: React.MutableRefObject<{ x: number; y: number; active: boolean }>;
  textures: Record<string, THREE.Texture>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const atmoMatRef = useRef<THREE.ShaderMaterial>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const hoverLerp = useRef(0);
  const magneticOffset = useRef(new THREE.Vector3());
  const tmpVec = useRef(new THREE.Vector3());
  const targetScaleVec = useRef(new THREE.Vector3(1, 1, 1));
  const [hover, setHover] = useState(false);
  const { camera, size } = useThree();

  const planetTex = body.planet ? textures[body.planet] : null;
  const isSaturn = body.planet === "saturn";
  const isEarth = body.planet === "earth";
  const isVenus = body.planet === "venus";

  // Color de halo: para Saturno (servicio 05 → impacto) magenta, resto violeta de marca
  const haloColor = body.color;
  const atmoColor = isEarth ? "#5BA9FF" : isVenus ? "#F5DC8C" : haloColor;

  const atmoUniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(atmoColor) },
      uHover: { value: 0 },
    }),
    [atmoColor],
  );

  const spinSpeed = useMemo(() => 0.08 + Math.random() * 0.12, []);
  const pulsePhase = useMemo(() => Math.random() * Math.PI * 2, []);
  const emissiveCol = useMemo(() => new THREE.Color(haloColor), [haloColor]);
  const earthNormalScale = useMemo(() => new THREE.Vector2(0.55, 0.55), []);
  const earthNormalTex = textures.earthNormal;
  const useEarthDetail =
    isEarth && earthNormalTex && !isLowTier();

  useFrame((state, delta) => {
    // ── Magnetic effect (V7: fuerza reducida a 0.4× para integrar con drag de cámara) ──
    let nearPointer = false;
    if (serviceMeta && pointerRef?.current.active) {
      tmpVec.current.set(
        body.position[0] + magneticOffset.current.x,
        body.position[1] + magneticOffset.current.y,
        body.position[2] + magneticOffset.current.z,
      );
      tmpVec.current.project(camera);
      const screenX = (tmpVec.current.x * 0.5 + 0.5) * size.width;
      const screenY = (-tmpVec.current.y * 0.5 + 0.5) * size.height;
      const dx = pointerRef.current.x - screenX;
      const dy = pointerRef.current.y - screenY;
      const dist = Math.hypot(dx, dy);
      const radius = 220;
      nearPointer = dist < radius;
      const pull = nearPointer ? Math.max(0, 1 - dist / radius) : 0;
      const depth = Math.abs(camera.position.z - body.position[2]) || 1;
      const worldPerPx = (2 * depth * Math.tan((((camera as THREE.PerspectiveCamera).fov || 55) * Math.PI) / 360)) / size.height;
      const maxOffset = 0.9;
      // V7: factor 0.22 (antes 0.55 = ~0.4× la fuerza)
      const targetX = THREE.MathUtils.clamp(dx * worldPerPx * pull * 0.22, -maxOffset, maxOffset);
      const targetY = THREE.MathUtils.clamp(-dy * worldPerPx * pull * 0.22, -maxOffset, maxOffset);
      magneticOffset.current.x += (targetX - magneticOffset.current.x) * 0.14;
      magneticOffset.current.y += (targetY - magneticOffset.current.y) * 0.14;
    } else {
      magneticOffset.current.x *= 0.9;
      magneticOffset.current.y *= 0.9;
    }

    if (groupRef.current) {
      groupRef.current.position.set(
        body.position[0] + magneticOffset.current.x,
        body.position[1] + magneticOffset.current.y,
        body.position[2],
      );
    }

    const wantHover = hover || nearPointer;
    hoverLerp.current += ((wantHover ? 1 : 0) - hoverLerp.current) * 0.12;
    if (atmoMatRef.current) atmoMatRef.current.uniforms.uHover.value = hoverLerp.current;
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * (spinSpeed + hoverLerp.current * 0.05);
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.03;
    }
    const dx = cameraPos.x - body.position[0];
    const dy = cameraPos.y - body.position[1];
    const dz = cameraPos.z - body.position[2];
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const active = 1 - Math.min(dist / 12, 1);
    const targetScale = body.scale * (1 + active * 0.15 + hoverLerp.current * 0.12);
    if (meshRef.current) {
      targetScaleVec.current.set(targetScale, targetScale, targetScale);
      meshRef.current.scale.lerp(targetScaleVec.current, 0.1);
    }
    if (glowRef.current) {
      const t = state.clock.elapsedTime;
      const pulse = 1 + Math.sin(t * (Math.PI / 3) + pulsePhase) * 0.05;
      const g = targetScale * (body.impact ? 1.4 : 1.22) * pulse * (1 + hoverLerp.current * 0.15);
      glowRef.current.scale.set(g, g, g);
    }
  });

  const interactive = !!(serviceMeta && onSelect);
  const handleClick = (e: any) => {
    if (!interactive) return;
    e.stopPropagation();
    onSelect!(serviceMeta!);
  };
  const handleEnter = () => {
    if (!interactive) return;
    setHover(true);
    document.body.style.cursor = "pointer";
  };
  const handleLeave = () => {
    if (!interactive) return;
    setHover(false);
    document.body.style.cursor = "";
  };

  const segments = isLowTier() ? 32 : 64;

  return (
    <group ref={groupRef} position={body.position}>
      {/* Halo aditivo Limitless (violeta/magenta) — firma de marca */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color={haloColor}
          transparent
          opacity={body.impact ? 0.18 : 0.12}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Anillos de Saturno (servicio 05 → branding magenta) */}
      {isSaturn && textures.saturnRing && (
        <mesh ref={ringRef} rotation={[Math.PI / 2.4, 0, 0]}>
          <ringGeometry args={[1.45, 2.4, 96]} />
          <meshBasicMaterial
            map={textures.saturnRing}
            transparent
            opacity={0.92}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Planeta real con textura fotográfica */}
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={handleEnter}
        onPointerOut={handleLeave}
      >
        <sphereGeometry args={[1, segments, segments]} />
        {planetTex ? (
          useEarthDetail ? (
            <meshStandardMaterial
              map={planetTex}
              normalMap={earthNormalTex}
              normalScale={earthNormalScale}
              roughness={0.78}
              metalness={0.04}
              emissive={emissiveCol}
              emissiveIntensity={0.025}
            />
          ) : (
            <meshStandardMaterial
              map={planetTex}
              roughness={0.92}
              metalness={0.02}
              emissive={emissiveCol}
              emissiveIntensity={0.04}
            />
          )
        ) : (
          <meshStandardMaterial color={haloColor} roughness={0.9} />
        )}
      </mesh>

      {/* Atmósfera fresnel — solo Tierra (azul) y Venus (amarillo) + halo de marca para los demás */}
      <mesh scale={1.18}>
        <sphereGeometry args={[1, isLowTier() ? 24 : 48, isLowTier() ? 24 : 48]} />
        <shaderMaterial
          ref={atmoMatRef}
          vertexShader={atmoVertex}
          fragmentShader={atmoFragment}
          uniforms={atmoUniforms}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.BackSide}
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
    const count = isLowTier() ? 400 : 1200;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
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
// ROUTE LINE
// ============================================================

function RouteLine({ progress }: { progress: number }) {
  const { points, total } = useMemo(() => {
    const ctrl: THREE.Vector3[] = [];
    ctrl.push(new THREE.Vector3(0, 0, 0));
    for (const s of SERVICES) ctrl.push(new THREE.Vector3(...s.position));
    ctrl.push(new THREE.Vector3(...PIVOT.position));
    const curve = new THREE.CatmullRomCurve3(ctrl, false, "catmullrom", 0.4);
    const pts = curve.getPoints(isLowTier() ? 120 : 300);
    return { points: pts, total: pts.length };
  }, []);

  const visiblePoints = useMemo(() => {
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
// LABEL
// ============================================================

function BodyLabel({
  body,
  cameraPosRef,
  cameraYawRef,
}: {
  body: Body;
  cameraPosRef: React.MutableRefObject<THREE.Vector3>;
  cameraYawRef: React.MutableRefObject<number>;
}) {
  const lite = isLowTier();
  const htmlRef = useRef<HTMLDivElement>(null);

  useFrame(() => {
    const el = htmlRef.current;
    if (!el) return;
    const cp = cameraPosRef.current;
    const yaw = cameraYawRef.current;
    const dx = body.position[0] - cp.x;
    const dz = body.position[2] - cp.z;
    const fx = -Math.sin(yaw);
    const fz = -Math.cos(yaw);
    const depthInFront = dx * fx + dz * fz;
    let opacity = 0;
    if (depthInFront > -2 && depthInFront < 18) {
      if (depthInFront < 4) {
        opacity = Math.max(0, (depthInFront + 2) / 6);
      } else {
        opacity = Math.max(0, 1 - (depthInFront - 4) / 14);
      }
    }
    el.style.opacity = String(opacity);
  });

  if (!body.title) return null;

  return (
    <Html
      position={body.position}
      center
      distanceFactor={lite ? 11 : 8}
      style={{
        pointerEvents: "none",
        opacity: 0,
        transition: "opacity 300ms linear",
      }}
    >
      <div
        ref={htmlRef}
        style={{
          width: lite ? "200px" : "260px",
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
            fontSize: body.impact ? (lite ? "28px" : "40px") : (lite ? "22px" : "32px"),
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
            fontSize: lite ? "12px" : "13px",
            opacity: 0.75,
            maxWidth: lite ? "180px" : "240px",
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
// PROJECTS OVERLAY 2D — Acto II (sin cambios respecto a V6)
// ============================================================

function ProjectsOverlay({ progress }: { progress: number }) {
  const pl = (progress - INFLEXION_END) / (1 - INFLEXION_END);
  const clamped = Math.max(-0.1, Math.min(1.1, pl));
  const local = -0.6 + clamped * (PROJECTS.length + 0.8);

  const enterFade =
    progress < INFLEXION_END - 0.01
      ? 0
      : progress < INFLEXION_END + 0.04
      ? (progress - (INFLEXION_END - 0.01)) / 0.05
      : 1;
  const exitFade =
    progress < 0.96 ? 1 : progress < 1 ? Math.max(0, 1 - (progress - 0.96) / 0.04) : 0;
  const overlayFade = enterFade * exitFade;

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
      <div className="relative w-full h-full" style={{ transformStyle: "preserve-3d" }}>
        {PROJECTS.map((project, i) => {
          const l = local - i;
          const z = -2200 + l * 2400;
          const rawOpacity =
            l < -1.2
              ? 0
              : l < 0
              ? Math.max(0, 1 + l * 0.85)
              : l < 0.55
              ? 1
              : Math.max(0, 1 - (l - 0.55) * 3.5);
          const opacity = l > 0.9 ? 0 : rawOpacity;

          const lite = isLowTier();
          const xOffset = (i % 2 === 0 ? -1 : 1) * (lite ? 60 : 120);
          const yOffset = i % 3 === 0 ? (lite ? -50 : -80) : i % 3 === 1 ? (lite ? 40 : 60) : (lite ? -20 : -30);
          const visible = opacity > 0.01 && l <= 0.9;

          return (
            <div
              key={project.id}
              className="absolute top-1/2 left-1/2"
              style={{
                width: lite ? "min(420px, 88vw)" : "min(560px, 70vw)",
                height: lite ? "min(280px, 50vh)" : "min(360px, 45vh)",
                marginLeft: lite ? "calc(min(420px, 88vw) / -2)" : "calc(min(560px, 70vw) / -2)",
                marginTop: lite ? "calc(min(280px, 50vh) / -2)" : "calc(min(360px, 45vh) / -2)",
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
// SCENE — V7: cámara narrativa + drag-to-orbit
// ============================================================

function easeInflexion(t: number): number {
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
  onSelectService,
  pointerRef,
  userYawRef,
  userPitchRef,
}: {
  progress: number;
  onStateChange: (s: SceneState) => void;
  onSelectService: (s: ServiceMeta) => void;
  pointerRef: React.MutableRefObject<{ x: number; y: number; active: boolean }>;
  userYawRef: React.MutableRefObject<number>;
  userPitchRef: React.MutableRefObject<number>;
}) {
  const { camera } = useThree();
  const mouse = useMouseParallaxRef();
  const stateEmitRef = useRef({ act: "I" as SceneState["act"], id: "", flash: -999 });
  const cameraPosVec = useRef(new THREE.Vector3());
  const cameraYawRef = useRef(0);
  const lite = useMemo(() => isLowTier(), []);
  const swayMul = lite ? 0.4 : 1;

  const textures = usePlanetTextures();

  // Sun (luz direccional para iluminar las texturas)
  // Posicionado lateral al cosmos, intensidad moderada para no sobreexponer.
  // Light component se monta abajo en JSX — useFrame solo gestiona cámara.

  useFrame(() => {
    const p = progress;

    let targetX = 0;
    let targetY = 0;
    let targetZ = 0;
    let targetYaw = 0;
    let act: SceneState["act"] = "I";
    let flash = 0;

    if (p < ACT_I_END) {
      act = "I";
      const pl = p / ACT_I_END;
      targetX = Math.sin(pl * Math.PI * 3) * 1.5 * swayMul;
      targetY = Math.cos(pl * Math.PI * 2) * 0.8 * swayMul;
      targetZ = -pl * 55;
      targetYaw = 0;
    } else if (p < INFLEXION_END) {
      act = "transition";
      const pl = (p - ACT_I_END) / (INFLEXION_END - ACT_I_END);
      const eased = easeInflexion(pl);
      const zCurve = -55 + Math.sin(pl * Math.PI) * -3;
      targetZ = zCurve;
      targetX = Math.sin(Math.PI * 3) * 1.5 * swayMul * (1 - eased);
      targetY = Math.cos(Math.PI * 2) * 0.8 * swayMul * (1 - eased);
      targetYaw = eased * Math.PI;
      const flashD = Math.abs(pl - 0.5);
      flash = flashD < 0.1 ? Math.pow(1 - flashD / 0.1, 1.6) * 0.4 : 0;
    } else {
      act = "II";
      const pl = (p - INFLEXION_END) / (1 - INFLEXION_END);
      targetX = Math.sin(pl * Math.PI * 2.5 + Math.PI) * 1.5 * swayMul;
      targetY = Math.cos(pl * Math.PI * 2 + Math.PI) * 0.8 * swayMul;
      targetZ = -55 + pl * 52;
      targetYaw = Math.PI;
    }

    camera.position.x += (targetX - camera.position.x) * 0.1;
    camera.position.y += (targetY - camera.position.y) * 0.1;
    camera.position.z += (targetZ - camera.position.z) * 0.1;

    // Base yaw narrativo + drag del usuario + parallax mouse leve
    const baseYaw = targetYaw;
    cameraYawRef.current += (baseYaw - cameraYawRef.current) * 0.08;
    const rotY = cameraYawRef.current + userYawRef.current + mouse.current.x * 0.03;
    const rotX = userPitchRef.current - mouse.current.y * 0.03;
    camera.rotation.order = "YXZ";
    camera.rotation.y += (rotY - camera.rotation.y) * 0.12;
    camera.rotation.x += (rotX - camera.rotation.x) * 0.12;

    cameraPosVec.current.copy(camera.position);

    const fx = -Math.sin(cameraYawRef.current);
    const fz = -Math.cos(cameraYawRef.current);
    const pool = act === "II" ? PROJECTS : SERVICES;
    let bestBody = pool[0];
    let bestDist = Infinity;
    for (const b of pool) {
      const ddx = b.position[0] - camera.position.x;
      const ddz = b.position[2] - camera.position.z;
      const depth = ddx * fx + ddz * fz;
      if (depth < -3) continue;
      const lateral = Math.hypot(ddx - depth * fx, ddz - depth * fz);
      const score = Math.abs(depth) + lateral * 0.5;
      if (score < bestDist) {
        bestDist = score;
        bestBody = b;
      }
    }

    const em = stateEmitRef.current;
    if (
      em.act !== act ||
      em.id !== bestBody.id ||
      Math.abs(em.flash - flash) > 0.04
    ) {
      em.act = act;
      em.id = bestBody.id;
      em.flash = flash;
      onStateChange({ act, activeBody: bestBody, flash });
    }
  });

  return (
    <>
      <fog attach="fog" args={["#030208", 18, 55]} />
      {/* Iluminación para las texturas reales */}
      <ambientLight intensity={0.55} color="#EDECE8" />
      <directionalLight
        position={[20, 12, 8]}
        intensity={1.4}
        color="#FFF4DA"
      />
      {/* Luz violeta de relleno desde el lado opuesto, marca Limitless */}
      <directionalLight
        position={[-15, -6, -10]}
        intensity={0.35}
        color="#7B2FFF"
      />
      <AmbientDust />
      <RouteLine progress={progress} />
      {ACT_I_BODIES.map((b, i) => {
        const meta = b.number ? SERVICE_DATA[i] : undefined;
        return (
          <Planet
            key={b.id}
            body={b}
            cameraPos={cameraPosVec.current}
            serviceMeta={meta}
            onSelect={onSelectService}
            pointerRef={pointerRef}
            textures={textures}
          />
        );
      })}
      {ACT_I_BODIES.map((b) => (
        <BodyLabel
          key={`l-${b.id}`}
          body={b}
          cameraPosRef={cameraPosVec}
          cameraYawRef={cameraYawRef}
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

const ServicesProjectsJourneyV7 = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const progress = useScrollProgress(sectionRef);
  const [state, setState] = useState<SceneState>({
    act: "I",
    activeBody: SERVICES[0],
    flash: 0,
  });
  const [webgl] = useState(() => isWebGLAvailable());
  const [selectedService, setSelectedService] = useState<ServiceMeta | null>(null);
  const pointerRef = useRef({ x: -9999, y: -9999, active: false });

  // ── Drag-to-orbit camera offsets ──
  const userYawRef = useRef(0);
  const userPitchRef = useRef(0);
  const draggingRef = useRef(false);
  const lastDragXRef = useRef(0);
  const lastDragYRef = useRef(0);
  const dragMovedRef = useRef(false);

  // Track pointer in section-local coords for magnetic effect
  useEffect(() => {
    const handle = (e: PointerEvent) => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const inside =
        e.clientY >= 0 &&
        e.clientY <= window.innerHeight &&
        rect.top <= 0 &&
        rect.bottom >= window.innerHeight;
      if (inside) {
        pointerRef.current.x = e.clientX - rect.left;
        pointerRef.current.y = e.clientY - Math.max(0, rect.top);
        pointerRef.current.active = true;
      } else {
        pointerRef.current.active = false;
      }
    };
    const onLeave = () => {
      pointerRef.current.active = false;
    };
    window.addEventListener("pointermove", handle);
    window.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", handle);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  // ── Drag handlers — rotate camera angle on user drag ──
  useEffect(() => {
    const wrap = canvasWrapRef.current;
    if (!wrap) return;

    const lite = isLowTier();
    const sensX = lite ? 0.008 : 0.005;
    const sensY = lite ? 0.008 : 0.005;
    const maxYaw = Math.PI / 4; // ±45°
    const maxPitch = (Math.PI / 180) * 25; // ±25°

    const onPointerDown = (e: PointerEvent) => {
      // Only primary button / single touch
      if (e.button !== undefined && e.button > 0) return;
      draggingRef.current = true;
      dragMovedRef.current = false;
      lastDragXRef.current = e.clientX;
      lastDragYRef.current = e.clientY;
      wrap.style.cursor = "grabbing";
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      const dx = e.clientX - lastDragXRef.current;
      const dy = e.clientY - lastDragYRef.current;
      lastDragXRef.current = e.clientX;
      lastDragYRef.current = e.clientY;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) dragMovedRef.current = true;
      userYawRef.current = THREE.MathUtils.clamp(
        userYawRef.current + dx * sensX,
        -maxYaw,
        maxYaw,
      );
      userPitchRef.current = THREE.MathUtils.clamp(
        userPitchRef.current + dy * sensY,
        -maxPitch,
        maxPitch,
      );
    };
    const onPointerUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      wrap.style.cursor = "grab";
    };

    // Prevent click on planet when user was dragging
    const onClickCapture = (e: MouseEvent) => {
      if (dragMovedRef.current) {
        e.stopPropagation();
        e.preventDefault();
        dragMovedRef.current = false;
      }
    };

    wrap.style.cursor = "grab";
    wrap.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    wrap.addEventListener("click", onClickCapture, true);

    // Lerp back to neutral when not dragging
    let raf = 0;
    const tick = () => {
      if (!draggingRef.current) {
        userYawRef.current *= 0.96;
        userPitchRef.current *= 0.96;
        if (Math.abs(userYawRef.current) < 0.0005) userYawRef.current = 0;
        if (Math.abs(userPitchRef.current) < 0.0005) userPitchRef.current = 0;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      wrap.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      wrap.removeEventListener("click", onClickCapture, true);
      cancelAnimationFrame(raf);
    };
  }, []);

  const lite = isLowTier();

  if (!webgl || lite) {
    // Fallback ultra liviano para mobile/low-tier: sin Canvas ni imágenes pesadas.
    return (
      <Suspense fallback={<div className="h-screen" />}>
        <div ref={sectionRef} className="relative bg-black text-foreground py-24 px-6 md:px-12">
          <div className="max-w-4xl mx-auto">
            <p className="text-[10px] tracking-[0.4em] uppercase text-foreground/50 font-light">
              Servicios · Proyectos
            </p>
            <h2 className="mt-5 text-4xl md:text-6xl font-extralight tracking-tight text-foreground">
              Universo Limitless
            </h2>
            <p className="mt-6 text-sm md:text-base text-foreground/60 font-light leading-relaxed">
              En celular usamos un modo liviano. El recorrido 3D completo está disponible en desktop.
            </p>
            <div className="mt-10 flex gap-4">
              <a
                href="/proyectos"
                className="inline-flex items-center gap-3 border border-foreground/20 px-6 py-3 text-xs tracking-[0.35em] uppercase text-foreground/80 font-light hover:border-primary hover:text-foreground transition-colors"
              >
                Ver proyectos →
              </a>
              <a
                href="/contacto"
                className="inline-flex items-center gap-3 border border-foreground/20 px-6 py-3 text-xs tracking-[0.35em] uppercase text-foreground/80 font-light hover:border-primary hover:text-foreground transition-colors"
              >
                Contacto →
              </a>
            </div>
          </div>
        </div>
      </Suspense>
    );
  }

  const isAct2 = state.act === "II";
  const isTransition = state.act === "transition";

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

  const canvasOpacity =
    progress < 0.40 ? 1 : progress < 0.46 ? 1 - (progress - 0.40) / 0.06 : 0;

  const eyebrowText = isAct2
    ? "Proyectos"
    : isTransition
    ? ""
    : "Servicios · Proyectos";

  const poolSize = isAct2 ? PROJECTS.length : SERVICES.length;
  const activeNumber = isAct2
    ? act2Project.number
    : state.activeBody.impact
    ? "★"
    : state.activeBody.number;
  const activeTitle = isAct2 ? act2Project.title : state.activeBody.title;

  const overlayOpacity = isTransition ? 0 : 1;

  const pivotCenter = (ACT_I_END + INFLEXION_END) / 2;
  const pivotRange = (INFLEXION_END - ACT_I_END) / 2;
  const pivotD = Math.abs(progress - pivotCenter) / pivotRange;
  const pivotVisible = pivotD < 1;
  const pivotScale = pivotVisible ? Math.pow(1 - pivotD, 0.6) : 0;
  const pivotOpacity = pivotVisible ? Math.pow(1 - pivotD, 1.2) : 0;

  const lite2 = isLowTier();
  const fov =
    typeof window !== "undefined"
      ? window.innerWidth < 480
        ? 75
        : window.innerWidth < 768
        ? 65
        : 55
      : 55;
  const sectionHeight = lite2 ? "600vh" : "900vh";

  return (
    <section
      ref={sectionRef}
      className="relative"
      style={{ height: sectionHeight, contain: "layout paint" }}
    >
      <div
        className="sticky top-0 w-full h-screen overflow-hidden"
        style={{ transform: "translateZ(0)" }}
      >
        <div
          ref={canvasWrapRef}
          className="absolute inset-0"
          style={{
            opacity: canvasOpacity,
            transition: "opacity 200ms linear",
            visibility: canvasOpacity <= 0.001 ? "hidden" : "visible",
            touchAction: "pan-y",
          }}
        >
          <Suspense fallback={null}>
            <Canvas
              dpr={lite ? [1, 1] : [1, 1.5]}
              gl={{
                antialias: !lite,
                alpha: true,
                powerPreference: "high-performance",
                stencil: false,
              }}
              camera={{ fov, near: 0.1, far: 200, position: [0, 0, 0] }}
              style={{ background: "transparent" }}
            >
              <Scene
                progress={progress}
                onStateChange={setState}
                onSelectService={setSelectedService}
                pointerRef={pointerRef}
                userYawRef={userYawRef}
                userPitchRef={userPitchRef}
              />
            </Canvas>
          </Suspense>
        </div>

        <ProjectsOverlay progress={progress} />

        {pivotVisible && (
          <div
            className="pointer-events-none absolute inset-0 z-[15] flex items-center justify-center"
            style={{ opacity: pivotOpacity }}
          >
            <div
              style={{
                width: "40vmin",
                height: "40vmin",
                transform: `scale(${pivotScale})`,
                background:
                  "radial-gradient(circle at 50% 50%, rgba(200,0,122,0.95) 0%, rgba(200,0,122,0.55) 18%, rgba(123,47,255,0.25) 45%, rgba(0,0,0,0) 72%)",
                filter: "blur(2px)",
                borderRadius: "50%",
                willChange: "transform, opacity",
              }}
            />
          </div>
        )}

        <div
          className="pointer-events-none absolute inset-0 z-20"
          style={{
            background: "white",
            opacity: state.flash,
            mixBlendMode: "screen",
          }}
        />

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

          {/* Hint: arrastrar para rotar */}
          <div
            className="absolute bottom-8 right-8 hidden md:flex items-center gap-2"
            style={{ opacity: overlayOpacity * 0.7, transition: "opacity 200ms linear" }}
          >
            <span className="text-[9px] tracking-[0.3em] uppercase text-foreground/40 font-light">
              Arrastrá · Rotar vista
            </span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-px bg-foreground/5">
            <div
              className="h-full bg-primary/60"
              style={{
                width: `${Math.min(100, progress * 100)}%`,
                transition: "width 120ms linear",
              }}
            />
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
      <ServiceModal service={selectedService} onClose={() => setSelectedService(null)} />
    </section>
  );
};

export default ServicesProjectsJourneyV7;
