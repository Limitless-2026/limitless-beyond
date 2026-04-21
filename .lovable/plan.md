

# Plan: Destello blanco limpio sin "fragmentación"

## Problema

En la captura se ve cómo, durante la transición hero → proyectos, queda un **halo violeta/blanco enorme** del núcleo de la nebulosa visible **detrás** del campo de estrellas del parallax. Como las estrellas se dibujan encima de un fondo que aún no terminó de desaparecer, parece que el destello blanco está "roto" o fragmentado por puntitos negros.

Causa real: el wrapper de la nebulosa hace fade de opacidad **al mismo tiempo** que el StarfieldParallax fade-in, y como el shader sigue zoomeando hacia adentro, el núcleo brillante ocupa toda la pantalla justo en ese cruce → se ve translúcido y las estrellas lo "comen".

## Solución: convertir el clímax en un destello blanco real, full-screen, no scrolleable visualmente

### 1. Overlay de destello blanco global (`src/pages/V2.tsx`)

Agregar una nueva capa fija full-screen, **encima** del WebGL y del StarfieldParallax, **debajo** del texto y del badge:

```tsx
<div className="fixed inset-0 pointer-events-none z-[8]"
  style={{
    background: 'white',
    opacity: flashOpacity,   // calculado abajo
    mixBlendMode: 'normal',
  }}
/>
```

`flashOpacity` se calcula con scrollProgress como una **campana corta y simétrica** centrada en el momento del cruce:

```ts
// pico en scrollProgress = 0.86, ancho ~0.10
const flashCenter = 0.86;
const flashWidth = 0.07;
const d = Math.abs(scrollProgress - flashCenter);
const flashOpacity = d < flashWidth ? Math.pow(1 - d / flashWidth, 1.6) : 0;
```

Resultado: en 0.79 empieza a blanquearse, llega a opacidad 1 en 0.86 (cubre TODO: nebulosa + parallax + cualquier glitch), y se va a 0 en 0.93 dejando ver el starfield ya estabilizado.

### 2. Cortar la nebulosa con hard switch (no fade lento)

En `V2.tsx`:
- Reemplazar el `nebulaOpacity` actual (fade gradual de 0.78 a 0.95) por un esquema en dos pasos:
  - `scrollProgress < 0.84` → opacidad 1 (nebulosa visible).
  - `scrollProgress >= 0.84` → opacidad 0 inmediato y `display: none` para liberar la GPU y eliminar cualquier sangrado.
- El switch ocurre **dentro** del pico del flash blanco, así el usuario nunca ve el corte: solo ve blanco.

```tsx
const nebulaVisible = scrollProgress < 0.84;
// ...
<div className="fixed inset-0"
  style={{
    opacity: nebulaVisible ? 1 : 0,
    visibility: nebulaVisible ? 'visible' : 'hidden',
    background: 'rgb(2,1,5)',
  }}>
```

### 3. Starfield solo visible después del flash

En `V2.tsx`, cambiar el `visible` que se pasa al `<StarfieldParallax>`:
- Antes: `visible={scrollProgress > 0.78}` (entraba mientras la nebulosa todavía se veía).
- Después: `visible={scrollProgress > 0.86}` (entra recién cuando el flash ya tapa todo, así no compite con la nebulosa).

Mantener el fade-in de 800ms del componente para que no aparezca brusco después del flash.

### 4. Detalles técnicos

- **Z-index final**:
  - `0` HeroWebGLV2 (visible solo si scrollProgress < 0.84)
  - `1` StarfieldParallax (visible solo si scrollProgress > 0.86)
  - `5` Overlay oscuro radial (sin cambios)
  - `8` **Flash blanco** (nuevo, pico en 0.86)
  - `10` Texto del hero (se oculta antes de 0.94, sin cambios)
  - `50` Badge (sin cambios)
- **Por qué funciona**: el flash blanco es una capa sólida, no tiene transparencias parciales en el pico → es físicamente imposible ver "estrellas comiendo el destello" porque todo está cubierto por blanco al 100% durante ~150ms de scroll.
- **Sin tocar el shader**: no necesitamos cambiar `FragmentShaderV2.tsx` ni `uStarfield`. El crossfade interno del shader sigue funcionando para usuarios que scrollean despacio dentro del rango pre-flash.
- **Sin tocar `ProjectsWarp.tsx`** ni `StarfieldParallax.tsx`.

## Archivos a editar

- `src/pages/V2.tsx` — agregar overlay de flash blanco z-[8], cambiar nebulaOpacity por hard switch en 0.84, ajustar visible del StarfieldParallax a > 0.86.

