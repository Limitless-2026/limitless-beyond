import { lazy, Suspense, useEffect, useState } from "react";
import CustomCursor from "@/components/CustomCursor";

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
    const onScroll = () => {
      const max = window.innerHeight * 2.5;
      setScrollProgress(Math.max(0, Math.min(1, window.scrollY / max)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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

  // Final section
  const endOpacity = Math.max(0, (scrollProgress - 0.75) * 4);

  return (
    <div className="relative bg-background text-foreground">
      {/* Cosmic background — fixed, infinite */}
      {useWebGL === null ? (
        <div className="fixed inset-0" style={{ background: "rgb(2,1,5)" }} />
      ) : useWebGL ? (
        <Suspense fallback={<div className="fixed inset-0" style={{ background: "rgb(2,1,5)" }} />}>
          <HeroWebGLV2 />
        </Suspense>
      ) : (
        <div className="fixed inset-0 flex items-center justify-center" style={{ background: "rgb(2,1,5)" }}>
          <p className="text-foreground/50 text-sm">WebGL no soportado en este navegador</p>
        </div>
      )}

      <CustomCursor />

      {/* Top-left v2 badge */}
      <div className="fixed top-6 left-6 z-50 pointer-events-none">
        <span className="text-[10px] tracking-[0.4em] uppercase text-foreground/50 font-light">
          Limitless · v2
        </span>
      </div>

      {/* Hero */}
      <section className="relative h-screen w-full flex flex-col items-center justify-center pointer-events-none z-10">
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
            className="text-xs md:text-sm tracking-[0.4em] uppercase text-foreground/60 mb-6 font-light"
            style={{ opacity: subOpacity }}
          >
            Estudio · Argentina
          </p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-light tracking-tight leading-[0.95]">
            Los límites
            <br />
            <span className="italic font-extralight bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              están para romperse
            </span>
          </h1>
          <p
            className="mt-8 text-sm md:text-base text-foreground/50 max-w-md mx-auto font-light"
            style={{ opacity: subOpacity }}
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

      {/* Mid — inside the portal */}
      <section className="relative h-screen w-full flex items-center justify-center pointer-events-none z-10">
        <div
          className="text-center px-6"
          style={{
            opacity: midShow,
            transform: `scale(${0.85 + midShow * 0.15})`,
          }}
        >
          <p className="text-xs md:text-sm tracking-[0.4em] uppercase text-primary/80 mb-6 font-light">
            Cruzando el horizonte
          </p>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-extralight tracking-tight leading-tight">
            No hay fronteras
            <br />
            cuando el espacio
            <br />
            <em className="not-italic bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              es infinito
            </em>
          </h2>
        </div>
      </section>

      {/* End — through the singularity */}
      <section className="relative h-screen w-full flex items-center justify-center pointer-events-none z-10">
        <div
          className="text-center px-6"
          style={{
            opacity: endOpacity,
            transform: `scale(${0.9 + endOpacity * 0.1})`,
          }}
        >
          <p className="text-xs md:text-sm tracking-[0.4em] uppercase text-primary mb-6 font-light">
            Bienvenido al otro lado
          </p>
          <h2 className="text-6xl md:text-8xl lg:text-[10rem] font-extralight tracking-tighter leading-none">
            LIMITLESS
          </h2>
          <p className="mt-8 text-base md:text-lg text-foreground/60 max-w-lg mx-auto font-light">
            Diseño y desarrollo sin fronteras.
            <br />
            Hecho en Argentina, para el universo.
          </p>
        </div>
      </section>

      {/* Spacer */}
      <div className="h-[60vh]" />
    </div>
  );
};

export default V2;
