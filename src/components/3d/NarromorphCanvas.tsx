import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

import CameraController from './CameraController';
import SceneContent from './SceneContent';

/**
 * Main 3D canvas component for Narramorph visualization
 */
export default function NarromorphCanvas() {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  return (
    <Canvas
      camera={{
        position: [0, 0, 60],
        fov: 50,
      }}
    >
      {/* Atmospheric fog for depth perception */}
      <fog attach="fog" args={['#1a1a1a', 50, 200]} />

      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} />

      <SceneContent />
      <CameraController controlsRef={controlsRef} />
      <OrbitControls ref={controlsRef} />
    </Canvas>
  );
}
