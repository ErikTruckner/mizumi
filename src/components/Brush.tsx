import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import * as THREE from 'three';

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

const PARTICLE_ACTIVATION_OFFSET = 0.05; // Adjust this value to fine-tune the delay

const Brush: React.FC<BrushProps> = ({ verts = [], fullPathRef, debugVerts = false }) => {
  const groupRef = useRef<THREE.Group>(null!);
  const particleGroupRef = useRef<THREE.Group>(null!);
  const lastParticlePos = useRef<THREE.Vector3 | null>(null);
  const scroll = useScroll();

  const [particlesEnabled, setParticlesEnabled] = useState(false);

  const bristles = useMemo(() => {
    const bristleCount = 50;
    return Array.from({ length: bristleCount }, (_, i) => ({
      radius: (Math.random() * 0.03 + 0.01) * (4 / 3),
      offset: new THREE.Vector3((i / (bristleCount - 1) - 0.5) * 1.0, 0, 0),
      opacity: Math.random() * 0.5 + 0.2,
    }));
  }, []);

  const { fullPath, progressAtVert3, progressAtVert4 } = useMemo(() => {
    if (verts.length > 1) {
      const path = new THREE.CatmullRomCurve3(verts);
      fullPathRef.current = path;

      let progress = 0;
      let progress4 = 0;
      if (verts.length > 2) {
        const lengths = [];
        for (let i = 0; i < verts.length - 1; i++) {
            lengths.push(verts[i].distanceTo(verts[i+1]));
        }
        const totalLength = lengths.reduce((a, b) => a + b, 0);
        const lengthAtVert3 = lengths.slice(0, 2).reduce((a, b) => a + b, 0);
        const lengthAtVert4 = lengths.slice(0, 3).reduce((a, b) => a + b, 0);
        if (totalLength > 0) {
            progress = lengthAtVert3 / totalLength;
            progress4 = lengthAtVert4 / totalLength;
        }
      }
      return { fullPath: path, progressAtVert3: progress, progressAtVert4: progress4 };
    }
    fullPathRef.current = null;
    return { fullPath: null, progressAtVert3: 0, progressAtVert4: 0 };
  }, [verts, fullPathRef]);

  useFrame((state) => {
    if (groupRef.current && fullPath) {
      const time = state.clock.getElapsedTime();
      const progress = scroll.offset;
      const brushEndProgress = Math.max(0, progress);

      if (!particlesEnabled && brushEndProgress > (progressAtVert3 + PARTICLE_ACTIVATION_OFFSET)) {
        setParticlesEnabled(true);
      }

      // Particle Creation
      if (particlesEnabled && brushEndProgress > progressAtVert3 && brushEndProgress < progressAtVert4 && particleGroupRef.current) {
        const point = fullPath.getPointAt(brushEndProgress);
        if (!lastParticlePos.current || lastParticlePos.current.distanceTo(point) > 0.2) { // Increased density
            const particle = new THREE.Mesh(
                new THREE.BoxGeometry(1, 1, 1),
                new THREE.MeshBasicMaterial({ color: '#FFD700' })
            );
            particle.position.copy(point);
            particle.position.x += (Math.random() - 0.5) * 2;
            particle.position.y += (Math.random() - 0.5) * 2;
            particle.position.z += (Math.random() - 0.5) * 2;
            particle.userData.progress = brushEndProgress; // Store progress
            particleGroupRef.current.add(particle);
            lastParticlePos.current = point.clone();
        }
      }

      // Particle Creation
      if (particlesEnabled && brushEndProgress > progressAtVert3 && brushEndProgress < progressAtVert4 && particleGroupRef.current) {
        const point = fullPath.getPointAt(brushEndProgress);
        if (!lastParticlePos.current || lastParticlePos.current.distanceTo(point) > 0.2) { // Increased density
            const particle = new THREE.Mesh(
                new THREE.BoxGeometry(1, 1, 1),
                new THREE.MeshBasicMaterial({ color: '#FFD700' })
            );
            particle.position.copy(point);
            particle.position.x += (Math.random() - 0.5) * 2;
            particle.position.y += (Math.random() - 0.5) * 2;
            particle.position.z += (Math.random() - 0.5) * 2;
            particle.userData.progress = brushEndProgress; // Store progress
            particleGroupRef.current.add(particle);
            lastParticlePos.current = point.clone();
        }
      }

      // Particle Removal
      if (particlesEnabled && particleGroupRef.current) {
          for (let i = particleGroupRef.current.children.length - 1; i >= 0; i--) {
              const child = particleGroupRef.current.children[i] as THREE.Mesh;
              // Remove particles if they are outside the desired range (vert 3 to vert 4)
              // OR if they are ahead of the current brushEndProgress
              if (child.userData.progress < progressAtVert3 || child.userData.progress > progressAtVert4 || child.userData.progress > brushEndProgress) {
                  child.geometry.dispose();
                  particleGroupRef.current.remove(child);
              }
          }
      }

      // Particle Animation
      if (particleGroupRef.current) {
        particleGroupRef.current.children.forEach(child => {
            const scale = (0.5 + Math.sin(time * 2 + child.position.x) * 0.5) * 0.5;
            child.scale.set(scale, scale, scale);
        });
      }

      const points = fullPath.getPoints(200);
      const endIndex = Math.floor(brushEndProgress * (points.length - 1));
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
            if (child.material instanceof THREE.ShaderMaterial) {
              child.material.uniforms.uTime.value += 0.01;
            }
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
            <shaderMaterial
              uniforms={{
                uTime: { value: 0 },
                uColor1: { value: new THREE.Color('#CCCCCC') },
                uColor3: { value: new THREE.Color('#000000') },
                uOpacity: { value: bristle.opacity },
              }}
              vertexShader={`
                varying float vProgress;
                void main() {
                  vProgress = uv.x;
                  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
              `}
              fragmentShader={`
                uniform float uTime;
                uniform vec3 uColor1;
                uniform vec3 uColor3;
                uniform float uOpacity;
                varying float vProgress;

                void main() {
                  vec3 color = mix(uColor1, uColor3, vProgress);
                  gl_FragColor = vec4(color, uOpacity);
                }
              `}
              transparent
            />
          </mesh>
        ))}
      </group>
      <group ref={particleGroupRef} />
    </>
  );
};

export default Brush;