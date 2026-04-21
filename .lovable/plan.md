

# Plan: Acto II como cards planas estilo V4 + reposicionar Software/SaaS

Dos cambios quirúrgicos en `ServicesProjectsJourney.tsx`, sin tocar nada más.

---

## 1. Acto II — Reemplazar planetas 3D por cards planas que desplazan (estilo V4)

**El problema actual**: los planetas del Acto I siguen visibles al fondo durante el Acto II, y las cards `<Html transform>` compiten con ellos. La imagen que mostraste lo confirma: planetas violetas atrás, card "PUBLICIDAD" cortada adelante.

**La solución**: durante el Acto II el Canvas 3D se oculta por completo y aparece un **overlay 2D con cards deslizándose**, exactamente como hace `ProjectsWarp` en V4 — pero integrado en la misma sección sticky del viaje (sin agregar scroll extra).

### Mecánica

- Un nuevo componente interno `ProjectsOverlay` se renderiza **fuera del Canvas**, como capa DOM absoluta sobre el sticky stage.
- Se activa cuando `progress >= INFLEXION_END` (0.58).
- Mapea el sub-progress local (0.58 → 1.00) a un valor `0 → 6` que avanza por las 6 cards.
- Cada card se mueve en Z (translateZ de -2200 a +200) con perspective 1200px — idéntico a V4 `ProjectsWarp`.
- Opacidad escalonada: card visible solo cuando está en su "ventana" de progress.
- Imágenes: reutilizo las 6 que ya están en `src/assets/projects/`.

### Canvas 3D durante Acto II

- Durante Acto II el Canvas entero fade-outea a opacity 0 entre progress 0.56 → 0.62. Así los planetas del Acto I **desaparecen** y las cards del Acto II quedan solas sobre el starfield global.
- El pivote magenta y su flash siguen apareciendo dentro de la ventana de inflexión (sin conflicto, el fade empieza recién al final de la rotación).
- Las 6 `ProjectCard` 3D actuales (`<Html transform>`) se **eliminan** del componente. Se van también sus constantes `PROJECTS` como cuerpos en el Canvas (quedan solo como data para el overlay 2D).
- La `RouteLine` también corta en el pivote (ya no conecta los proyectos 3D). Se ajusta para que termine en el pivote y no en `(0,0,0)` de retorno.

### Estructura final del componente

```text
<section sticky 900vh>
  <Canvas 3D>                        ← fade out durante Acto II
    - SERVICES (planetas) ✓
    - PIVOT (planeta magenta) ✓
    - RouteLine (solo ida) ✓
    - Labels de servicios ✓
    - Starfield ambient ✓
  </Canvas>

  <ProjectsOverlay 2D>               ← nuevo, aparece en Acto II
    - 6 cards con translate3d Z       ← idéntico a ProjectsWarp V4
    - imágenes, título, categoría, año
    - esquinas decorativas HUD
  </ProjectsOverlay>

  <2D overlay existente>             ← sin cambios
    - eyebrow "Capacidades" / "Pruebas"
    - contador 01/06
    - barra de progreso
</section>
```

### Eyebrow y contador en Acto II

- Se mantienen donde están, pero el número ahora se calcula sobre el avance del overlay 2D (qué card está en la ventana central), no sobre la cámara 3D.
- Texto del eyebrow en Acto II: `"Pruebas · Atravesando el espacio"` (matcheando el lenguaje de V4).

---

## 2. Acto I — Software / SaaS más centrado

Posición actual: `[6, 3, -36]` — queda muy a la derecha y muy arriba, fuera del viewport en resoluciones medianas, y el label se recorta.

Nueva posición: `[3, 1.5, -36]` — más hacia el centro, altura más cercana al eje de la cámara. La cámara pasa más cerca → el texto se lee completo.

El resto de los servicios quedan exactamente como están.

---

## Archivos

**Editado**
- `src/components/ServicesProjectsJourney.tsx`:
  - Eliminar `ProjectCard` (componente `<Html transform>` y su uso).
  - Agregar `ProjectsOverlay` como DOM 2D absoluto sobre el sticky stage.
  - Fade del Canvas a opacity 0 durante Acto II.
  - Ajustar `RouteLine` para cortar en el pivote.
  - Reposicionar Software/SaaS a `[3, 1.5, -36]`.
  - Ajustar textos del eyebrow 2D en Acto II.

**Sin tocar**
- V2, V3, V4, `ProjectsWarp.tsx` original (lo uso como referencia, no como dependencia).
- Hero, Manifiesto, About, Footer V2, starfield global.
- Assets de imágenes (ya existen).

