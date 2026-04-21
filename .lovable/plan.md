

# Plan: Scroll más calmo + menú nivel Awwwards + formulario de contacto

Tres cambios independientes y enfocados.

---

## 1. Bajar la velocidad del scroll (sensación menos "voladora")

El scroll usa Lenis con `wheelMultiplier: 0.7` y `lerp: 0.075`. El wheel multiplier > 0.5 más el lerp bajo hacen que cada notch del mouse avance demasiado. Además, en `V5.tsx` hay un segundo lerp extra (`current += (target - current) * 0.12`) que puede sentirse como "deslizamiento doble".

### Cambios

**`src/components/SmoothScrollProvider.tsx`**
- `wheelMultiplier: 0.7` → **`0.45`** (cada notch avanza menos).
- `touchMultiplier: 1.5` → **`1.1`**.
- `lerp: 0.075` → **`0.09`** (un toque más asentado, menos planeo).
- `duration: 1.6` → **`1.4`** (cierre del easing un poco más rápido para que no "siga sola").

**`src/pages/V5.tsx`**
- El doble-lerp de `scrollProgress` (línea 35: `0.12`) lo subimos a **`0.18`**: sigue suavizado pero sin sentir un retraso visible respecto al scroll real.

Resultado: el scroll mantiene la suavidad cinematográfica pero responde con más control, sin sensación de "vuelo".

---

## 2. Menú hamburguesa — rediseño Awwwards

El actual es funcional pero plano: panel con texto centrado, sin presencia visual fuerte. Lo reescribimos con personalidad de marca.

### Trigger (top-right)

- Reemplazar el lockup actual por uno más editorial:
  - Texto **`MENÚ`** vertical o con subíndice numérico: `MENÚ — 03` (sugerencia: items totales como dato curatorial).
  - Tres líneas que en lugar de hover-sutil hacen una **transformación tipo "rotación a X"** al abrir (líneas superior/inferior se cruzan formando una X cuando `open=true`).
  - Color base `foreground/60`, hover `text` (blanco hueso), no violeta — el violeta queda para impacto adentro del panel.

### Panel (slide desde la derecha)

- **Ancho**: `w-full sm:max-w-[560px]` (un poco más amplio para respirar).
- **Background en capas**:
  - Base: `#08080C`.
  - Una imagen de "ruido cósmico" generada con SVG (granulado sutil) sobre toda la superficie, opacidad 0.04.
  - Gradiente radial violeta en la esquina inferior-izquierda + magenta tenue en la superior-derecha (ya estaba, lo mantenemos).
  - Borde izquierdo: línea vertical 1px violeta con un degradé que se anima de arriba hacia abajo al abrirse el panel (efecto "energía entrando").

### Layout interno del panel

```text
┌────────────────────────────────────────┐
│  ⌖ MENÚ                            ✕   │  ← header con índice + close
│  ─────                                  │
│                                         │
│  (Wordmark grande LIMITLESS rotado     │
│   90° a la izquierda, vertical, col.   │
│   muy tenue foreground/8 — decorativo) │
│                                         │
│            01                          │  ← items alineados a la derecha
│            INICIO  ──────── →          │
│            Volver al universo           │
│                                         │
│            02                          │
│            PROYECTOS  ───── →          │
│            Casos en órbita              │
│                                         │
│            03                          │
│            CONTACTO  ────── →          │
│            Romper límites juntos        │
│                                         │
│  ─────────────────────────────────     │
│  Argentina · 2025  ·  hola@…           │  ← footer en una sola línea
│  Buenos Aires (-34.6°, -58.4°)         │  ← coordenadas como dato editorial
└────────────────────────────────────────┘
```

### Detalles de los items

- Items **alineados a la derecha** (no centrados/izquierda).
- Cada item es un bloque grande:
  - Número arriba (`text-[11px]` tracking `0.4em` violeta `primary/70`).
  - Título en Arkitech `text-5xl md:text-6xl` (más grande que ahora), uppercase, `font-extralight`, tracking `0.18em`, justificado a la derecha.
  - Subtítulo abajo, DM Sans 300, `text-[10px]` uppercase tracking `0.3em` `foreground/35`.
