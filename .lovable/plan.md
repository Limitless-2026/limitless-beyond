

# Plan: Limpiar el fondo de la sección de proyectos

## Problema
1. En `ProjectsWarp.tsx` hay una capa de "warp stars" que vuelan hacia el viewer (efecto hyperspace) — al usuario no le gusta.
2. En `StarfieldParallax.tsx` las tres capas se trasladan en `Y` negativo cuando hace scroll, así que las estrellas "se mueven para arriba" durante el scroll de proyectos.

## Cambios

### 1. `src/components/ProjectsWarp.tsx` — eliminar warp stars
- Borrar el bloque JSX completo de warp-stars (el `<div>` con perspectiva que renderiza `warpStars.map(...)`).
- Borrar el `useMemo` de `warpStars`, la interfaz `WarpStar` y el helper `seeded` (queda sin usar).
- Borrar el state `warpTime` y todo lo que lo actualiza dentro de `tick` (incluido el `requestAnimationFrame` continuo "para mantener loop suave"). Dejar el RAF solo mientras `current !== target` para que pare cuando no se scrollea.
- El fondo durante proyectos queda solo con el `StarfieldParallax` global (que ya está fijo full-screen detrás).

### 2. `src/components/StarfieldParallax.tsx` — estrellas de fondo quietas
- Eliminar el efecto de parallax vertical: las estrellas no deben moverse cuando se hace scroll en proyectos.
- Quitar el `useEffect` con `window.addEventListener("scroll", ...)` y los `style.transform = translate3d(...)` sobre los refs.
- Mantener las tres capas (far / mid / near) y el `sf-twinkle` (titileo) — eso da vida sin movimiento.
- Los refs (`farRef`, `midRef`, `nearRef`) se pueden eliminar ya que no se usan.
- El contenedor sigue `fixed inset-0` con el fade de visibilidad por `prop visible`.

## Archivos a editar
- `src/components/ProjectsWarp.tsx` — quitar capa de warp stars y código asociado.
- `src/components/StarfieldParallax.tsx` — quitar parallax de scroll, dejar estrellas estáticas con titileo.

