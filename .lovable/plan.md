

# Plan: `/v7` — planetas reales + cámara orbital rotable

Ajusto el plan según lo que pediste:

1. **Planetas con sus estructuras y colores reales** (texturas fotográficas del sistema solar).
2. **Fondo intacto** — el cosmos negro/violeta, starfield, nebulosa de transición, todo igual a V6. No agrego órbitas ni anillos decorativos.
3. **Cámara rotable en ángulos** — el usuario puede arrastrar para rotar la vista del cosmos en distintos ángulos (orbit camera).
4. **Magnetic mantenido** con intensidad reducida (~40% del actual) para que no compita con el drag de cámara.

---

## Ruta y archivos nuevos

- `/v7` → renderiza `V7` (clon de `V6`).
- `src/pages/V7.tsx` (nuevo, clon de `V6.tsx`).
- `src/components/ServicesProjectsJourneyV7.tsx` (nuevo, clon de V6 con planetas reales + cámara rotable).
- `public/textures/planets/` → mercury.jpg, venus.jpg, earth.jpg, mars.jpg, jupiter.jpg, saturn.jpg, saturn_ring.png.
- Ruta agregada en `src/App.tsx`.

---

## Planetas reales texturizados

Mapeo servicio ↔ planeta:

| # | Servicio | Planeta |
|---|----------|---------|
| 01 | Diseño Web | Tierra |
| 02 | Desarrollo Web | Mercurio |
| 03 | Apps Mobile | Marte |
| 04 | SaaS | Júpiter |
| 05 | Branding (pivote magenta) | Saturno (con anillos) |
| 06 | Publicidad | Venus |

**Render:**
- `meshStandardMaterial` con `map={texture}` reemplaza al shader procedural de V6.
- Iluminación: `directionalLight` (sol, posición lateral) + `ambientLight` suave para que las texturas se lean correctamente sin quedar planas ni sobreexpuestas.
- **Halo aditivo violeta/magenta** alrededor de cada planeta — firma Limitless intacta.
- **Atmósfera fresnel** suave para Tierra (azul) y Venus (amarillo).
- **Saturno**: `ringGeometry` con textura PNG transparente, rotada ~25° en X.
- Cada planeta sigue rotando en su eje (`spinSpeed`).

**Texturas:**
- Generadas one-off con `google/gemini-2.5-flash-image` en formato equirectangular 2048×1024 (versión 1024×512 para mobile).
- `texture.colorSpace = THREE.SRGBColorSpace`, `wrapS = RepeatWrapping`, `anisotropy 4/8`.
- QA visual de cada una antes de integrar — si Tierra no tiene continentes reconocibles o Júpiter pierde la mancha roja, regenero.

---

## Cámara rotable en ángulos (lo nuevo)

Hoy en V6 la cámara sigue un path narrativo controlado 100% por scroll (avance Z + serpenteo automático). La cambio a un modelo híbrido:

- **El scroll sigue controlando la posición narrativa de la cámara** (avance Z, fases del viaje, transiciones Acto I/II/flash). La narrativa cinematográfica no se toca.
- **Encima de eso**, el usuario puede **arrastrar** (mouse drag en desktop, touch drag en mobile) para **rotar el ángulo de vista**: pitch (arriba/abajo) y yaw (izquierda/derecha). Es un "look-around" sobre el punto de mira de la cámara, no un movimiento posicional.
- **Implementación**: un par de offsets `userYaw` y `userPitch` que se suman al `lookAt` calculado por scroll. Al soltar, los offsets vuelven suavemente a 0 con `lerp` (~2 segundos) para que la cámara retome el path narrativo sin perder al usuario.
- **Límites**: yaw ±45°, pitch ±25° — rangos suficientes para "asomarse" sin perder el norte.
- **Sensibilidad**: `0.005` rad/px en desktop, `0.008` en mobile.
- **Sin librería extra**: no uso `OrbitControls` de drei porque pelea con el scroll narrativo. Hago el drag manual con `pointerdown/move/up` sobre el canvas y muto refs (cero re-render React).
- **Indicador sutil**: cursor cambia a `grab` / `grabbing` sobre el canvas para señalizar que se puede rotar (en desktop). En mobile, sin indicador visual — se descubre al tocar.

---

## Magnetic suavizado

Conservo el magnetic actual de V5/V6 sobre los planetas, solo bajo la fuerza:

- **Fuerza de desplazamiento**: reducida a `0.4×` del valor actual.
- **Radio de atracción**: igual que hoy.
- En mobile el magnetic ya estaba reducido por device tier — se mantiene.

Razón: con el drag de cámara, un magnetic fuerte se siente "peleando" contra la rotación.

---

## Lo que se mantiene de V6 (sin tocar)

- **Fondo idéntico**: nebulosa del hero, starfield warp, transición magenta del flash, color base `rgb(2,1,5)`. Cero cambios.
- Toda la narrativa cinematográfica (Acto I, inflexión, Acto II, flash, starfield warp, cards de proyectos, magenta pivote, modal de servicios).
- `BodyLabel` con título + descripción.
- FOV adaptativo (75/65/55), DPR adaptativo, viewport culling, lite shader del hero.
- `RouteLine`, `AmbientDust`, hint inferior, contador, eyebrow, progress bar.
- Optimizaciones mobile heredadas (geometría 32×32, dust 400, etc.).
- Footer, menú, preloader, custom cursor.

---

## Detalles técnicos

- **Texturas**: cargadas con `useTexture` de drei + Suspense fallback existente.
- **Generación de assets**: script one-off con AI image gateway, guardado en `public/textures/planets/`.
- **Drag de cámara**: handlers `onPointerDown/Move/Up` sobre el `<canvas>`, mutación de refs `userYawRef.current` / `userPitchRef.current`. Lerp de retorno en `useFrame`. Compatible con scroll (pointer events ≠ wheel).
- **Sin tocar**: V5, V6, hero, footer, menú, proyectos, contacto, lógica de ruteo existente.

---

## Archivos editados/creados

- `src/App.tsx` (ruta `/v7`)
- `src/pages/V7.tsx` (nuevo)
- `src/components/ServicesProjectsJourneyV7.tsx` (nuevo)
- `public/textures/planets/*.{jpg,png}` (nuevos)

## Resultado

`/v7` con los planetas del sistema solar reconocibles (Tierra, Mercurio, Marte, Júpiter, Saturno con anillos, Venus) con sus colores y estructuras reales. El fondo cósmico de V6 queda exactamente igual. El usuario puede arrastrar para rotar la cámara y mirar el cosmos desde distintos ángulos, mientras el scroll sigue avanzando la narrativa. El magnetic sigue activo pero suave para integrarse con el drag.

