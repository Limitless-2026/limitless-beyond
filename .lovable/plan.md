

# Plan: `/proyectos/v2` con animaciones cinematográficas

Creo una versión paralela de la página de proyectos en una nueva ruta `/proyectos/v2`. La actual queda intacta como referencia, y en v2 aplico todas las capas de animación que propusimos.

---

## Ruta nueva

- `/proyectos/v2` → renderiza `ProyectosV2` (nueva página).
- La actual `/proyectos` sigue funcionando igual, sin cambios.

---

## Archivos

**Nuevos**
- `src/pages/ProyectosV2.tsx` — clon de `Proyectos.tsx` con hero animado (split por palabra, blur reveal, gradiente flotante en "Limitless", contador odómetro 00→N), conector vertical punteado entre estaciones con punto violeta que cae con el scroll, y badge `v2` discreto abajo.
- `src/components/ProjectStationV2.tsx` — versión enriquecida de `ProjectStation`:
  - Marca de agua gigante del número (`01`, `02`...) en Arkitech 18rem, opacity 0.04, parallax lento detrás del bloque.
  - Parallax diferencial: cover ±40px, texto ±20px (sentido opuesto).
  - Reveal en cascada al entrar al viewport: header → línea (`scaleX`) → cover (clip-path cortina) → título (split por palabra con stagger 40ms) → underline → meta/desc/CTA (stagger 80ms).
  - Tilt 3D ±4° del cover según mouse + brillo radial violeta que sigue al cursor.
  - Cursor custom dentro del cover: círculo violeta 80px con texto `VER CASO` que sigue el mouse con lerp.
  - Punto del estado pulsa (escala + opacity loop 2.4s).
  - Línea horizontal del header con shimmer cada 6s.
  - Título con breathing sutil en `letter-spacing` (8s loop).

**Editados**
- `src/App.tsx` — agregar `<Route path="/proyectos/v2" element={<ProyectosV2 />} />`.
- `src/index.css` — keyframes nuevos: `shimmer`, `breathe-tracking`, `pulse-dot`, `gradient-flow`, `blur-in`.

**Sin tocar**
- `src/pages/Proyectos.tsx`, `ProjectStation.tsx`, `projects.ts`, página de detalle, V5/V6, hero, footer, menú.

---

## Detalles técnicos

- **Parallax por estación**: cálculo `(rect.top - vh/2) / vh` en `requestAnimationFrame`, mapeado a `translateY` vía `ref.current.style` (sin re-render).
- **Tilt + cursor magnético**: `onMouseMove` con RAF throttle, escritura directa al `style`. Solo se monta si `matchMedia('(hover: hover)').matches` (desktop).
- **Reveal en cascada**: `IntersectionObserver` por sub-elemento + `transition-delay` inline. Sin librerías.
- **Conector orbital**: SVG vertical entre estaciones; `stroke-dasharray` animado por scroll progress global; en la última estación se desvanece.
- **Reduced motion**: si `prefers-reduced-motion: reduce`, se desactivan parallax/tilt/cursor/shimmer; queda fade simple.
- **Performance**: solo `transform` y `opacity`, sin layout thrashing.

---

## Resultado

- `/proyectos` → versión actual, sin cambios.
- `/proyectos/v2` → misma data, mismo layout, pero la página respira: estaciones que entran en cascada cinematográfica, tilt y cursor magnético en los covers, números gigantes flotando como marca de agua editorial, conector orbital uniendo proyectos, hero con gradiente que fluye y contador que cuenta. Fácil de comparar lado a lado y de promover a producción cuando lo apruebes.

