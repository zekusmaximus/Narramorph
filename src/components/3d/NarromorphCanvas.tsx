import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useRef } from 'react';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

import CameraController, { DEFAULT_CAMERA_POSITION } from './CameraController';
import SceneContent from './SceneContent';

/**
 * Main 3D canvas component for Narramorph visualization
 *
 * VERIFICATION CHECKLIST (v1-3d-visualization):
 *
 * Core Functionality:
 * [ ] All 19 story nodes render correctly in 3D space
 * [ ] Nodes grouped by character (3 layers: archaeologist, algorithm, last-human)
 * [ ] Each layer positioned correctly along z-axis (0, 25, 50)
 * [ ] Circular layout per character (15 unit radius)
 *
 * Navigation & Interaction:
 * [ ] Click on available node opens ContentPanel3D
 * [ ] Click on locked node has no effect (no cursor change)
 * [ ] Camera smoothly animates to selected node
 * [ ] OrbitControls allow manual camera movement
 * [ ] Escape key closes content panel
 *
 * Visual States:
 * [ ] Active node: large (1.3x), bright glow (2.0 intensity)
 * [ ] Visited node: normal scale, medium glow (0.5 intensity)
 * [ ] Unvisited node: normal scale, subtle glow (0.2 intensity)
 * [ ] Locked node: small (0.8x), dim (0.1 intensity), transparent (0.3 opacity)
 * [ ] Hover on available node: 5% scale increase + pointer cursor
 *
 * Content Display:
 * [ ] ContentPanel3D slides in from right
 * [ ] Panel displays correct node title and character
 * [ ] Content variations load and display
 * [ ] Variation error banner shows if content unavailable
 * [ ] Reading time tracker updates
 *
 * Performance & Polish:
 * [ ] No console errors in browser
 * [ ] FPS counter visible in dev mode (top-right)
 * [ ] Atmospheric fog renders correctly
 * [ ] PlaneGuide labels visible for each character layer
 * [ ] Loading state shows when positions empty
 *
 * Mode Switching:
 * [ ] 2D fallback works (WebGL error boundary)
 * [ ] UI toggle switches between 2D and 3D modes
 * [ ] localStorage persists mode preference
 * [ ] Both modes operate independently (no state conflicts)
 *
 * Cross-Browser:
 * [ ] Chrome/Edge (Chromium)
 * [ ] Firefox
 * [ ] Safari (WebKit)
 * [ ] Fallback to 2D on unsupported browsers
 */
export default function NarromorphCanvas() {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  return (
    <div className="absolute inset-0">
      <Canvas
        className="h-full w-full"
        camera={{
          position: DEFAULT_CAMERA_POSITION,
          fov: 50,
          near: 0.1,
          far: 500,
        }}
        dpr={[1, 2]}
      >
        {/* Atmospheric fog for depth perception */}
        <fog attach="fog" args={['#1a1a1a', 50, 200]} />

        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} />

        <SceneContent />
        <CameraController controlsRef={controlsRef} />
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.08}
          enablePan={false}
          enableZoom
          minDistance={35}
          maxDistance={140}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2}
          rotateSpeed={0.6}
          zoomSpeed={0.8}
        />
      </Canvas>
    </div>
  );
}
