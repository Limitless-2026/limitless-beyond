

# Plan: Explosión más larga + scroll global más controlado

## 1. Explosión del footer — más tiempo para apreciarla

El problema: el footer mide `180vh`, lo que deja muy poco recorrido para que la explosión respire. Con scroll rápido pasa en un parpadeo.

**Cambios:**

- **Altura del contenedor**: `180vh` → **`280vh`**. Da ~100vh extra de scroll dedicado a la explosión, sin afectar el contenido (sigue ocupando la misma proporción del rango 0.45→1.0).
- **Reescalar las fases** para que el estallido propiamente dicho dure más:

```text
ANTES                          AHORA
[ 0.00 → 0.18 ] colapso        [ 0.00 → 0.20 ] colapso
[ 0.18 → 0.28 ] carga          [ 0.20 → 0.32 ] carga (más larga)
[ 0.28 → 0.36 ] estallido      [ 0.32 → 0.44 ] estallido (50% más)
[ 0.36 → 0.48 ] residual       [ 0.44 → 0.58 ] residual (más largo)
[ 0.45 → 1.00 ] contenido      [ 0.55 → 1.00 ] contenido
```

- **Estallido en sí mismo**:
  - Pre-flash: ahora ocupa 0.32→0.35 (antes era instantáneo).
  - Shockwave: expansión de 0 a 250vmax durante 0.32→0.42 (antes 0.28→0.36 → ahora se ve viajar la onda).
  - Esquirlas: se mantienen visibles más tiempo, fade-out durante 0.38→0.46.
  - Flash blanco principal: ancho `0.06` → **`0.09`**, curva `pow(1-d/w, 2.4)` (caída aún más suave).
- **Polvo residual**: las nubes violetas viven 0.44→0.58 (antes 0.36→0.48), se aprecia el "después".

Todo esto solo requiere reescalar constantes en `CosmicFooter.tsx`. Cero cambios estructurales.

## 2. Scroll global más controlado (Lenis)

El problema: la config actual de Lenis (`duration: 1.2, lerp: 0.1, wheelMultiplier: 1`) deja viajar muy rápido — un solo scroll fuerte tira al usuario varios viewports.

**Nueva config en `SmoothScrollProvider.tsx`:**

| Parámetro          | Antes | Ahora | Efecto                                              |
| ------------------ | ----- | ----- | --------------------------------------------------- |
| `duration`         | 1.2   | 1.6   | Cada wheel tarda más en completarse → más cinematográfico |
| `lerp`             | 0.1   | 0.075 | Inercia más pesada, frenado más largo               |
| `wheelMultiplier`  | 1     | 0.7   | Cada notch del scroll mueve menos distancia        |
| `touchMultiplier`  | —     | 1.5   | Mobile se siente natural (compensa el wheelMultiplier bajo) |
| `easing`           | expo-out | igual | Mantiene la sensación orgánica                  |

Esto hace que:
- Un scroll agresivo no te catapulte a través de la página.
- Las secciones sticky (hero, projects, about, footer) se sienten "ancladas", no atravesadas.
- La explosión del footer se percibe como un evento, no como un destello.

## Performance
- Sin nuevos listeners, sin nuevos RAFs, sin nuevos elementos en DOM.
- El reescalado de fases es solo cambio de constantes.
- Lenis ya está integrado; solo cambiamos parámetros de init.

## Archivos
- **Editado**: `src/components/CosmicFooter.tsx` — altura 280vh, reescalar todas las constantes de fase, ajustar fórmula del flash.
- **Editado**: `src/components/SmoothScrollProvider.tsx` — nueva config de Lenis.
- **Sin tocar**: nada más. V2 hereda automáticamente el scroll más controlado.

