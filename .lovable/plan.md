

# Plan: Giro 3D notorio + menú hamburguesa global

Dos cambios independientes.

---

## 1. Hacer que el giro 3D SE SIENTA (referencias visuales fuertes)

El problema: las estrellas son muy chicas y dispersas → el `rotateY` ocurre pero el ojo no tiene un objeto de referencia claro para leer la rotación. Necesitamos **elementos grandes y reconocibles** que pasen por el campo de visión durante el giro.

### Cambios en `ServicesProjectsJourney.tsx`

**A. Reemplazar el starfield 3D por una "cámara que gira en una sala"**

Dentro del contenedor con `perspective: 1200px` + `rotateY`, agregar **objetos grandes posicionados en 360°** alrededor del usuario:

- **6 paneles luminosos verticales** distribuidos cada 60° en un cilindro virtual (radio ~600px), cada uno de ~200px ancho × 80vh alto, con gradientes violeta/magenta tenues. Al girar la cámara, estos paneles pasan claramente de derecha a izquierda en el campo visual → la rotación se vuelve obvia.
- **Líneas de grilla horizontales** en el "piso" y "techo" (planos con `rotateX(90deg)` y `rotateX(-90deg)`) que dan referencia espacial.
- Estrellas 3D actuales: aumentar cantidad (300+), tamaño (2-4px), y agregar algunas "grandes" (8-12px con glow) que actúen como puntos focales.

**B. Aumentar la perspectiva y el ángulo aparente**

- `perspective: 800px` (más cerca = distorsión más fuerte = giro más dramático).
- Mantener `rotateY` 0 → 180°, pero las referencias grandes hacen que se sienta.

**C. Trail de movimiento**

- Durante el pico (0.46 → 0.54), aplicar `filter: blur(Xpx)` dinámico al contenedor 3D (0 → 4px → 0) para simular motion blur de cámara que gira rápido.

**D. Indicador direccional sutil**

- Una flecha/chevron tenue (`→`) en la parte inferior de la pantalla que aparece durante el giro, indicando "girando a la derecha". Se desvanece cuando termina.

---

## 2. Menú hamburguesa global

### Componente nuevo: `src/components/HamburgerMenu.tsx`

- Posición: `fixed top-6 left-6 z-[100]` (por encima de todo, incluido el badge "Limitless · v5").
- Trigger: ícono `Menu` de lucide-react, 24px, color `foreground/80`, hover a `foreground`.
- Click → abre un `Sheet` (shadcn) desde la izquierda con fondo `bg-background/95 backdrop-blur-xl`.
- Items de navegación:
  - **Inicio** → `/v5`
  - **Proyectos** → `/proyectos`
  - **Contacto** → `/contacto`
- Estilo de items: tipografía Arkitech equivalente (uppercase, tracking-[0.3em], font-light), tamaño grande (`text-3xl`), separados verticalmente con espacio generoso.
- Hover: cambio de color a `primary` (violeta) + leve `translate-x-2`.
- Cierre: X arriba a la derecha del Sheet (ya viene en SheetContent).

### Páginas placeholder nuevas

**`src/pages/Proyectos.tsx`**
- Fondo negro `bg-background`, hero centrado con texto "Proyectos" en Arkitech/uppercase, subtítulo "Próximamente — el universo de Limitless en construcción."
- Incluye `HamburgerMenu` arriba.

**`src/pages/Contacto.tsx`**
- Misma estructura: título "Contacto", subtítulo "Próximamente — la puerta para romper límites juntos."
- Incluye `HamburgerMenu` arriba.

### Rutas en `App.tsx`

Agregar antes del catch-all:
```tsx
<Route path="/proyectos" element={<Proyectos />} />
<Route path="/contacto" element={<Contacto />} />
```

### Integración en V5

En `src/pages/V5.tsx`, agregar `<HamburgerMenu />` al inicio del JSX (junto al CustomCursor, fuera de cualquier transformación).

---

## Archivos

**Editado**
- `src/components/ServicesProjectsJourney.tsx` — paneles 360°, grilla piso/techo, motion blur, perspectiva más fuerte, indicador direccional.
- `src/pages/V5.tsx` — montar `HamburgerMenu`.
- `src/App.tsx` — rutas `/proyectos` y `/contacto`.

**Nuevo**
- `src/components/HamburgerMenu.tsx`
- `src/pages/Proyectos.tsx`
- `src/pages/Contacto.tsx`

**Sin tocar**
- Hero, Manifiesto, About, Footer, Canvas 3D del Acto I, cards Acto II, V2/V3/V4.