- **Hover**:
  - Título cambia de `foreground` → degradé `from-foreground via-primary to-foreground` con `bg-clip-text` (mismo recurso que el hero).
  - Una línea horizontal 1px violeta crece de derecha a izquierda hasta 80px debajo del título.
  - El número se desplaza `-translate-x-2` y la flecha aparece desde el lado izquierdo del título (no derecha).
- **Item activo** (ruta actual): número en magenta `--color-impact`, título en blanco, línea violeta visible permanentemente al 30% de ancho.
- **Stagger de entrada**: cada item entra con `clip-path: inset(0 0 100% 0)` → `inset(0 0 0% 0)` (revelado vertical desde arriba), 100ms de delay entre items, 700ms de duración.

### Wordmark vertical decorativo

- En el lado izquierdo del panel, el texto `LIMITLESS` rotado 90° (escrito de abajo hacia arriba), Arkitech, `text-7xl`, `text-foreground/[0.05]`, posición `absolute left-6 top-1/2`. Funciona como marca de agua editorial sin distraer.

### Footer del panel

- En lugar de dos líneas separadas, una grilla de 2 filas:
  - Fila 1: `ARGENTINA · 2025` (izq) — `HOLA@LIMITLESS.STUDIO` (der), ambos `text-[10px]` tracking `0.3em` uppercase `foreground/40`.
  - Fila 2: `BUENOS AIRES · -34.6° / -58.4°` (izq) en `foreground/25` — un puntito violeta latiendo (`animate-pulse`) a la derecha como "señal de vida".

---

## 3. Formulario de Contacto — adaptado a la marca

Reemplazar el placeholder `Próximamente…` por un formulario completo basado en las imágenes de referencia, con el lenguaje visual de Limitless.

### Estructura (`src/pages/Contacto.tsx`)

```text
┌──────────────────────────────────────────────┐
│  HamburgerMenu (fijo top-right)              │
│                                               │
│  ┌──────────  CONTACTO · 04 ─────────┐       │  ← eyebrow
│  HOLA, ¿TENÉS                                │  ← H1 enorme, Arkitech
│  UNA IDEA?                                   │
│                                               │
│  ───── ESTOY INTERESADO EN…                  │  ← grupo de chips
│  [Diseño UX-UI] [Sitio web] [Branding]       │
│  [Aplicación] [Software/SaaS] [Chatbot]      │
│  [Publicidad]                                │
│                                               │
│  ───── DECINOS QUIÉN SOS                     │
│  Tu nombre…              ___________________ │  ← inputs underlined
│  Tu email…               ___________________ │
│                                               │
│  ───── CONTANOS LA IDEA                      │
│  Contanos sobre tu proyecto…                 │  ← textarea minimal
│  ___________________________________________│
│                                               │
│  📎 Añadir archivo adjunto                   │  ← attach link
│  El envío abre tu correo; si elegís archivo, │
│  mencionamos el nombre en el mensaje. Para   │
│  enviarlo, adjuntalo en el cliente de email. │
│                                               │
│  ───── PRESUPUESTO ESTIMADO                  │
│  [USD 5-10k] [10-25k] [25-60k] [60k+]        │  ← chips (ajustamos a moneda lat)
│                                               │
│           ╭──────────────────╮                │
│           │     ENVIAR  →    │                │  ← botón final ancho
│           ╰──────────────────╯                │
└──────────────────────────────────────────────┘
```

### Estilo de cada elemento

- **Fondo**: `#08080C` con la misma nebulosa radial violeta sutil arriba (ya está).
- **Eyebrow**: `text-[10px]` tracking `0.4em` uppercase `text-primary`.
- **H1**: Arkitech, `text-6xl md:text-8xl lg:text-9xl`, `font-extralight`, uppercase, tracking `0.08em`, leading tight. La palabra `IDEA?` con el degradé violeta del hero (recurso de marca). En español argentino: **"HOLA, ¿TENÉS UNA IDEA?"**.
- **Section labels** (`ESTOY INTERESADO EN…`, etc.): `text-[10px]` tracking `0.4em` uppercase `text-foreground/40` con guión decorativo a la izquierda (`─────`). La primera palabra (`ESTOY`) con un sutil degradé violeta como en la imagen de referencia.
- **Chips de servicios** (selección múltiple):
  - `rounded-full border border-foreground/20 px-6 py-2.5 text-[11px] tracking-[0.25em] uppercase font-light`.
  - Estado normal: `text-foreground/70`, fondo transparente.
  - Hover: borde `primary/60`, texto `foreground`.
  - Seleccionado: borde `primary`, fondo `primary/10`, texto `foreground`, una pequeña marca `+` rotada se vuelve `×` para deseleccionar.
