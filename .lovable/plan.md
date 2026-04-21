

# Plan: Sección "Sobre Limitless" (después de Proyectos) + nueva sección de cierre

## Ajuste clave
La sección de manifiesto va **después** de Proyectos, no antes. Y agregamos una sección final más antes del footer para cerrar el viaje con fuerza.

---

## Parte 1 — "Sobre Limitless" (después de Proyectos)

### Concepto: "Constelación manifiesto"
Después del warp de proyectos, el universo se calma. El usuario llega a una zona contemplativa donde ~14 estrellas se conectan progresivamente formando una "L" estilizada (Limitless), mientras el manifiesto se compone palabra por palabra encima.

### Flujo (sticky stage ~280vh)

```text
[ 0.00 → 0.15 ]  Aparecen ~14 estrellas dispersas, sin líneas
[ 0.15 → 0.40 ]  Se conectan secuencialmente formando una "L" sutil
[ 0.20 → 0.45 ]  Bloque 1: "Somos un estudio de diseño y desarrollo
                  digital con base en Argentina y mirada global."
[ 0.45 → 0.70 ]  Bloque 2: "No hacemos sólo sitios — creamos
                  experiencias que transforman marcas."
                  (palabra "transforman" en gradiente violeta)
[ 0.70 → 0.92 ]  Bloque 3: "Estrategia, craft y tecnología.
                  Para que cada lanzamiento se sienta inevitable."
[ 0.92 → 1.00 ]  La constelación se desvanece; aparece micro-cierre:
                  "Si tu idea pide romper moldes, es el tipo de brief
                   que nos entusiasma."
```

### Detalles de craft
- Canvas 2D (no WebGL) con DPR-aware. ~14 estrellas: 7 forman la "L", 7 de relleno.
- Líneas de la L: trazo 1px en `--color-accent`, opacidad 0.35, aparecen secuencialmente entre 18% y 38%.
- Stagger de palabras a 60ms (no por carácter — más elegante).
- Mouse parallax sutil sobre las estrellas (rotateX/Y máx 4°). Las palabras quedan fijas.
- Twinkle de estrellas con `requestAnimationFrame` continuo y barato.
- **Magenta** (`--color-impact`): aparece UNA vez como línea horizontal 60px debajo de la última palabra del cierre.

### Tipografía
- Eyebrow: `Sobre nosotros · Capítulo III` en DM Sans, `text-[10px]` tracking 0.4em.
- Manifiesto: DM Sans 300, `text-2xl md:text-4xl lg:text-5xl`, leading relajado.
- Palabras destacadas: gradiente `from-foreground via-primary to-foreground` (mismo que el hero).

---

## Parte 2 — "Llamada al vacío" (nueva, antes del footer)

### Concepto: "El umbral"
Después del manifiesto, el viaje necesita un cierre con peso. En vez de un CTA de agencia genérico ("Contactanos"), montamos un **portal**: un círculo de luz violeta que crece con el scroll hasta llenar la pantalla, dentro del cual aparece la invitación final.

### Flujo (sticky stage ~150vh)

```text
[ 0.00 → 0.30 ]  Punto de luz violeta diminuto centrado en pantalla.
                  Eyebrow arriba: "Capítulo final · El umbral"
[ 0.30 → 0.65 ]  El punto crece a círculo grande con halo difuso.
                  Aparece pregunta: "¿Listos para cruzar?"
                  (Arkitech, mayúsculas, tracking extremo)
[ 0.65 → 0.90 ]  El círculo se expande hasta casi llenar el viewport.
                  Sub-copy en DM Sans: "Contanos qué querés romper."
                  Aparece CTA real: botón outline "Iniciar contacto →"
                  que enlaza a /contacto.
[ 0.90 → 1.00 ]  El portal se estabiliza, queda visible y se entrega
                  al footer con un fade suave.
```

### Detalles
- Portal hecho con `radial-gradient` + `box-shadow` masivo en violeta (sin shaders, sin canvas).
- El CTA es un `<a>` real a `/contacto` (o `#contacto`) — primer elemento clickeable de la página después del nav.
- Mouse parallax: el portal se desplaza 8px máximo siguiendo al mouse, da sensación de "respira".
- Dentro del portal, una animación de partículas mínimas (5-6 puntos rotando lento) hechas con CSS `@keyframes` puro.
- El botón usa `--color-accent` en hover (relleno) — **no** magenta, porque el magenta ya se gastó en la sección anterior.

### Tipografía
- Eyebrow: DM Sans, `text-[10px]` tracking 0.4em.
- "¿Listos para cruzar?": Arkitech, `text-5xl md:text-7xl lg:text-8xl`, tracking 0.15em.
- Sub-copy: DM Sans 300, `text-base md:text-lg`, opacidad 70.
- Botón: DM Sans 400, `text-sm`, tracking 0.2em, padding generoso, border 1px.

---

## Continuidad narrativa

```text
Hero → Servicios → Proyectos → Sobre Limitless → Umbral → Footer
nebulosa  órbitas    warp        constelación     portal    cierre
```

Cada sección hereda el lenguaje cósmico y entrega visualmente a la siguiente. El `StarfieldParallax` global sigue presente como fondo en todas las secciones post-hero (ya está activado a partir de `scrollProgress > 0.91` en V2 — habrá que ajustar ese umbral si hace falta para que cubra hasta el final).

---

## Archivos

- **Nuevo**: `src/components/AboutConstellation.tsx` — manifiesto con Canvas 2D y stagger por palabra.
- **Nuevo**: `src/components/PortalCTA.tsx` — sección del umbral con portal violeta y CTA.
- **Editado**: `src/pages/V2.tsx` — montar `<AboutConstellation />` después de `<ProjectsWarp />` y `<PortalCTA />` antes del footer; ajustar spacers (`h-[20vh]` entre secciones) y revisar el umbral del `StarfieldParallax` para que siga visible hasta el portal.

