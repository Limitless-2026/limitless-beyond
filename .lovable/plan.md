

# Plan: V6 (planetas reales + click→popup) + arreglos en V5/Proyectos

Tres bloques de trabajo, todos enfocados, sin romper lo que ya funciona.

---

## 1. Crear `/v6` — clon de V5 con servicios mejorados

Nueva ruta `/v6` para iterar sin tocar V5.

**Nuevos archivos**
- `src/pages/V6.tsx` — copia de `V5.tsx` pero usa `<ServicesPlanetsInteractive />` en vez de `ServicesProjectsJourney`. Actualiza el badge a `Limitless · v6`.
- `src/components/ServicesPlanetsInteractive.tsx` — sección nueva de servicios con planetas magnéticos clickeables.
- `src/components/ServiceModal.tsx` — popup que se abre al clickear un planeta.
- `src/data/services.ts` — array tipado con los 6 servicios y su contenido extendido.

**Editado**
- `src/App.tsx` — agregar `<Route path="/v6" element={<V6 />} />`.
- `src/components/HamburgerMenu.tsx` — el item "Inicio" apunta a `/v6` (V6 pasa a ser la home preferida; V5 queda accesible por URL directa para comparar).

### Diseño de `ServicesPlanetsInteractive`

Sección full-viewport con fondo negro frío y starfield sutil heredado.

```text
┌──────────────────────────────────────────────┐
│  SERVICIOS · 06                               │  ← eyebrow violeta
│                                               │
│  EL UNIVERSO LIMITLESS                       │  ← H2 grande
│                                               │
│      ●           ●                            │
│           ●           ●                       │  ← 6 planetas distribuidos
│      ●           ●                            │     orgánicamente
│                                               │
│  Tocá un planeta para entrar.                │  ← hint
└──────────────────────────────────────────────┘
```

**Planetas más "reales"** (Three.js + R3F, igual stack que el actual pero con shader mejorado):
- Esfera con shader fbm 4 octavas (vs 3 del actual) → más detalle de superficie.
- Capa de atmósfera externa: segunda esfera levemente más grande con `additive blending`, color violeta, opacidad radial tipo fresnel.
- Anillo orbital opcional para 2 de los 6 planetas (Saturno-style) usando `ringGeometry` con shader de bandas.
- Iluminación con `directionalLight` que da terminator (lado oscuro/iluminado) → sensación esférica real, no plana.
- Cada planeta con paleta levemente distinta dentro del violeta: `#7B2FFF`, `#9A5BFF`, `#5A1FD8`, `#A974FF`, `#6B1FE0`, `#8244FF`. El planeta de "Branding" lleva el toque magenta `#C8007A` (regla de impacto).
- Rotación continua propia + flotación senoidal (±0.15 unidades en Y, fase desfasada por planeta).

**Efecto magnético en hover**:
- En el hook `usePointer`, calcular distancia 2D del mouse a cada planeta proyectado.
- Si `dist < 180px`: el planeta se desplaza hacia el mouse con `lerp` suave (max offset 30px), escala crece a `1.15`, atmósfera intensifica fresnel.
- Halo violeta pulsante aparece alrededor del planeta activo.
- Cursor custom muestra texto `ENTRAR` cuando hay planeta cerca (si hay `CustomCursor` activo).

**Click → popup**:
- Al click sobre un planeta: animación rápida (350ms) — el planeta hace `scale 1 → 1.6` con flash blanco hueso, partículas estallan radialmente desde su centro (60 partículas, ease-out, fade, GPU-friendly).
- Justo al terminar el flash, se monta `<ServiceModal service={...} />`.

### Diseño de `ServiceModal`

Overlay fixed, backdrop blur, panel grande centrado.

```text
┌──────────────────────────────────────────────┐
│   ●  ── Diseño Web                       ✕   │  ← header con planeta mini + título + close
│                                               │
│   01 / 06                                    │  ← índice violeta
│                                               │
│   DISEÑO                                     │  ← título grande Arkitech
│   WEB                                        │
│                                               │
│   Sitios que respiran. Que duelen.           │  ← bajada DM Sans
│   Que ganan.                                 │
│                                               │
│   ─────────────────────────                  │
│                                               │
│   QUÉ HACEMOS                                │  ← bloque 1
│   • Diseño UX/UI                             │
│   • Wireframes y prototipos interactivos     │
│   • Sistemas de diseño escalables            │
│   • Diseño editorial y motion                │
│                                               │
│   PROCESO                                    │  ← bloque 2
│   01 Briefing →  02 Concept →  03 Diseño     │
│   →  04 Iteración  →  05 Handoff             │
│                                               │
│   STACK                                      │  ← bloque 3
│   Figma · Framer · After Effects · Webflow   │
│                                               │
│   [ HABLEMOS DE TU PROYECTO  → ]             │  ← CTA a /contacto
└──────────────────────────────────────────────┘
```

