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
      const page = scroll.offset * (verts.length - 1);
      const segmentIndex = Math.floor(page);
      const segmentProgress = page - segmentIndex;

      if (segmentIndex >= verts.length - 1) {
        const fullPath = new THREE.CatmullRomCurve3(verts);
        const fullTubeGeometry = new THREE.TubeGeometry(fullPath, 25, 0.1, 8, false);
        tubeRef.current.geometry.dispose();
        tubeRef.current.geometry = fullTubeGeometry;
        return;
      }

      const pointsToShow = verts.slice(0, segmentIndex + 1);
      
      const startPoint = verts[segmentIndex];
      const endPoint = verts[segmentIndex + 1];
      const interpolatedPoint = startPoint.clone().lerp(endPoint, segmentProgress);
      pointsToShow.push(interpolatedPoint);

      if (pointsToShow.length > 1) {
        const newPath = new THREE.CatmullRomCurve3(pointsToShow);
        const newTubeGeometry = new THREE.TubeGeometry(newPath, 25, 0.1, 8, false);
        
        tubeRef.current.geometry.dispose();
        tubeRef.current.geometry = newTubeGeometry;
      } else if (pointsToShow.length === 1) {
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
