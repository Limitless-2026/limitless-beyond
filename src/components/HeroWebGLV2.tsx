import { Canvas } from "@react-three/fiber";
import FragmentShaderMeshV2 from "./FragmentShaderV2";
import { getDeviceTier } from "@/hooks/useDeviceTier";

const HeroWebGLV2 = () => {
  const lite = getDeviceTier() === "low";
  const perf = lite ? "low" : "high";
  const dpr = lite ? ([1, 1.25] as const) : ([1, 1.65] as const);

  return (
    <div className="fixed inset-0 w-full h-full" style={{ background: "rgb(2, 1, 5)" }}>
      <Canvas
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: "high-performance",
          stencil: false,
        }}
        orthographic
        camera={{ position: [0, 0, 1], zoom: 1 }}
        style={{ width: "100%", height: "100%" }}
        dpr={dpr}
      >
        <FragmentShaderMeshV2 perf={perf} />
      </Canvas>
    </div>
  );
};

export default HeroWebGLV2;
