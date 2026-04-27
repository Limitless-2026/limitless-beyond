import { useRef, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import HamburgerMenu from "@/components/HamburgerMenu";

const PRICING: Record<string, number> = {
  "Diseño UX-UI": 200,
  "Sitio web": 500,
  "Branding": 400,
  "Aplicación": 1000,
  "Software / SaaS": 1000,
  "Chatbot": 1000,
  "Publicidad": 150,
};

const SERVICES = Object.keys(PRICING);

function generateBudgets(selectedServices: string[]): string[] {
  let base = 0;
  for (const s of selectedServices) {
    if (PRICING[s]) base += PRICING[s];
  }

  if (base === 0) return ["USD 500 - 1K", "USD 1K - 3K", "USD 3K - 10K", "USD 10K+"];
  
  const format = (n: number) => {
    if (n >= 1000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1).replace(".0", "") + "K";
    return n.toString();
  };

  const b1 = base;
  const b2 = Math.round((base * 1.8) / 100) * 100;
  const b3 = Math.round((base * 3) / 100) * 100;
  const b4 = Math.round((base * 6) / 100) * 100;

  return [
    `USD ${format(b1)} - ${format(b2)}`,
    `USD ${format(b2)} - ${format(b3)}`,
    `USD ${format(b3)} - ${format(b4)}`,
    `USD ${format(b4)}+`
  ];
}

const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Decinos cómo te llamás")
    .max(100, "Máximo 100 caracteres"),
  email: z
    .string()
    .trim()
    .email("Email inválido")
    .max(255, "Máximo 255 caracteres"),
  message: z
    .string()
    .trim()
    .min(1, "Contanos un poco más")
    .max(1000, "Máximo 1000 caracteres"),
  services: z.array(z.string()).min(1, "Elegí al menos un servicio"),
  budget: z.string().min(1, "Elegí un rango de presupuesto"),
});

type FieldErrors = Partial<Record<"name" | "email" | "message" | "services" | "budget", string>>;

