import { Canvas } from "@react-three/fiber";
import FragmentShaderMeshV2 from "./FragmentShaderV2";

const HeroWebGLV2 = () => {
  return (
    <div className="fixed inset-0 w-full h-full" style={{ background: "rgb(2, 1, 5)" }}>
      <Canvas
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: "high-performance",
        }}
        orthographic
        camera={{ position: [0, 0, 1], zoom: 1 }}
        style={{ width: "100%", height: "100%" }}
        dpr={[1, 2]}
      >
        <FragmentShaderMeshV2 />
      </Canvas>
    </div>
  );
};

export default HeroWebGLV2;
