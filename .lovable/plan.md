

# Plan: Unificar Servicios + Proyectos en un solo viaje 3D retrógrado

Tenés razón — con `ServicesCosmos` (3D) y `ProjectsWarp` (lineal horizontal) seguidos, la sección se siente repetida: dos "constelaciones" pegadas, cada una pidiendo su propio momento de atención. La solución más fuerte narrativamente es **unificarlas en una sola secuencia continua** donde el usuario atraviesa primero los servicios y después los proyectos en el mismo volumen 3D, pero con una **inversión de dirección** que genera tensión.

---

## Concepto

**Un solo viaje. Dos actos.**

- **Acto I — CAPACIDADES** (lo que podemos hacer): la cámara avanza hacia adelante en el cosmos, encontrando 6 cuerpos-servicio.
- **Punto de inflexión**: la cámara llega a un "horizonte" — un cuerpo magenta masivo (pivote narrativo). Se frena, gira 180°.
- **Acto II — PRUEBAS** (lo que ya hicimos): la cámara **vuelve hacia atrás** atravesando el mismo cosmos pero descubriendo 6 cuerpos nuevos — los proyectos — que estaban "detrás" todo el tiempo. El viaje de vuelta es la evidencia de lo que afirmó el Acto I.

Eso responde exacto a tu intuición: **la web retrocede en esas dos secciones**, pero con sentido — no es ir hacia atrás por ir, es "volver mostrando pruebas".

---

## Por qué funciona

- **Elimina la repetición**: una sola escena 3D, un solo sistema de partículas, una sola cámara. No hay dos "cosmos" seguidos.
- **Narrativa cinematográfica**: ida (promesa) → giro (revelación) → vuelta (evidencia). Clásico y muy reconocible.
- **Jerarquía de marca**: el único cuerpo magenta (`#C8007A`) es el pivote en el medio del viaje — respeta la regla "aparece UNA sola vez por página".
- **Scroll coherente con Lenis**: un único tramo largo (sticky 100vh sobre contenedor 900vh) con tres fases claras.

---

## Mecánica

```text
Contenedor sticky: 900vh (vs. 500vh + 400vh actuales = 900vh, pero unificados).
progress global: 0 → 1.

[ 0.00 → 0.42 ]  ACTO I — CAPACIDADES
  cámara avanza: z = -progress_local * 55
  serpentea X/Y (sin/cos) — viaje no lineal
  6 servicios distribuidos en z = -8 a z = -50
  overlay 2D: "Capacidades · 01 / 06"

[ 0.42 → 0.58 ]  INFLEXIÓN — HORIZONTE MAGENTA
  cámara se frena gradualmente al acercarse al pivote
  cuerpo magenta central (en z = -55) crece ocupando el FOV
  micro-flash blanco al "atravesarlo"
  cámara rota 180° en yaw (π radianes) durante este tramo
  overlay 2D: transición "Capacidades" → "Pruebas"
  (texto fade-out + fade-in con 200ms de silencio)

[ 0.58 → 1.00 ]  ACTO II — PRUEBAS
  cámara vuelve: z va de -55 hacia -5 (dirección invertida)
  ahora mira hacia +z, los cuerpos pasan de atrás hacia adelante
  6 proyectos distribuidos en el MISMO volumen pero en
    posiciones X/Y distintas a los servicios (no se solapan)
  overlay 2D: "Pruebas · 01 / 06"
  al final, cámara frena y el último proyecto queda
  centrado → transición natural al About
```

---

## Componente único: `ServicesProjectsJourney.tsx`

Reemplaza a `ServicesCosmos` + `ProjectsWarp` en V5. Un solo Canvas R3F:

- **Cámara controlada por `useScrollProgress`**: tres rangos de progreso, tres comportamientos.
- **12 cuerpos celestes** distribuidos en el volumen (6 servicios z: -8 a -50, 6 proyectos z: -50 a -5 en la vuelta con offsets X/Y distintos).
- **1 pivote magenta** en z = -55, tamaño grande (escala 2.2), único uso de `#C8007A`.
- **Starfield único**: `<Points>` con ~1200 partículas cubriendo todo el volumen.
- **Línea de ruta**: Bezier 3D que dibuja el camino de ida Y el camino de vuelta (se colorea progresivamente).
- **Overlay HTML** (drei `<Html>`): labels de cada cuerpo, fade por distancia 3D. Los servicios muestran copy de V4. Los proyectos muestran los 6 proyectos del `ProjectsWarp` actual.
- **Overlay 2D fijo**: eyebrow ("Capacidades" / "Pruebas"), contador (01/06), barra de progreso de la sección.

### Cámara — detalle de la rotación

Durante el tramo 0.42→0.58:
- `yaw` interpola de 0 a π con easing `cubic-bezier(0.7, 0, 0.3, 1)`.
- El punto de `lookAt` gira con ella: mira hacia `z - 5` en la ida, hacia `z + 5` en la vuelta.
- Flash blanco sincronizado en el pico (progress_local 0.5) con `mix-blend-mode: screen`, opacity pico 0.4, ancho 0.04.

### Performance

- Un solo `<Canvas>` reemplaza a dos componentes → menos overhead.
- `frameloop="demand"` fuera del viewport, `"always"` dentro.
- Shaders heredados del `ServicesCosmos` actual (fbm 3 octavas).
- Fallback WebGL → versión 2D lineal apilada (servicios + proyectos de V4) si no hay soporte.

---

## Qué se elimina y qué se preserva

**Se elimina de V5**:
- `<ServicesCosmos />` aislado.
- `<ProjectsWarp />` aislado.
- El espaciador de `80vh` entre ambos.

**Se preserva**:
- Copy de los 6 servicios (de `ServicesNebula`/`ServicesCosmos`).
- Copy y metadata de los 6 proyectos (de `ProjectsWarp`).
- Hero, Manifiesto, About, Footer V2 — todo intacto.
- V2, V3, V4 sin tocar.

---

## Archivos

**Nuevo**
- `src/components/ServicesProjectsJourney.tsx` — escena R3F única con los dos actos + inflexión.

**Editado**
- `src/pages/V5.tsx` — reemplazar `<ServicesCosmos /> + <ProjectsWarp />` por `<ServicesProjectsJourney />`. Ajustar spacers.

**Sin tocar**
- Todo lo demás. V2/V3/V4 intactos. Hero, Manifiesto, About, Footer V2 de V5 intactos.

