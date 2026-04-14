import { Canvas } from "@react-three/fiber";
import FragmentShaderMesh from "./FragmentShader";

const HeroCanvas = () => {
  return (
    <div className="fixed inset-0 w-full h-full" style={{ background: "rgb(2, 1, 5)" }}>
      <Canvas
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: "high-performance",
        }}
        camera={{ position: [0, 0, 1] }}
        style={{ width: "100%", height: "100%" }}
        dpr={[1, 2]}
      >
        <FragmentShaderMesh />
      </Canvas>
    </div>
  );
};

export default HeroCanvas;
