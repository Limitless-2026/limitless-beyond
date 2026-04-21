

# Plan: Refinar explosión + simplificar meta + integrar Lenis

## 1. Explosión más pausada y "nebulosa" (footer V3)

Se estiran las fases para que el estallido respire y se sienta como una **nebulosa que colapsa y renace**, alineada con el lenguaje del hero.

```text
[ 0.00 → 0.18 ]  COLAPSO LENTO
  Punto violeta vibra suave en el centro.
  Anillo concéntrico se cierra con cubic-bezier(0.6, 0, 0.4, 1).
  3 halos nebulosos (radial-gradients violetas con blur 40px,
  escalas 1.2 / 0.8 / 0.5) se contraen junto al punto:
  sensación de gas estelar siendo absorbido.

[ 0.18 → 0.28 ]  CARGA PROLONGADA
  Punto pulsa lento (2 ciclos de respiración).
  Glow violeta crece de 40px a 280px.
  Halo magenta sutil desfasado → aberración cromática orgánica.

[ 0.28 → 0.36 ]  ESTALLIDO EN DOS TIEMPOS
  - Pre-flash blanco suave (pico opacity 0.6).
  - Shockwave violeta: 0 → 250vmax en 8% de progreso.
  - 12 esquirlas con offset escalonado 0–30ms (no todas a la vez).
  - Flash blanco final width 0.06, curva pow(1-d/w, 2.2) (caída suave).

[ 0.36 → 0.48 ]  POLVO Y NEBULOSA RESIDUAL
  Esquirlas se desvanecen.
  8 partículas blancas + 2 nubes violetas blureadas derivan y se apagan.

[ 0.45 → 1.00 ]  CONTENIDO DEL FOOTER
  Capas existentes reescaladas a este rango.
  La pregunta gigante gana peso por venir del silencio post-explosión.
```

Easings: colapso `cubic-bezier(0.6, 0, 0.4, 1)`, estallido `(0.25, 0.1, 0.25, 1)`, residual `(0, 0, 0.2, 1)`.

## 2. Meta-footer simplificado

Quitamos las 4 columnas (Estudio · Servicios · Contacto · Redes) y el email suelto. La capa 5 queda:

```text
              [ INICIAR CONTACTO → ]              ← CTA (sin cambios)

  L  I  M  I  T  L  E  S  S                        ← Wordmark de fondo

  ── (línea magenta 60px)

  © 2026 LIMITLESS · BUENOS AIRES   LOS LÍMITES ESTÁN PARA ROMPERSE
```

- Año actualizado a **2026**.
- Meta en DM Sans 300, `text-xs`, tracking 0.2em uppercase.
- Mismo clip-path reveal de la capa 5, ahora más limpio.

## 3. Lenis — smooth scroll global

Integramos `@studio-freight/lenis` para que toda la experiencia (V2 y V3) tenga inercia controlada tipo Awwwards.

- **Instalación**: dependencia `lenis` (sucesor mantenido de `@studio-freight/lenis`).
- **Provider único**: nuevo `src/components/SmoothScrollProvider.tsx` que inicializa Lenis una sola vez al montar `<App />`, con config:
  - `duration: 1.2`
  - `easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t))` (expo-out, alineado con los easings del footer)
  - `smoothWheel: true`, `smoothTouch: false` (en mobile el scroll nativo es mejor)
  - `wheelMultiplier: 1`, `lerp: 0.1`
- **RAF central**: Lenis corre en su propio loop. Para no duplicar listeners, el hook compartido `useScrollProgress` se suscribe a `lenis.on('scroll', ...)` cuando Lenis está disponible, y cae al `window.scroll` listener actual si no.
- **Compatibilidad**: el hero de V2/V3 ya usa lerp interno sobre `window.scrollY` — Lenis lo reemplaza naturalmente porque actualiza `scrollY` real. No hace falta tocar la lógica de `scrollProgress` de las páginas.
- **Sticky stages**: Lenis es compatible con `position: sticky`. Verificado para `ProjectsWarp`, `AboutConstellation` y `CosmicFooter`.
- **Anchor links / `scrollTo`**: el CTA `<a href="/contacto">` no necesita ajuste (es navegación). Si más adelante agregamos anchors internos, se usará `lenis.scrollTo()`.
- **Cleanup**: `lenis.destroy()` en unmount del provider.

## Performance
- Lenis reemplaza eventos `scroll` nativos por su RAF → menos repaints disparados por wheel events.
- El hook `useScrollProgress` queda con un único origen de verdad (Lenis cuando esté, fallback nativo si no).
- Halos nebulosos y nubes residuales: `mount/unmount` condicional por rango activo (no viven todo el scroll).

## Archivos
- **Editado**: `src/components/CosmicFooter.tsx` — nuevas fases, halos, flash en dos tiempos, meta simplificado.
- **Editado**: `src/hooks/useScrollProgress.ts` — suscripción a Lenis si está activo.
- **Nuevo**: `src/components/SmoothScrollProvider.tsx` — init/cleanup de Lenis.
- **Editado**: `src/App.tsx` — montar `<SmoothScrollProvider>` envolviendo las rutas.
- **Dependencia nueva**: `lenis`.
- **Sin tocar**: V2 visualmente intacto (solo gana el smooth scroll global).

