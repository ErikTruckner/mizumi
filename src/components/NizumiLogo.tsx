import React, { useMemo } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

interface NizumiLogoProps {
  position: THREE.Vector3;
}

const NizumiLogo: React.FC<NizumiLogoProps> = ({ position }) => {
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

  // Define points for the 'Z' brush stroke - more points for better shape
  const zVerts = useMemo(() => [
    new THREE.Vector3(-0.5, 0.5, 0), // Top-left
    new THREE.Vector3(0.5, 0.5, 0),  // Top-right
    new THREE.Vector3(-0.5, -0.5, 0), // Bottom-left
    new THREE.Vector3(0.5, -0.5, 0)   // Bottom-right
  ], []);

  // Create the 'Z' brush stroke geometry
  const zBrushGeometry = useMemo(() => {
    const path = new THREE.CatmullRomCurve3(zVerts, false, 'catmullrom', 0); // Added curveType and tension
    const geometry = new THREE.TubeGeometry(path, 20, 0.1, 8, false); // Adjusted radius

    // Apply tapering and noise to vertices
    const positionAttribute = geometry.getAttribute('position');
    const normalAttribute = geometry.getAttribute('normal');
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
      const originalRadius = 0.1; // Original radius of the tube
      const taperedRadius = originalRadius * taperFactor;

      // Displace vertex along its normal based on noise and tapered radius
      const noiseValue = noise2D(tempPosition.x * 10, tempPosition.y * 10) * 0.1; // Adjust multiplier for intensity
      tempPosition.add(tempNormal.multiplyScalar(noiseValue + (taperedRadius - originalRadius)));

      positionAttribute.setXYZ(i, tempPosition.x, tempPosition.y, tempPosition.z);
    }
    positionAttribute.needsUpdate = true;

    return geometry;
  }, [zVerts, noise2D]);

  return (
    <group scale={[5, 5, 5]} position={position}>
      <Text
        position={[-0.7, 0, 0]} // Position 'Ni'
        fontSize={0.5}
        color="black"
        anchorX="right"
        anchorY="middle"
      >
        Ni
      </Text>
      
      {/* The 'Z' brush stroke */}
      <mesh geometry={zBrushGeometry} position={[0, 0, 0]}> {/* Position 'Z' relative to group */}
        <meshStandardMaterial color="black" bumpMap={bumpMap} bumpScale={0.2} roughness={0.5} metalness={0.5} /> {/* Apply bump map and material properties */}
      </mesh>

      <Text
        position={[0.7, 0, 0]} // Position 'zumi'
        fontSize={0.5}
        color="black"
        anchorX="left"
        anchorY="middle"
      >
        zumi
      </Text>
    </group>
  );
};

export default NizumiLogo;
