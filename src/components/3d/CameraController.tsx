import { RefObject, useEffect, useMemo, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { useSpring } from '@react-spring/three';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

import { useStoryStore } from '@/stores';
import { useSpatialStore } from '@/stores/spatialStore';

interface CameraControllerProps {
  controlsRef: RefObject<OrbitControlsImpl>;
}

type Vec3 = [number, number, number];

// Default framing keeps the camera high enough to reveal complete rings instead of clipped half-spheres
export const DEFAULT_CAMERA_TARGET: Vec3 = [0, 0, 25];
export const DEFAULT_CAMERA_POSITION: Vec3 = [0, 35, 90];

function vec3Equals(a: Vec3, b: Vec3) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

/**
 * Camera controller component
 * Manages camera behavior and controls with smooth transitions
 */
export default function CameraController({ controlsRef }: CameraControllerProps) {
  const { camera } = useThree();
  const selectedNode = useStoryStore((state) => state.selectedNode);
  const positions = useSpatialStore((state) => state.positions);
  const setIsAnimating = useStoryStore((state) => state.setIsAnimating);

  const previousTargetRef = useRef<Vec3>(DEFAULT_CAMERA_TARGET);
  const previousPositionRef = useRef<Vec3>(DEFAULT_CAMERA_POSITION);

  // Compute target position based on active node
  const activeNodeId = selectedNode;
  const target: Vec3 = useMemo(() => {
    if (activeNodeId && positions[activeNodeId]) {
      return positions[activeNodeId];
    }
    return DEFAULT_CAMERA_TARGET;
  }, [activeNodeId, positions]);

  const cameraTargetPos: Vec3 = useMemo(() => {
    if (activeNodeId && positions[activeNodeId]) {
      const [x, y, z] = positions[activeNodeId];
      return [x, y + 5, z + 15];
    }
    return DEFAULT_CAMERA_POSITION;
  }, [activeNodeId, positions]);

  // Animate camera position and target
  const [spring, api] = useSpring(() => ({
    position: DEFAULT_CAMERA_POSITION as Vec3,
    target: DEFAULT_CAMERA_TARGET as Vec3,
    config: { tension: 280, friction: 60 },
  }));

  // If a node is selected before layout finishes, release the animation lock immediately
  useEffect(() => {
    if (activeNodeId && !positions[activeNodeId]) {
      setIsAnimating(false);
    }
  }, [activeNodeId, positions, setIsAnimating]);

  useEffect(() => {
    const hasTargetChanged =
      !vec3Equals(previousTargetRef.current, target) ||
      !vec3Equals(previousPositionRef.current, cameraTargetPos);

    if (!hasTargetChanged) {
      return;
    }

    previousTargetRef.current = target;
    previousPositionRef.current = cameraTargetPos;

    api.start({
      position: cameraTargetPos,
      target,
      onStart: () => setIsAnimating(true),
      onRest: () => setIsAnimating(false),
    });
  }, [api, cameraTargetPos, setIsAnimating, target]);

  // Update camera and controls on each frame
  useFrame(() => {
    const pos = spring.position.get();
    const tgt = spring.target.get();

    if (pos && Array.isArray(pos)) {
      camera.position.set(pos[0], pos[1], pos[2]);
    }

    if (tgt && Array.isArray(tgt) && controlsRef.current) {
      controlsRef.current.target.set(tgt[0], tgt[1], tgt[2]);
      controlsRef.current.update();
    }
  });

  return null;
}
