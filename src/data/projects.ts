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

const PLACEHOLDER = "/placeholder.svg";

const make = ({
  id,
  slug,
  name,
  cover,
  estado,
}: {
  id: string;
  slug: string;
  name: string;
  cover: string;
  estado: ProjectStatus;
}): Project => ({
  id,
  slug,
  name,
  cliente: name,
  año: "2024 — 2026",
  stack: "—",
  tipo: "Proyecto",
  estado,
  descripcion: "Caso en construcción. Próximamente sumamos detalles, stack y resultados.",
  cover,
  gallery: [cover],
  problema: "—",
  solucion: "—",
  resultados: [],
  creditos: [],
});

// Orden basado en los archivos numerados que dejaste en `public/images/`.
// 2 y 6: sin imagen todavía → placeholder.
export const PROJECTS: Project[] = [
  // 01: datos reales (link live pendiente)
  {
    id: "01",
    slug: "aceros-cas",
    name: "ACEROS CAS",
    cliente: "AcerosCas",
    año: "2026",
    stack: "React",
    tipo: "Sitio web institucional + manual de marca",
    estado: "EN CONSTRUCCIÓN",
    descripcion:
      "Fábrica de aceros: sitio institucional y manual de marca en desarrollo.",
    cover: "/images/1-AcerosCas.png",
    gallery: ["/images/1-AcerosCas.png"],
    problema: "—",
    solucion: "—",
    resultados: [],
    creditos: [],
  },
  {
    id: "02",
    slug: "beltran",
    name: "BELTRÁN BRIONES",
    cliente: "Beltrán Briones",
    año: "2026",
    stack: "React",
    tipo: "Sitio web",
    estado: "EN CONSTRUCCIÓN",
    descripcion: "Sitio web personal para Beltrán Briones.",
    cover: PLACEHOLDER,
    gallery: [PLACEHOLDER],
    problema: "—",
    solucion: "—",
    resultados: [],
    creditos: [],
    linkLive: "https://beltranbriones.netlify.app/",
  },
  {
    id: "03",
    slug: "dolton",
    name: "DOLTON",
    cliente: "Dolton",
    año: "2025",
    stack: "HTML",
    tipo: "Página web + Re-Branding",
    estado: "LANZADO",
    descripcion: "Cambio visual de la marca, rebranding + página web.",
    cover: "/images/3-Dolton.png",
    gallery: ["/images/3-Dolton.png"],
    problema: "—",
    solucion: "—",
    resultados: [],
    creditos: [],
    linkLive: "http://dolton.com.ar/",
  },
  {
    id: "04",
    slug: "assitech",
    name: "ASSITECH",
    cliente: "ASSITECH",
    año: "2025",
    stack: "HTML",
    tipo: "Landing page",
    estado: "LANZADO",
    descripcion: "Se mejoró la landing para conversiones por Google Ads.",
    cover: "/images/4-Assitech.png",
    gallery: ["/images/4-Assitech.png"],
    problema: "—",
    solucion: "—",
    resultados: [],
    creditos: [],
    linkLive: "https://whirphool.netlify.app/",
  },
  {
    id: "05",
    slug: "taol",
    name: "TAOL",
    cliente: "TAOL",
    año: "2024",
    stack: "—",
    tipo: "Branding",
    estado: "LANZADO",
    descripcion: "Creación de la marca.",
    cover: "/images/5-TAOL.png",
    gallery: ["/images/5-TAOL.png"],
    problema: "—",
    solucion: "—",
    resultados: [],
    creditos: [],
  },
  {
    id: "06",
    slug: "emprendimientos",
    name: "ESCUELA CREADORES DE CONTENIDO",
    cliente: "Mati emprendimientos",
    año: "2026",
    stack: "React",
    tipo: "Página web",
    estado: "EN CONSTRUCCIÓN",
    descripcion: "Mejora y optimización de la web para convertir mejor.",
    cover: PLACEHOLDER,
    gallery: [PLACEHOLDER],
    problema: "—",
    solucion: "—",
    resultados: [],
    creditos: [],
    linkLive: "https://escueladecreadores.netlify.app/",
  },
  {
    id: "07",
    slug: "occ",
    name: "OCC",
    cliente: "OCC",
    año: "2024",
    stack: "HTML",
    tipo: "Branding + página web",
    estado: "LANZADO",
    descripcion: "Creación de marca para empresa constructora + página web.",
    cover: "/images/7-OCC.png",
    gallery: ["/images/7-OCC.png"],
    problema: "—",
    solucion: "—",
    resultados: [],
    creditos: [],
    linkLive: "https://occ-construcciones.netlify.app/",
  },
  {
    id: "08",
    slug: "a-la-tremenda",
    name: "A LA TREMENDA",
    cliente: "A la tremneda",
    año: "2023",
    stack: "—",
    tipo: "Branding",
    estado: "LANZADO",
    descripcion: "Creación de marca para una casa de tortas.",
    cover: "/images/8-ALaTremenda.png",
    gallery: ["/images/8-ALaTremenda.png"],
    problema: "—",
    solucion: "—",
    resultados: [],
    creditos: [],
  },
  {
    id: "09",
    slug: "morph",
    name: "MORPH",
    cliente: "Morph",
    año: "2025",
    stack: "—",
    tipo: "Branding",
    estado: "LANZADO",
    descripcion: "Creación de branding para una empresa constructora.",
    cover: "/images/9-Morph.png",
    gallery: ["/images/9-Morph.png"],
    problema: "—",
    solucion: "—",
    resultados: [],
    creditos: [],
  },
];

const STATUS_PRIORITY: Record<ProjectStatus, number> = {
  "EN CONSTRUCCIÓN": 0,
  "EN ÓRBITA": 1,
  "LANZADO": 2,
};

/** Lista ordenada para mostrar en secciones de Proyectos. */
export const PROJECTS_ORDERED: Project[] = [...PROJECTS].sort((a, b) => {
  const pa = STATUS_PRIORITY[a.estado] ?? 99;
  const pb = STATUS_PRIORITY[b.estado] ?? 99;
  if (pa !== pb) return pa - pb;
  return Number(a.id) - Number(b.id);
});

export const getProjectBySlug = (slug: string) =>
  PROJECTS.find((p) => p.slug === slug);

export const getNextProject = (slug: string) => {
  const idx = PROJECTS.findIndex((p) => p.slug === slug);
  if (idx === -1) return null;
  return PROJECTS[(idx + 1) % PROJECTS.length];
};
