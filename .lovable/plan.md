

# Plan: alinear V6 al sistema de scroll de V5

Entiendo perfecto. La V6 tiene que comportarse exactamente como V5 — mismo viaje espacial con scroll, hero que se atraviesa, transición a la parte terrestre — y solo cambia que la sección de Servicios usa los planetas interactivos magnéticos (lo único que mejoramos). Después siguen Proyectos, About y Footer igual que V5.

---

## Diagnóstico

Comparé `V5.tsx` y `V6.tsx`:

- **V5** tiene el flujo completo: hero WebGL con scroll progresivo (3.5 viewports), 3 secciones de texto que se atraviesan con clip-path/opacity, transición a fondo negro, **`ServicesProjectsJourney`** (servicios + proyectos integrados en un mismo journey con su propio scroll), About y Footer.
- **V6** actual tiene casi lo mismo PERO:
  1. Reemplazó `ServicesProjectsJourney` por `ServicesPlanetsInteractive` suelto.
  2. Perdió la sección de **Proyectos** del journey (porque `ServicesProjectsJourney` traía las dos cosas juntas).
  3. Quedó con un layout más corto y sin la parte de proyectos del home.

El usuario quiere: **scroll idéntico a V5**, los planetas magnéticos solo reemplazan el bloque de "servicios" dentro de ese flujo, y después debe seguir la parte de proyectos del home como en V5.

---

## Cambios

### `src/pages/V6.tsx` — reescribir tomando V5 como base

- Copiar la estructura completa de `V5.tsx` 1:1 (hero WebGL, las 3 secciones de texto con scroll progress, el fondo negro de transición, About, Footer, badge `Limitless · v6`).
- En lugar de `<ServicesProjectsJourney />`, montar:
  1. **`<ServicesPlanetsInteractive />`** — la sección nueva de servicios con planetas magnéticos clickeables y modal.
  2. **Bloque de Proyectos del home** — la misma vista de proyectos que V5 mostraba dentro de `ServicesProjectsJourney`, pero como sección independiente. Para no duplicar lógica, extraer/reusar el bloque de proyectos: render simple de las primeras 3 entradas de `PROJECTS` con título grande, número, cover y link a `/proyectos/:slug`. Misma estética editorial que la página `/proyectos`, condensada al home.
- Mantener el sistema de `scrollProgress`, `fadeInOut`, capas fijas con `opacity` por scroll, `StarfieldParallax`, flash, badge — todo idéntico a V5.

### `src/components/ServicesPlanetsInteractive.tsx` — sin cambios estructurales

Funciona como ya está. Solo se asegura de que su contenedor en V6 lo monte como sección normal con su propio espacio (`min-h-screen`), no como overlay fijo. Se monta DESPUÉS del bloque hero+textos (cuando `scrollProgress > 0.95` y la nebulosa se desvanece), igual que V5 hace con `ServicesProjectsJourney`.

### Nuevo componente: `src/components/ProjectsHomePreview.tsx`

Bloque liviano de proyectos para el home (V5 ya lo tenía dentro del Journey; lo extraemos a su propio componente para que tanto V5 como V6 puedan usarlo limpio si quisieran).
- Eyebrow `PROYECTOS · 04` violeta.
- H2 grande Arkitech: `CASOS EN ÓRBITA`.
- 3 proyectos en formato compacto (número + título + cover pequeño + link).
- CTA: `VER TODOS LOS PROYECTOS →` que lleva a `/proyectos`.
- Misma paleta y tipografía editorial.

(No tocamos `ServicesProjectsJourney` ni V5 — queda intacto.)

---

## Resumen de archivos

**Editado**
- `src/pages/V6.tsx` — reescrito sobre la base de V5, con planetas + bloque de proyectos en el lugar correcto.

**Nuevo**
- `src/components/ProjectsHomePreview.tsx` — bloque de proyectos del home, reutilizable.

**Sin tocar**
- V5, hero WebGL, ServicesPlanetsInteractive, ServiceModal, Proyectos page, ProyectoDetalle, About, Footer, menú, scroll provider.

---

## Resultado

V6 = misma experiencia de viaje espacial que V5 (idéntico scroll, idénticas transiciones, idéntico hero), pero al llegar a la "tierra" después del portal:
1. **Servicios** ahora son 6 planetas magnéticos clickeables con modal (la mejora pedida).
2. **Proyectos** aparecen como en V5 (preview de 3 con link a la constelación completa).
3. **About** y **Footer** igual.

