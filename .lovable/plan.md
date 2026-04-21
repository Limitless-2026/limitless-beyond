

# Plan: Adaptación responsive (menú, planetas, footer)

Tres ajustes puntuales para mobile y pantallas grandes, sin tocar la lógica ni la estética en desktop.

---

## 1. `HamburgerMenu.tsx` — más compacto en mobile

- **Ancho del panel**: hoy `!w-full sm:!max-w-[680px]`. Lo bajo a `!w-[88%] sm:!w-full sm:!max-w-[560px] md:!max-w-[680px]` para que en mobile no ocupe toda la pantalla y respire.
- **Padding**: `px-8` → `px-6 sm:px-8`.
- **Tipografía de items**: `text-4xl md:text-5xl` → `text-2xl sm:text-3xl md:text-5xl`. La etiqueta `01/02/03` baja a `text-[10px] sm:text-[11px]`. La descripción mantiene `text-[10px]`.
- **Gap entre items**: `gap-6` → `gap-4 sm:gap-6` para que entren los 3 cómodos.
- **Watermark vertical "Limitless"**: hoy `text-5xl`. En mobile pasa a `text-3xl sm:text-5xl` y se oculta en pantallas <380px (`hidden xs:block` vía media query inline) para no chocar con el contenido.
- **Header y footer del panel**: `pt-8 pb-4` → `pt-6 pb-3 sm:pt-8 sm:pb-4`; meta footer `text-[10px]` se mantiene pero `flex-col gap-1` en <400px (con `sm:flex-row`).
- **Botón hamburguesa trigger**: `top-6 right-6` → `top-4 right-4 sm:top-6 sm:right-6`.

---

## 2. `ServicesPlanetsInteractive.tsx` — planetas que no se cortan en mobile

- **Layout responsive de los 6 planetas**: hoy hay un único array de posiciones `[-3.6 … 3.4]` que se sale del viewport mobile. Detecto el ancho del viewport (o uso `useThree().size.width`) y genero **dos layouts**:
  - Desktop (≥768px): el actual (3 + 3 horizontal).
  - Mobile (<768px): grid 2×3 más vertical y comprimido — posiciones tipo `[-1.6, 2.2]`, `[1.6, 2.2]`, `[-1.6, 0]`, `[1.6, 0]`, `[-1.6, -2.2]`, `[1.6, -2.2]` con `size` reducido a ~0.55–0.7.
  - Cámara: en mobile `position: [0, 0, 9]` (más alejada) para que entren todos.
- **Radio magnético**: `radius = 180` → `radius = window.innerWidth < 768 ? 110 : 180`.
- **Título**: `clamp(2rem, 6vw, 4.5rem)` → `clamp(1.6rem, 7vw, 4.5rem)` y `pt-24 md:pt-32` → `pt-20 md:pt-32`. Padding lateral `px-6 md:px-12` se mantiene.
- **Hint inferior**: `bottom-10` → `bottom-6 sm:bottom-10` para que no se solape con planetas inferiores.
- **Section min-height**: `min-h-screen` se mantiene; en mobile sumamos un poco de padding inferior para dejar el hint sin pisar.

---

## 3. `CosmicFooterV2.tsx` — control del tamaño en pantallas grandes

El problema en monitores anchos: el wordmark `LIMITLESS` y la pregunta `¿LISTOS PARA CRUZAR?` se vuelven gigantes porque los `clamp` tienen techos altos.

- **Wordmark de fondo**: `clamp(6rem, 22vw, 22rem)` → `clamp(4.5rem, 18vw, 14rem)`. Sigue dominante pero deja de tragarse pantallas 2K/4K.
- **Pregunta gigante**: `clamp(4rem, 12vw, 12rem)` → `clamp(2.6rem, 10vw, 8rem)`. Mantiene impacto sin desbordar.
- **CTA**: `mt-12 md:mt-16` se mantiene; en mobile `px-8 py-4 text-xs` queda OK.
- **Meta footer**: `text-xs` está bien — no toco.

Esto resuelve también el caso mobile (los `min` bajan), así que no hace falta romper en breakpoints distintos.

---

## Detalles técnicos

- **Detección mobile en planetas**: uso `useThree().size.width` dentro del `Scene` (ya disponible) para elegir `layout` y `cameraZ`. La cámara se ajusta vía `useEffect` que escucha cambios de tamaño y actualiza `camera.position.z` + `camera.updateProjectionMatrix()`.
- **Radio magnético**: leo `window.innerWidth` una sola vez en el componente `Planet` con `useMemo`, y lo recalculo en `useEffect` con `resize` listener.
- **Sin nuevos breakpoints**: uso los ya disponibles en Tailwind (`sm` 640, `md` 768).
- **Sin tocar**: lógica de scroll, animaciones del footer, modal de servicios, contenido del menú, V5 ni nada fuera de estos 3 archivos.

---

## Archivos editados

- `src/components/HamburgerMenu.tsx`
- `src/components/ServicesPlanetsInteractive.tsx`
- `src/components/CosmicFooterV2.tsx`

## Resultado

- **Menú**: en mobile ocupa ~88% del ancho, tipografía ~50% más chica, todo legible y sin scroll forzado.
- **Planetas**: los 6 entran completos en mobile en grid 2×3, magnetismo proporcional al touch.
- **Footer**: en pantallas grandes el wordmark y la pregunta dejan de explotar; misma jerarquía visual, escala controlada.

