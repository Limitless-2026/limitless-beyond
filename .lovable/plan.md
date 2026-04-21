

# Plan: Sección "Servicios" cósmica + correcciones de Proyectos

## Parte 1 — Nueva sección de Servicios (entre el hero y proyectos)

### Concepto: "Órbitas de capacidad"
En lugar de una grilla típica de cards de servicios, los servicios se presentan como **órbitas alrededor de un núcleo central** (un punto de luz violeta tipo agujero blanco). Cada servicio es un satélite que **orbita** lentamente y reacciona al mouse. Mantiene exactamente la misma sintonía cósmica:
- Fondo negro profundo, mismo `StarfieldParallax` global.
- Núcleo central pulsante con resplandor violeta/magenta.
- Servicios dispuestos en 2 órbitas (interna + externa) con rotación lenta automática.
- Hover en un servicio → frena la rotación, lo agranda, muestra micro-descripción y subraya con un trazo magenta (uso quirúrgico del color de impacto).
- Tipografía: Arkitech para los títulos cortos de servicio, DM Sans 300 para descripciones.

### Servicios a listar (6, con copy en español)
1. **Diseño Web** — Sitios que sienten el peso de cada pixel.
2. **Desarrollo Web** — Código limpio, performance de élite.
3. **Apps Mobile** — iOS y Android con identidad propia.
4. **Software / SaaS** — Productos digitales escalables a medida.
5. **Branding** — Identidades que rompen la inercia visual.
6. **Publicidad** — Campañas con dirección de arte propia.

### Anclaje narrativo
- Heading superior (eyebrow): `Capacidades · En órbita`
- Título principal: `Todo lo que rompe lo conocido` en Arkitech.
- Después de la órbita, un cierre: `Un solo equipo. Disciplinas que se cruzan.`

### Comportamiento técnico
- Sección con `min-h-[140vh]`, **sticky stage** al estilo `ProjectsWarp` para que el usuario "permanezca" en el sistema solar mientras las órbitas terminan una rotación visible.
- Las órbitas usan `requestAnimationFrame` con un ángulo continuo (no scroll-jacking). El scroll solo controla:
  - Entrada: opacidad y escala del sistema (0 → 1) cuando el sticky entra.
  - Salida: el núcleo se "colapsa" (escala a 0.2 + flash sutil violeta) cuando se acerca el final del sticky → transición natural a Proyectos.
- Mouse parallax: leve inclinación (rotateX/rotateY) del contenedor de órbitas según posición del mouse, igual que el resto del sitio.
- Sin frameworks de animación nuevos — solo React state + RAF + transforms CSS.

### Archivo nuevo
- `src/components/ServicesOrbit.tsx` — toda la sección.

### Cambio en `src/pages/V2.tsx`
- Insertar `<ServicesOrbit />` **entre** el "Vacío estelar" y `<ProjectsWarp />`.
- Mantener `StarfieldParallax visible` para que las estrellas sigan visibles también durante Servicios (cambiar la condición a `scrollProgress > 0.91` ya está bien).

---

## Parte 2 — Correcciones de Proyectos (`ProjectsWarp.tsx`)

### Problema A: el primer proyecto ya se ve antes de entrar al sticky
Cuando todavía estoy en el "vacío estelar" o recién entrando, ya aparece la primera card flotando lejos. Debe estar **invisible** hasta que realmente esté en la capa de proyectos.

**Fix**: cambiar el cálculo de `scrolled` para que use el top del sticky (no el top de la sección entera). Hoy `progress` arranca en 0 ya cuando la sección entra al viewport, por eso la card 0 ya tiene `local = 0` y se ve.
- Aumentar el buffer inicial: pasar de `(raw - 0.3) / 0.7` a `(raw - 0.12) / 0.78` **pero arrancando `progress` desde -1.2** (debajo del umbral de visibilidad). Concretamente: `target = -1.2 + buffered * (PROJECTS.length + 1.2)`.
- Resultado: cuando recién empieza el sticky, `progress = -1.2` → ninguna card es visible (todas tienen `local < -1.2`). Las cards solo aparecen cuando el usuario ya está scrolleando dentro del rango.

### Problema B: al salir del último proyecto se "pega" — no se siente que se puede seguir scrolleando
Después de la última card, el sticky aún ocupa pantalla pero no hay nada visible, así que el usuario no percibe avance.

**Fix doble**:
1. Reducir la altura final extra del sticky: cambiar `height: ${PROJECTS.length * 100 + 50}vh` a `${PROJECTS.length * 100}vh` y dejar que el spacer externo del V2 maneje la transición (subir el `h-[20vh]` final a `h-[60vh]`).
2. Agregar **un indicador de salida** dentro del sticky que aparezca cuando `progress > PROJECTS.length - 0.3`:
   - Texto sutil centrado: `Continuar →` o un guion vertical animado bajando.
   - Opacidad ligada a `progress` para que se sienta el desvanecimiento del último proyecto y la invitación a seguir.
3. Empujar la última card a desaparecer un poco antes (cambiar el corte de salida de `local > 0.7` a `local > 0.55`) para que cuando el progress llegue al final, ya no quede nada visible y el "Continuar" tenga protagonismo.

### Archivo a editar
- `src/components/ProjectsWarp.tsx` — buffer inicial negativo, altura del sticky, fade-out más temprano, indicador de salida.
- `src/pages/V2.tsx` — montar `<ServicesOrbit />` y agrandar spacer final.

---

## Resumen de archivos
- **Nuevo**: `src/components/ServicesOrbit.tsx`
- **Editado**: `src/pages/V2.tsx`, `src/components/ProjectsWarp.tsx`

