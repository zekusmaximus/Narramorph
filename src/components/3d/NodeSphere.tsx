/* eslint-disable react/no-unknown-property -- R3F mesh/material props are not DOM attributes. */
import { animated, useSpring } from '@react-spring/three';
import { useEffect, type ReactElement } from 'react';

import { useMapInteractionAdapter } from '@/components/map/useMapInteractionAdapter';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';

import { resolveNodeStateCue } from './nodeStateCues';
import { SCENE_CONFIG } from './sceneConfig';

interface NodeSphereProps {
  nodeId: string;
  position: [number, number, number];
}

export default function NodeSphere({ nodeId, position }: NodeSphereProps): ReactElement | null {
  const adapter = useMapInteractionAdapter('3d');
  const reduceMotion = useReducedMotionPreference();
  const adaptedNode = adapter.getNode(nodeId);
  const appearance = adaptedNode?.appearance ?? {
    scale: 1,
    emissiveIntensity: 0,
    opacity: 0,
    color: '#888888',
    emissiveColor: '#000000',
  };
  const isSelected = adaptedNode?.selected ?? false;
  const isHovered = adaptedNode?.hovered ?? false;
  const isAvailable = adaptedNode?.available ?? false;
  const cue = resolveNodeStateCue({
    available: isAvailable,
    selected: isSelected,
    visited: adaptedNode?.visited ?? false,
  });
  const baseScale = appearance.scale;
  const { scale, emissiveIntensity, opacity } = useSpring({
    scale: isSelected
      ? baseScale * SCENE_CONFIG.node.selectedScale
      : isHovered && isAvailable
        ? baseScale * SCENE_CONFIG.node.hoverScale
        : baseScale,
    emissiveIntensity: isSelected
      ? appearance.emissiveIntensity
      : isHovered && isAvailable
        ? appearance.emissiveIntensity * 1.2
        : appearance.emissiveIntensity,
    opacity: appearance.opacity,
    immediate: reduceMotion,
    config: SCENE_CONFIG.node.spring,
  });

  useEffect(
    () => () => {
      document.body.style.cursor = 'auto';
    },
    [],
  );

  if (adaptedNode === undefined) {
    return null;
  }

  return (
    <animated.mesh
      position={position}
      scale={scale}
      userData={{ stateCue: cue }}
      onClick={() => adapter.activate(nodeId)}
      onPointerOver={() => {
        if (adapter.hover(nodeId)) {
          document.body.style.cursor = 'pointer';
        }
      }}
      onPointerOut={() => {
        adapter.hover(null);
        document.body.style.cursor = 'auto';
      }}
    >
      <sphereGeometry
        args={[
          SCENE_CONFIG.node.radius,
          SCENE_CONFIG.node.widthSegments,
          SCENE_CONFIG.node.heightSegments,
        ]}
      />
      <animated.meshStandardMaterial
        color={appearance.color}
        emissive={appearance.emissiveColor}
        emissiveIntensity={emissiveIntensity}
        opacity={opacity}
        transparent
      />

      {cue === 'locked' && (
        <mesh scale={1.08}>
          <sphereGeometry
            args={[
              SCENE_CONFIG.node.radius,
              SCENE_CONFIG.node.lockedCageSegments,
              SCENE_CONFIG.node.lockedCageSegments,
            ]}
          />
          <meshBasicMaterial
            color={SCENE_CONFIG.node.lockedCageColor}
            opacity={SCENE_CONFIG.node.lockedCageOpacity}
            transparent
            wireframe
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      )}

      {(cue === 'opened' || cue === 'selected') && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry
            args={[SCENE_CONFIG.node.cueRingRadius, SCENE_CONFIG.node.cueRingTube, 8, 40]}
          />
          <meshBasicMaterial
            color={appearance.color}
            transparent
            opacity={0.9}
            toneMapped={false}
          />
        </mesh>
      )}
      {cue === 'selected' && (
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry
            args={[SCENE_CONFIG.node.cueRingRadius, SCENE_CONFIG.node.cueRingTube, 8, 40]}
          />
          <meshBasicMaterial
            color={appearance.color}
            transparent
            opacity={0.9}
            toneMapped={false}
          />
        </mesh>
      )}
    </animated.mesh>
  );
}
