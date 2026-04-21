export type ProjectStatus = "EN ÓRBITA" | "LANZADO" | "EN CONSTRUCCIÓN";

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
  },
];