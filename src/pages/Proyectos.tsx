import HamburgerMenu from "@/components/HamburgerMenu";

const Proyectos = () => {
  return (
    <main className="relative min-h-screen bg-background text-foreground overflow-hidden">
      <HamburgerMenu />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 40%, hsl(var(--primary) / 0.15) 0%, transparent 70%)",
        }}
      />
      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-6">
        <p className="text-[10px] tracking-[0.4em] uppercase text-primary mb-8 font-light">
          Universo Limitless
        </p>
        <h1 className="text-6xl md:text-8xl lg:text-9xl font-extralight tracking-[0.15em] uppercase leading-none">
          Proyectos
        </h1>
        <p className="mt-10 text-base md:text-lg text-foreground/60 max-w-md font-light">
          Próximamente — el universo de Limitless en construcción.
        </p>
      </section>
    </main>
  );
};

export default Proyectos;
