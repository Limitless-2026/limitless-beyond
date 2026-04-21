

# Plan: arreglar el menú de una vez

Tres correcciones puntuales sobre el menú actual.

---

## 1. Sacar la palabra "MENÚ" del trigger

El botón fijo arriba a la derecha hoy muestra: `Menú — 03 ☰`.

Lo dejamos solo con el ícono de tres líneas (☰), sin texto, sin numerito.
- El ícono solo, alineado a la derecha.
- Hover: las líneas cambian sutilmente de color (foreground/60 → foreground).
- Al abrir, las líneas se transforman en X (animación ya existente).

---

## 2. Eliminar la doble X

Hoy conviven dos cierres cuando el menú está abierto:
- el trigger fijo del header (que ahora va a ser solo ☰ → X),
- el botón close por defecto de Radix dentro del `SheetContent`.

Soluciones:
- **`src/components/ui/sheet.tsx`**: agregar prop `hideDefaultClose` al `SheetContent` para no renderizar el close por defecto cuando se pide. Reemplaza el hack actual de `<style>` inyectado.
- **`src/components/HamburgerMenu.tsx`**:
  - Pasar `hideDefaultClose` al `SheetContent`.
  - Ocultar el trigger fijo cuando `open === true` (`opacity-0 pointer-events-none` + transición), así no compite visualmente con la X custom del header del panel.
  - Dejar solo la X custom del header interno como único cierre visible.

---

## 3. Que no se corte el contenido

El panel actual usa `overflow-hidden` y los títulos son demasiado grandes para el viewport medio → letras cortadas.

Cambios en `src/components/HamburgerMenu.tsx`:
- Estructura en 3 zonas con flex column:
  - header fijo (índice + X),
  - `nav` flexible con `flex-1 min-h-0 overflow-y-auto`,
  - footer fijo.
- Tipografía de los items más responsive: bajar de `text-5xl md:text-6xl` a `text-4xl md:text-5xl` con tracking más contenido (`0.14em` en vez de `0.18em`), para que entren completos.
- Reducir gap entre items (`gap-10` → `gap-6`) y padding lateral del nav para ganar ancho útil.
- Watermark vertical "LIMITLESS": bajar tamaño (`text-7xl` → `text-5xl`) y opacidad para que no empuje al contenido visible.
- Quitar el `<style>` inline que ocultaba el close (ya no hace falta).

---

## Resultado

- Trigger: solo ícono ☰, sin texto.
- Una sola X visible al abrir (la del header del panel).
- Items completos, sin recortes, en el viewport actual y más chicos.
- Mismo lenguaje visual editorial, más limpio.

---

## Archivos

**Editar**
- `src/components/ui/sheet.tsx` — agregar soporte `hideDefaultClose`.
- `src/components/HamburgerMenu.tsx` — quitar texto "Menú/— 03" del trigger, ocultar trigger al abrir, usar `hideDefaultClose`, rehacer layout responsive y reducir escalas.

**Sin tocar**
- `V5.tsx`, `Contacto.tsx`, scroll, hero, servicios, proyectos, footer.

