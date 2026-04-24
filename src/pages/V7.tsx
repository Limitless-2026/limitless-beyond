import { lazy, Suspense, useEffect, useState } from "react";
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

const V7 = () => {
  const lite = isLowTier();
  const [useWebGL, setUseWebGL] = useState<boolean | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showPreloader, setShowPreloader] = useState(true);

  useEffect(() => {
    setUseWebGL(isWebGLAvailable());
  }, []);

  useEffect(() => {
    const max = () => window.innerHeight * HERO_SCROLL_VH;
    let raf = 0;
    const commit = () => {
      raf = 0;
      const p = Math.max(0, Math.min(1, window.scrollY / max()));
      setScrollProgress(p);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(commit);
    };
    commit();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", commit);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", commit);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

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

  const heroOpacity = fadeInOut(scrollProgress, -0.01, 0, 0.18, 0.30);
  const heroScale = 1 + scrollProgress * 0.6;
  const heroBlur = Math.min(8, scrollProgress * 8);
  const subOpacity = heroOpacity;

  const midShow = fadeInOut(scrollProgress, 0.32, 0.42, 0.55, 0.65);
  const endOpacity = fadeInOut(scrollProgress, 0.68, 0.78, 0.95, 0.99);

  const heroLayerOpacity =
    scrollProgress < 0.95 ? 1 : Math.max(0, 1 - (scrollProgress - 0.95) * 50);
  const heroLayerHidden = scrollProgress > 0.97;

  const nebulaVisible = scrollProgress < 0.89;

  const flashCenter = 0.91;
  const flashWidth = 0.05;
  const flashD = Math.abs(scrollProgress - flashCenter);
  const flashOpacity = flashD < flashWidth ? Math.pow(1 - flashD / flashWidth, 1.6) : 0;

  const badgeOpacity =
    scrollProgress < 0.92 ? 1 : Math.max(0, 1 - (scrollProgress - 0.92) * 15);

  return (
    <div className="relative bg-background text-foreground">
      {showPreloader && <Preloader onDone={() => setShowPreloader(false)} />}
      <div
        className="fixed inset-0"
        style={{
          opacity: nebulaVisible ? 1 : 0,
          visibility: nebulaVisible ? "visible" : "hidden",
          background: "rgb(2,1,5)",
        }}
      >
        {useWebGL === null ? null : !useWebGL ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-foreground/50 text-sm">WebGL no soportado en este navegador</p>
          </div>
        ) : nebulaVisible && !lite ? (
          <Suspense fallback={null}>
            <HeroWebGLV2 />
          </Suspense>
        ) : null}
      </div>

      <StarfieldParallax visible={scrollProgress > 0.91} />

      {!lite && <CustomCursor />}
      <HamburgerMenu />

      <div
        className="fixed inset-0 pointer-events-none z-[8]"
        style={{ background: "white", opacity: flashOpacity }}
      />

      <div
        className="fixed inset-0 pointer-events-none z-[5]"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 40%, rgba(0,0,0,0) 75%)",
          opacity: 1 - scrollProgress * 0.6,
        }}
      />

      <div
        className="fixed top-6 left-6 z-50 pointer-events-none"
        style={{ opacity: badgeOpacity, transition: "opacity 200ms linear" }}
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
        className="fixed inset-0 pointer-events-none z-10"
        style={{
          opacity: heroLayerOpacity,
          visibility: heroLayerHidden ? "hidden" : "visible",
          transition: "opacity 150ms linear",
        }}
      >
        <section className="absolute inset-0 flex flex-col items-center justify-center">
          <div
            className="text-center px-6"
            style={{
              opacity: heroOpacity,
              transform: `scale(${heroScale})`,
              filter: `blur(${heroBlur}px)`,
            }}
          >
            <p
              className="text-xs md:text-sm tracking-[0.4em] uppercase text-foreground/85 mb-6 font-light"
              style={{ opacity: subOpacity, textShadow: "0 2px 20px rgba(0,0,0,0.7)" }}
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
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
            style={{ opacity: subOpacity }}
          >
            <span className="text-[10px] tracking-[0.3em] uppercase text-foreground/40">Scroll</span>
            <div className="w-px h-12 bg-gradient-to-b from-foreground/40 to-transparent animate-pulse" />
          </div>
        </section>

        <section className="absolute inset-0 flex items-center justify-center">
          <div
            className="text-center px-6"
            style={{
              opacity: midShow,
              transform: `scale(${0.85 + midShow * 0.15})`,
            }}
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
            className="text-center px-6"
            style={{
              opacity: endOpacity,
              transform: `scale(${0.9 + endOpacity * 0.1})`,
            }}
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
