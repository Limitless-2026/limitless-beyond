

# Respuesta: Sí, mundos y cards están totalmente separados

Confirmado mirando el estado actual de `ServicesProjectsJourney.tsx`:

## Acto I — Mundos (Servicios)
- Visible mientras `progress < ~0.42`.
- Los planetas/mundos 3D viven dentro del `Canvas` de Three.js (`Scene` con servicios orbitando).
- Tienen su propio fade-out **antes** de que arranque el giro de cámara → cuando empieza la inflexión, los mundos ya no están en pantalla.

## Inflexión (0.42 → 0.58)
- Espacio vacío: solo el starfield global de fondo + el pivote magenta 2D + el flash blanco.
- Sin mundos, sin cards. Es el "blackout" narrativo entre actos.

## Acto II — Cards (Proyectos)
- Aparece después de `progress > ~0.58` vía `ProjectsOverlay`.
- Son cards 2D (DOM), nada que ver con la geometría 3D del Acto I.
- Nunca coexisten con los mundos.

## Conclusión

La separación está intacta:
```
Mundos 3D  →  [vacío + giro + flash]  →  Cards 2D
   Acto I         Inflexión              Acto II
```

No hace falta tocar nada para mantener esa diferenciación. Si querés que avance con el plan pendiente (revertir escenografía 360° del giro + rediseñar el menú a la derecha), decime "dale" y lo aplico.

