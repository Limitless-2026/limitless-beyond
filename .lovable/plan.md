

# Plan: Explosión cinemática al entrar al footer de V3

## Concepto
El footer no aparece "directamente" — lo precede un **estallido** del mismo lenguaje visual que el del hero de V2 (flash blanco + colapso/expansión radial), pero esta vez como **cierre**: el universo vuelve a contraerse en un punto de luz violeta y explota, revelando el footer detrás.

Es el mismo gesto narrativo que el del hero, pero invertido: en el hero atravesás la luz para entrar al universo; en el footer, el universo colapsa en un punto que estalla y te entrega al cierre.

## Mecánica (todo dentro del sticky stage del footer)

El `CosmicFooter` actual mantiene su altura de `180vh` y su sticky de `100vh`, pero se reorganiza el rango de progreso para meter una **fase 0 de explosión** antes de las capas de contenido:

```text
Progreso del sticky (0 → 1)

[ 0.00 → 0.10 ]  COLAPSO
  Pantalla casi negra. Un punto de luz violeta diminuto
  aparece en el centro y se contrae (scale 1 → 0.4),
  acompañado de un anillo concéntrico que se cierra
  hacia el centro (radial-gradient con stops dinámicos).
  Vibración sutil del punto (translate ±1px en RAF).

[ 0.10 → 0.16 ]  CARGA
  El punto pulsa, se intensifica (box-shadow violeta
  crece de 20px a 200px). Aparece un destello cromático
  alrededor (ring violeta + ring magenta desfasado 1 frame).

[ 0.16 → 0.22 ]  ESTALLIDO
  - Flash blanco a pantalla completa (mismo lenguaje
    que V2: opacity pico 1.0, curva pow(1-d/w, 1.6)).
  - Onda expansiva: radial-gradient violeta que se
    expande de 0% a 150% del viewport en 6% de progreso
    (se siente instantáneo).
  - 12 "esquirlas" lineales (divs 1px de alto, 40-120px
    de ancho) salen radialmente desde el centro hacia
    los bordes con translate + rotate, opacidad 1 → 0.
    Hechas con CSS transforms puros.

[ 0.22 → 0.30 ]  POLVO ESTELAR
  Quedan ~8 partículas blancas suspendidas que se
  apagan lentamente. El fondo del footer (negro) ya
  está estable. Es el "después de la explosión".

[ 0.25 → 1.00 ]  CONTENIDO DEL FOOTER
  Las capas actuales (eyebrow, pregunta, CTA, wordmark,
  meta) se reescalan a este nuevo rango y entran como
  hoy, pero arrancando 0.25 en vez de 0.0.
  La pregunta "¿LISTOS PARA CRUZAR?" gana peso
  porque viene justo después del estallido.
```

### Detalles de craft
- **Punto de colapso**: un único `<div>` centrado con `border-radius: 50%`, `background: radial-gradient(circle, #fff 0%, #7B2FFF 40%, transparent 70%)`, animado con `transform: scale()` + `box-shadow` interpolado por progreso. Sin canvas.
- **Anillo concéntrico de cierre**: `border` de un div con `border-radius: 50%`, `width/height` interpolados de `200vw` a `0vw`, opacidad de 0 a 0.4. Da la sensación de que el universo se "succiona" hacia el centro.
- **Flash blanco**: idéntico al de V2 (mismo `flashCenter / flashWidth / pow(1-d/w, 1.6)`) pero centrado en `0.19` con ancho `0.04`. Reusa exactamente la fórmula que ya conocés.
- **Onda expansiva violeta**: un div `position: absolute`, `border-radius: 50%`, `width/height` interpolados de `0` a `300vmax`, `background: radial-gradient(circle, transparent 40%, rgba(123,47,255,0.4) 60%, transparent 80%)`. Da la sensación de "shockwave".
- **Esquirlas**: 12 `<span>` generados estáticamente, cada uno con un `--angle` CSS custom property y un `transform: rotate(var(--angle)) translateX(distance)`. La distancia se interpola por progreso. CSS-only, cero JS por frame.
- **Polvo estelar post-estallido**: 8 puntos blancos pequeños con `animation: twinkle-fade` (CSS keyframe) que se montan solo cuando el progreso entra en su rango y se desmontan al salir, para no tenerlos vivos siempre.
- **Easing**: la fase de colapso usa `cubic-bezier(0.4, 0, 1, 1)` (acelera al final, simula gravedad). El estallido es lineal puro (instantáneo). El polvo usa `cubic-bezier(0, 0, 0.2, 1)` (sale rápido, frena suave).

### Continuidad con el resto de la página
- El `StarfieldParallax` global ya está visible en este punto del scroll. Durante la fase de colapso `[0 → 0.16]`, lo atenuamos progresivamente con un overlay negro que crece (`opacity 0 → 1`) — refuerza la sensación de "todo se va al punto". En `[0.22 → 0.30]` el overlay se mantiene negro (estamos dentro del footer), no necesita volver.
- El cambio de rango del contenido (de `[0 → 1]` a `[0.25 → 1]`) implica reescalar las cuatro ventanas existentes (`eyebrowP`, `ctaP`, `wordmarkP`, `metaP`) y la del stagger de la pregunta. Es proporcional, sin tocar el orden ni los textos.

### Performance
- Todo el efecto es **CSS transforms + opacity** sobre 1 listener compartido (`useScrollProgress` ya existente). No agrega RAF nuevos, no agrega canvas, no agrega React state.
- Las esquirlas y el polvo se montan/desmontan condicionalmente por rango de progreso, no están vivos durante todo el scroll.
- `will-change: transform, opacity` puntual en el punto, el anillo y la onda — se quita cuando salen de su ventana activa.

## Archivos
- **Editado**: `src/components/CosmicFooter.tsx` — agregar la fase 0 de estallido antes de las capas existentes y reescalar las ventanas de contenido al rango `[0.25 → 1]`.
- **Sin tocar**: nada más. V2 queda exactamente como está. La explosión es exclusiva de V3.