const Contacto = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [budget, setBudget] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const toggleService = (s: string) => {
    setServices((prev) => {
      const next = prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s];
      const newBudgets = generateBudgets(next);
      if (budget && !newBudgets.includes(budget)) setBudget("");
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = contactSchema.safeParse({ name, email, message, services, budget });
    if (!result.success) {
      const next: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        if (key && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      toast.error("Revisá los campos marcados");
      return;
    }
    setErrors({});
    const data = result.data;
    const body =
      `Hola Limitless,\n\n` +
      `Soy ${data.name} (${data.email}).\n\n` +
      `Estoy interesado en: ${data.services.join(", ")}\n` +
      `Presupuesto: ${data.budget}\n\n` +
      `La idea:\n${data.message}\n` +
      (fileName ? `\nAdjuntaré: ${fileName} desde mi cliente de correo.\n` : "");
    const subject = `Nueva idea — ${data.name}`;
    const href = `mailto:hola@limitless.studio?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
    toast("Abriendo tu cliente de email…", {
      description: "Si no se abre, escribinos a hola@limitless.studio",
    });
  };

  const FieldError = ({ msg }: { msg?: string }) =>
    msg ? (
      <div
        className="mt-2 text-[10px] tracking-[0.2em] uppercase font-light"
        style={{ color: "hsl(327 100% 45%)", animation: "errSlide 220ms ease-out" }}
      >
        {msg}
      </div>
    ) : null;

  return (
    <main className="relative min-h-screen bg-background text-foreground overflow-hidden">
      <HamburgerMenu />

      {/* Nebula background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, hsl(var(--primary) / 0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 100% 100%, hsl(327 100% 39% / 0.06) 0%, transparent 60%)",
        }}
      />

      <section className="relative z-10 max-w-3xl mx-auto px-6 md:px-10 pt-32 pb-24">
        {/* Eyebrow */}
        <p
          className="text-[10px] tracking-[0.4em] uppercase text-primary mb-8 font-light"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Contacto · 04
        </p>

        {/* H1 */}
        <h1
          className="text-6xl md:text-8xl lg:text-9xl font-extralight uppercase leading-[0.95]"
          style={{
            fontFamily: "'Arkitech', 'Inter', sans-serif",
            letterSpacing: "0.06em",
            clipPath: "inset(0 0 0% 0)",
            animation: "h1Reveal 900ms cubic-bezier(0.22, 1, 0.36, 1) both",
          }}
        >
          Hola, ¿tenés
          <br />
          una{" "}
          <span className="italic font-extralight bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
            idea?
          </span>
        </h1>

        <form
          onSubmit={handleSubmit}
          className="mt-20 space-y-16"
          style={{ animation: "fadeUp 700ms ease-out 200ms both" }}
        >
          {/* Servicios */}
          <div>
            <SectionLabel>Estoy interesado en…</SectionLabel>
            <div className="mt-6 flex flex-wrap gap-3">
              {SERVICES.map((s) => {
                const active = services.includes(s);
                return (
                  <button
                    type="button"
                    key={s}
                    onClick={() => toggleService(s)}
                    className={`group rounded-full border px-6 py-2.5 text-[11px] tracking-[0.25em] uppercase font-light transition-all duration-300 flex items-center gap-2 ${
                      active
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-foreground/20 text-foreground/70 hover:border-primary/60 hover:text-foreground"
                    }`}
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    <span
                      aria-hidden
                      className={`inline-block w-3 h-3 relative transition-transform duration-300 ${
                        active ? "rotate-45" : "rotate-0"
                      }`}
                    >
                      <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-current" />
                      <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-current" />
                    </span>
                    {s}
                  </button>
                );
              })}
            </div>
            <FieldError msg={errors.services} />
          </div>

          {/* Datos personales */}
          <div>
            <SectionLabel>Decinos quién sos</SectionLabel>
            <div className="mt-6 grid gap-10">
              <UnderlineInput
                label="Tu nombre"
                value={name}
                onChange={setName}
                error={errors.name}
                maxLength={100}
              />
              <UnderlineInput
                label="Tu email"
                type="email"
                value={email}
                onChange={setEmail}
                error={errors.email}
                maxLength={255}
              />
            </div>
          </div>

          {/* Mensaje */}
          <div>
            <SectionLabel>Contanos la idea</SectionLabel>
            <div className="mt-6">
              <UnderlineTextarea
                label="Contanos sobre tu proyecto…"
                value={message}
                onChange={setMessage}
                error={errors.message}
                maxLength={1000}
              />
            </div>

            {/* Attach */}
            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 text-sm font-light text-foreground/70 hover:text-primary transition-colors duration-300"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 11.5l-9.6 9.6a5.5 5.5 0 11-7.8-7.8L13.2 3.7a3.7 3.7 0 115.2 5.2l-9.5 9.5a1.8 1.8 0 11-2.6-2.6l8.5-8.5" />
                </svg>
                {fileName || "Añadir archivo adjunto"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
              />
            </div>
            <p
              className="mt-3 text-[11px] font-light text-foreground/40 leading-relaxed max-w-md"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              El envío abre tu correo. Si elegís un archivo, mencionamos el nombre en el mensaje;
              para enviarlo, adjuntalo desde tu cliente de email.
            </p>
          </div>

          {/* Presupuesto */}
          <div>
            <SectionLabel>Presupuesto estimado</SectionLabel>
            <div className="mt-6 flex flex-wrap gap-3">
              {generateBudgets(services).map((b) => {
                const active = budget === b;
                return (
                  <button
                    type="button"
                    key={b}
                    onClick={() => setBudget(b)}
                    className={`rounded-full border px-6 py-2.5 text-[11px] tracking-[0.25em] uppercase font-light transition-all duration-300 ${
                      active
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-foreground/20 text-foreground/70 hover:border-primary/60 hover:text-foreground"
                    }`}
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {b}
                  </button>
                );
              })}
            </div>
            <FieldError msg={errors.budget} />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="group relative w-full py-6 border border-foreground/30 rounded-full overflow-hidden hover:border-primary transition-colors duration-500"
          >
            <span
              aria-hidden
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background:
                  "radial-gradient(ellipse 50% 80% at 50% 50%, hsl(var(--primary) / 0.20) 0%, transparent 70%)",
              }}
            />
            <span className="relative flex items-center justify-center gap-4 text-lg uppercase font-extralight text-foreground"
              style={{ fontFamily: "'Arkitech', 'Inter', sans-serif", letterSpacing: "0.4em" }}
            >
              Enviar
              <span className="inline-block transition-transform duration-300 group-hover:translate-x-2">→</span>
            </span>
          </button>
        </form>
      </section>

      <style>{`
        @keyframes h1Reveal {
          from { clip-path: inset(0 0 100% 0); transform: translateY(8px); }
          to   { clip-path: inset(0 0 0% 0); transform: translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes errSlide {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
};

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-4">
    <span aria-hidden className="block h-px w-8 bg-foreground/30" />
    <span
      className="text-[10px] tracking-[0.4em] uppercase text-foreground/40 font-light"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {children}
    </span>
  </div>
);

const UnderlineInput = ({
  label,
  value,
  onChange,
  type = "text",
  error,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  error?: string;
  maxLength?: number;
}) => {
  const [focused, setFocused] = useState(false);
  const filled = value.length > 0;
  return (
    <div className="relative">
      <label
        className={`absolute left-0 transition-all duration-300 pointer-events-none font-light uppercase tracking-[0.25em] ${
          focused || filled
            ? "text-[10px] -top-3 text-primary/80"
            : "text-[14px] top-4 text-foreground/35"
        }`}
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full bg-transparent border-0 outline-none py-4 text-base font-light text-foreground"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      />
      <div className="absolute left-0 right-0 bottom-0 h-px bg-foreground/15" />
      <div
        className="absolute left-0 bottom-0 h-px bg-primary transition-all duration-[400ms] ease-out"
        style={{ width: focused || filled ? "100%" : "0%" }}
      />
      {error && (
        <div
          className="mt-2 text-[10px] tracking-[0.2em] uppercase font-light"
          style={{ color: "hsl(327 100% 45%)", animation: "errSlide 220ms ease-out" }}
        >
          {error}
        </div>
      )}
    </div>
  );
};

const UnderlineTextarea = ({
  label,
  value,
  onChange,
  error,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  maxLength?: number;
}) => {
  const [focused, setFocused] = useState(false);
  const filled = value.length > 0;
  return (
    <div className="relative">
      <label
        className={`absolute left-0 transition-all duration-300 pointer-events-none font-light uppercase tracking-[0.25em] ${
          focused || filled
            ? "text-[10px] -top-3 text-primary/80"
            : "text-[14px] top-4 text-foreground/35"
        }`}
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {label}
      </label>
      <textarea
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full bg-transparent border-0 outline-none py-4 text-base font-light text-foreground min-h-[120px] resize-y"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      />
      <div className="absolute left-0 right-0 bottom-0 h-px bg-foreground/15" />
      <div
        className="absolute left-0 bottom-0 h-px bg-primary transition-all duration-[400ms] ease-out"
        style={{ width: focused || filled ? "100%" : "0%" }}
      />
      {error && (
        <div
          className="mt-2 text-[10px] tracking-[0.2em] uppercase font-light"
          style={{ color: "hsl(327 100% 45%)", animation: "errSlide 220ms ease-out" }}
        >
          {error}
        </div>
      )}
    </div>
  );
};

export default Contacto;