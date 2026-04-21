import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";

const items = [
  { number: "01", label: "Inicio",    desc: "Volver al universo",    to: "/v5" },
  { number: "02", label: "Proyectos", desc: "Casos en órbita",       to: "/proyectos" },
  { number: "03", label: "Contacto",  desc: "Romper límites juntos", to: "/contacto" },
];

const HamburgerMenu = () => {
  const [open, setOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (open) {
      // Trigger reveal animation just after mount
      const id = requestAnimationFrame(() => setRevealed(true));
      return () => cancelAnimationFrame(id);
    }
    setRevealed(false);
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          className="fixed top-6 right-6 z-[100] group flex items-center gap-4 px-1 py-2 bg-transparent"
        >
          <span
            className="text-[10px] tracking-[0.4em] uppercase font-light text-foreground/60 group-hover:text-foreground transition-colors duration-300"
            style={{ fontFamily: "'Arkitech', 'Inter', sans-serif" }}
          >
            Menú
          </span>
          <span
            className="text-[10px] tracking-[0.3em] font-light text-foreground/30 group-hover:text-primary/80 transition-colors duration-300"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            — 03
          </span>
          <span className="relative flex flex-col items-end justify-center w-[26px] h-[14px]">
            <span
              className={`absolute left-0 right-0 h-px bg-foreground/70 group-hover:bg-foreground transition-all duration-500 ease-out ${
                open ? "top-1/2 rotate-45" : "top-[3px]"
              }`}
            />
            <span
              className={`absolute left-0 h-px bg-foreground/70 group-hover:bg-foreground transition-all duration-500 ease-out top-1/2 -translate-y-1/2 ${
                open ? "w-0 opacity-0" : "w-full opacity-100"
              }`}
            />
            <span
              className={`absolute left-0 right-0 h-px bg-foreground/70 group-hover:bg-foreground transition-all duration-500 ease-out ${
                open ? "top-1/2 -rotate-45" : "bottom-[3px]"
              }`}
            />
          </span>
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="!w-full sm:!max-w-[560px] !max-w-none p-0 border-0 overflow-hidden [&_>button.absolute.right-4]:hidden"
        style={{ background: "#08080C" }}
      >
        {/* SVG grain */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.04] mix-blend-overlay"
          xmlns="http://www.w3.org/2000/svg"
        >
          <filter id="hm-noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#hm-noise)" />
        </svg>

        {/* Color fields */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 0% 100%, hsl(var(--primary) / 0.20) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 100% 0%, hsl(327 100% 39% / 0.10) 0%, transparent 60%)",
          }}
        />

        {/* Animated left edge */}
        <div
          className="absolute left-0 top-0 bottom-0 w-px overflow-hidden pointer-events-none"
          style={{ background: "hsl(var(--primary) / 0.10)" }}
        >
          <div
            className="absolute left-0 right-0 transition-all duration-[1400ms] ease-out"
            style={{
              top: revealed ? "100%" : "0%",
              height: "40%",
              background:
                "linear-gradient(to bottom, transparent, hsl(var(--primary) / 0.9), transparent)",
              transform: "translateY(-100%)",
            }}
          />
        </div>

        {/* Vertical wordmark watermark */}
        <div
          aria-hidden
          className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none select-none"
          style={{
            transform: "translateY(-50%) rotate(-90deg)",
            transformOrigin: "left center",
            fontFamily: "'Arkitech', 'Inter', sans-serif",
          }}
        >
          <span className="block text-7xl tracking-[0.4em] font-extralight uppercase text-foreground/[0.05] whitespace-nowrap">
            Limitless
          </span>
        </div>

        <div className="relative h-full flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between px-10 pt-10 pb-6">
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="block w-2 h-2 rounded-full bg-primary"
                style={{ boxShadow: "0 0 12px hsl(var(--primary) / 0.6)" }}
              />
              <div
                className="text-[10px] tracking-[0.4em] uppercase text-foreground/60 font-light"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Menú · Índice
              </div>
            </div>
            <SheetClose
              aria-label="Cerrar menú"
              className="group relative w-8 h-8 flex items-center justify-center text-foreground/60 hover:text-primary transition-colors duration-300"
            >
              <span className="absolute h-px w-4 bg-current rotate-45" />
              <span className="absolute h-px w-4 bg-current -rotate-45" />
            </SheetClose>
          </div>

          {/* Items — right aligned */}
          <nav className="flex-1 flex flex-col justify-center px-10 pr-12 gap-10">
            {items.map((item, idx) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="group relative block text-right"
                  style={{
                    clipPath: revealed ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)",
                    transition: `clip-path 700ms cubic-bezier(0.22, 1, 0.36, 1) ${idx * 110}ms, transform 500ms ease-out`,
                  }}
                >
                  <div
                    className={`text-[11px] tracking-[0.4em] uppercase font-light transition-all duration-300 group-hover:-translate-x-2 ${
                      active ? "text-[hsl(327_100%_45%)]" : "text-primary/70"
                    }`}
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {item.number}
                  </div>

                  <div className="relative mt-2 flex items-baseline justify-end gap-4">
                    <span className="text-foreground/0 group-hover:text-foreground/80 text-2xl translate-x-3 group-hover:translate-x-0 transition-all duration-300">
                      ←
                    </span>
                    <span
                      className={`text-5xl md:text-6xl tracking-[0.18em] uppercase font-extralight leading-none transition-all duration-300 ${
                        active
                          ? "bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent"
                          : "text-foreground/90 group-hover:bg-gradient-to-r group-hover:from-foreground group-hover:via-primary group-hover:to-foreground group-hover:bg-clip-text group-hover:text-transparent"
                      }`}
                      style={{ fontFamily: "'Arkitech', 'Inter', sans-serif" }}
                    >
                      {item.label}
                    </span>
                  </div>

                  <div
                    className="mt-3 text-[10px] tracking-[0.3em] uppercase text-foreground/35 font-light"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {item.desc}
                  </div>

                  <div
                    className={`mt-4 ml-auto h-px bg-primary transition-all duration-500 ease-out ${
                      active ? "w-[30%]" : "w-0 group-hover:w-20"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="px-10 pb-10 pt-6 border-t border-foreground/10 grid gap-2">
            <div className="flex items-center justify-between">
              <span
                className="text-[10px] tracking-[0.3em] uppercase text-foreground/40 font-light"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Argentina · 2025
              </span>
              <span
                className="text-[10px] tracking-[0.3em] uppercase text-foreground/40 font-light"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                hola@limitless.studio
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span
                className="text-[10px] tracking-[0.3em] uppercase text-foreground/25 font-light"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Buenos Aires · −34.6° / −58.4°
              </span>
              <span
                aria-hidden
                className="block w-1.5 h-1.5 rounded-full bg-primary animate-pulse"
                style={{ boxShadow: "0 0 10px hsl(var(--primary) / 0.7)" }}
              />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default HamburgerMenu;