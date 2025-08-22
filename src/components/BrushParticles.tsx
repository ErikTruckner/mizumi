import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const BrushParticles: React.FC = () => {
  const particlesRef = useRef<THREE.Points>(null!);

  const particleCount = 5000; // Large number of particles
  const particlesData = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      // Random positions within a large box
      positions[i * 3] = (Math.random() - 0.5) * 20; 
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;

      // Bright Gold and White colors
      const color = i % 2 === 0 ? new THREE.Color(0xFFD700) : new THREE.Color(0xFFFFFF);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = Math.random() * 1.0 + 0.5; // Large random size
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    return geometry;
  }, []);

  useFrame(() => {
    if (particlesRef.current) {
      const positions = particlesData.attributes.position.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;

        // Simple upward movement
        positions[i3 + 1] += 0.05; // Move up

        // Recycle particles when they go off-screen (simple check)
        if (positions[i3 + 1] > 10) { // If above a certain Y threshold
          positions[i3 + 1] = -10; // Reset to bottom
        }
      }

      particlesData.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={particlesRef} geometry={particlesData}>
      <pointsMaterial
        vertexColors
        sizeAttenuation={false} // Particles maintain size regardless of distance
        size={1.0} // Very large base size
        transparent
        opacity={1.0} // Fully opaque
        depthWrite={false} // Ensures particles are always rendered on top
        blending={THREE.AdditiveBlending} // For a glowing effect
      />
    </points>
  );
};

export default BrushParticles;
