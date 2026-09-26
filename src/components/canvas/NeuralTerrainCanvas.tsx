import { useSyncExternalStore } from "react";
import { Canvas } from "@react-three/fiber";
import NeuralTerrainScene from "@/scenes/NeuralTerrainScene.tsx";

const FOG_COLOR = "#030305";
const FOG_DENSITY = 0.04;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const media = window.matchMedia(REDUCED_MOTION_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getReducedMotion() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getServerReducedMotion() {
  return false;
}

export default function NeuralTerrainCanvas() {
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, getServerReducedMotion);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
      <Canvas
        flat
        dpr={[1, 2]}
        frameloop={reducedMotion ? "demand" : "always"}
        camera={{ fov: 60, near: 0.1, far: 100, position: [0, 5, 15] }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        onCreated={({ camera }) => camera.lookAt(0, 0, 0)}
        style={{ pointerEvents: "none" }}
      >
        <fogExp2 attach="fog" args={[FOG_COLOR, FOG_DENSITY]} />
        <NeuralTerrainScene animated={!reducedMotion} />
      </Canvas>
    </div>
  );
}
