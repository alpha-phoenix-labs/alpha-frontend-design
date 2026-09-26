import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { AdditiveBlending, PlaneGeometry, PointsMaterial } from "three";

const PLANE_SIZE = 40;
const PLANE_SEGMENTS = 60;
const POINT_SIZE = 0.03;
const POINT_COLOR = 0x8899aa;
const POINT_OPACITY = 0.4;
const CAMERA_BASE_Y = 5;
const PARALLAX_EASE = 0.02;
const PARALLAX_POINTER_SCALE = 0.001;
const PARALLAX_RANGE = 2;

export default function NeuralTerrainScene() {
  const camera = useThree((state) => state.camera);
  const pointer = useRef({ x: 0, y: 0 });

  const geometry = useMemo(() => {
    const plane = new PlaneGeometry(PLANE_SIZE, PLANE_SIZE, PLANE_SEGMENTS, PLANE_SEGMENTS);
    plane.rotateX(-Math.PI / 2);
    return plane;
  }, []);

  const material = useMemo(
    () =>
      new PointsMaterial({
        size: POINT_SIZE,
        color: POINT_COLOR,
        transparent: true,
        opacity: POINT_OPACITY,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    [],
  );

  const baseY = useMemo(() => {
    const positions = geometry.getAttribute("position");
    const values = new Float32Array(positions.count);
    for (let i = 0; i < positions.count; i++) {
      values[i] = positions.getY(i);
    }
    return values;
  }, [geometry]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX - window.innerWidth / 2) * PARALLAX_POINTER_SCALE;
      pointer.current.y = (event.clientY - window.innerHeight / 2) * PARALLAX_POINTER_SCALE;
    };
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    const targetX = pointer.current.x * PARALLAX_RANGE;
    const targetY = pointer.current.y * PARALLAX_RANGE;
    camera.position.x += (targetX - camera.position.x) * PARALLAX_EASE;
    camera.position.y += (CAMERA_BASE_Y + targetY - camera.position.y) * PARALLAX_EASE;
    camera.lookAt(0, 0, 0);

    const positions = geometry.getAttribute("position");
    const count = positions.count;
    for (let i = 0; i < count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const wave1 = Math.sin(x * 0.2 + time * 0.5) * 0.5;
      const wave2 = Math.cos(z * 0.3 + time * 0.3) * 0.5;
      const wave3 = Math.sin(x * z * 0.05 + time * 0.2) * 0.2;
      positions.setY(i, (baseY[i] ?? 0) + wave1 + wave2 + wave3);
    }
    positions.needsUpdate = true;
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
