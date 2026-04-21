

# Plan: Giro 3D a la derecha (no rotación plana)

Entiendo: el giro actual es una **rotación 2D** (como una rueda girando en el plano de la pantalla). Vos querés un giro **3D tipo cámara**, como si la cabeza girara hacia la derecha — el mundo pasa de izquierda a derecha con perspectiva, no dando vueltas circulares.

## Revertir la rotación circular

Quito los tres efectos 2D que agregué en el último cambio:
- `RotatingStarfield` con `transform: rotate()` → fuera.
- Anillos contrarotantes en el pivote → fuera.
- Vignette giratoria → fuera.
- Speed lines con `conic-gradient` → fuera.

## Nuevo: giro 3D horizontal (cámara pan a la derecha)

Reemplazo por una capa con **perspectiva CSS 3D** que simule el giro de cámara:

### Capa de estrellas con `rotateY`

- Contenedor padre con `perspective: 1200px`.
- Hijo con `transform: rotateY(...)` que va de **0° → 180°** entre progress `0.42 → 0.58`.
- Dentro del hijo, ~150 estrellas distribuidas en un plano ancho (3x viewport) para que al rotar se vean pasar de izquierda a derecha con profundidad real.
- Sentido del giro: **negativo** (`rotateY(-180deg)`) → las estrellas pasan hacia la derecha desde la perspectiva del usuario (la cámara gira a la derecha = el mundo se mueve a la izquierda relativo a la vista, pero por el pivote central se lee como pan a la derecha).

### Motion lines horizontales

Durante el pico del giro (0.46 → 0.54), líneas horizontales tenues que se desplazan de izquierda a derecha (tipo streak de velocidad lateral). Refuerzan la dirección del pan.

### Pivote magenta: escala simple

Vuelvo al pivote original sin anillos rotantes. Solo un punto magenta que crece y se desvanece — mantiene el ancla visual sin competir con el giro 3D.

### Timing

```
progress 0.40 → 0.46  : Canvas 3D fade-out + starfield 3D aparece
progress 0.42 → 0.58  : rotateY 0° → 180° (giro de cámara a la derecha)
progress 0.46 → 0.54  : motion lines horizontales (pico del giro)
progress 0.54 → 0.60  : starfield 3D fade-out + flash
progress > 0.58       : Acto II (cards)
```

## Archivos

**Editado**
- `src/components/ServicesProjectsJourney.tsx`:
  - Eliminar `RotatingStarfield` con rotate 2D, anillos contrarotantes, vignette giratoria, conic speed lines.
  - Agregar `Camera3DTurn` (contenedor con `perspective` + hijo con `rotateY`).
  - Agregar motion lines horizontales con `translateX` animado.
  - `PivotPoint2D` vuelve a su versión simple (glow radial + escala).

**Sin tocar**
- Canvas 3D, servicios, cards Acto II, flash, fases y timing general.

