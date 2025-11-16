import { Billboard, Text } from '@react-three/drei';
import { DoubleSide } from 'three';

interface PlaneGuideProps {
  zPosition: number;
  color: string;
  label: string;
  showPlane?: boolean;
}

/**
 * Visual guide plane for character layers
 */
export default function PlaneGuide({
  zPosition,
  color,
  label,
  showPlane = false,
}: PlaneGuideProps) {
  return (
    <>
      {/* Optional translucent guide plane */}
      {showPlane && (
        <mesh position={[0, 0, zPosition]}>
          <planeGeometry args={[80, 80]} />
          <meshBasicMaterial color={color} opacity={0.02} transparent side={DoubleSide} depthWrite={false} />
        </mesh>
      )}

      {/* Label text below the plane */}
      <Billboard position={[0, -20, zPosition]} follow>
        <Text fontSize={2} color={color} anchorX="center" anchorY="middle">
          {label}
        </Text>
      </Billboard>
    </>
  );
}
