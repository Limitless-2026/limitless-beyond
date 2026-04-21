

# Plan: V5 — Servicios como viaje 3D entre cuerpos celestes

V4 queda intacto. `/v5` hereda todo de V4 y reemplaza solo la **sección Servicios** (`ServicesNebula`) por una experiencia espacial 3D real: el usuario vuela por el cosmos y va encontrando los 6 servicios como cuerpos celestes en distintas direcciones y profundidades, no en línea recta.

La sección de Proyectos (`ProjectsWarp`) se mantiene como en V4.

---

## 1. Concepto

En V4 los servicios viven en una constelación horizontal (scroll mapea a translateX). En V5 se sienten como **cuerpos celestes reales** distribuidos en un volumen 3D. El scroll mueve una "cámara" que atraviesa el espacio: los servicios aparecen arriba, abajo, a la izquierda, lejos, cerca. Cada uno con escala, rotación y textura de gas/nebulosa.

Lenguaje visual alineado con el hero: nebulosa, partículas, violeta eléctrico, magenta quirúrgico en un solo cuerpo (el "impact" — Branding).

---

## 2. Nueva ruta `/v5` y componente `ServicesCosmos`

### Ruta
- Nuevo `src/pages/V5.tsx` — copia exacta de `V4.tsx`.
- Reemplaza `<ServicesNebula />` por `<ServicesCosmos />`.
- Badge top-left: `"Limitless · v5"`.
- `src/App.tsx` — agregar ruta `/v5`.

### Componente nuevo: `src/components/ServicesCosmos.tsx`

**Stack**: `@react-three/fiber@^8.18` + `@react-three/drei@^9.122.0` + `three@>=0.133`.

---

## 3. Mecánica 3D

### Escena

```text
Cámara: PerspectiveCamera, fov 55, posición inicial (0, 0, 0).
Scroll mapea Z de cámara: z = -progress * 60 unidades.

Stage sticky: 100vh.
Contenedor: 500vh (viaje pausado).

6 servicios distribuidos en volumen 3D:
  #   Servicio           Posición (x, y, z)    Escala  Color
  01  Diseño Web         (-4,  2, -10)         1.2     violeta
  02  Desarrollo Web     ( 5, -1, -20)         0.8     violeta claro
  03  Apps Mobile        (-3, -3, -30)         1.6     violeta profundo
  04  Software / SaaS    ( 6,  3, -38)         1.0     violeta
  05  Branding (impact)  (-2,  1, -48)         1.4     MAGENTA
  06  Publicidad         ( 3, -2, -58)         0.9     violeta

La cámara NO pasa por el centro de cada cuerpo → vuela "entre"
ellos con micro-desviaciones.
```

### Cuerpos celestes (servicios)

Cada servicio es una `<Sphere>` con **shader material custom** (GLSL) que mezcla:
- Noise fractal (fbm de 3 octavas) → textura de gas/nebulosa.
- Gradiente radial del color base a un tono oscuro.
- Rotación propia lenta, velocidad distinta por cuerpo.
- Glow exterior: esfera transparente 20% más grande, blending aditivo.

El cuerpo #05 (Branding) usa magenta `#C8007A` — único uso de magenta en la página.

### Partículas ambiente

Un `<Points>` con ~800 partículas distribuidas en el volumen de 60 unidades. Polvo estelar que deriva lento en dirección opuesta a la cámara → refuerza viaje.

### Línea de ruta

Curva de Bezier 3D que conecta los 6 cuerpos en orden. `<Line>` delgada (opacity 0.15, violeta). Se "dibuja" progresivamente con `dashOffset` según scroll → la ruta del viaje.

### Labels de servicio (HTML overlay)

Títulos y copy NO se renderizan en 3D (typos borrosos). Usamos `<Html>` de drei proyectando DOM sobre la posición 3D de cada cuerpo:

```text
  ★ 01
  DISEÑO WEB
  Sitios que respiran. Que duelen. Que ganan.
```

- Fade-in cuando el cuerpo está a menos de 15 unidades de la cámara.
- Fade-out cuando queda detrás.
- Arkitech para título, DM Sans 300 para descripción.

---

## 4. Cámara no lineal

Para que el viaje no sea una línea recta, la cámara serpentea:

```text
camera.x = sin(progress * π * 3) * 1.5
camera.y = cos(progress * π * 2) * 0.8
camera.z = -progress * 60
camera.lookAt(0, 0, camera.z - 5)
```

Mouse parallax leve sobre rotación de cámara (±0.05 rad en X/Y) → el usuario siente que puede "mirar alrededor" mientras vuela.

---

## 5. Overlay 2D

- **Eyebrow** top-left: `"Capacidades · Cosmos 3D"`.
- **Contador inferior**: `03 / 06` — actualizado por el servicio más cercano a la cámara (calculado en `useFrame`).
- **Barra de progreso** 1px abajo.
- DM Sans 300, 10px, tracking 0.3em, uppercase.

---

## 6. Performance

- Canvas con `dpr={[1, 1.5]}`, `gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}`.
- Shaders mínimos (fbm 3 octavas).
- `<Points>` con BufferGeometry estática.
- `frameloop="demand"` fuera del viewport, `"always"` dentro.
- Fallback a `ServicesNebula` de V4 si WebGL no está disponible (lazy + Suspense + ErrorBoundary).
- Lenis ya integrado globalmente.

---

## 7. Detalles visuales

- Canvas `transparent` → se ve el starfield global.
- `<fog>` violeta a partir de z=-40 → cuerpos lejanos se desvanecen en el cosmos.
- Cuerpo activo (el más cercano) recibe +15% de escala vía spring.
- Glow pulsa cada 6s, desfasado entre cuerpos.

---

## 8. Archivos

**Nuevos**
- `src/pages/V5.tsx` — copia de V4 con `<ServicesCosmos />`.
- `src/components/ServicesCosmos.tsx` — Canvas R3F + cámara + 6 cuerpos + partículas + línea + labels HTML + overlay 2D.

**Editado**
- `src/App.tsx` — ruta `/v5`.
- `package.json` — agregar `@react-three/fiber@^8.18`, `@react-three/drei@^9.122.0`, `three@^0.160` si faltan.

**Sin tocar**
- V2, V3, V4. Hero, Manifiesto, Proyectos (warp), About y Footer V2 se mantienen idénticos a V4. El único cambio en V5 es la sección de Servicios.