- Apertura: backdrop fade-in 300ms; panel entra con clip-path desde el centro (igual lenguaje del menú); contenido stagger por bloque (60ms).
- Cierre: ✕ arriba a la derecha + click fuera + tecla Escape.
- Reutiliza Radix `Dialog` de shadcn (`src/components/ui/dialog.tsx`) para a11y / focus trap, con styling custom para que no parezca shadcn default.
- Acento de color: el modal toma el color del planeta clickeado (line accents, números, botón) — refuerza identidad por servicio.

### Datos en `src/data/services.ts`

```ts
export type Service = {
  id: string;
  number: string;
  title: string;       // "DISEÑO WEB"
  tagline: string;     // bajada
  description: string; // párrafo
  whatWeDo: string[];  // bullets
  process: string[];   // pasos
  stack: string[];     // tools
  color: string;
  hasRing?: boolean;
  isImpact?: boolean;  // magenta — solo branding
};
```

6 entradas: Diseño Web, Desarrollo Web, Apps Mobile, Software/SaaS, Branding (impact magenta), Publicidad.

---

## 2. Implementar páginas de detalle "Ver caso" (sirve para V5 y V6)

Dejar de tener el botón disabled. Hacer que `VER CASO →` lleve a `/proyectos/:slug` con galería real, fácil de extender.

**Nuevos archivos**
- `src/pages/ProyectoDetalle.tsx` — página de caso individual.
- `src/components/CaseGallery.tsx` — componente de galería de imágenes del caso.

**Editados**
- `src/data/projects.ts` — agregar campos `cover`, `gallery: string[]`, `problema`, `solucion`, `resultados: {label, value}[]`, `creditos: {role, name}[]`, `linkLive?`. Cargar las 6 imágenes existentes en `src/assets/projects/` como cover de cada proyecto, y duplicarlas como gallery placeholder hasta tener más.
- `src/components/ProjectStation.tsx` — el botón disabled pasa a ser `<Link to={'/proyectos/' + slug}>`. Mostrar el cover real (no más gradiente con texto) usando la imagen importada del proyecto.
- `src/App.tsx` — agregar `<Route path="/proyectos/:slug" element={<ProyectoDetalle />} />`.

### Estructura de `ProyectoDetalle`

```text
┌──────────────────────────────────────────────┐
│  ☰                                            │
│                                               │
│  ← Volver a constelación                     │  ← back link arriba izq
│                                               │
│  CASO 01  ·  EN ÓRBITA                       │  ← eyebrow
│                                               │
│  NEBULA                                      │  ← H1 enorme Arkitech
│                                               │
│  Sistema visual y site corporativo           │  ← descripción
│  para una fintech argentina.                 │
│                                               │
│  CLIENTE        AÑO         STACK            │  ← meta row
│  Nebula Cap.    2025        React · …        │
│                                               │
│  [   COVER FULL-WIDTH 16:9   ]               │
│                                               │
│  ── EL DESAFÍO ──                            │  ← bloque problema
│  Texto editorial DM Sans 300.                │
│                                               │
│  ── LA SOLUCIÓN ──                           │  ← bloque solución
│  Texto editorial.                            │
│                                               │
│  [ GALLERY ]  ← grid responsive,             │
│  imágenes con fade-in al entrar viewport     │
│  layout: 2 cols desktop, 1 col mobile,       │
│  alguna imagen ocupa 2 cols (full bleed)     │
│                                               │
│  ── RESULTADOS ──                            │
│  +180% conv  ·  3.5s LCP  ·  100/100 SEO     │
│                                               │
│  ── CRÉDITOS ──                              │
│  Dirección creativa — Nombre                 │
│  Desarrollo — Nombre                         │
│                                               │
│  ── PRÓXIMO CASO ──                          │  ← cross-link al siguiente
│  ÓRBITA 7 →                                   │     proyecto del array
│                                               │
│  CosmicFooterV2                              │
└──────────────────────────────────────────────┘
```

