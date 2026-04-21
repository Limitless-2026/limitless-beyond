

# Plan: Planetas desaparecen ANTES del giro — el Acto II es solo cards

Entendido el matiz: no querés ver planetas durante la rotación. El giro 180° debe ocurrir sobre un espacio ya vacío → cuando la cámara termine de rotar, solo aparecen las cards. Los mundos son exclusivos del Acto I.

---

## Cambio único en `ServicesProjectsJourney.tsx`

### Fade del Canvas 3D adelantado al inicio del giro

**Rangos nuevos**:
```text
progress < 0.40  → Canvas opacity 1   (Acto I: serpenteo entre planetas)
0.40 → 0.46      → Canvas fade 1 → 0  (planetas desaparecen ANTES de girar)
0.46 → 0.58      → Canvas opacity 0   (giro + flash sobre vacío limpio)
progress > 0.58  → Canvas opacity 0   (Acto II: solo cards 2D)
```

**Narrativa resultante**:
1. Serpenteo por los 6 servicios (planetas visibles).
2. Al llegar al último servicio, los planetas empiezan a desvanecerse rápido.
3. Canvas completamente invisible → el giro 180° ocurre sobre el starfield global solo.
4. Flash blanco marca el momento de inflexión.
5. Aparecen las cards 2D deslizándose.

El pivote magenta y el flash siguen dentro del Canvas pero se los reemplaza con overlays 2D DOM para que sigan siendo visibles durante el giro:

- **Flash blanco**: ya existe como overlay 2D (`flashOpacity` DOM) → se mantiene.
- **Pivote magenta**: se elimina del Canvas 3D. En su lugar, un **punto magenta 2D centrado** (`div` con glow radial) aparece entre progress 0.42 → 0.56, escala 0 → grande → 0. Cumple la misma función narrativa ("atravesás el horizonte") sin necesidad del Canvas.

### Eyebrow durante el giro

Durante la fase `transition` (0.42 → 0.58) el eyebrow hace fade-out total a opacity 0. Vuelve recién en Acto II con el texto de proyectos.

### Cierre limpio del Acto II

- Cards con `l > 0.9` → `visibility: hidden` + opacity dura a 0 (sin cola de borde residual).
- `progress > 0.96` → `ProjectsOverlay` entero fade-out a 0 en 4% → cierre negro limpio hacia About.

---

## Estructura final

```text
<section sticky 900vh>
  <Canvas 3D>                    ← opacity: 1 → 0 entre 0.40 y 0.46
    - Servicios (planetas)
    - RouteLine hasta el pivote
    - Labels de servicios
  </Canvas>

  <PivotPoint2D />               ← nuevo, div magenta centrado, solo en transición
  <FlashOverlay2D />             ← ya existe, se mantiene
  <ProjectsOverlay2D />          ← cards deslizando, Acto II

  <EyebrowOverlay />             ← fade 0 durante transición
</section>
```

---

## Archivos

**Editado**
- `src/components/ServicesProjectsJourney.tsx`:
  - `canvasOpacity`: rangos `0.40 → 0.46` (antes `0.56 → 0.62`).
  - Eliminar el cuerpo `PIVOT` del Canvas 3D (quitar del render 3D).
  - Agregar `PivotPoint2D` como div DOM con glow magenta, visible 0.42 → 0.56.
  - `eyebrowText` y su overlay: opacity 0 durante fase `transition`.
  - `ProjectsOverlay`: cutoff duro `l > 0.9` + fade global `progress > 0.96`.
  - `RouteLine`: termina en la posición donde estaba el pivote (sin cambio estructural, solo visual).

**Sin tocar**
- Posiciones de servicios, shaders, starfield global, flash overlay.
- V2, V3, V4, Hero, Manifiesto, About, Footer V2.

