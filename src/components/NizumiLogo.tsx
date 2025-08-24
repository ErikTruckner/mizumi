import React, { useMemo } from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { createNoise2D } from "simplex-noise";

interface NizumiLogoProps {
  position: THREE.Vector3;
}

const NizumiLogo: React.FC<NizumiLogoProps> = ({ position }) => {
  const noise2D = useMemo(() => createNoise2D(), []);

  const shaderMaterial = useMemo(() => {
    const streakMap = new THREE.DataTexture(
      new Uint8Array(256 * 256).map((_, i) => {
        const x = i % 256;
        const y = Math.floor(i / 256);
        const u = x / 255;
        const v = y / 255;

        // Center-biased gradient
        const centerBias = 1.0 - Math.abs(u - 0.5) * 2.0;
        const gradient = THREE.MathUtils.smoothstep(centerBias, 0.0, 1.0);

        const streaks = (noise2D(u * 20, v * 60) + 1) * 0.5;
        let alpha = streaks > 0.6 ? 0 : 1;
        alpha *= gradient;

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

  // Define points for the 'Z' brush stroke - more points for better shape
  const zVerts = useMemo(
    () => [
      new THREE.Vector3(-0.5, 0.5, 0), // Top-left
      new THREE.Vector3(0.5, 0.5, 0), // Top-right
      new THREE.Vector3(-0.5, -0.5, 0), // Bottom-left
      new THREE.Vector3(0.5, -0.5, 0), // Bottom-right
    ],
    []
  );

  // Create the 'Z' brush stroke geometry
  const zBrushGeometry = useMemo(() => {
    const path = new THREE.CatmullRomCurve3(zVerts, false, "catmullrom", 0); // Added curveType and tension
    const geometry = new THREE.TubeGeometry(path, 20, 0.1, 8, false); // Adjusted radius

    // Apply tapering and noise to vertices
    const positionAttribute = geometry.getAttribute("position");
    const normalAttribute = geometry.getAttribute("normal");
    const uvAttribute = geometry.getAttribute("uv");
    const tempNormal = new THREE.Vector3();
    const tempPosition = new THREE.Vector3();

    for (let i = 0; i < positionAttribute.count; i++) {
      tempPosition.fromBufferAttribute(positionAttribute, i);
      tempNormal.fromBufferAttribute(normalAttribute, i);
      const v = uvAttribute.getY(i);

      const noiseValue =
        noise2D(v * 200, 0.5) * 0.1; // Adjust multiplier for intensity
      tempPosition.add(
        tempNormal.multiplyScalar(noiseValue)
      );

      positionAttribute.setXYZ(
        i,
        tempPosition.x,
        tempPosition.y,
        tempPosition.z
      );
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
      <mesh geometry={zBrushGeometry} position={[0, 0, 0]} material={shaderMaterial}>
        {" "}
        {/* Position 'Z' relative to group */}
      </mesh>
      <mesh position={zVerts[0]} material={shaderMaterial}>
        <sphereGeometry args={[0.1, 32, 32]} />
      </mesh>
      <mesh position={zVerts[zVerts.length -1]} material={shaderMaterial}>
        <sphereGeometry args={[0.1, 32, 32]} />
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
