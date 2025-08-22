import React, { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ScrollControls, Scroll, useScroll } from "@react-three/drei";
import * as THREE from "three";
import Brush from "./components/Brush";
import CameraAnimator from "./components/CameraAnimator";
import BrushParticles from "./components/BrushParticles";
import NizumiLogo from "./components/NizumiLogo";

function App() {
  const sections = [
    { title: "Section 1 Title", vert: new THREE.Vector3(0, 15, 0) },
    { title: "Section 2 Title", vert: new THREE.Vector3(-15, -40, 0) },
    { title: "Section 3 Title", vert: new THREE.Vector3(15, -80, 0) },
    { title: "Section 4 Title", vert: new THREE.Vector3(-15, -115, 0) },
    { title: "Section 5 Title", vert: new THREE.Vector3(15, -155, 0) },
  ];

  const verts = [
    new THREE.Vector3(0, 15, 0),
    new THREE.Vector3(7.5, -5, 0),
    new THREE.Vector3(-15, -40, 0),
    new THREE.Vector3(15, -60.5, 0),
    new THREE.Vector3(15, -80, 0),
    new THREE.Vector3(-15, -80.5, 0),
    new THREE.Vector3(-15, -115, 0),
    new THREE.Vector3(0, -145.5, 0),
    new THREE.Vector3(15, -165, 0),
  ];

  const fullPathRef = useRef<THREE.CatmullRomCurve3 | null>(null);
  const brushGroupRef = useRef<THREE.Group>(null);

  return (
    <div className="w-screen h-screen">
      <Canvas
        className="absolute top-0 left-0"
        camera={{ position: [0, 0, 30], fov: 75 }}
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          <ScrollControls pages={sections.length} damping={0.1}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            <group scale={[1, 1, 1]}>
              <group ref={brushGroupRef}>
                {" "}
                {/* Group for the main brush */}
                <Brush
                  verts={verts}
                  fullPathRef={fullPathRef}
                  debugVerts={false}
                />
              </group>
            </group>
            <CameraAnimator />
            <BrushParticles />
            <NizumiLogo position={verts[0]} />
            <NizumiLogo position={verts[verts.length - 1]} /> {/* Final logo */}
            <Scroll html>
              {sections.map((section, index) => (
                <div
                  key={index}
                  className={`flex items-center ${
                    index % 2 === 0 ? "justify-start" : "justify-end"
                  } w-screen h-screen p-8 bg-transparent`}
                  style={{ position: "absolute", top: `${index * 100}vh` }}
                >
                  <div className="w-1/2">
                    <h2 className="text-4xl font-bold">{section.title}</h2>
                    <p className="mt-4 text-lg">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                      Sed do eiusmod tempor incididunt ut labore et dolore magna
                      aliqua.
                    </p>
                  </div>
                </div>
              ))}
            </Scroll>
          </ScrollControls>
        </Suspense>
      </Canvas>
    </div>
  );
}

export default App;
