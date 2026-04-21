import { lazy, Suspense, useEffect, useState } from "react";
import CustomCursor from "@/components/CustomCursor";
import ProjectsWarp from "@/components/ProjectsWarp";
import StarfieldParallax from "@/components/StarfieldParallax";

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

const V2 = () => {
  const [useWebGL, setUseWebGL] = useState<boolean | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    setUseWebGL(isWebGLAvailable());
  }, []);

  useEffect(() => {
    let raf = 0;
    let target = 0;
    let current = 0;
    const tick = () => {
      current += (target - current) * 0.12;
      if (Math.abs(target - current) < 0.0005) current = target;
      setScrollProgress(current);
      if (current !== target) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    };
    const onScroll = () => {
      const max = window.innerHeight * 3.5;
      target = Math.max(0, Math.min(1, window.scrollY / max));
      if (!raf) raf = requestAnimationFrame(tick);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Hero text fades and stretches inward
  const heroOpacity = Math.max(0, 1 - scrollProgress * 2.5);
  const heroScale = 1 + scrollProgress * 0.6;
  const heroBlur = scrollProgress * 12;
  const subOpacity = Math.max(0, 1 - scrollProgress * 4);

  // Mid-section "breakthrough" text
  const midOpacity = Math.max(0, Math.min(1, (scrollProgress - 0.35) * 3));
  const midFade = Math.max(0, 1 - Math.max(0, scrollProgress - 0.6) * 4);
  const midShow = midOpacity * midFade;

  // Final section — sube rápido a 1 en ~0.78 y se desvanece entre 0.85 y 0.92
  const endIn = Math.max(0, Math.min(1, (scrollProgress - 0.62) * 6));
  const endOut = Math.max(0, Math.min(1, 1 - Math.max(0, scrollProgress - 0.85) * 14));
  const endOpacity = endIn * endOut;

  // Capa de texto del hero — se oculta antes de que entren los proyectos
  const heroLayerOpacity = scrollProgress < 0.85 ? 1 : Math.max(0, 1 - (scrollProgress - 0.85) * 14);
  const heroLayerHidden = scrollProgress > 0.94;

  // Nebulosa WebGL — fade-out en el último tramo del hero
  const nebulaOpacity = scrollProgress < 0.78 ? 1 : Math.max(0, 1 - (scrollProgress - 0.78) * 6);

  // Badge top-left — se atenúa al entrar en proyectos
  const badgeOpacity = scrollProgress < 0.9 ? 1 : Math.max(0, 1 - (scrollProgress - 0.9) * 12);

  return (
    <div className="relative bg-background text-foreground">
      {/* Cosmic background — fixed, infinite */}
      <div
        className="fixed inset-0"
        style={{
          opacity: nebulaOpacity,
          transition: "opacity 200ms linear",
          background: "rgb(2,1,5)",
        }}
      >
        {useWebGL === null ? null : useWebGL ? (
          <Suspense fallback={null}>
            <HeroWebGLV2 />
          </Suspense>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-foreground/50 text-sm">WebGL no soportado en este navegador</p>
          </div>
        )}
      </div>

      {/* Starfield parallax — toma el relevo al final del hero */}
      <StarfieldParallax visible={scrollProgress > 0.78} />

      <CustomCursor />

      {/* Overlay oscurecedor — sobre la nebulosa, debajo del texto */}
      <div
        className="fixed inset-0 pointer-events-none z-[5]"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 40%, rgba(0,0,0,0) 75%)",
          opacity: 1 - scrollProgress * 0.6,
        }}
      />

      {/* Top-left v2 badge */}
      <div
        className="fixed top-6 left-6 z-50 pointer-events-none"
        style={{ opacity: badgeOpacity, transition: "opacity 200ms linear" }}
      >
        <span className="text-[10px] tracking-[0.4em] uppercase text-foreground/50 font-light">
          Limitless · v2
        </span>
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
              transition: "filter 0.1s linear",
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
            <p
              className="mt-8 text-sm md:text-base text-foreground/85 max-w-md mx-auto font-light"
              style={{ opacity: subOpacity, textShadow: "0 2px 20px rgba(0,0,0,0.7)" }}
            >
              Movete con el mouse · Scrolleá para atravesar
            </p>
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

      {/* Vacío estelar entre el hero y los proyectos */}
      <div className="relative z-0 h-[80vh] bg-black" />

      {/* Projects — warp flythrough */}
      <ProjectsWarp />

      {/* Spacer */}
      <div className="h-[20vh]" />
    </div>
  );
};

export default V2;
