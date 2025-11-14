import { Text } from '@react-three/drei';
import { DoubleSide } from 'three';

interface PlaneGuideProps {
  zPosition: number;
  color: string;
  label: string;
}

/**
 * Visual guide plane for character layers
 */
export default function PlaneGuide({ zPosition, color, label }: PlaneGuideProps) {
  return (
    <>
      {/* Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, zPosition]}>
        <planeGeometry args={[80, 80]} />
        <meshBasicMaterial color={color} opacity={0.05} transparent side={DoubleSide} />
      </mesh>

      {/* Label text below the plane */}
      <Text
        position={[0, -20, zPosition]}
        fontSize={2}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </>
  );
}
