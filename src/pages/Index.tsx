import HeroCanvas from "@/components/HeroCanvas";
import CustomCursor from "@/components/CustomCursor";

const Index = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <HeroCanvas />
      <CustomCursor />
    </div>
  );
};

export default Index;
