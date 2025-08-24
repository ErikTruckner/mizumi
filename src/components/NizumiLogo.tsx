import React, { useMemo } from "react";
import { Text, Image } from "@react-three/drei";
import * as THREE from "three";

interface NizumiLogoProps {
  position: THREE.Vector3;
}

const NizumiLogo: React.FC<NizumiLogoProps> = ({ position }) => {
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

      <Image url="/img/Z.png" scale={2} position={[0, 0, 0]} />

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
