import { lazy, Suspense, useEffect, useState, useRef } from "react";
import CustomCursor from "@/components/CustomCursor";
import HamburgerMenu from "@/components/HamburgerMenu";
import StarfieldParallax from "@/components/StarfieldParallax";
import ServicesProjectsJourneyV7 from "@/components/ServicesProjectsJourneyV7";
import AboutConstellation from "@/components/AboutConstellation";
import CosmicFooterV2 from "@/components/CosmicFooterV2";
import Preloader from "@/components/Preloader";
import { HERO_SCROLL_VH } from "@/constants/heroScroll";
import { isLowTier } from "@/hooks/useDeviceTier";
import { PROJECTS_ORDERED } from "@/data/projects";

function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    return !!gl;
  } catch {
    return false;
  }
}

const HeroWebGLV2 = lazy(() => import("@/components/HeroWebGLV2"));

const fadeInOut = (
  p: number,
  inStart: number,
  inEnd: number,
  outStart: number,
  outEnd: number,
) => {
  if (p < inStart || p > outEnd) return 0;
  if (p < inEnd) return (p - inStart) / (inEnd - inStart);
  if (p < outStart) return 1;
  return 1 - (p - outStart) / (outEnd - outStart);
};

const V7 = () => {
  const lite = isLowTier();
  const [useWebGL, setUseWebGL] = useState<boolean | null>(null);
  const [showPreloader, setShowPreloader] = useState(true);
  
  // Minimal React states only for mounting/unmounting
  const [starfieldVisible, setStarfieldVisible] = useState(false);
  const [nebulaMount, setNebulaMount] = useState(true);
  const stateTracker = useRef({ starfield: false, nebula: true });

  // Refs for direct DOM manipulation to bypass React render loop (60fps smooth)
  const nebulaRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const gradientRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const heroLayerRef = useRef<HTMLDivElement>(null);
  const heroTextRef = useRef<HTMLDivElement>(null);
  const heroSubtextRef = useRef<HTMLParagraphElement>(null);
  const heroScrollPromptRef = useRef<HTMLDivElement>(null);
  const midSectionRef = useRef<HTMLDivElement>(null);
  const endSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUseWebGL(isWebGLAvailable());
  }, []);

  useEffect(() => {
    const max = () => window.innerHeight * HERO_SCROLL_VH;
    let raf = 0;
    let lastP = -1;

    const commit = () => {
      raf = 0;
      const p = Math.max(0, Math.min(1, window.scrollY / max()));
      if (p === lastP) return;
      lastP = p;

      // Mount/Unmount logic (triggers cheap re-render only when threshold is crossed)
      if (p > 0.91 && !stateTracker.current.starfield) {
        stateTracker.current.starfield = true;
        setStarfieldVisible(true);
      } else if (p <= 0.91 && stateTracker.current.starfield) {
        stateTracker.current.starfield = false;
        setStarfieldVisible(false);
      }

      const nebulaVisible = p < 0.89;
      if (!nebulaVisible && stateTracker.current.nebula) {
        stateTracker.current.nebula = false;
        setNebulaMount(false);
      } else if (nebulaVisible && !stateTracker.current.nebula) {
        stateTracker.current.nebula = true;
        setNebulaMount(true);
      }

      // Direct DOM manipulation (Bypasses React render loop)
      if (nebulaRef.current) {
        nebulaRef.current.style.opacity = nebulaVisible ? "1" : "0";
        nebulaRef.current.style.visibility = nebulaVisible ? "visible" : "hidden";
      }

      const flashCenter = 0.91;
      const flashWidth = 0.05;
      const flashD = Math.abs(p - flashCenter);
      const flashOpacity = flashD < flashWidth ? Math.pow(1 - flashD / flashWidth, 1.6) : 0;
      if (flashRef.current) flashRef.current.style.opacity = flashOpacity.toString();

      if (gradientRef.current) gradientRef.current.style.opacity = (1 - p * 0.6).toString();

      const badgeOpacity = p < 0.92 ? 1 : Math.max(0, 1 - (p - 0.92) * 15);
      if (badgeRef.current) badgeRef.current.style.opacity = badgeOpacity.toString();

      const heroLayerOpacity = p < 0.95 ? 1 : Math.max(0, 1 - (p - 0.95) * 50);
      const heroLayerHidden = p > 0.97;
      if (heroLayerRef.current) {
        heroLayerRef.current.style.opacity = heroLayerOpacity.toString();
        heroLayerRef.current.style.visibility = heroLayerHidden ? "hidden" : "visible";
      }

      const heroOpacity = fadeInOut(p, -0.01, 0, 0.18, 0.30);
      const heroScale = 1 + p * 0.6;
      const heroBlur = Math.min(8, p * 8);
      if (heroTextRef.current) {
        heroTextRef.current.style.opacity = heroOpacity.toString();
        heroTextRef.current.style.transform = `scale(${heroScale})`;
        heroTextRef.current.style.filter = `blur(${heroBlur}px)`;
      }

      if (heroSubtextRef.current) heroSubtextRef.current.style.opacity = heroOpacity.toString();
      if (heroScrollPromptRef.current) heroScrollPromptRef.current.style.opacity = heroOpacity.toString();

      const midShow = fadeInOut(p, 0.32, 0.42, 0.55, 0.65);
      if (midSectionRef.current) {
        midSectionRef.current.style.opacity = midShow.toString();
        midSectionRef.current.style.transform = `scale(${0.85 + midShow * 0.15})`;
      }

      const endOpacity = fadeInOut(p, 0.68, 0.78, 0.95, 0.99);
      if (endSectionRef.current) {
        endSectionRef.current.style.opacity = endOpacity.toString();
        endSectionRef.current.style.transform = `scale(${0.9 + endOpacity * 0.1})`;
      }
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(commit);
    };

    // Initial commit
    commit();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", commit);
    
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", commit);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="relative bg-background text-foreground">
      {showPreloader && <Preloader onDone={() => setShowPreloader(false)} />}
      <div
        ref={nebulaRef}
        className="fixed inset-0"
        style={{
          background: "rgb(2,1,5)",
        }}
      >
        {useWebGL === null ? null : !useWebGL ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-foreground/50 text-sm">WebGL no soportado en este navegador</p>
          </div>
        ) : nebulaMount && !lite ? (
          <Suspense fallback={null}>
            <HeroWebGLV2 />
          </Suspense>
        ) : null}
      </div>

      <StarfieldParallax visible={starfieldVisible} />

      {!lite && <CustomCursor />}
      <HamburgerMenu />

      <div
        ref={flashRef}
        className="fixed inset-0 pointer-events-none z-[8]"
        style={{ background: "white", opacity: 0 }}
      />

      <div
        ref={gradientRef}
        className="fixed inset-0 pointer-events-none z-[5]"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 40%, rgba(0,0,0,0) 75%)",
        }}
      />

      <div
        ref={badgeRef}
        className="fixed top-6 left-6 z-50 pointer-events-none"
        style={{ transition: "opacity 200ms linear" }}
      >
        <div className="flex items-center gap-3">
          <img
            src="/images/Logo%20(3).png"
            alt="Limitless"
            className="h-6 w-6 object-contain opacity-80"
            draggable={false}
          />
          <img
            src="/images/LIMITLESS.png"
            alt="Limitless Studio"
            className="h-4 object-contain opacity-80"
            draggable={false}
          />
        </div>
      </div>

      <div
        ref={heroLayerRef}
        className="fixed inset-0 pointer-events-none z-10"
        style={{
          transition: "opacity 150ms linear",
        }}
      >
        <section className="absolute inset-0 flex flex-col items-center justify-center">
          <div
            ref={heroTextRef}
            className="text-center px-6"
          >
            <p
              ref={heroSubtextRef}
              className="text-xs md:text-sm tracking-[0.4em] uppercase text-foreground/85 mb-6 font-light"
              style={{ textShadow: "0 2px 20px rgba(0,0,0,0.7)" }}
            >
              Estudio · Argentina
            </p>
            <h1
              className="text-5xl md:text-7xl lg:text-8xl font-light tracking-tight leading-[0.95] text-foreground"
              style={{ textShadow: "0 2px 30px rgba(0,0,0,0.6)" }}
            >
              Los límites
              <br />
              <span className="italic font-extralight bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                están para romperse
              </span>
            </h1>
          </div>

          <div
            ref={heroScrollPromptRef}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
          >
            <span className="text-[10px] tracking-[0.3em] uppercase text-foreground/40">Scroll</span>
            <div className="w-px h-12 bg-gradient-to-b from-foreground/40 to-transparent animate-pulse" />
          </div>
        </section>

        <section className="absolute inset-0 flex items-center justify-center">
          <div
            ref={midSectionRef}
            className="text-center px-6"
            style={{ opacity: 0 }}
          >
            <p
              className="text-xs md:text-sm tracking-[0.4em] uppercase text-primary mb-6 font-light"
              style={{ textShadow: "0 2px 20px rgba(0,0,0,0.8)" }}
            >
              Cruzando el horizonte
            </p>
            <h2
              className="text-4xl md:text-6xl lg:text-7xl font-light tracking-tight leading-tight text-foreground/95"
              style={{ textShadow: "0 2px 30px rgba(0,0,0,0.7)" }}
            >
              No hay fronteras
              <br />
              cuando el espacio
              <br />
              <em className="not-italic bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                es infinito
              </em>
            </h2>
          </div>
        </section>

        <section className="absolute inset-0 flex items-center justify-center">
          <div
            ref={endSectionRef}
            className="text-center px-6"
            style={{ opacity: 0 }}
          >
            <p
              className="text-xs md:text-sm tracking-[0.4em] uppercase text-primary mb-6 font-light"
              style={{ textShadow: "0 2px 20px rgba(0,0,0,0.8)" }}
            >
              Bienvenido al otro lado
            </p>
            <h2
              className="text-6xl md:text-8xl lg:text-[10rem] font-extralight tracking-tighter leading-none text-foreground"
              style={{ textShadow: "0 4px 40px rgba(0,0,0,0.7)" }}
            >
              LIMITLESS
            </h2>
            <p
              className="mt-8 text-base md:text-lg text-foreground/90 max-w-lg mx-auto font-light"
              style={{ textShadow: "0 2px 20px rgba(0,0,0,0.7)" }}
            >
              Diseño y desarrollo sin fronteras.
              <br />
              Hecho en Argentina, para el universo.
            </p>
          </div>
        </section>
      </div>

      <div className="relative z-0 h-[420vh]" />
      <div className="relative z-0 h-[80vh] bg-black" />

      {!lite ? (
        <ServicesProjectsJourneyV7 />
      ) : (
        <section className="relative z-10 bg-black py-20 px-6 md:px-12">
          <div className="max-w-6xl mx-auto">
            <p className="text-[10px] tracking-[0.4em] uppercase text-foreground/50 font-light">
              Servicios · Proyectos
            </p>
            <h2 className="mt-4 text-4xl md:text-6xl font-extralight tracking-tight text-foreground">
              Proyectos
            </h2>
            <p className="mt-6 text-sm md:text-base text-foreground/60 font-light leading-relaxed">
              Versión liviana para celular. El recorrido 3D completo está en desktop.
            </p>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {PROJECTS_ORDERED.map((p) => {
                const disabled = p.estado === "EN CONSTRUCCIÓN";
                const content = (
                  <div className="group relative overflow-hidden rounded-xl border border-foreground/10 bg-foreground/[0.02]">
                    <div className="relative aspect-[16/11] overflow-hidden">
                      <img
                        src={p.cover}
                        alt={p.name}
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 w-full h-full object-cover opacity-85"
                        draggable={false}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                      <div className="absolute top-4 left-4 flex items-center gap-2">
                        <span className="text-[10px] tracking-[0.3em] uppercase text-foreground/70 font-light">
                          {p.id}
                        </span>
                        <span
                          className="text-[10px] tracking-[0.25em] uppercase font-light px-2 py-1 rounded-full border"
                          style={{
                            borderColor:
                              p.estado === "LANZADO"
                                ? "rgba(237,236,232,0.18)"
                                : "rgba(200,0,122,0.35)",
                            color:
                              p.estado === "LANZADO"
                                ? "rgba(237,236,232,0.55)"
                                : "rgba(200,0,122,0.85)",
                            background:
                              p.estado === "LANZADO"
                                ? "rgba(0,0,0,0.25)"
                                : "rgba(200,0,122,0.08)",
                          }}
                        >
                          {p.estado}
                        </span>
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="text-2xl font-extralight tracking-tight text-foreground">
                        {p.name}
                      </h3>
                      <p className="mt-2 text-xs text-foreground/55 font-light">
                        {p.tipo} · {p.año}
                      </p>
                      <div className="mt-6 flex items-center justify-between">
                        <span className="text-[10px] tracking-[0.3em] uppercase text-primary font-light">
                          {disabled ? "Próximamente" : "Ver caso →"}
                        </span>
                      </div>
                    </div>
                  </div>
                );

                return (
                  <div key={p.id} className={disabled ? "opacity-70" : ""}>
                    {disabled ? content : <a href={`/proyectos/${p.slug}`}>{content}</a>}
                  </div>
                );
              })}
            </div>

            <div className="mt-10 flex justify-center">
              <a
                href="/proyectos"
                className="inline-flex items-center gap-3 border border-foreground/20 px-6 py-3 text-xs tracking-[0.35em] uppercase text-foreground/80 font-light hover:border-primary hover:text-foreground transition-colors"
              >
                Ver todos →
              </a>
            </div>
          </div>
        </section>
      )}

      <div className="h-[20vh]" />
      <AboutConstellation />

      <CosmicFooterV2 />
    </div>
  );
};

export default V7;
