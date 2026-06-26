import { animated, useSpring } from '@react-spring/three';
import { useEffect, type ReactElement } from 'react';

import { useMapInteractionAdapter } from '@/components/map/useMapInteractionAdapter';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';

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
  const baseScale = appearance.scale;
  const { scale, emissiveIntensity, opacity } = useSpring({
    scale: isSelected ? baseScale * 1.3 : isHovered && isAvailable ? baseScale * 1.05 : baseScale,
    emissiveIntensity: isSelected
      ? appearance.emissiveIntensity
      : isHovered && isAvailable
        ? appearance.emissiveIntensity * 1.2
        : appearance.emissiveIntensity,
    opacity: appearance.opacity,
    immediate: reduceMotion,
    config: { tension: 300, friction: 20 },
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
      <sphereGeometry args={[1.5, 32, 32]} />
      <animated.meshStandardMaterial
        color={appearance.color}
        emissive={appearance.emissiveColor}
        emissiveIntensity={emissiveIntensity}
        opacity={opacity}
        transparent
      />
    </animated.mesh>
  );
}