- Smooth scroll heredado.
- Galería: usa `CaseGallery` con `gallery` array. Si en el futuro se quiere cambiar el layout, se toca solo ese componente. Si se agregan más imágenes a un proyecto, se añade al array — la página no se rompe.
- Si el slug no existe → redirige a `/proyectos`.

---

## 3. Arreglos en `/proyectos` (corregir V5)

El usuario reporta dos cosas:
1. **El "Empecemos" no es la última pantalla** — hay scroll después → footer muy alto.
2. Los visuales de proyecto son placeholders sin imagen real.

**Cambios en `src/pages/Proyectos.tsx`**
- Eliminar el bloque de cierre (`¿TU PROYECTO ES EL PRÓXIMO LÍMITE? · EMPECEMOS`) como sección separada.
- Plegar ese mensaje DENTRO del `CosmicFooterV2` o, más limpio: hacer que la sección de cierre **sea** la última pantalla y que el footer arranque inmediatamente debajo SIN gap. Para que el `EMPECEMOS` quede en la imagen final que pasaste:
  - Convertir esa sección de cierre a `min-h-screen flex items-center justify-center` para que ocupe exactamente un viewport.
  - Eliminar el bloque de línea + punto magenta de abajo (sobra y empuja).
  - Reducir paddings verticales (`py-32 md:py-48` → `py-0`).
  - El footer (`CosmicFooterV2`) se puede simplificar en esta página: usar `CosmicFooter` (la versión chica, sin la animación de explosión de 360vh) para que no agregue scroll extra. Si no existe versión corta, montar un footer mínimo inline (1 línea: `LIMITLESS · 2025 · hola@limitless.studio · Argentina`) integrado al final de la sección de cierre.

**Cambios en `src/components/ProjectStation.tsx`**
- Mostrar la imagen real del proyecto (`project.cover`) en el visual en vez del gradiente con texto. Mantener el ring violeta animado en hover sobre la imagen.
- El botón pasa a `<Link>` a `/proyectos/:slug` (ver bloque 2).

**Resultado**
- La página de Proyectos termina exactamente con la pantalla `¿TU PROYECTO ES EL PRÓXIMO LÍMITE?` + footer mínimo integrado, sin scroll residual.
- Agregar un proyecto = agregar una entrada al array `PROJECTS` en `src/data/projects.ts`. Aparece automáticamente en la lista y tiene su `/proyectos/:slug` funcional.

---

## Resumen de archivos

**Nuevos**
- `src/pages/V6.tsx`
- `src/pages/ProyectoDetalle.tsx`
- `src/components/ServicesPlanetsInteractive.tsx`
- `src/components/ServiceModal.tsx`
- `src/components/CaseGallery.tsx`
- `src/data/services.ts`

**Editados**
- `src/App.tsx` — rutas `/v6` y `/proyectos/:slug`.
- `src/data/projects.ts` — campos extendidos + imports de imágenes.
- `src/components/ProjectStation.tsx` — imagen real + Link a detalle.
- `src/pages/Proyectos.tsx` — sección final compacta + footer integrado.
- `src/components/HamburgerMenu.tsx` — "Inicio" → `/v6`.

**Sin tocar**
- V5, hero, manifiesto, About, Contacto, scroll, preloader, FooterV2.

---

## Notas técnicas

- **Click en planetas 3D**: usar `onClick` de `<mesh>` de R3F (raycasting nativo de R3F) — no necesita librería extra.
- **Magnetismo**: hook `useMagnetic(planetWorldPos, mouseScreen)` que devuelve `offset` para aplicar al `group.position`.
- **Modal**: Radix Dialog, animaciones con clases utilitarias + transiciones inline para mantener el lenguaje editorial (no usar las defaults de shadcn).
- **Galería**: `IntersectionObserver` para fade-in stagger; `loading="lazy"` en `<img>`.
- **Performance**: el `Canvas` de servicios baja a `dpr={[1, 1.5]}` y `frameloop="demand"` cuando no hay hover ni rotación visible — pero default `always` está bien para 6 planetas con shader simple.

