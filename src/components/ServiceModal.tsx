import { useEffect } from "react";
import { Link } from "react-router-dom";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Dialog, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import type { Service } from "@/data/services";

interface Props {
  service: Service | null;
  onClose: () => void;
}

const ServiceModal = ({ service, onClose }: Props) => {
  const open = !!service;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!service) return null;
  const accent = service.color;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 z-[201] w-[94vw] max-w-3xl max-h-[90vh] -translate-x-1/2 -translate-y-1/2 overflow-hidden border-0 p-0 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          style={{
            background: "#0E0E14",
            border: `1px solid ${accent}33`,
            boxShadow: `0 0 80px ${accent}22, 0 0 0 1px ${accent}11`,
          }}
        >
          <DialogPrimitive.Title className="sr-only">{service.title}</DialogPrimitive.Title>
          {/* Soft halo */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full"
            style={{
              background: `radial-gradient(circle, ${accent}22 0%, transparent 65%)`,
              filter: "blur(40px)",
            }}
          />

          {/* Close — único, fijo arriba a la derecha, fuera del scroll */}
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute top-5 right-5 md:top-6 md:right-6 z-10 w-9 h-9 rounded-full border border-foreground/20 bg-background/40 backdrop-blur flex items-center justify-center text-foreground/60 hover:text-foreground hover:border-foreground/50 transition-colors"
          >
            <span className="absolute h-px w-3.5 bg-current rotate-45" />
            <span className="absolute h-px w-3.5 bg-current -rotate-45" />
          </button>

          <div className="relative overflow-y-auto max-h-[90vh] p-8 md:p-12 pr-14 md:pr-16">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
              <span
                className="block w-2.5 h-2.5 rounded-full"
                style={{ background: accent, boxShadow: `0 0 14px ${accent}` }}
              />
              <span
                className="text-[10px] tracking-[0.4em] uppercase font-light"
                style={{ color: accent, fontFamily: "'DM Sans', sans-serif" }}
              >
                {service.number} / 06 · Servicio
              </span>
            </div>

            {/* Title */}
            <h2
              className="font-extralight tracking-[0.06em] uppercase leading-[0.92] text-foreground mb-6"
              style={{ fontSize: "clamp(2.25rem, 7vw, 4.5rem)" }}
            >
              {service.titleLines.map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </h2>

            <p className="text-base md:text-lg text-foreground/80 font-light leading-relaxed max-w-xl mb-3">
              {service.tagline}
            </p>
            <p className="text-sm md:text-base text-foreground/55 font-light leading-relaxed max-w-2xl mb-10">
              {service.description}
            </p>

            <div
              className="h-px mb-10"
              style={{ background: `linear-gradient(to right, ${accent}66, transparent)` }}
            />

            {/* Blocks */}
            <div className="grid md:grid-cols-2 gap-10 mb-10">
              <div>
                <h3
                  className="text-[10px] tracking-[0.4em] uppercase font-light mb-4"
                  style={{ color: accent }}
                >
                  Qué hacemos
                </h3>
                <ul className="space-y-2">
                  {service.whatWeDo.map((it) => (
                    <li
                      key={it}
                      className="text-sm md:text-base text-foreground/80 font-light flex gap-3"
                    >
                      <span style={{ color: accent }}>—</span>
                      {it}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3
                  className="text-[10px] tracking-[0.4em] uppercase font-light mb-4"
                  style={{ color: accent }}
                >
                  Proceso
                </h3>
                <ol className="space-y-2">
                  {service.process.map((p, i) => (
                    <li
                      key={p}
                      className="text-sm md:text-base text-foreground/80 font-light flex gap-3"
                    >
                      <span
                        className="text-[10px] tracking-[0.3em] font-light pt-1"
                        style={{ color: accent + "AA" }}
                      >
                        0{i + 1}
                      </span>
                      {p}
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="mb-10">
              <h3
                className="text-[10px] tracking-[0.4em] uppercase font-light mb-3"
                style={{ color: accent }}
              >
                Stack
              </h3>
              <p className="text-sm md:text-base text-foreground/75 font-light">
                {service.stack.join("  ·  ")}
              </p>
            </div>

            {/* CTA */}
            <Link
              to="/contacto"
              onClick={onClose}
              className="group inline-flex items-center gap-4 border-b pb-3 transition-colors"
              style={{ borderColor: accent + "55" }}
            >
              <span
                className="text-xs md:text-sm tracking-[0.4em] uppercase text-foreground font-light"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Hablemos de tu proyecto
              </span>
              <span
                className="group-hover:translate-x-1 transition-transform"
                style={{ color: accent }}
              >
                →
              </span>
            </Link>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};

export default ServiceModal;
