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
  const tubeRef = useRef<THREE.Mesh>(null!);
  const scroll = useScroll();
  const noise2D = useMemo(() => createNoise2D(), []);

  const shaderMaterial = useMemo(() => {
    const streakMap = new THREE.DataTexture(
      new Uint8Array(256 * 256).map((_, i) => {
        const x = i % 256;
        const y = Math.floor(i / 256);
        const u = x / 255;
        const v = y / 255;

        // Edge noise
        const edgeNoise = Math.pow(Math.abs(u - 0.5) * 2, 2.0);
        const streaks = (noise2D(u * 10, v * 30) + 1) * 0.5;
        let alpha = streaks > 0.8 ? 0 : 1;
        alpha *= 1.0 - edgeNoise;

        // Stray streaks
        const stray = (noise2D(u * 5, v * 10) + 1) * 0.5;
        if (stray > 0.95) alpha = 0;

        return alpha * 255;
      }),
      256,
      256,
      THREE.RedFormat,
      THREE.UnsignedByteType
    );
    streakMap.needsUpdate = true;

    return new THREE.ShaderMaterial({
      uniforms: {
        streakMap: { value: streakMap },
        color: { value: new THREE.Color('black') },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D streakMap;
        uniform vec3 color;
        varying vec2 vUv;
        void main() {
          float streakAlpha = texture2D(streakMap, vUv).r;
          float tipTaper = smoothstep(0.9, 1.0, vUv.y);
          float alpha = mix(streakAlpha, 1.0, 1.0 - tipTaper);
          if (alpha < 0.1) discard;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
    });
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
      const endProgress = Math.min(1, progress);

      const points = fullPath.getPoints(200);
      const endIndex = Math.floor(endProgress * (points.length - 1));
      const subPoints = points.slice(0, endIndex + 1);

      if (subPoints.length > 1) {
        const newPath = new THREE.CatmullRomCurve3(subPoints);
        const radius = 0.5;
        const tubeSegments = 128;
        const radialSegments = 16;
        const closed = false;
        const newTubeGeometry = new THREE.TubeGeometry(newPath, tubeSegments, radius, radialSegments, closed);

        const positionAttribute = newTubeGeometry.getAttribute('position');
        const normalAttribute = newTubeGeometry.getAttribute('normal');
        const uvAttribute = newTubeGeometry.getAttribute('uv');
        const tempNormal = new THREE.Vector3();
        const tempPosition = new THREE.Vector3();

        for (let i = 0; i < positionAttribute.count; i++) {
          tempPosition.fromBufferAttribute(positionAttribute, i);
          tempNormal.fromBufferAttribute(normalAttribute, i);
          const v = uvAttribute.getY(i);

          const t = i / (positionAttribute.count - 1);

          // Tapered brush head
          const headSize = 0.2; // 20% of the stroke is the head
          let taperFactor = 1.0;
          if (t < headSize) {
            taperFactor = Math.sin((t / headSize) * Math.PI * 0.5); // Ease-in sine curve
          }

          // Tapered tail
          const tailSize = 0.1; // 10% of the stroke is the tail
          if (t > 1.0 - tailSize) {
            taperFactor *= Math.sin(((1.0 - t) / tailSize) * Math.PI * 0.5); // Ease-out sine curve
          }

          taperFactor = Math.max(0.0, Math.min(1.0, taperFactor));

          const noiseValue = noise2D(v * 200, 0.5) * 0.1;
          const taperedRadius = radius * taperFactor;

          tempPosition.add(tempNormal.multiplyScalar(noiseValue + (taperedRadius - radius)));
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
      <VertDebugger verts={verts} visible={debugVerts} />
      <mesh ref={tubeRef} material={shaderMaterial} />
    </>
  );
};

export default Brush;