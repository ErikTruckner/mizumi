import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

interface BrushProps {
  verts?: THREE.Vector3[];
  fullPathRef: React.MutableRefObject<THREE.CatmullRomCurve3 | null>;
  debugVerts?: boolean;
}

const VertDebugger: React.FC<{ verts: THREE.Vector3[]; visible: boolean }> = ({ verts, visible }) => {
  if (!visible) return null;
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

const Brush: React.FC<BrushProps> = ({ verts = [], fullPathRef, debugVerts = false }) => {
  const groupRef = useRef<THREE.Group>(null!);
  const scroll = useScroll();
  const noise2D = useMemo(() => createNoise2D(), []);

  const bristles = useMemo(() => {
    const bristleCount = 50;
    return Array.from({ length: bristleCount }, (_, i) => ({
      radius: Math.random() * 0.03 + 0.01,
      offset: new THREE.Vector3((i / (bristleCount - 1) - 0.5) * 1.0, 0, 0),
      opacity: Math.random() * 0.5 + 0.2,
    }));
  }, []);

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
    if (groupRef.current && fullPath) {
      const progress = scroll.offset;
      const endProgress = Math.min(1, progress);

      const points = fullPath.getPoints(200);
      const endIndex = Math.floor(endProgress * (points.length - 1));
      const subPoints = points.slice(0, endIndex + 1);

      if (subPoints.length > 1) {
        groupRef.current.children.forEach((child, i) => {
          if (child instanceof THREE.Mesh) {
            const bristle = bristles[i];
            let bristlePoints = subPoints;
            if (subPoints.length > 1) {
              const clampedProgress = Math.max(0, Math.min(1, progress));
              const tangent = fullPath.getTangentAt(fullPath.getUtoTmapping(clampedProgress, 0));
              const perpendicular = new THREE.Vector3(-tangent.y, tangent.x, 0).normalize();
              bristlePoints = subPoints.map(p => {
                const offset = perpendicular.clone().multiplyScalar(bristle.offset.x);
                return p.clone().add(offset);
              });
            }


            const newPath = new THREE.CatmullRomCurve3(bristlePoints);
            const newTubeGeometry = new THREE.TubeGeometry(newPath, 64, bristle.radius, 8, false);

            child.geometry.dispose();
            child.geometry = newTubeGeometry;
          }
        });
      } else {
        groupRef.current.children.forEach(child => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            child.geometry = new THREE.BufferGeometry();
          }
        });
      }
    }
  });

  return (
    <>
      <VertDebugger verts={verts} visible={debugVerts} />
      <group ref={groupRef}>
        {bristles.map((bristle, i) => (
          <mesh key={i}>
            <meshBasicMaterial color="black" transparent opacity={bristle.opacity} />
          </mesh>
        ))}
      </group>
    </>
  );
};

export default Brush;