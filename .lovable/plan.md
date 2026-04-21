

# Plan: Crear `/v4` con explosión más realista + sección Servicios reinventada

V3 queda intacto. V4 es una copia que cambia dos cosas: el **footer cinematográfico** y la **sección de servicios** (de "órbita" a algo mucho más expresivo).

---

## 1. Nueva ruta `/v4`

- Nuevo archivo `src/pages/V4.tsx` — copia de `V3.tsx`.
- Reemplaza `<ServicesOrbit />` por el nuevo `<ServicesNebula />`.
- Reemplaza `<CosmicFooter />` por `<CosmicFooterV2 />`.
- Badge de top-left: `"Limitless · v4"`.
- Ruta agregada en `src/App.tsx`: `/v4`.

---

## 2. Explosión "más realista" y más lenta — `CosmicFooterV2.tsx`

El problema actual: aunque ya hicimos el footer de 280vh, el estallido sigue sintiéndose **CSS** (escalas, divs, gradientes). No "respira" como la nebulosa del hero, que es shader. La solución es darle el mismo lenguaje visual del hero (mismo shader/colores) y estirar todavía más las fases.

### A. Altura y reescalado de fases

- Altura del sticky stage: `280vh` → **`360vh`**. ~80vh extra dedicados exclusivamente al estallido.
- Nuevas ventanas de progreso:

```text
[ 0.00 → 0.24 ]  COLAPSO LENTO
   El starfield se contrae hacia el centro (vignette negro
   creciendo desde los bordes). 4 halos nebulosos violeta/magenta
   se contraen con rotación lenta — sensación de gas siendo
   devorado por gravedad. El punto vibra ±0.5px (RAF orgánico).

[ 0.24 → 0.40 ]  CARGA PROFUNDA
   El punto pulsa con 3 ciclos de respiración (no 2).
   Glow violeta crece de 40px → 360px.
   Aparece distorsión radial sutil (chromatic aberration:
   halo magenta desfasado 8px del violeta).
   Onda de presión apenas visible — anillo violeta que
   pulsa hacia adentro (inverso al shockwave).

[ 0.40 → 0.56 ]  ESTALLIDO EN TRES TIEMPOS
   • 0.40→0.43  Pre-flash blanco suave (peak 0.5).
   • 0.43→0.50  Núcleo blanco se hincha de 0 → 35vmax con
                glow masivo. Sensación de "núcleo expuesto".
   • 0.46→0.56  Shockwave violeta principal: 0 → 320vmax
                con perfil de anillo (no relleno) — pasa
                visualmente por encima del usuario.
   • 0.43→0.55  20 esquirlas (no 12), de 3 tipos:
                  - 8 cortas y rápidas (núcleo cercano)
                  - 8 medias (anillo medio)
                  - 4 largas y lentas (alcance lejano)
                Cada una con offset escalonado 0–60ms.
   • Flash blanco principal centrado en 0.49, ancho 0.08,
     curva pow(1-d/w, 2.6) — caída aún más suave.

[ 0.56 → 0.72 ]  POLVO Y NEBULOSA RESIDUAL
   Las esquirlas se desvanecen lentamente.
   3 nubes violetas blureadas derivan con rotación leve.
   12 partículas (no 8) tipo "ceniza estelar" titilando.
   Aparece un sutil ruido de grano (CSS noise overlay) que
   imita la textura del shader del hero — continuidad visual.

[ 0.68 → 1.00 ]  CONTENIDO DEL FOOTER
   Las capas (eyebrow, pregunta, CTA, wordmark, meta)
   entran en este rango más comprimido. La pregunta gana
   peso máximo porque viene de un silencio más largo.
```

### B. Detalles "más realistas"

- **Vignette de colapso**: `radial-gradient(circle at center, transparent 0%, transparent 30%, black 90%)` que crece su opacidad de 0 a 1 durante `[0 → 0.24]`. Refuerza la sensación de "todo se va al centro" sin tocar el starfield (que ya está atenuado por overlay).
- **Halos rotantes**: cada halo tiene `transform: rotate(angle)` interpolado por RAF lento (1 frame cada 30ms). Da vida orgánica vs. quietud sintética.
- **Tres tiempos de estallido** (vs. dos actuales):
  - Pre-flash → preparación
  - Núcleo expuesto (nuevo) → la estrella en su pico
  - Shockwave principal → la onda viaja
- **Núcleo expuesto**: un div blanco con `filter: blur(0)` en su centro y `filter: blur(20px)` en su halo, escalando de 0 a 35vmax con `opacity` 0→1→0. Es el "momento de luz pura".
- **Shockwave como anillo**, no relleno: `background: radial-gradient(circle, transparent 45%, hsl(var(--primary) / 0.7) 52%, transparent 60%)`. Se ve la onda viajar como un anillo nítido, no como un disco.
- **20 esquirlas en 3 categorías**: cortas (rápidas, alcance 30vmax), medias (40vmax), largas (lentas, 80vmax). Heterogeneidad → realismo.
- **Grano post-estallido**: SVG noise como background-image en un overlay con `mix-blend-mode: overlay` y opacity 0.08. Existe solo en `[0.56 → 0.72]`. Imita la textura granular del shader del hero.
- **Curvas de easing más físicas**:
  - Colapso: `cubic-bezier(0.55, 0, 0.45, 1)` (gravitatorio simétrico)
  - Estallido: `cubic-bezier(0.05, 0.7, 0.1, 1)` (impulso explosivo realista)
  - Residual: `cubic-bezier(0, 0, 0.3, 1)` (decay natural)

