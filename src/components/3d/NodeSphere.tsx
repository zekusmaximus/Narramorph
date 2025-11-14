import { useState } from 'react';
import { animated, useSpring } from '@react-spring/three';

import { useStoryStore } from '@/stores';
import { getNodeAppearance } from '@/utils/getNodeAppearance';

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
  const visitedNodes = useStoryStore((state) => state.progress.visitedNodes);
  const awarenessLevel = useStoryStore((state) => state.progress.temporalAwarenessLevel);
  const isAnimating = useStoryStore((state) => state.isAnimating);
  const openStoryView = useStoryStore((state) => state.openStoryView);

  if (!node) return null;

  // Calculate node state
  const visitRecord = visitedNodes[nodeId];
  const visitCount = visitRecord?.visitCount || 0;
  const isActive = selectedNode === nodeId;
  const isVisited = visitCount > 0;

  // Get appearance based on state
  const appearance = getNodeAppearance({
    character: node.character,
    isActive,
    isVisited,
    awarenessLevel,
  });

  // Animated properties
  const { scale, emissiveIntensity } = useSpring({
    scale: isActive ? 1.3 : isHovered ? 1.15 : 1.0,
    emissiveIntensity: isActive
      ? appearance.emissiveIntensity
      : isHovered
        ? appearance.emissiveIntensity * 1.5
        : appearance.emissiveIntensity,
    config: { tension: 300, friction: 20 },
  });

  // Event handlers
  const handleClick = () => {
    if (isAnimating) return; // Ignore clicks during animation
    openStoryView(nodeId);
  };

  const handlePointerOver = () => {
    if (isAnimating) return; // Don't change cursor during animation
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
      />
    </animated.mesh>
  );
}
