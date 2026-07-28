/* eslint-disable react/no-unknown-property -- R3F Object3D/material props are not DOM attributes. */
import { Quaternion, Vector3 } from 'three';

import { useMemo, type ReactElement } from 'react';

import { SCENE_CONFIG, SCENE_CONNECTION_COLOR } from './sceneConfig';
import type { SceneConnectionDescriptor } from './sceneConnections';

interface Segment {
  length: number;
  position: [number, number, number];
}

interface ConnectionGeometry {
  forwardArrowPosition: [number, number, number];
  forwardQuaternion: Quaternion;
  reverseArrowPosition: [number, number, number];
  reverseQuaternion: Quaternion;
  segments: Segment[];
}

const Y_AXIS = new Vector3(0, 1, 0);

function tuple(vector: Vector3): [number, number, number] {
  return [vector.x, vector.y, vector.z];
}

function buildGeometry(
  sourceTuple: SceneConnectionDescriptor['source'],
  targetTuple: SceneConnectionDescriptor['target'],
  locked: boolean,
): ConnectionGeometry | null {
  const source = new Vector3(...sourceTuple);
  const target = new Vector3(...targetTuple);
  const direction = target.clone().sub(source);
  const fullLength = direction.length();
  const clearance = SCENE_CONFIG.connection.nodeClearance;
  if (fullLength <= clearance * 2) {
    return null;
  }

  direction.normalize();
  const start = source.clone().addScaledVector(direction, clearance);
  const end = target.clone().addScaledVector(direction, -clearance);
  const drawableLength = start.distanceTo(end);
  const forwardQuaternion = new Quaternion().setFromUnitVectors(Y_AXIS, direction);
  const reverseQuaternion = new Quaternion().setFromUnitVectors(
    Y_AXIS,
    direction.clone().multiplyScalar(-1),
  );

  const segmentCount = locked ? SCENE_CONFIG.connection.lockedSegments : 1;
  const segmentSpan = drawableLength / segmentCount;
  const segmentLength = locked
    ? segmentSpan * SCENE_CONFIG.connection.lockedSegmentFill
    : drawableLength;
  const segments = Array.from({ length: segmentCount }, (_, index): Segment => {
    const distance = locked ? segmentSpan * (index + 0.5) : drawableLength / 2;
    const position = start.clone().addScaledVector(direction, distance);
    return { length: segmentLength, position: tuple(position) };
  });

  return {
    forwardArrowPosition: tuple(end),
    forwardQuaternion,
    reverseArrowPosition: tuple(start),
    reverseQuaternion,
    segments,
  };
}

/** A structural line plus arrowhead; locked routes are segmented rather than colour-only. */
export default function SceneConnection({
  connection,
}: {
  connection: SceneConnectionDescriptor;
}): ReactElement | null {
  const geometry = useMemo(
    () => buildGeometry(connection.source, connection.target, connection.locked),
    [connection.locked, connection.source, connection.target],
  );

  if (!geometry) {
    return null;
  }

  const radius = connection.highlighted
    ? SCENE_CONFIG.connection.highlightedRadius
    : connection.locked
      ? SCENE_CONFIG.connection.lockedRadius
      : SCENE_CONFIG.connection.availableRadius;
  const opacity = connection.highlighted
    ? SCENE_CONFIG.connection.opacity.highlighted
    : connection.locked
      ? SCENE_CONFIG.connection.opacity.locked
      : SCENE_CONFIG.connection.opacity.available;
  const color = SCENE_CONNECTION_COLOR[connection.type];

  return (
    <group>
      {geometry.segments.map((segment, index) => (
        <mesh
          key={`${connection.id}-segment-${index}`}
          position={segment.position}
          quaternion={geometry.forwardQuaternion}
        >
          <cylinderGeometry args={[radius, radius, segment.length, 6]} />
          <meshBasicMaterial
            color={color}
            opacity={opacity}
            transparent
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}

      <mesh position={geometry.forwardArrowPosition} quaternion={geometry.forwardQuaternion}>
        <coneGeometry
          args={[SCENE_CONFIG.connection.arrowRadius, SCENE_CONFIG.connection.arrowHeight, 8]}
        />
        <meshBasicMaterial
          color={color}
          opacity={opacity}
          transparent
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {connection.bidirectional && (
        <mesh position={geometry.reverseArrowPosition} quaternion={geometry.reverseQuaternion}>
          <coneGeometry
            args={[SCENE_CONFIG.connection.arrowRadius, SCENE_CONFIG.connection.arrowHeight, 8]}
          />
          <meshBasicMaterial
            color={color}
            opacity={opacity}
            transparent
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      )}
    </group>
  );
}
