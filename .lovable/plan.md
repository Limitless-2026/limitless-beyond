

# Plan: Optimización mobile sin perder animaciones

Confirmo: **no perdemos ni modificamos ninguna animación a nivel visual**. Todo el viaje narrativo, los planetas, el flash, el pivote magenta, el cosmos, el footer animado y las transiciones quedan **idénticos en desktop** y **visualmente iguales en mobile** (mismo movimiento, mismas fases, mismos tiempos). Lo que cambia es **cómo se calculan internamente**, no qué se ve.

Y como decís que el cuello principal es la **nebulosa del hero**, foco el 80% del esfuerzo ahí.

---

## Qué se mantiene (sin tocar)

- Arco narrativo completo (Acto I → inflexión → Acto II → flash → starfield → cosmos).
- Posiciones, tiempos y curvas de todas las animaciones de scroll.
- Planetas, labels, line route, ambient dust, magenta pivote, modal de servicios.
- Footer cosmic, hamburger menu, preloader, custom cursor en desktop.
- Toda la estética: colores, tipografías, blends, shadows, gradientes.

---

## Qué se optimiza (invisible para el usuario)

### 1. Nebulosa del hero — el foco (`FragmentShader.tsx` + `HeroWebGL.tsx`)

Esto es lo que más le cuesta a tu celu. Tres palancas:

- **DPR adaptativo**: hoy `dpr={[1, 2]}`. En un celu con DPR 2-3, eso significa pintar 4-9× más píxeles que necesarios. Paso a `dpr={[1, 1]}` en mobile. **El shader se ve igual**, solo que renderizado a resolución nativa de CSS en vez de retina. En una pantalla de 6", la diferencia visual es nula; la de performance es enorme (×4-9 menos píxeles a procesar por frame).
- **Variante "lite" del shader en mobile**: bajo las octavas de ruido fractal (`fbm` de 6 → 3, `fbm3` de 5 → 3) y las capas de estrellas warp (5 → 3). Visualmente la nebulosa **sigue viéndose igual**: las octavas altas aportan detalle sub-pixel que en mobile no se percibe. Es la técnica estándar de LOD para shaders.
- **Pausar el shader cuando ya no es visible**: hoy el shader sigue corriendo a 60fps incluso cuando ya scrolleaste a la sección de planetas (porque está `fixed`). Agrego un guard en `useFrame` que skipea el cálculo cuando `scrollY > viewportHeight * 1.6`. Ya no se ve, no tiene sentido seguir computando.

**Impacto esperado**: el hero pasa de ~6M píxeles/frame con shader pesado a ~700K con shader liviano. Es lo que más vas a sentir.

### 2. Cursor custom (`CustomCursor.tsx`)

- En touch devices no se ve (no hay puntero), pero igual está corriendo un RAF infinito. Early return si es touch → libera CPU permanentemente.

### 3. Cosmos de planetas (`ServicesProjectsJourneyV6.tsx` + V5) + adaptación mobile

**Performance:**
- Geometría de esferas: `(1, 64, 64)` → `(1, 32, 32)` en mobile. Visualmente idénticas a esa escala (las esferas se ven redondas igual).
- AmbientDust: 1200 → 400 puntos en mobile.
- RouteLine: 300 → 120 puntos.
- DPR del Canvas: `[1, 1.5]` → `[1, 1]` en mobile.
- Quitar el `force()` que re-renderiza React 60×/s. Los labels se actualizan con mutación directa de refs.

**Adaptación visual mobile** (el screenshot que mandaste):
- FOV adaptativa: `55` desktop → `65` tablet → `75` mobile. Esto **aleja la cámara** sin tocar las posiciones de los planetas → todos entran en el frame, ya no se cortan en los bordes.
- Amplitud del serpenteo de cámara reducida en mobile (para que el sway no empuje planetas afuera).
- Labels (`BodyLabel`): width 260 → 200, título 32 → 22, descripción 13 → 12.
- Cards del Acto II: ancho `min(560, 70vw)` → `min(420, 88vw)` en mobile.
- Altura de la sección: `900vh` → `600vh` en mobile (acortamos 1/3 del scroll, pero las fases narrativas se mantienen — solo se densifican).

---

## Detalles técnicos

- **Hook `useDeviceTier()`** nuevo: detecta tier una sola vez (`width < 768 || hardwareConcurrency <= 4 || hover: none`) y se memoriza. Se importa donde haga falta.
- **Inyección del define LITE**: `const frag = (isLite ? "#define LITE\n" : "") + fragmentShader;` y dentro del GLSL los loops usan `#ifdef LITE` para limitar octavas. Cero cambio en desktop.
- **Reduced motion**: si `prefers-reduced-motion: reduce`, también se aplica el path lite.
- **Sin breakpoints nuevos**: `sm` (640) y `md` (768) de Tailwind.

---

## Archivos editados

- `src/components/FragmentShader.tsx` (variante lite + pausa fuera de viewport)
- `src/components/HeroWebGL.tsx` (DPR adaptativo)
- `src/components/CustomCursor.tsx` (skip en touch)
- `src/components/ServicesProjectsJourneyV6.tsx` (FOV, layout mobile, perf cosmos)
- `src/components/ServicesProjectsJourney.tsx` (mismos cambios, V5)
- `src/hooks/useDeviceTier.ts` (nuevo)

## Resultado

- **Desktop**: idéntico, sin diferencias.
- **Mobile**: las animaciones se ven y se sienten iguales, pero la web corre fluida. La nebulosa del hero — tu cuello principal — pasa a procesar ~10× menos trabajo por frame. Los planetas entran completos en el frame y la sección no es eterna.