- **Inputs underlined**:
  - Sin caja, solo línea inferior 1px `foreground/15`.
  - Placeholder `text-[14px] font-light text-foreground/35`, label flota arriba al focar.
  - Focus: línea pasa a `primary` con animación de ancho 0 → 100% (left to right, 400ms).
  - Padding `py-4`, font DM Sans 300.
- **Textarea**: misma estética, `min-h-[120px]`, resize vertical.
- **Attach link**: ícono paperclip (SVG inline simple), texto `Añadir archivo adjunto` en `text-sm font-light text-foreground/70`, hover `text-primary`. Input file oculto.
- **Nota informativa**: `text-[11px] font-light text-foreground/40 leading-relaxed max-w-md`, mismo copy de la imagen pero con el tono Limitless.
- **Chips de presupuesto**: misma estética que los de servicios pero **selección única** (radio behavior). Rangos en USD: **5-10K / 10-25K / 25-60K / 60K+**.
- **Botón ENVIAR**:
  - Ancho completo del form (`max-w-3xl`), `py-6`, `border border-foreground/30 rounded-full`.
  - Texto `ENVIAR` Arkitech tracking `0.4em` uppercase `text-lg`, flecha `→` a la derecha.
  - Hover: borde `primary`, fondo radial violeta sutil que crece desde el centro, flecha se desplaza `translate-x-2`.

### Comportamiento

- **Validación con zod** (siguiendo la regla de seguridad del proyecto): nombre 1-100, email válido 1-255, mensaje 1-1000, al menos un servicio seleccionado, presupuesto seleccionado.
- **Submit**: arma un `mailto:` a `hola@limitless.studio` con asunto `Nueva idea — [nombre]` y cuerpo formateado:
  ```text
  Hola Limitless,

  Soy [nombre] ([email]).

  Estoy interesado en: [servicios separados por coma]
  Presupuesto: [rango]

  La idea:
  [mensaje]

  [Si hay archivo: "Adjuntaré: [nombre.ext] desde mi cliente de correo."]
  ```
  Usa `encodeURIComponent` para todo el cuerpo.
- **Errores**: cada input muestra un mensaje pequeño en magenta `--color-impact` debajo, `text-[10px]` tracking `0.2em` uppercase, animación slide-down 200ms. (Aquí usamos magenta como el "una vez por página" — el del impacto narrativo se libera porque el contacto es página separada.)
- **Toast de éxito** (al volver del cliente de correo no podemos detectarlo, pero al disparar el `mailto` con éxito mostramos): `<Toaster>` con mensaje `Abriendo tu cliente de email…`.

### Detalles finos

- Layout máximo `max-w-3xl mx-auto px-6 md:px-10`, padding vertical generoso (`pt-32 pb-24`).
- Cada bloque (servicios / datos / presupuesto / botón) separado por `mt-16` para que respire.
- Animación de entrada: H1 con clip-path reveal (igual que items del menú), bloques inferiores con fade-up + 80ms stagger.
- Sin carruseles, sin sliders, sin elementos genéricos. Todo manual, editorial.

---

## Archivos

**Editado**
- `src/components/SmoothScrollProvider.tsx` — bajar wheelMultiplier, touchMultiplier, ajustar lerp y duration.
- `src/pages/V5.tsx` — subir lerp del doble-suavizado de progress.
- `src/components/HamburgerMenu.tsx` — rediseño completo (trigger con animación X, panel con wordmark vertical, items alineados derecha, footer enriquecido, transiciones clip-path).
- `src/pages/Contacto.tsx` — reemplazar placeholder por formulario completo con zod + mailto + toasts.

**Sin tocar**
- `App.tsx`, rutas, Hero, Manifiesto, Servicios, Footer, About, V2/V3/V4.

