import { CanvasTexture, DoubleSide, LinearFilter, SRGBColorSpace } from 'three';

import { useEffect, useMemo, type ReactElement } from 'react';

interface PlaneGuideProps {
  zPosition: number;
  color: string;
  label: string;
  showPlane?: boolean;
}

function PlaneLabel({ color, label }: Pick<PlaneGuideProps, 'color' | 'label'>): ReactElement {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Unable to create the 3D label canvas.');
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = '600 58px Inter, system-ui, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = color;
    context.fillText(label, canvas.width / 2, canvas.height / 2);

    const nextTexture = new CanvasTexture(canvas);
    nextTexture.colorSpace = SRGBColorSpace;
    nextTexture.minFilter = LinearFilter;
    nextTexture.generateMipmaps = false;
    return nextTexture;
  }, [color, label]);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <sprite scale={[18, 2.25, 1]}>
      {/* R3F maps this Three.js material property; it is not a DOM attribute. */}
      {/* eslint-disable-next-line react/no-unknown-property */}
      <spriteMaterial map={texture} transparent depthWrite={false} />
    </sprite>
  );
}

/**
 * Visual guide plane for character layers
 */
export default function PlaneGuide({
  zPosition,
  color,
  label,
  showPlane = false,
}: PlaneGuideProps): ReactElement {
  return (
    <>
      {/* Optional translucent guide plane */}
      {showPlane && (
        <mesh position={[0, 0, zPosition]}>
          <planeGeometry args={[80, 80]} />
          <meshBasicMaterial
            color={color}
            opacity={0.02}
            transparent
            side={DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Label text below the plane */}
      <group position={[0, -20, zPosition]}>
        <PlaneLabel color={color} label={label} />
      </group>
    </>
  );
}
