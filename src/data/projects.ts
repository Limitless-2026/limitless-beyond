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
  año: "2026",
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
  // 01–02: en construcción (todavía faltan assets/detalles)
  make({ id: "01", slug: "aceros-cas", name: "ACEROS CAS", cover: "/images/1-AcerosCas.png", estado: "EN CONSTRUCCIÓN" }),
  make({ id: "02", slug: "beltran", name: "BELTRÁN", cover: PLACEHOLDER, estado: "EN CONSTRUCCIÓN" }),
  // Desde Dolton (03) hacia abajo: webs publicadas
  make({ id: "03", slug: "dolton", name: "DOLTON", cover: "/images/3-Dolton.png", estado: "LANZADO" }),
  make({ id: "04", slug: "assitech", name: "ASSITECH", cover: "/images/4-Assitech.png", estado: "LANZADO" }),
  make({ id: "05", slug: "taol", name: "TAOL", cover: "/images/5-TAOL.png", estado: "LANZADO" }),
  make({ id: "06", slug: "emprendimientos", name: "EMPRENDIMIENTOS", cover: PLACEHOLDER, estado: "LANZADO" }),
  make({ id: "07", slug: "occ", name: "OCC", cover: "/images/7-OCC.png", estado: "LANZADO" }),
  make({ id: "08", slug: "a-la-tremenda", name: "A LA TREMENDA", cover: "/images/8-ALaTremenda.png", estado: "LANZADO" }),
  make({ id: "09", slug: "morph", name: "MORPH", cover: "/images/9-Morph.png", estado: "LANZADO" }),
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
