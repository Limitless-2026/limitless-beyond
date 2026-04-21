

# Plan: Acto II con cards de proyectos flotando en 3D

Buenísima idea — la rotación 180° es el momento más fuerte del viaje y merece una revelación distinta. Hacer que al girar la cámara aparezcan los proyectos como **cards flotantes** (no como planetas) crea un contraste narrativo perfecto:

- **Acto I** = cosmos puro, servicios como cuerpos celestes (abstracto, promesa).
- **Giro** = pivote magenta + flash (revelación).
- **Acto II** = las cards de proyectos aparecen suspendidas en el vacío, como evidencia tangible (concreto, prueba).

El cambio de lenguaje (planetas → cards) refuerza la narrativa: "lo que prometemos" vs "lo que entregamos".

---

## Cambios en `ServicesProjectsJourney.tsx`

### Lo que se mantiene
- Acto I intacto: 6 servicios como cuerpos celestes con shader GLSL.
- Pivote magenta en el centro + flash blanco.
- Rotación 180° de la cámara (el momento "espectacular").
- Overlay 2D (eyebrow, contador, barra de progreso).
- Starfield, partículas, fog violeta.

### Lo que cambia: Acto II (progress 0.58 → 1.00)

**Se eliminan** los 6 cuerpos celestes de proyectos.

**Se agregan 6 cards 3D flotantes** distribuidas en el mismo volumen que antes ocupaban los planetas-proyecto, pero con tratamiento completamente distinto:

```text
Cada card:
  - Plano 3D (6 x 3.6 unidades, ratio 16:10) con <Html transform>
    de drei → DOM real renderizado en 3D con perspectiva real.
  - Contenido HTML:
      ┌─────────────────────────────────┐
      │  ★ 01                  2025     │
      │                                 │
      │  NEBULA OS                      │
      │  Plataforma SaaS                │
      │                                 │
      │  ──────────                     │
      │  Dashboard de gestión orbital.  │
      └─────────────────────────────────┘
  - Fondo: glass morphism (bg rgba(14,14,20,0.6) + backdrop-blur)
  - Borde: 1px violeta con opacity 0.3
  - Tipografía: Arkitech para título, DM Sans 300 para meta
  - Shadow: glow violeta sutil detrás
```

### Comportamiento de las cards

- **Orientación**: cada card siempre mira a la cámara (`billboard` via `lookAt` en `useFrame`) → nunca se ve de canto, legibilidad asegurada.
- **Entrada**: al empezar Acto II (0.58), las 6 cards están invisibles (scale 0, opacity 0). Entran escalonadas cada 0.06 de progreso, con:
  - `scale` 0 → 1 (spring easing)
  - `opacity` 0 → 1
  - `position.z` offset +3 → 0 (llegan desde adelante, como materializándose)
- **Flotación orgánica**: cada card tiene micro-oscilación Y (±0.15 unidades) con frecuencia distinta → "suspendidas en gravedad cero".
- **Hover** (mientras la cámara pasa cerca): la card más cercana gana `scale 1.1` + borde violeta más intenso. El cursor cambia a pointer.
- **Salida**: cuando la cámara pasa (card queda detrás), fade-out suave por distancia 3D.

### Distribución en el volumen

Para que la cámara (que ya viene girada mirando +z) encuentre las cards en su camino de vuelta:

```text
  #   Proyecto           Posición (x, y, z)
  01  NEBULA OS          ( 4,  1.5, -50)
  02  AURORA BANK        (-5, -1,   -42)
  03  KRONOS SPORTS      ( 3, -2.5, -34)
  04  VORTEX LABS        (-4,  2,   -26)
  05  HELIOS STUDIO      ( 5, -1,   -18)
  06  MERIDIAN.CO        (-2,  1,   -10)
```

Offsets X/Y distintos a los servicios del Acto I → la cámara serpentea entre cards nuevas al volver.

### Línea de ruta en Acto II

- Se mantiene el `CatmullRomCurve3`, pero ahora conecta los 6 puntos de las cards.
- Color: violeta con opacity 0.2 (más sutil que en Acto I, para no competir con las cards).

### Performance

- `<Html transform>` de drei: un solo DOM root reutilizado, R3F gestiona el reposicionamiento.
- `distanceFactor` calibrado para que las cards mantengan tamaño legible (~6 unidades de ancho a 8 de distancia).
- 6 cards DOM es trivial en términos de carga — mucho más barato que 6 spheres con shader.
- `occlude={false}` → las cards nunca se tapan por los cuerpos celestes del Acto I (que ya están lejos al volver).

---

## Copy de las cards (placeholder narrativo, editable luego)

```text
01 · NEBULA OS       · Plataforma SaaS · 2025
02 · AURORA BANK     · Fintech mobile · 2024
03 · KRONOS SPORTS   · E-commerce · 2024
04 · VORTEX LABS     · Brand system · 2024
05 · HELIOS STUDIO   · Web experience · 2023
06 · MERIDIAN.CO     · Corporate site · 2023
```

Cada una con una descripción corta de 1 línea.

---

## Overlay 2D durante Acto II

Mismo esquema actual, pero el eyebrow pasa de "Pruebas · Cosmos 3D" a "Proyectos · 03 / 06" con el nombre del proyecto más cercano debajo, en Arkitech 12px. Pequeño detalle que ancla cada card.

---

## Archivos

**Editado**
- `src/components/ServicesProjectsJourney.tsx` — reemplazar los 6 cuerpos celestes del Acto II por 6 cards 3D con `<Html transform>`. Ajustar línea de ruta de Acto II. Entrada escalonada, flotación orgánica, billboard.

**Sin tocar**
- Acto I (servicios). Pivote magenta. Rotación 180°. Flash. Overlay 2D base. V2/V3/V4. Hero, Manifiesto, About, Footer V2.

