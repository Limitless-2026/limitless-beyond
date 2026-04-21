

# Plan: Crear `/v3` con footer agresivo + pasada de performance global (v2 y v3)

## Estrategia
- `v2` queda **intacto en lo visual**, pero recibe la pasada de performance.
- `v3` es una copia de `v2` con un único cambio narrativo: reemplazar `<PortalCTA />` por el nuevo `<CosmicFooter />` con el scroll-in agresivo estilo NK/Awwwards.

---

## Parte 1 — Nueva ruta `/v3`

### Archivos
- **Nuevo**: `src/pages/V3.tsx` — copia de `V2.tsx`, con `<PortalCTA />` reemplazado por `<CosmicFooter />` y sin el spacer final (el footer ya tiene su propio largo).
- **Editado**: `src/App.tsx` — agregar `<Route path="/v3" element={<V3 />} />`.

### El footer (`CosmicFooter.tsx`)

**Estructura**: contenedor de `~180vh`. Adentro, un stage `sticky top-0 h-screen` que mantiene el footer fijo mientras el progreso interno (0→1) avanza. Cinco capas con rangos solapados.

```text
Capa 1 — Eyebrow            [ 0.00 → 0.25 ]
  "Capítulo final ─────"    DM Sans, text-[10px], tracking 0.4em

Capa 2 — Pregunta gigante   [ 0.15 → 0.45 ]
  "¿LISTOS / PARA CRUZAR?"  Arkitech, clamp(4rem, 12vw, 12rem)
                            Reveal por palabra, stagger 80ms

Capa 3 — CTA real           [ 0.40 → 0.65 ]
  "[ INICIAR CONTACTO → ]"  <a href="/contacto">, outline, hover invierte
                            a violeta, flecha translateX(8px)

Capa 4 — Wordmark de fondo  [ 0.55 → 0.85 ]
  "L I M I T L E S S"       Arkitech, clamp(6rem, 22vw, 22rem)
                            Opacidad 0.10, z-index bajo, ancho total

Capa 5 — Meta-footer        [ 0.75 → 1.00 ]
  Columnas: Estudio · Servicios · Contacto
  hola@limitless.studio
  ── (línea magenta 60px, único uso del color de impacto)
  © 2025 Limitless · Buenos Aires
```

### Mecánica de animación (lo que la hace agresiva)

1. **`clip-path: inset(100% 0 0 0)` → `inset(0 0 0 0)`** en cada bloque grande. Eso es una persiana que se levanta y revela el texto desde abajo, no un fade. Es lo que da el efecto físico tipo Awwwards.
2. **`translateY(40px) → translateY(0)` en simultáneo** con el clip-path. La letra "emerge" del borde inferior del bloque.
3. **Easing custom** `cubic-bezier(0.16, 1, 0.3, 1)` (expo-out) en cada capa — da peso físico, no se siente "web genérica".
4. **Stagger por palabra** en la pregunta: cada palabra tiene su propio rango de progreso desfasado 80ms, no entran juntas.
5. **Capas solapadas**: cuando una termina la otra ya empezó — sensación de construcción continua.
6. **Sombra inferior sutil** (`box-shadow` en el contenedor) durante el reveal para reforzar que algo "sale de abajo".
7. **Línea horizontal** que recorre el ancho con clip-path antes de cada bloque grande, como guía visual.

El progreso interno se calcula con un único `scroll listener` RAF-throttled vía el hook compartido nuevo (ver Parte 2).

---

## Parte 2 — Pasada de performance (afecta `v2` y `v3` por igual)

### 2.1 Hooks compartidos (nuevos)
- **`src/hooks/useScrollProgress.ts`** — un único `scroll` listener global con RAF throttle. Cada sección se suscribe pasando su `ref`; recibe el progreso 0→1 calculado contra su `getBoundingClientRect`. Hoy hay 5 listeners independientes leyendo rects por separado → pasa a 1.
- **`src/hooks/useMouseParallax.ts`** — un único `mousemove` listener global con RAF throttle. Las 3 secciones que hoy tienen su propio listener se suscriben.

### 2.2 `StarfieldParallax.tsx` — reescritura
- **Hoy**: 275 `<span>` con `animation` CSS y `box-shadow` (glow). Cada uno es una capa de compositor.
- **Cambio**: un único `<canvas>` 2D que dibuja las 3 capas (far/mid/near). Twinkle en RAF a **30fps** (no 60). Glow de la capa near con `radialGradient` cacheado, no `box-shadow`. DPR-aware.

### 2.3 `AboutConstellation.tsx` — fix crítico
- **Hoy**: el `useEffect` del canvas tiene `[progress]` en dependencias → cada tick de scroll cancela y recrea el RAF. Eso es lo que más traba.
- **Cambios**:
  - Pasar `progress` a un `progressRef.current` y leerlo dentro del `draw`. `useEffect` queda con `[]`.
  - Cachear los `radialGradient` por estrella (hoy se crean 14 × 60 = 840/seg).
  - Bajar el loop a 30fps.
  - Suscribir el scroll al hook compartido.

### 2.4 `ServicesOrbit.tsx`
- **Hoy**: `setAngle` re-renderiza React a 60fps + `backdrop-blur-sm` en 6 satélites (bottleneck conocido sobre fondos animados).
- **Cambios**:
  - Rotación movida a CSS `@keyframes` (`spin-inner` / `spin-outer`) sobre los anillos. Cada satélite hereda y aplica contra-rotación CSS para mantener el card recto. Cero re-renders por animación.
  - Hover pausa con `animation-play-state: paused`.
  - Reemplazar `backdrop-blur-sm` por `rgba(8,6,14,0.78)` opaco + `text-shadow` sutil para legibilidad.
  - Mouse parallax desde el hook compartido.

### 2.5 `ProjectsWarp.tsx`
- Aplicar `transform: translateZ(0)` y `contain: layout paint` en el sticky stage para aislar repaint.
- Cards ocultas: agregar `pointer-events: none` cuando `visibility: hidden`.

### 2.6 `V2.tsx` y `V3.tsx`
- Sacar `transition: filter 0.1s linear` del hero (caro durante todo el scroll). El lerp del scroll ya suaviza.
- Limitar el blur máximo a 8px (hoy llega hasta 12).
- Migrar el scroll listener al hook compartido.

---

## Resumen de archivos

**Nuevos**
- `src/pages/V3.tsx`
- `src/components/CosmicFooter.tsx`
- `src/hooks/useScrollProgress.ts`
- `src/hooks/useMouseParallax.ts`

**Editados**
- `src/App.tsx` — ruta `/v3`.
- `src/pages/V2.tsx` — pasada de performance (sin cambios visuales).
- `src/components/StarfieldParallax.tsx` — reescritura a canvas único.
- `src/components/AboutConstellation.tsx` — fix RAF + cache de gradientes.
- `src/components/ServicesOrbit.tsx` — rotación CSS + sin backdrop-blur.
- `src/components/ProjectsWarp.tsx` — `contain: layout paint`.

**Sin tocar**
- `PortalCTA.tsx` queda en el repo (sigue montado en `/v2`).

