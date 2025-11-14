import { useState } from 'react';
import { animated, useSpring } from '@react-spring/three';

import { useStoryStore } from '@/stores';
import { getNodeAppearance } from '@/utils/getNodeAppearance';
import { isNodeAvailable } from '@/utils/isNodeAvailable';

interface NodeSphereProps {
  nodeId: string;
  position: [number, number, number];
}

/**
 * 3D sphere representing a story node
 */
export default function NodeSphere({ nodeId, position }: NodeSphereProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Get node data and state from store
  const node = useStoryStore((state) => state.nodes.get(nodeId));
  const selectedNode = useStoryStore((state) => state.selectedNode);
  const progress = useStoryStore((state) => state.progress);
  const visitedNodes = useStoryStore((state) => state.progress.visitedNodes);
  const awarenessLevel = useStoryStore((state) => state.progress.temporalAwarenessLevel);
  const isAnimating = useStoryStore((state) => state.isAnimating);
  const unlockConfigs = useStoryStore((state) => state.unlockConfigs);
  const openStoryView = useStoryStore((state) => state.openStoryView);

  if (!node) return null;

  // Calculate node state
  const visitRecord = visitedNodes[nodeId];
  const visitCount = visitRecord?.visitCount || 0;
  const isActive = selectedNode === nodeId;
  const isVisited = visitCount > 0;

  // Check if node is available
  const unlockConfig = unlockConfigs.get(nodeId);
  const isAvailable = isNodeAvailable(nodeId, progress, unlockConfig);
  const isLocked = !isAvailable;

  // Get appearance based on state
  const appearance = getNodeAppearance({
    character: node.character,
    isActive,
    isVisited,
    isLocked,
    awarenessLevel,
  });

  // Animated properties - conditional hover based on availability
  const baseScale = appearance.scale;
  const { scale, emissiveIntensity, opacity } = useSpring({
    scale: isActive
      ? baseScale * 1.3
      : isHovered && isAvailable
        ? baseScale * 1.05
        : baseScale,
    emissiveIntensity: isActive
      ? appearance.emissiveIntensity
      : isHovered && isAvailable
        ? appearance.emissiveIntensity * 1.2
        : appearance.emissiveIntensity,
    opacity: appearance.opacity,
    config: { tension: 300, friction: 20 },
  });

  // Event handlers
  const handleClick = () => {
    if (isAnimating || !isAvailable) return; // Ignore clicks if animating or locked
    openStoryView(nodeId);
  };

  const handlePointerOver = () => {
    if (isAnimating || !isAvailable) return; // No hover effects if animating or locked
    setIsHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setIsHovered(false);
    document.body.style.cursor = 'auto';
  };

  return (
    <animated.mesh
      position={position}
      scale={scale}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
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
