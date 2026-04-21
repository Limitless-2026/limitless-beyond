

# Plan: Limpiar la transición al espacio de proyectos

El problema en las capturas:
1. El texto del hero ("LIMITLESS", "Bienvenido al otro lado", subtítulos) sigue visible cuando ya empezaron a aparecer las cards de proyectos.
2. Cuando termina el hero (destello blanco) y se entra al "vacío estelar", queda un fondo plano sin vida — la nebulosa desaparece de golpe pero las estrellas no toman el relevo.
3. Al scrollear rápido, la falta de un sistema de capas continuo hace que se vea un "salto" entre el final del hero y el inicio de los proyectos.

## 1. Ocultar el texto del hero antes de que entren los proyectos

**`src/pages/V2.tsx`**

- Envolver toda la capa de texto fija (`fixed inset-0 ... z-10`) en un contenedor con `opacity` y `visibility` controlados por `scrollProgress`:
  - Cuando `scrollProgress > 0.85` → opacidad de la capa = 0 y `pointer-events: none` ya estaba.
  - Cuando `scrollProgress > 0.92` → `visibility: hidden` para que ni siquiera ocupe stacking context y no haya riesgo de que el "LIMITLESS" tape las cards.
- Recortar `endOpacity` para que "LIMITLESS" llegue a 1 antes (en `scrollProgress ~ 0.78`) y empiece a desvanecerse rápido entre `0.85` y `0.92`, antes del spacer negro.
- También bajar el badge "Limitless · v2" del top-left durante el tramo de proyectos (opacidad sigue scrollProgress > 0.95 → 0).

## 2. Reemplazar el spacer negro plano por un campo de estrellas con parallax

**Nuevo componente: `src/components/StarfieldParallax.tsx`**

- Componente `position: fixed inset-0 z-0` con tres capas SVG/canvas de estrellas:
  - **Capa lejana**: muchas estrellas pequeñas (1px), opacidad baja, se mueve lento con scroll (`translateY(scroll * -0.05)`).
  - **Capa media**: estrellas 1.5–2px, opacidad media (`scroll * -0.15`).
  - **Capa cercana**: pocas estrellas 2–3px brillantes con leve halo violeta, se mueve rápido (`scroll * -0.35`).
- Cada estrella tiene un parpadeo sutil con `animation` CSS (twinkle 3–6s, opacity 0.3 → 1).
- Las posiciones se generan una sola vez con `useMemo` (semilla fija) para evitar saltos en re-renders.
- El componente solo se vuelve visible cuando `scrollProgress > 0.78` (lo recibe por prop o lee scroll global), con un fade-in de 200vh.

**`src/pages/V2.tsx`**

- Renderizar `<StarfieldParallax visible={scrollProgress > 0.78} />` por encima del WebGL pero por debajo del texto y de las cards.
- Hacer que la nebulosa WebGL haga fade-out en el último 10% del hero (controlado por `uScroll` ya existente o por `opacity` del `<HeroWebGLV2>` wrapper) para entregarle el escenario al starfield sin que ambos peleen.

## 3. Viaje suave de estrellas durante la sección de proyectos

**`src/components/ProjectsWarp.tsx`**

- Añadir una capa de "warp stars" propia dentro de la sección sticky:
  - 80–120 estrellas posicionadas aleatoriamente (semilla fija, `useMemo`).
  - Cada estrella se renderiza como un trazo (`div` con `width: 1px`, `height: 4–12px` según depth, gradiente vertical violeta→transparente).
  - Su `transform: translate3d(x, y, z)` se anima con el mismo `progress` que las cards: `z = -2200 + (progress * 0.4 + estrella.offset) * 2400`, dándole un loop continuo.
  - Las estrellas se mueven SIEMPRE (no solo cuando hay card visible) para dar sensación de viaje constante.
- Esto cubre el caso "scroll rápido": aunque el usuario salte directo, el campo de estrellas viaja por debajo y nunca se ve un fondo muerto.

## 4. Suavizar la transición scroll-rápido

**`src/components/ProjectsWarp.tsx`**

- Aplicar un easing al `progress` con un `requestAnimationFrame` + lerp (factor 0.08) para que el avance del warp no sea 1:1 con el scroll bruto. Resultado: si el usuario tira un scroll fuerte, las cards y estrellas siguen viajando suavemente unas décimas después en vez de teleportarse.
- Mismo patrón en `V2.tsx` para `scrollProgress` del hero, así el destello blanco final también queda suave.

## 5. Detalles técnicos

- **Z-index final**:
  - `0` HeroWebGLV2 (fixed)
  - `1` StarfieldParallax (fixed, fade-in tras hero)
  - `5` Overlay oscuro radial (ya existe, se mantiene solo en hero)
  - `10` Capa de texto del hero (se oculta al `scrollProgress > 0.92`)
  - `10` ProjectsWarp (sticky, mismo nivel pero aparece después en flow)
  - `50` Badge top-left (se atenúa en proyectos)
- **Performance**: el starfield parallax usa solo `transform` y `opacity` (compositor GPU). Sin re-render React por scroll: usar `useRef` + manipular `style.transform` directamente en el listener para las capas.
- **No tocamos el shader** (`FragmentShaderV2.tsx`).
- **Rutas**: todo el cambio sigue en `/v2`.

## Archivos a tocar
- `src/components/StarfieldParallax.tsx` — **nuevo**, capas de estrellas con parallax.
- `src/pages/V2.tsx` — ocultar texto del hero antes de proyectos, montar StarfieldParallax, suavizar scrollProgress.
- `src/components/ProjectsWarp.tsx` — capa de warp-stars siempre activa, easing de progress.

