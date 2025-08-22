import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

interface BrushProps {
  verts?: THREE.Vector3[];
  fullPathRef: React.MutableRefObject<THREE.CatmullRomCurve3 | null>;
}

const VertDebugger: React.FC<{ verts: THREE.Vector3[] }> = ({ verts }) => {
  return (
    <group>
      {verts.map((vert, index) => (
        <mesh key={index} position={vert}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshBasicMaterial color="green" wireframe />
        </mesh>
      ))}
    </group>
  );
};

const Brush: React.FC<BrushProps> = ({ verts = [], fullPathRef }) => {
  const tubeRef = useRef<THREE.Mesh>(null!);
  const scroll = useScroll();

  const noise2D = useMemo(() => createNoise2D(), []);

  const bumpMap = useMemo(() => {
    const size = 128;
    const data = new Uint8Array(size * size);
    for (let i = 0; i < size * size; i++) {
      const x = i % size;
      const y = Math.floor(i / size);
      const value = (noise2D(x / 10, y / 10) + 1) * 128;
      data[i] = value;
    }
    return new THREE.DataTexture(data, size, size, THREE.RedFormat, THREE.UnsignedByteType);
  }, [noise2D]);

  const fullPath = useMemo(() => {
    if (verts.length > 1) {
      const path = new THREE.CatmullRomCurve3(verts);
      fullPathRef.current = path;
      return path;
    }
    fullPathRef.current = null;
    return null;
  }, [verts, fullPathRef]);

  useFrame(() => {
    if (tubeRef.current && fullPath) {
      const progress = scroll.offset;
      const tailLengthRatio = 0.125; // Shortened by half

      const startProgress = Math.max(0, progress - tailLengthRatio);
      const endProgress = progress;

      const points = fullPath.getPoints(100); // Get many points for smooth sub-curve
      const startIndex = Math.floor(startProgress * (points.length - 1));
      const endIndex = Math.floor(endProgress * (points.length - 1));

      const subPoints = points.slice(startIndex, endIndex + 1);

      if (subPoints.length > 1) {
        const newPath = new THREE.CatmullRomCurve3(subPoints);
        const newTubeGeometry = new THREE.TubeGeometry(newPath, 25, 0.5, 8, false);
        
        // Apply noise to vertices for imperfections
        const positionAttribute = newTubeGeometry.getAttribute('position');
        const normalAttribute = newTubeGeometry.getAttribute('normal');
        const tempNormal = new THREE.Vector3();
        const tempPosition = new THREE.Vector3();

        for (let i = 0; i < positionAttribute.count; i++) {
          tempPosition.fromBufferAttribute(positionAttribute, i);
          tempNormal.fromBufferAttribute(normalAttribute, i);

          // Calculate tapering factor based on position along the sub-curve
          const t = i / (positionAttribute.count - 1); // Normalized position along the current tube segment
          let taperFactor = 1.0;
          if (t < 0.2) { // Taper in at the start (first 20%)
            taperFactor = t / 0.2;
          } else if (t > 0.8) { // Taper out at the end (last 20%)
            taperFactor = (1.0 - t) / 0.2;
          }
          taperFactor = Math.max(0.0, Math.min(1.0, taperFactor)); // Clamp between 0 and 1

          // Apply tapering to the radius
          const originalRadius = 0.5; // Original radius of the tube
          const taperedRadius = originalRadius * taperFactor;

          // Displace vertex along its normal based on noise and tapered radius
          const noiseValue = noise2D(tempPosition.x * 10, tempPosition.y * 10) * 0.1; // Adjust multiplier for intensity
          tempPosition.add(tempNormal.multiplyScalar(noiseValue + (taperedRadius - originalRadius)));

          positionAttribute.setXYZ(i, tempPosition.x, tempPosition.y, tempPosition.z);
        }
        positionAttribute.needsUpdate = true;

        tubeRef.current.geometry.dispose();
        tubeRef.current.geometry = newTubeGeometry;
      } else {
        tubeRef.current.geometry = new THREE.BufferGeometry();
      }
    }
  });

  return (
    <>
      <VertDebugger verts={verts} />
      <mesh ref={tubeRef}>
        <meshStandardMaterial color="black" bumpMap={bumpMap} bumpScale={0.2} roughness={0.5} metalness={0.5} />
      </mesh>
    </>
  );
};

export default Brush;