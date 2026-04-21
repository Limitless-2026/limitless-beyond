

# Plan: Secuenciar correctamente los textos del hero antes del destello

## Problema

Los tres bloques de texto del hero (`"Los límites están para romperse"`, `"No hay fronteras cuando el espacio es infinito"` y `"LIMITLESS / Bienvenido al otro lado"`) están todos posicionados con `absolute inset-0` dentro de la misma capa fixed, y sus opacidades se solapan en el rango de scroll. Por eso en la captura se ve `LIMITLESS` encima de `No hay fronteras` encima de `Bienvenido al otro lado`, todos con el destello blanco encima.

Además, el destello blanco actual es solo una campana sobre `scrollProgress` (0.79 → 0.93), lo que significa que mientras el usuario scrollea, el destello aparece y se va sin darle tiempo a "respirar" al texto final.

## Solución: secuenciar narrativa con rangos de scroll exclusivos + pausa con scroll-jacking corto durante el destello

### 1. Rangos de scroll exclusivos para cada bloque (`src/pages/V2.tsx`)

Reasignar las ventanas de opacidad para que NUNCA dos bloques estén visibles a la vez:

| Bloque | Aparece | Pico (opacidad 1) | Desaparece |
|---|---|---|---|
| **"Los límites están para romperse"** (hero) | 0.00 | 0.00 – 0.18 | 0.30 |
| **"No hay fronteras..."** (mid) | 0.32 | 0.42 – 0.55 | 0.65 |
| **"Bienvenido al otro lado / LIMITLESS"** (end) | 0.68 | 0.78 – ⏸ | después del destello |

Implementación: reemplazar las funciones actuales `heroOpacity`, `midShow`, `endOpacity` por rampas con ventanas duras que devuelvan 0 fuera de su rango:

```ts
const fadeInOut = (p: number, inStart: number, inEnd: number, outStart: number, outEnd: number) => {
  if (p < inStart || p > outEnd) return 0;
  if (p < inEnd) return (p - inStart) / (inEnd - inStart);
  if (p < outStart) return 1;
  return 1 - (p - outStart) / (outEnd - outStart);
};

const heroOpacity = fadeInOut(scrollProgress, 0, 0.05, 0.18, 0.30);
const midOpacity  = fadeInOut(scrollProgress, 0.32, 0.42, 0.55, 0.65);
const endOpacity  = fadeInOut(scrollProgress, 0.68, 0.78, /* outStart */ 0.95, /* outEnd */ 0.99);
```

### 2. "Pausa narrativa" para que LIMITLESS se aprecie antes del destello

El bloque final (`Bienvenido al otro lado / LIMITLESS`) debe quedar **fijo en pantalla mientras el destello hace su ciclo completo**. Para lograrlo sin scroll-jacking real:

- **Mover el destello más adelante**: cambiar `flashCenter` de `0.86` → `0.91` y `flashWidth` de `0.07` → `0.05`. Así el destello empieza en 0.86, llega a 1 en 0.91 y termina en 0.96.
- **Mantener `endOpacity = 1` durante todo el destello** (desde 0.78 hasta 0.95, ver tabla arriba). Esto garantiza que LIMITLESS está visible y estable durante ~17% del scroll del hero (≈ 60vh con el spacer actual de 420vh) **antes** de que el destello empiece a cubrirlo.
- **El destello cubre la salida**: cuando el destello llega a su pico (0.91), tapa todo. Cuando se va (0.96), ya estamos en el starfield con el texto desvanecido.

Resultado: el usuario hace scroll → ve aparecer LIMITLESS → tiene una porción del scroll donde LIMITLESS queda estable y legible → empieza el destello blanco → el destello cubre todo → al disiparse, ya estamos en el espacio de proyectos.

### 3. Ajustar nebulosa y starfield al nuevo timing

- `nebulaVisible`: pasar de `< 0.84` → `< 0.89` (la nebulosa sigue acompañando a LIMITLESS hasta que el destello la tape).
- `<StarfieldParallax visible={scrollProgress > 0.91} />`: alineado con el pico del nuevo destello.
- `heroLayerHidden`: pasar de `> 0.94` → `> 0.97` (la capa de texto se desmonta solo después de que el destello terminó).
- `heroLayerOpacity`: rampa final `0.95 → 0.97` con factor `* 50` para corte rápido bajo el destello.

### 4. Detalles técnicos

- **Sin scroll-jacking real** (`preventDefault`): la "pausa" se logra con la duración del spacer (`420vh`) y rangos de opacidad anchos. El usuario nunca pierde el control del scroll.
- **`pointer-events`**: se mantiene `pointer-events: none` en la capa de texto.
- **Sin tocar**: `FragmentShaderV2.tsx`, `HeroWebGLV2.tsx`, `StarfieldParallax.tsx`, `ProjectsWarp.tsx`, `CustomCursor.tsx`.

## Archivos a editar

- `src/pages/V2.tsx` — helper `fadeInOut`, nuevos rangos para `heroOpacity` / `midOpacity` / `endOpacity`, mover destello a 0.91, ajustar `nebulaVisible`, `heroLayerHidden` y `visible` del StarfieldParallax.

