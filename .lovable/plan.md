

# Plan: Mejorar legibilidad del hero y demorar la entrada de proyectos

## 1. Oscurecer el fondo detrás del texto (legibilidad)

**`src/pages/V2.tsx`** — Agregar un overlay oscuro que vive sobre la nebulosa pero debajo del texto, con un radial-gradient que oscurece el centro donde están los títulos sin tapar el "halo" exterior de la estrella.

```tsx
<div
  className="fixed inset-0 pointer-events-none z-[5]"
  style={{
    background:
      "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 40%, rgba(0,0,0,0) 75%)",
    opacity: 1 - scrollProgress * 0.6, // se desvanece cuando entrás al espacio negro
  }}
/>
```

- `z-[5]` queda sobre el canvas (fixed inset-0) y debajo del texto (`z-10`).
- Se atenúa con el scroll para no oscurecer la transición al starfield negro.

## 2. Reforzar contraste del texto

**`src/pages/V2.tsx`** — Sobre los tres bloques de texto:

- **"Los límites están para romperse"**: agregar `text-shadow` sutil (`0 2px 30px rgba(0,0,0,0.6)`) y subir el degradado del italic a colores más claros (de violeta saturado a blanco hueso) para que destaque sobre rosa/magenta.
- **Subtítulos** (`text-foreground/60` → `text-foreground/85`) — más opacos.
- **"No hay fronteras..."**: el texto principal pasa de `font-extralight` con bajo contraste a un `text-foreground/90` con `text-shadow` y el `<em>` con gradiente blanco→violeta (no violeta→violeta).

## 3. Demorar la aparición de los proyectos

Hoy el spacer del hero es `300vh` y `ProjectsWarp` empieza apenas termina, por eso en la 3ra captura ya se ve un proyecto detrás del bloque "LIMITLESS".

**`src/pages/V2.tsx`**:
- Subir el spacer hero de `300vh` a `420vh` para dar aire después de "LIMITLESS".
- Agregar un spacer **negro puro** (`bg-black h-[80vh]`) entre el hero y `ProjectsWarp` para asegurar que el usuario quede unos segundos en el espacio vacío antes de que aparezcan las cards.
- Ajustar el cálculo de `scrollProgress` (`max = window.innerHeight * 2.5` → `* 3.5`) para que las animaciones del hero (incluido "LIMITLESS") se completen y el texto se desvanezca por completo antes de que entre la primera card.

**`src/components/ProjectsWarp.tsx`**:
- Agregar un buffer interno: la primera card empieza a acercarse recién cuando `progress > 0.3` (en lugar de 0). Esto se logra remapeando `progress` para ignorar el primer 30% del scroll de la sección, dejando un "vacío estelar" antes de que aparezca la primera card.

## 4. Detalles técnicos

- No tocamos el shader (`FragmentShaderV2.tsx`) — el problema es de capa UI, no del WebGL.
- El overlay oscuro respeta el crossfade a starfield: cuando llegamos al espacio negro, ya está atenuado y no oscurece de más.
- El `text-shadow` se aplica vía `style={{ textShadow: '...' }}` en línea para evitar tocar Tailwind config.

## Archivos a editar
- `src/pages/V2.tsx` — overlay oscurecedor, contraste del texto, spacers más largos.
- `src/components/ProjectsWarp.tsx` — buffer inicial antes de la primera card.

