import { Canvas } from "@react-three/fiber";
import NeuralTerrainScene from "@/scenes/NeuralTerrainScene.tsx";

const FOG_COLOR = "#030305";
const FOG_DENSITY = 0.04;

export default function NeuralTerrainCanvas() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
      <Canvas
        flat
        dpr={[1, 2]}
        camera={{ fov: 60, near: 0.1, far: 100, position: [0, 5, 15] }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        onCreated={({ camera }) => camera.lookAt(0, 0, 0)}
        style={{ pointerEvents: "none" }}
      >
        <fogExp2 attach="fog" args={[FOG_COLOR, FOG_DENSITY]} />
        <NeuralTerrainScene />
      </Canvas>
    </div>
  );
}
