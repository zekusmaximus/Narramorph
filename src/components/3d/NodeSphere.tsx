import { animated, useSpring } from '@react-spring/three';
import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

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

  // Get node data - nodes map is stable, so we can just pick the node
  const node = useStoryStore((state) => state.nodes.get(nodeId));

  // Atomic selectors for frequently changing state
  const isSelected = useStoryStore((state) => state.selectedNode === nodeId);
  const isAnimating = useStoryStore((state) => state.isAnimating);
  const openStoryView = useStoryStore((state) => state.openStoryView);

  // Use useShallow for the specific visit record to avoid re-renders when other nodes are visited
  // We handle the case where visitRecord might be undefined
  const visitRecord = useStoryStore(useShallow((state) => state.progress.visitedNodes[nodeId]));

  // Primitive value selector - efficient by default
  const awarenessLevel = useStoryStore((state) => state.progress.temporalAwarenessLevel);

  // Custom selector for availability to avoid subscribing to the entire progress object
  const isAvailable = useStoryStore((state) => {
    // If node doesn't exist, it's not available
    const currentNode = state.nodes.get(nodeId);
    if (!currentNode) return false;

    // Get the unlock config for this node
    const config = state.unlockConfigs.get(nodeId);

    // Check availability using the utility function with current state
    return isNodeAvailable(nodeId, state.progress, config);
  });

  // Derived state
  const visitCount = visitRecord?.visitCount || 0;
  const isVisited = visitCount > 0;
  const isLocked = !isAvailable;

  // Get appearance based on state - with default values if node doesn't exist
  // This calculation is cheap enough to do in render as long as inputs are stable
  const appearance = node
    ? getNodeAppearance({
        character: node.character,
        isActive: isSelected,
        isVisited,
        isLocked,
        awarenessLevel,
      })
    : { scale: 1, emissiveIntensity: 0, opacity: 0, color: '#888888', emissiveColor: '#000000' };

  // Animated properties - must be called unconditionally (React rules of hooks)
  const baseScale = appearance.scale;
  const { scale, emissiveIntensity, opacity } = useSpring({
    scale: isSelected ? baseScale * 1.3 : isHovered && isAvailable ? baseScale * 1.05 : baseScale,
    emissiveIntensity: isSelected
      ? appearance.emissiveIntensity
      : isHovered && isAvailable
        ? appearance.emissiveIntensity * 1.2
        : appearance.emissiveIntensity,
    opacity: appearance.opacity,
    config: { tension: 300, friction: 20 },
  });

  // Early return after all hooks have been called
  if (!node) {
    return null;
  }

  // Event handlers
  const handleClick = () => {
    if (isAnimating || !isAvailable) {
      return;
    } // Ignore clicks if animating or locked
    openStoryView(nodeId);
  };

  const handlePointerOver = () => {
    if (isAnimating || !isAvailable) {
      return;
    } // No hover effects if animating or locked
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
