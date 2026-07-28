import { OrbitControls } from '@react-three/drei/core/OrbitControls.js';
import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useState, type KeyboardEvent, type ReactElement } from 'react';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

import { useMapInteractionAdapter } from '@/components/map/useMapInteractionAdapter';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';

import CameraController, { type CameraRequest } from './CameraController';
import { DEFAULT_CAMERA_POSITION } from './cameraDefaults';
import { SCENE_CONFIG } from './sceneConfig';
import SceneContent from './SceneContent';
import SceneNavigationControls from './SceneNavigationControls';
import SceneNodeList from './SceneNodeList';

/**
 * Main 3D canvas component for Narramorph visualization.
 * Verification status and the manual compatibility matrix live in
 * docs/3D_VIEW_PLAN.md rather than an unchecked source comment.
 */
interface NarromorphCanvasProps {
  onRuntimeFailure?: (reason: 'context-lost') => void;
}

function SceneReadySignal({ onReady }: { onReady: () => void }): null {
  const signalled = useRef(false);
  useFrame(() => {
    if (!signalled.current) {
      signalled.current = true;
      onReady();
    }
  });
  return null;
}

export default function NarromorphCanvas({
  onRuntimeFailure,
}: NarromorphCanvasProps): ReactElement {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const adapter = useMapInteractionAdapter('3d');
  const reduceMotion = useReducedMotionPreference();
  const [cameraRequest, setCameraRequest] = useState<CameraRequest>({
    id: 0,
    type: 'reset',
  });
  const selectedLabel = adapter.selectedNodeId
    ? (adapter.getNode(adapter.selectedNodeId)?.node.metadata?.chapterTitle ??
      adapter.getNode(adapter.selectedNodeId)?.node.title ??
      adapter.selectedNodeId)
    : null;

  const requestCamera = (type: CameraRequest['type']): void => {
    setCameraRequest((current) => ({ id: current.id + 1, type }));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const result = adapter.handleKey(event.key);
    if (result.handled) {
      event.preventDefault();
    }
  };

  return (
    <>
      {/* Accessible companion navigation: the canvas is never the only way in. */}
      <SceneNodeList />
      <SceneNavigationControls
        selectedLabel={selectedLabel}
        onFocusSelected={() => requestCamera('focus-selected')}
        onReset={() => requestCamera('reset')}
      />
      <div
        ref={containerRef}
        className="absolute inset-0"
        role="application"
        aria-label="Story map (3D view)"
        aria-description="Use arrow keys to select passages, Enter to open, and Escape to close the passage."
        data-story-map-focus-target="true"
        data-testid="three-dimensional-scene"
        data-scene-ready="false"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <Canvas
          className="h-full w-full"
          camera={{
            position: DEFAULT_CAMERA_POSITION,
            fov: SCENE_CONFIG.camera.fov,
            near: SCENE_CONFIG.camera.near,
            far: SCENE_CONFIG.camera.far,
          }}
          dpr={SCENE_CONFIG.renderer.dpr}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener(
              'webglcontextlost',
              (event) => {
                event.preventDefault();
                onRuntimeFailure?.('context-lost');
              },
              { once: true },
            );
          }}
        >
          {/* Atmospheric fog for depth perception */}
          <fog
            attach="fog"
            args={[SCENE_CONFIG.fog.color, SCENE_CONFIG.fog.near, SCENE_CONFIG.fog.far]}
          />

          <ambientLight intensity={SCENE_CONFIG.lighting.ambientIntensity} />
          <pointLight position={SCENE_CONFIG.lighting.pointPosition} />

          <SceneContent />
          <SceneReadySignal
            onReady={() => containerRef.current?.setAttribute('data-scene-ready', 'true')}
          />
          <CameraController controlsRef={controlsRef} request={cameraRequest} />
          <OrbitControls
            ref={controlsRef}
            enableDamping={!reduceMotion}
            dampingFactor={SCENE_CONFIG.orbit.dampingFactor}
            enablePan={false}
            enableZoom
            minDistance={SCENE_CONFIG.orbit.minDistance}
            maxDistance={SCENE_CONFIG.orbit.maxDistance}
            minPolarAngle={SCENE_CONFIG.orbit.minPolarAngle}
            maxPolarAngle={SCENE_CONFIG.orbit.maxPolarAngle}
            rotateSpeed={SCENE_CONFIG.orbit.rotateSpeed}
            zoomSpeed={SCENE_CONFIG.orbit.zoomSpeed}
          />
        </Canvas>
      </div>
    </>
  );
}
