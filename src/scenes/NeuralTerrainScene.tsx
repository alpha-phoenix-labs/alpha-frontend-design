import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { NormalBlending, PlaneGeometry, PointsMaterial } from "three";

const PLANE_SIZE = 40;
const PLANE_SEGMENTS = 60;
const POINT_SIZE = 0.032;
const POINT_COLOR = 0x7c83ff;
const POINT_OPACITY = 0.22;
const CAMERA_BASE_X = 0;
const CAMERA_BASE_Y = 5;
const PARALLAX_EASE = 0.02;
const PARALLAX_POINTER_SCALE = 0.001;
const PARALLAX_RANGE = 2;

export interface NeuralTerrainSceneProps {
  /** false: Welle und Parallaxe stehen still, die Szene zeigt einen festen Frame (prefers-reduced-motion). */
  animated: boolean;
}

export default function NeuralTerrainScene({ animated }: NeuralTerrainSceneProps) {
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);
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
        blending: NormalBlending,
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

  const applyWave = useCallback(
    (time: number) => {
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
    },
    [geometry, baseY],
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useLayoutEffect(() => {
    if (animated) return;
    pointer.current.x = 0;
    pointer.current.y = 0;
    camera.position.x = CAMERA_BASE_X;
    camera.position.y = CAMERA_BASE_Y;
    camera.lookAt(0, 0, 0);
    applyWave(0);
    invalidate();
  }, [animated, camera, invalidate, applyWave]);

  useEffect(() => {
    if (!animated) return;
    const handlePointerMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX - window.innerWidth / 2) * PARALLAX_POINTER_SCALE;
      pointer.current.y = (event.clientY - window.innerHeight / 2) * PARALLAX_POINTER_SCALE;
    };
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [animated]);

  useFrame((state) => {
    if (!animated) return;
    const targetX = CAMERA_BASE_X + pointer.current.x * PARALLAX_RANGE;
    const targetY = CAMERA_BASE_Y + pointer.current.y * PARALLAX_RANGE;
    camera.position.x += (targetX - camera.position.x) * PARALLAX_EASE;
    camera.position.y += (targetY - camera.position.y) * PARALLAX_EASE;
    camera.lookAt(0, 0, 0);
    applyWave(state.clock.getElapsedTime());
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
