

# Plan: Hacer que el giro 180° SE SIENTA

El problema: el Canvas hace fade a 0 justo cuando arranca el giro, entonces la rotación ocurre sobre un espacio vacío (starfield estático) → visualmente no se percibe el giro. El movimiento de 180° necesita **algo que rote** para ser sentido.

## Solución: starfield rotante + pivot que expresa el giro

Tres capas trabajando juntas durante la inflexión (0.42 → 0.58):

### 1. Starfield DOM rotando con el yaw

Agregar un contenedor con estrellas (puntos generados con `box-shadow`) que **rota con el progreso del giro**. Entre `progress 0.42 → 0.58` gira de 0° a 180°. Eso es lo que el ojo va a leer como "giro de cámara".

- `transform: rotate(...)` aplicado a un `<div>` con ~200 estrellas distribuidas.
- Z-index entre el Canvas (que ya se apagó) y el pivote magenta.
- Solo visible durante la transición y primeros frames del Acto II (fade-in/out).

### 2. Motion blur radial en el pivote

El pivote magenta actual es estático en el centro. Para expresar el giro, le agrego:
- Anillos concéntricos que rotan en sentido contrario al starfield (contrarotación → refuerza la sensación de giro).
- Speed lines radiales que se expanden desde el centro (estilo warp).
- Escala que pulsa con el momentum del giro, no solo distancia al centro.

### 3. Vignette giratoria

Un halo oscuro en los bordes que también rota con el yaw — el borde de la pantalla "se mueve" aunque el centro se mantenga anclado al pivote. Sutil pero sumamos la percepción de rotación.

### Timing

```
progress 0.42 → 0.46  : Canvas fade-out + starfield aparece rotando lento
progress 0.46 → 0.54  : giro principal (180° en starfield + contrarotación pivote + speed lines)
progress 0.54 → 0.58  : flash + fade-out del starfield rotante
progress > 0.58       : Acto II (cards)
```

## Archivos

**Editado**
- `src/components/ServicesProjectsJourney.tsx`:
  - Nuevo componente interno `RotatingStarfield` (DOM, CSS box-shadow stars).
  - `PivotPoint2D` enriquecido: anillos contrarrotantes + speed lines.
  - Cálculo del yaw visual (0 → 180°) en base a progress.

**Sin tocar**
- Canvas 3D, servicios, cards del Acto II, flash, timing general de fases.

