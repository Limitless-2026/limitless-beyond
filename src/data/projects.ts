import nebula from "@/assets/projects/nebula-os.jpg";
import orbita from "@/assets/projects/cosmos-travel.jpg";
import kairos from "@/assets/projects/quantum-bank.jpg";
import singularidad from "@/assets/projects/helios-health.jpg";
import albedo from "@/assets/projects/pulsar-studio.jpg";
import portal from "@/assets/projects/aurora-commerce.jpg";

export type ProjectStatus = "EN ÓRBITA" | "LANZADO" | "EN CONSTRUCCIÓN";

export interface Resultado {
  label: string;
  value: string;
}

export interface Credito {
  role: string;
  name: string;
}

export interface Project {
  id: string;
  slug: string;
  name: string;
  cliente: string;
  año: string;
  stack: string;
  tipo: string;
  estado: ProjectStatus;
  descripcion: string;
  cover: string;
  gallery: string[];
  problema: string;
  solucion: string;
  resultados: Resultado[];
  creditos: Credito[];
  linkLive?: string;
}

export const PROJECTS: Project[] = [
  {
    id: "01",
    slug: "nebula",
    name: "NEBULA",
    cliente: "Nebula Capital",
    año: "2025",
    stack: "React · Tailwind · Figma",
    tipo: "Branding · Web",
    estado: "EN ÓRBITA",
    descripcion:
      "Sistema visual y site corporativo para una fintech argentina que rompe el molde acartonado del sector.",
    cover: nebula,
    gallery: [nebula, orbita, kairos, singularidad],
    problema:
      "Una fintech argentina llegaba con la identidad de un banco tradicional. Tenía producto de vanguardia, pero comunicaba conservadurismo. Su web era una tarjeta de presentación, no una herramienta de venta.",
    solucion:
      "Reconstruimos la marca desde cero: tipografía editorial, paleta fría con un acento eléctrico y un site narrativo donde el producto se cuenta como una historia. Cada scroll suma confianza.",
    resultados: [
      { label: "Conversión", value: "+184%" },
      { label: "LCP", value: "1.8s" },
      { label: "Lighthouse", value: "98/100" },
      { label: "Bounce rate", value: "−42%" },
    ],
    creditos: [
      { role: "Dirección creativa", name: "Limitless Studio" },
      { role: "Diseño UI", name: "Equipo Limitless" },
      { role: "Desarrollo", name: "Equipo Limitless" },
    ],
  },
  {
    id: "02",
    slug: "orbita-7",
    name: "ÓRBITA 7",
    cliente: "Orbita Logistics",
    año: "2025",
    stack: "Next.js · Three.js · Postgres",
    tipo: "SaaS · Plataforma",
    estado: "EN ÓRBITA",
    descripcion:
      "Plataforma SaaS de logística satelital con visualización 3D de flotas en tiempo real.",
    cover: orbita,
    gallery: [orbita, nebula, albedo, portal],
    problema:
      "Operadores logísticos coordinaban flotas con planillas y mapas estáticos. Cada decisión llegaba tarde. Necesitaban ver todo, en vivo, sin saturarse.",
    solucion:
      "Diseñamos una interfaz 3D donde cada flota orbita en su capa. La densidad de datos se traduce en luz y movimiento, no en tablas. El operador escanea el universo de un vistazo.",
    resultados: [
      { label: "Tiempo de respuesta", value: "−61%" },
      { label: "Usuarios activos", value: "+220%" },
      { label: "NPS", value: "78" },
    ],
    creditos: [
      { role: "Producto", name: "Limitless Studio" },
      { role: "WebGL", name: "Equipo Limitless" },
      { role: "Backend", name: "Equipo Limitless" },
    ],
  },
  {
    id: "03",
    slug: "kairos",
    name: "KAIROS",
    cliente: "Bodega Kairos",
    año: "2024",
    stack: "Astro · GSAP · Sanity",
    tipo: "Editorial · Web",
    estado: "LANZADO",
    descripcion:
      "Sitio editorial inmersivo para una bodega de Mendoza. Cada cosecha cuenta su propia historia.",
    cover: kairos,
    gallery: [kairos, nebula, singularidad, orbita],
    problema:
      "La bodega tenía premios internacionales y un site que parecía catálogo de supermercado. Los compradores premium pasaban de largo.",
    solucion:
      "Convertimos el site en una revista digital. Cada cosecha es un capítulo con tipografía editorial, fotografía de autor y micro-narrativa. La compra es la última página, no la primera.",
    resultados: [
      { label: "Ticket promedio", value: "+92%" },
      { label: "Tiempo en sitio", value: "4:38" },
      { label: "Exportación", value: "+3 países" },
    ],
    creditos: [
      { role: "Dirección creativa", name: "Limitless Studio" },
      { role: "Editorial", name: "Equipo Limitless" },
    ],
  },
  {
    id: "04",
    slug: "singularidad",
    name: "SINGULARIDAD",
    cliente: "Singularity Mind",
    año: "2024",
    stack: "React Native · Expo · Supabase",
    tipo: "App Mobile",
    estado: "LANZADO",
    descripcion:
      "Aplicación mobile de meditación cósmica. Sesiones guiadas con paisajes sonoros generativos.",
    cover: singularidad,
    gallery: [singularidad, kairos, nebula, albedo],
    problema:
      "El nicho de meditación está saturado de apps idénticas: pasteles, redondeadas, predecibles. Singularity quería existir en otro plano estético.",
    solucion:
      "Construimos una app oscura, contemplativa, donde el sonido y el silencio son el contenido. Cada sesión tiene un paisaje sonoro generado en tiempo real.",
    resultados: [
      { label: "Retención D30", value: "47%" },
      { label: "Sesiones / usuario", value: "23/mes" },
      { label: "App Store", value: "4.9 ★" },
    ],
    creditos: [
      { role: "Producto", name: "Limitless Studio" },
      { role: "Mobile", name: "Equipo Limitless" },
      { role: "Sound design", name: "Equipo Limitless" },
    ],
  },
  {
    id: "05",
    slug: "albedo-studio",
    name: "ALBEDO STUDIO",
    cliente: "Albedo Arquitectos",
    año: "2024",
    stack: "WordPress headless · Next.js",
    tipo: "Identidad · Web",
    estado: "LANZADO",
    descripcion:
      "Identidad y portfolio web para estudio de arquitectura con foco en luz, materia y silencio.",
    cover: albedo,
    gallery: [albedo, kairos, nebula, portal],
    problema:
      "Un estudio que diseña casas de autor no puede mostrarse en una grilla de fotos. Necesitaban un espacio que respire como sus obras.",
    solucion:
      "Identidad mínima, generosa en blanco, con tipografía que se lee como un plano. El portfolio es un recorrido lento donde cada proyecto tiene su propia atmósfera.",
    resultados: [
      { label: "Briefs cualificados", value: "+140%" },
      { label: "Premios", value: "2 publicaciones" },
    ],
    creditos: [
      { role: "Branding", name: "Limitless Studio" },
      { role: "Web", name: "Equipo Limitless" },
    ],
  },
  {
    id: "06",
    slug: "portal-cero",
    name: "PORTAL CERO",
    cliente: "Atelier Zero",
    año: "2025",
    stack: "Three.js · GLSL · WebGL",
    tipo: "Experiencia inmersiva",
    estado: "EN CONSTRUCCIÓN",
    descripcion:
      "Experiencia WebGL para un evento de moda. Un portal interactivo que reacciona al movimiento del visitante.",
    cover: portal,
    gallery: [portal, nebula, orbita, singularidad],
    problema:
      "Un evento de moda necesitaba una pieza digital que viviera fuera del calendario: que la gente la compartiera por sí misma, no por la marca.",
    solucion:
      "Diseñamos un portal WebGL que reacciona al movimiento del cursor (o del giroscopio en mobile). Cada visitante ve una versión única generada por su gesto.",
    resultados: [
      { label: "Compartidos orgánicos", value: "12.4K" },
      { label: "Tiempo medio", value: "3:12" },
      { label: "Awwwards", value: "Honorable Mention" },
    ],
    creditos: [
      { role: "Dirección creativa", name: "Limitless Studio" },
      { role: "Shaders", name: "Equipo Limitless" },
    ],
  },
];

export const getProjectBySlug = (slug: string) =>
  PROJECTS.find((p) => p.slug === slug);

export const getNextProject = (slug: string) => {
  const idx = PROJECTS.findIndex((p) => p.slug === slug);
  if (idx === -1) return null;
  return PROJECTS[(idx + 1) % PROJECTS.length];
};
