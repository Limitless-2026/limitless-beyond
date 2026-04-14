import HeroCanvas from "@/components/HeroCanvas";
import CustomCursor from "@/components/CustomCursor";

const Index = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <HeroCanvas />
      <CustomCursor />
      {/* Subtle scroll indicator */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 opacity-30 animate-pulse">
        <div
          className="w-px h-12"
          style={{
            background: "linear-gradient(to bottom, hsla(270, 80%, 60%, 0.6), transparent)",
          }}
        />
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: "hsla(270, 80%, 60%, 0.5)" }}
        />
      </div>
    </div>
  );
};

export default Index;
