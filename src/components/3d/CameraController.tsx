import { useSpring } from '@react-spring/three';
import { useThree, useFrame } from '@react-three/fiber';
import type { ReactElement, RefObject } from 'react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';
import { useStoryStore } from '@/stores';
import { useSpatialStore } from '@/stores/spatialStore';

import { DEFAULT_CAMERA_TARGET, DEFAULT_CAMERA_POSITION } from './cameraDefaults';
import { SCENE_CONFIG } from './sceneConfig';

export interface CameraRequest {
  id: number;
  type: 'reset' | 'focus-selected';
}

interface CameraControllerProps {
  controlsRef: RefObject<OrbitControlsImpl>;
  request: CameraRequest;
}

type Vec3 = [number, number, number];

function vec3Equals(a: Vec3, b: Vec3): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

/**
 * Camera controller component
 * Manages camera behavior and controls with smooth transitions
 */
export default function CameraController({
  controlsRef,
  request,
}: CameraControllerProps): ReactElement | null {
  const { camera } = useThree();
  const selectedNode = useStoryStore((state) => state.selectedNode);
  const positions = useSpatialStore((state) => state.positions);
  const setIsAnimating = useStoryStore((state) => state.setIsAnimating);
  const reduceMotion = useReducedMotionPreference();

  const previousTargetRef = useRef<Vec3 | null>(null);
  const previousPositionRef = useRef<Vec3 | null>(null);
  const animationActiveRef = useRef(false);

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
      return [x, y + SCENE_CONFIG.focus.verticalOffset, z + SCENE_CONFIG.focus.depthOffset];
    }
    return DEFAULT_CAMERA_POSITION;
  }, [activeNodeId, positions]);

  // Animate camera position and target
  const [spring, api] = useSpring(() => ({
    position: DEFAULT_CAMERA_POSITION,
    target: DEFAULT_CAMERA_TARGET,
    config: SCENE_CONFIG.focus.spring,
  }));

  const moveCamera = useCallback(
    (nextPosition: Vec3, nextTarget: Vec3): void => {
      if (reduceMotion) {
        api.set({ position: nextPosition, target: nextTarget });
        camera.position.set(nextPosition[0], nextPosition[1], nextPosition[2]);
        if (controlsRef.current) {
          controlsRef.current.target.set(nextTarget[0], nextTarget[1], nextTarget[2]);
          controlsRef.current.update();
        }
        animationActiveRef.current = false;
        setIsAnimating(false);
        return;
      }

      void api.start({
        position: nextPosition,
        target: nextTarget,
        onStart: () => {
          animationActiveRef.current = true;
          setIsAnimating(true);
        },
        onRest: () => {
          animationActiveRef.current = false;
          setIsAnimating(false);
          camera.position.set(nextPosition[0], nextPosition[1], nextPosition[2]);
          if (controlsRef.current) {
            controlsRef.current.target.set(nextTarget[0], nextTarget[1], nextTarget[2]);
            controlsRef.current.update();
          }
        },
      });
    },
    [api, camera, controlsRef, reduceMotion, setIsAnimating],
  );

  // Ensure controls start with the same framing as our default camera target
  useEffect(() => {
    if (!controlsRef.current) {
      return;
    }

    controlsRef.current.target.set(
      DEFAULT_CAMERA_TARGET[0],
      DEFAULT_CAMERA_TARGET[1],
      DEFAULT_CAMERA_TARGET[2],
    );
    controlsRef.current.update();
  }, [controlsRef]);

  // If a node is selected before layout finishes, release the animation lock immediately
  useEffect(() => {
    if (activeNodeId && !positions[activeNodeId]) {
      setIsAnimating(false);
    }
  }, [activeNodeId, positions, setIsAnimating]);

  useEffect(() => {
    const hasTargetChanged =
      !previousTargetRef.current ||
      !vec3Equals(previousTargetRef.current, target) ||
      !previousPositionRef.current ||
      !vec3Equals(previousPositionRef.current, cameraTargetPos);

    if (!hasTargetChanged) {
      return;
    }

    previousTargetRef.current = target;
    previousPositionRef.current = cameraTargetPos;
    moveCamera(cameraTargetPos, target);
  }, [cameraTargetPos, moveCamera, target]);

  // DOM controls can explicitly replay focus or return to the overview even
  // when the selected node itself has not changed.
  useEffect(() => {
    if (request.id === 0) {
      return;
    }
    if (request.type === 'reset') {
      moveCamera(DEFAULT_CAMERA_POSITION, DEFAULT_CAMERA_TARGET);
      return;
    }
    moveCamera(cameraTargetPos, target);
  }, [cameraTargetPos, moveCamera, request, target]);

  // Update camera and controls on each frame
  useFrame(() => {
    if (!animationActiveRef.current) {
      return;
    }

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
