import { useState } from "react";
import { Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const items = [
  { label: "Inicio", to: "/v5" },
  { label: "Proyectos", to: "/proyectos" },
  { label: "Contacto", to: "/contacto" },
];

const HamburgerMenu = () => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label="Abrir menú"
          className="fixed top-6 left-6 z-[100] w-11 h-11 flex items-center justify-center rounded-full bg-background/40 backdrop-blur-md border border-foreground/10 text-foreground/80 hover:text-foreground hover:bg-background/60 transition-colors"
        >
          <Menu size={20} strokeWidth={1.5} />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="bg-background/95 backdrop-blur-xl border-foreground/10 w-full sm:max-w-md p-0"
      >
        <nav className="flex flex-col justify-center h-full px-12 gap-10">
          <span className="text-[10px] tracking-[0.4em] uppercase text-foreground/40 font-light mb-4">
            Limitless · Menú
          </span>
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="group inline-flex items-baseline gap-4 text-foreground/80 hover:text-primary transition-all duration-300 hover:translate-x-2"
            >
              <span className="text-[10px] tracking-[0.3em] text-foreground/30 font-light">
                0{items.indexOf(item) + 1}
              </span>
              <span className="text-3xl md:text-4xl tracking-[0.25em] uppercase font-light">
                {item.label}
              </span>
            </Link>
          ))}
          <div className="mt-auto pb-12 pt-12 text-[10px] tracking-[0.3em] uppercase text-foreground/30 font-light">
            Romper límites · 2025
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
};

export default HamburgerMenu;
