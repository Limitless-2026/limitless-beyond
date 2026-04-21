

# Implementación: Preloader + página Proyectos

Confirmado el plan anterior. Lo ejecuto tal cual quedó definido:

## Preloader del inicio
- Nuevo `src/components/Preloader.tsx`: pantalla negra con contador 00→100 Arkitech, línea de progreso violeta, partículas escalonadas, micro-textos rotativos (`CALIBRANDO COORDENADAS` / `ABRIENDO PORTAL` / `ROMPIENDO LÍMITES`), flash magenta al 100, anillo violeta de salida y fade al hero.
- Solo primera visita por sesión (`sessionStorage`).
- Respeta `prefers-reduced-motion`.
- Montado en `src/pages/V5.tsx` por encima de todo.

## Página Proyectos
- `src/data/projects.ts`: 6 proyectos placeholder en español (Nebula, Órbita 7, Kairos, Singularidad, Albedo Studio, Portal Cero) con `cliente`, `año`, `stack`, `tipo`, `estado`, `descripcion`.
- `src/components/ProjectStation.tsx`: fila editorial alternada izq/der con número, estado, título grande, visual placeholder (gradiente violeta-magenta + nombre), sidebar de meta y CTA `VER CASO →`. Hover: scale del visual, anillo violeta animado, degradé en título, línea creciente.
- `src/pages/Proyectos.tsx`: hero (`CONSTELACIÓN LIMITLESS` con degradé en `LIMITLESS`), starfield sutil, lista de 6 estaciones con stagger por viewport, bloque de cierre (`¿TU PROYECTO ES EL PRÓXIMO LÍMITE?` → `/contacto`), footer reutilizando `CosmicFooter`.
- Magenta usado una sola vez: en el proyecto con estado `EN CONSTRUCCIÓN`.

## Sobre "VER CASO" y múltiples imágenes (próximo paso, no ahora)
Sí, la idea natural es que cada proyecto tenga su propia subpágina `/proyectos/:slug` con galería (hero del caso, varias imágenes/videos, problema, solución, resultados, créditos). En esta entrega dejo el CTA `VER CASO →` preparado pero sin navegar todavía (placeholder visual) para que en la próxima iteración lo conectemos a las páginas de detalle con la estructura de galería múltiple. Así no mezclamos scope.

## Archivos

**Nuevos**
- `src/components/Preloader.tsx`
- `src/components/ProjectStation.tsx`
- `src/data/projects.ts`

**Editados**
- `src/pages/V5.tsx` — montar Preloader.
- `src/pages/Proyectos.tsx` — página completa.

**Sin tocar**
- Hero, Manifiesto, Servicios, About, Contacto, menú, scroll, footer.

