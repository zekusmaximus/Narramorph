import { RefObject } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { useSpring } from '@react-spring/three';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

import { useStoryStore } from '@/stores';
import { useSpatialStore } from '@/stores/spatialStore';

interface CameraControllerProps {
  controlsRef: RefObject<OrbitControlsImpl>;
}

/**
 * Camera controller component
 * Manages camera behavior and controls with smooth transitions
 */
export default function CameraController({ controlsRef }: CameraControllerProps) {
  const { camera } = useThree();
  const selectedNode = useStoryStore((state) => state.selectedNode);
  const positions = useSpatialStore((state) => state.positions);

  // Compute target position based on active node
  const activeNodeId = selectedNode;
  const target = activeNodeId && positions[activeNodeId] ? positions[activeNodeId] : [0, 0, 0];
  const cameraTargetPos: [number, number, number] = [
    target[0],
    target[1] + 5,
    target[2] + 15,
  ];

  // Animate camera position and target
  const spring = useSpring({
    position: cameraTargetPos,
    target: target as [number, number, number],
    config: { tension: 280, friction: 60 },
  });

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