### C. Continuidad con el hero

- El starfield global ya se atenúa con un overlay negro durante el colapso — mantenemos eso.
- Los colores del estallido usan `hsl(var(--primary))` (violeta) y `hsl(var(--foreground))` (blanco hueso) — exactamente la misma paleta del shader del hero.
- El grano residual replica visualmente la textura de las nebulosas del hero.

---

## 3. Nueva sección de servicios — `ServicesNebula.tsx`

La sección actual (`ServicesOrbit`) tiene un sistema solar rotante con cards que orbitan. Funciona, pero compite con el resto de la página y se siente "decorativo". La rehacemos con un lenguaje más narrativo y editorial, manteniendo el universo cósmico pero con **mucho más impacto**.

### Concepto

**"Nebulosa de capacidades"**: cada servicio es una **estrella nominada** dentro de una constelación. El usuario scrollea horizontalmente (con scroll vertical real, mapeado a translación X) y atraviesa las 6 estrellas como si volara entre ellas. Cada estrella tiene su propio "panel de información" que aparece cuando el cursor entra en su zona de gravedad.

### Mecánica detallada

```text
Stage (sticky 100vh, contenedor 400vh):

┌─────────────────────────────────────────────────────────┐
│  CAPABILIDADES · CONSTELACIÓN                            │
│                                                          │
│   ★01      ★02      ★03      ★04      ★05      ★06      │  ← scroll horizontal
│   Diseño   Dev      Mobile   SaaS     Branding Ads      │
│   Web      Web                        (impact)           │
│                                                          │
│   ────────── línea de tiempo cósmica ──────────          │
│                                                          │
│  6 estrellas con líneas que las conectan (constelación) │
└─────────────────────────────────────────────────────────┘
```

#### Detalles visuales

- **Sticky stage 100vh**, contenedor 400vh. El scroll vertical se mapea a `translateX(-300vw)` del strip horizontal.
- **6 estrellas en línea horizontal**, espaciadas a 60vw entre cada una (total 6 × 60vw = 360vw).
- **Cada estrella**:
  - Núcleo: punto blanco 8px con glow violeta 60px.
  - Anillo orbital: círculo 1px violeta de 80px de diámetro, animación lenta de pulso.
  - Número del servicio (`01`, `02`, …) en Arkitech, tracking 0.4em, opacity 0.4, debajo de la estrella.
  - Título grande (`DISEÑO WEB`) en Arkitech 4xl/5xl, aparece cuando la estrella entra en el centro del viewport.
  - Descripción corta DM Sans 300 que entra debajo del título.
- **Línea de constelación**: SVG `<path>` que conecta las 6 estrellas con curvas suaves (no rectas — Bezier). La línea se dibuja con `stroke-dasharray` animado por scroll: a medida que avanzás, la línea se "completa" hacia adelante.
- **Estrella central activa**: la estrella que está en el centro del viewport recibe `scale(1.4)` y `boxShadow` ampliado. Las laterales quedan dim (`opacity 0.4`).
- **Servicio impact (Branding, #05)**: única vez en la página que aparece `#C8007A` (magenta). El núcleo de la estrella es magenta en vez de violeta, y su título tiene un underline magenta.
- **Mouse parallax**: las estrellas se desplazan ±15px en X/Y con el mouse, dando profundidad 3D parallax.
- **Indicador de progreso**: una barra delgada en el bottom (1px de alto, ancho proporcional al progreso del scroll dentro de la sección). Muestra `01 / 06`, `02 / 06`, etc., a la izquierda.

#### Texto de cada estrella

Mantenemos los 6 servicios actuales pero con copy más afilado:

```text
01 · DISEÑO WEB        — "Sitios que respiran. Que duelen. Que ganan."
02 · DESARROLLO WEB    — "Código performante. Arquitectura clara."
03 · APPS MOBILE       — "Productos nativos. iOS y Android sin compromisos."
04 · SOFTWARE / SAAS   — "Plataformas que escalan con tu ambición."
05 · BRANDING (impact) — "Identidades que rompen la inercia visual."
06 · PUBLICIDAD        — "Campañas con dirección de arte propia."
```

#### Performance

- Una sola transformación por frame: `translateX` del strip horizontal, hookeado al `useScrollProgress` ya existente.
- Las estrellas son DOM puro (1 div + 1 span por estrella) — sin canvas.
- Línea de constelación: 1 SVG con 1 path. `stroke-dashoffset` interpolado en CSS por progreso.
- Mouse parallax usa el hook compartido `useMouseParallax`.

---

## 4. Performance global

- Las nuevas piezas heredan Lenis automáticamente (ya integrado).
- `CosmicFooterV2` usa `contain: layout paint` igual que el actual.
- `ServicesNebula` también con `contain: layout paint` y `transform: translateZ(0)` para forzar capa GPU.
- Sin nuevos RAFs ni nuevos listeners de scroll — todo deriva del `useScrollProgress` compartido.

---

## Archivos

**Nuevos**
- `src/pages/V4.tsx` — copia de V3 con `ServicesNebula` y `CosmicFooterV2`.
- `src/components/CosmicFooterV2.tsx` — explosión en 3 tiempos, vignette de colapso, núcleo expuesto, grano residual, 360vh.
- `src/components/ServicesNebula.tsx` — constelación horizontal con 6 estrellas y scroll mapeado.

**Editado**
- `src/App.tsx` — agregar ruta `/v4`.

**Sin tocar**
- V2 y V3 quedan intactos. La nueva experiencia es exclusiva de `/v4`.

