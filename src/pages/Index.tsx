import { useEffect, useRef, useState } from "react";
import HeroCanvas from "@/components/HeroCanvas";
import CustomCursor from "@/components/CustomCursor";

const Index = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const max = window.innerHeight * 1.5;
      const p = Math.max(0, Math.min(1, window.scrollY / max));
      setScrollProgress(p);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Hero text animation values driven by scroll
  const heroOpacity = Math.max(0, 1 - scrollProgress * 2.2);
  const heroScale = 1 + scrollProgress * 0.4;
  const heroBlur = scrollProgress * 8;
  const subOpacity = Math.max(0, 1 - scrollProgress * 3);

  // Reveal text appears once we've broken through
  const breakthroughOpacity = Math.max(0, (scrollProgress - 0.55) * 3);

  return (
    <div className="relative bg-background text-foreground">
      {/* Fixed cosmic background — always present */}
      <HeroCanvas />
      <CustomCursor />

      {/* Hero — first viewport */}
      <section
        ref={heroRef}
        className="relative h-screen w-full flex flex-col items-center justify-center pointer-events-none z-10"
      >
        <div
          className="text-center px-6"
          style={{
            opacity: heroOpacity,
            transform: `scale(${heroScale})`,
            filter: `blur(${heroBlur}px)`,
            transition: "opacity 0.1s linear",
          }}
        >
          <p
            className="text-xs md:text-sm tracking-[0.4em] uppercase text-foreground/60 mb-6 font-light"
            style={{ opacity: subOpacity }}
          >
            Limitless · Studio
          </p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-light tracking-tight text-foreground leading-[0.95]">
            Los límites
            <br />
            <span className="italic font-extralight bg-gradient-to-r from-primary via-fuchsia-400 to-primary bg-clip-text text-transparent">
              están para romperse
            </span>
          </h1>
          <p
            className="mt-8 text-sm md:text-base text-foreground/50 max-w-md mx-auto font-light"
            style={{ opacity: subOpacity }}
          >
            Scrolleá para atravesar el portal
          </p>
        </div>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
          style={{ opacity: subOpacity }}
        >
          <span className="text-[10px] tracking-[0.3em] uppercase text-foreground/40">
            Scroll
          </span>
          <div className="w-px h-12 bg-gradient-to-b from-foreground/40 to-transparent animate-pulse" />
        </div>
      </section>

      {/* Breakthrough section — emerges as we scroll into the singularity */}
      <section className="relative h-screen w-full flex items-center justify-center pointer-events-none z-10">
        <div
          className="text-center px-6"
          style={{
            opacity: breakthroughOpacity,
            transform: `scale(${0.85 + breakthroughOpacity * 0.15})`,
          }}
        >
          <p className="text-xs md:text-sm tracking-[0.4em] uppercase text-primary/80 mb-6 font-light">
            Bienvenido al otro lado
          </p>
          <h2 className="text-6xl md:text-8xl lg:text-9xl font-extralight tracking-tighter text-foreground leading-none">
            LIMITLESS
          </h2>
          <p className="mt-8 text-base md:text-lg text-foreground/60 max-w-lg mx-auto font-light">
            Diseño y desarrollo sin fronteras.
            <br />
            Hecho en Argentina, para el universo.
          </p>
        </div>
      </section>

      {/* Spacer to allow scroll completion */}
      <div className="h-[50vh]" />
    </div>
  );
};

export default Index;
