import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";

const items = [
  { number: "01", label: "Inicio",    desc: "Volver al universo",         to: "/v5" },
  { number: "02", label: "Proyectos", desc: "Casos en órbita",            to: "/proyectos" },
  { number: "03", label: "Contacto",  desc: "Romper límites juntos",      to: "/contacto" },
];

const HamburgerMenu = () => {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const location = useLocation();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label="Abrir menú"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          className="fixed top-6 right-6 z-[100] group flex items-center gap-3 px-1 py-2 bg-transparent"
        >
          <span
            className={`text-[10px] tracking-[0.4em] uppercase font-light transition-colors duration-300 ${
              hover ? "text-primary" : "text-foreground/70"
            }`}
            style={{ fontFamily: "'Arkitech', 'Inter', sans-serif" }}
          >
            Menú
          </span>
          <span className="relative flex flex-col items-end gap-[5px] w-[22px] h-[14px] justify-center">
            <span
              className={`block h-px transition-all duration-300 ${
                hover ? "bg-primary translate-x-[-2px] w-[22px]" : "bg-foreground/70 w-[22px]"
              }`}
            />
            <span
              className={`block h-px transition-all duration-300 ${
                hover ? "bg-primary w-[11px]" : "bg-foreground/70 w-[22px]"
              }`}
            />
            <span
              className={`block h-px transition-all duration-300 ${
                hover ? "bg-primary translate-x-[2px] w-[22px]" : "bg-foreground/70 w-[22px]"
              }`}
            />
          </span>
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full sm:max-w-[480px] p-0 border-0 [&>button]:hidden"
        style={{
          background: "#08080C",
          boxShadow: "inset 1px 0 0 hsl(var(--primary) / 0.18)",
        }}
      >
        {/* Gradiente sutil violeta/magenta */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 0% 100%, hsl(var(--primary) / 0.18) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 100% 0%, hsl(327 100% 39% / 0.10) 0%, transparent 60%)",
          }}
        />

        <div className="relative h-full flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between px-10 pt-10 pb-6">
            <div>
              <div
                className="text-2xl tracking-[0.3em] font-light text-foreground uppercase"
                style={{ fontFamily: "'Arkitech', 'Inter', sans-serif" }}
              >
                Limitless
              </div>
              <div className="mt-3 h-px w-10 bg-foreground/30" />
            </div>
            <SheetClose
              aria-label="Cerrar menú"
              className="group relative w-8 h-8 flex items-center justify-center text-foreground/60 hover:text-primary transition-colors duration-300"
            >
              <span className="absolute h-px w-4 bg-current rotate-45" />
              <span className="absolute h-px w-4 bg-current -rotate-45" />
            </SheetClose>
          </div>

          {/* Items */}
          <nav className="flex-1 flex flex-col justify-center px-10 gap-2">
            {items.map((item, idx) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="group relative block py-5 transition-transform duration-500 ease-out hover:translate-x-3"
                  style={{
                    animation: open
                      ? `menuItemIn 600ms cubic-bezier(0.22, 1, 0.36, 1) ${idx * 80}ms both`
                      : undefined,
                  }}
                >
                  <div className="flex items-baseline gap-5">
                    <span
                      className="text-[10px] tracking-[0.3em] text-foreground/30 font-light w-6"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {item.number}
                    </span>
                    <span className="h-px w-6 bg-foreground/20 self-center" />
                    <span
                      className={`text-3xl md:text-4xl tracking-[0.22em] uppercase font-light transition-colors duration-300 ${
                        active ? "text-primary" : "text-foreground/90 group-hover:text-primary"
                      }`}
                      style={{ fontFamily: "'Arkitech', 'Inter', sans-serif" }}
                    >
                      {item.label}
                    </span>
                    <span className="ml-auto text-foreground/60 text-xl opacity-0 -translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                      →
                    </span>
                  </div>
                  <div
                    className="mt-3 ml-[68px] text-[10px] tracking-[0.25em] uppercase text-foreground/40 font-light"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {item.desc}
                  </div>
                  <div className="mt-3 ml-[68px] h-px w-0 bg-primary group-hover:w-10 transition-all duration-500 ease-out" />
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="px-10 pb-10 pt-6 border-t border-foreground/10">
            <div
              className="text-[10px] tracking-[0.3em] uppercase text-foreground/40 font-light"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Argentina · 2025
            </div>
            <div
              className="mt-2 text-[11px] tracking-[0.15em] text-foreground/60 font-light"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              hola@limitless.studio
            </div>
          </div>
        </div>

        <style>{`
          @keyframes menuItemIn {
            from { opacity: 0; transform: translateX(40px); }
            to   { opacity: 1; transform: translateX(0); }
          }
        `}</style>
      </SheetContent>
    </Sheet>
  );
};

export default HamburgerMenu;