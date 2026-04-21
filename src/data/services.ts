export type Service = {
  id: string;
  number: string;
  title: string;
  titleLines: string[];
  tagline: string;
  description: string;
  whatWeDo: string[];
  process: string[];
  stack: string[];
  color: string;
  hasRing?: boolean;
  isImpact?: boolean;
};

export const SERVICES: Service[] = [
  {
    id: "diseno-web",
    number: "01",
    title: "DISEÑO WEB",
    titleLines: ["DISEÑO", "WEB"],
    tagline: "Sitios que respiran. Que duelen. Que ganan.",
    description:
      "Diseñamos sitios donde cada decisión visual tiene una razón narrativa. UX que no se nota, UI que se recuerda.",
    whatWeDo: [
      "Diseño UX/UI editorial",
      "Wireframes y prototipos interactivos",
      "Sistemas de diseño escalables",
      "Diseño editorial y motion",
    ],
    process: ["Briefing", "Concept", "Diseño", "Iteración", "Handoff"],
    stack: ["Figma", "Framer", "After Effects", "Lottie"],
    color: "#7B2FFF",
    hasRing: true,
  },
  {
    id: "desarrollo-web",
    number: "02",
    title: "DESARROLLO WEB",
    titleLines: ["DESARROLLO", "WEB"],
    tagline: "Código que rinde. Performance que enamora.",
    description:
      "Sitios y plataformas construidas con stack moderno. Velocidad, accesibilidad y mantenibilidad como religión.",
    whatWeDo: [
      "Sitios marketing & corporativos",
      "Headless CMS",
      "Animaciones WebGL & GSAP",
      "Optimización Core Web Vitals",
    ],
    process: ["Arquitectura", "Setup", "Build", "QA", "Deploy"],
    stack: ["Next.js", "Astro", "Tailwind", "Vercel"],
    color: "#9A5BFF",
  },
  {
    id: "apps-mobile",
    number: "03",
    title: "APPS MOBILE",
    titleLines: ["APPS", "MOBILE"],
    tagline: "Tu producto, en el bolsillo de quien importa.",
    description:
      "Apps nativas y multiplataforma con foco en producto. De la idea al store, sin escalas.",
    whatWeDo: [
      "iOS & Android",
      "Diseño de producto mobile",
      "Integraciones nativas",
      "Publicación en stores",
    ],
    process: ["Discovery", "Prototipo", "Build", "TestFlight", "Release"],
    stack: ["React Native", "Expo", "Swift", "Kotlin"],
    color: "#5A1FD8",
  },
  {
    id: "software-saas",
    number: "04",
    title: "SOFTWARE / SAAS",
    titleLines: ["SOFTWARE", "& SAAS"],
    tagline: "Plataformas que escalan con tu ambición.",
    description:
      "Construimos SaaS y software a medida. Arquitectura sólida, UI clara, foco en métricas que importan.",
    whatWeDo: [
      "Plataformas SaaS multi-tenant",
      "Dashboards & analytics",
      "APIs y backoffice",
      "Auth, billing & permisos",
    ],
    process: ["Discovery", "MVP", "Iteración", "Scale", "Soporte"],
    stack: ["TypeScript", "Postgres", "Supabase", "AWS"],
    color: "#A974FF",
    hasRing: true,
  },
  {
    id: "branding",
    number: "05",
    title: "BRANDING",
    titleLines: ["BRAND", "BOOK"],
    tagline: "Marcas que se piensan. Que se huelen. Que se quedan.",
    description:
      "Identidades completas: estrategia, naming, sistema visual, tono de voz y guidelines de uso.",
    whatWeDo: [
      "Estrategia de marca",
      "Identidad visual & wordmark",
      "Sistema tipográfico y cromático",
      "Brandbook y guidelines",
    ],
    process: ["Inmersión", "Estrategia", "Concept", "Sistema", "Brandbook"],
    stack: ["Figma", "Illustrator", "InDesign", "Glyphs"],
    color: "#C8007A",
    isImpact: true,
  },
  {
    id: "publicidad",
    number: "06",
    title: "PUBLICIDAD",
    titleLines: ["PUBLI", "CIDAD"],
    tagline: "Campañas que cortan el feed.",
    description:
      "Concepto, dirección creativa y producción de campañas digitales que mueven el negocio, no solo el algoritmo.",
    whatWeDo: [
      "Concepto creativo",
      "Dirección de arte",
      "Producción audiovisual",
      "Performance & social",
    ],
    process: ["Brief", "Insight", "Concept", "Producción", "Pauta"],
    stack: ["Premiere", "After Effects", "Meta Ads", "Google Ads"],
    color: "#8244FF",
  },
];
