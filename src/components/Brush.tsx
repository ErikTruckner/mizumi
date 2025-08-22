import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import * as THREE from 'three';

interface BrushProps {
  verts?: THREE.Vector3[];
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

const Brush: React.FC<BrushProps> = ({ verts = [] }) => {
  const tubeRef = useRef<THREE.Mesh>(null!);
  const scroll = useScroll();

  useFrame(() => {
    if (tubeRef.current && verts.length > 1) {
      const progress = scroll.offset;

      // Total progress along all segments
      const totalProgress = progress * (verts.length - 1);
      // Index of the current segment
      const segmentIndex = Math.floor(totalProgress);
      // Progress within the current segment (0 to 1)
      const segmentProgress = totalProgress - segmentIndex;

      // Ensure we don't go out of bounds
      if (segmentIndex >= verts.length - 1) {
        // If at the end, draw the full path
        const fullPath = new THREE.CatmullRomCurve3(verts);
        const fullTubeGeometry = new THREE.TubeGeometry(fullPath, 25, 0.1, 8, false);
        tubeRef.current.geometry.dispose();
        tubeRef.current.geometry = fullTubeGeometry;
        return;
      }

      // Build the path up to the current point
      const pointsToShow = verts.slice(0, segmentIndex + 1);
      
      // Add the interpolated point in the current segment
      const startPoint = verts[segmentIndex];
      const endPoint = verts[segmentIndex + 1];
      const interpolatedPoint = startPoint.clone().lerp(endPoint, segmentProgress);
      pointsToShow.push(interpolatedPoint);

      // We need at least two points to form a curve for the tube
      if (pointsToShow.length > 1) {
        const newPath = new THREE.CatmullRomCurve3(pointsToShow);
        const newTubeGeometry = new THREE.TubeGeometry(newPath, 25, 0.1, 8, false);
        
        // Dispose the old geometry to prevent memory leaks
        tubeRef.current.geometry.dispose();
        tubeRef.current.geometry = newTubeGeometry;
      } else if (pointsToShow.length === 1) {
        // If there's only one point, we can't draw a tube yet.
        // To avoid an error, we can make the geometry invisible.
        tubeRef.current.geometry = new THREE.BufferGeometry();
      }
    }
  });

  return (
    <>
      <VertDebugger verts={verts} />
      <mesh ref={tubeRef}>
        <meshBasicMaterial color="black" />
      </mesh>
    </>
  );
};

export default Brush;
