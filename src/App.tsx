import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { ScrollControls, Scroll } from "@react-three/drei";
import * as THREE from "three";
import Brush from "./components/Brush";
import CameraAnimator from "./components/CameraAnimator";

function App() {
  const sections = [
    { title: "Section 1 Title", vert: new THREE.Vector3(0, 0, 0) },
    { title: "Section 2 Title", vert: new THREE.Vector3(0, -5, 0) },
    { title: "Section 3 Title", vert: new THREE.Vector3(0, -10, 0) },
    { title: "Section 4 Title", vert: new THREE.Vector3(0, -15, 0) },
    { title: "Section 5 Title", vert: new THREE.Vector3(0, -20, 0) },
  ];

  const verts = sections.map((section) => section.vert);

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
              <Brush verts={verts} />
            </group>
            <CameraAnimator />

            <Scroll html>
              {sections.map((section, index) => (
                <div
                  key={index}
                  className={`flex items-center ${index % 2 === 0 ? "justify-start" : "justify-end"} w-screen h-screen p-8 bg-transparent`}
                  style={{ position: "absolute", top: `${index * 100}vh` }}
                >
                  <div className="w-1/2">
                    <h2 className="text-4xl font-bold">{section.title}</h2>
                    <p className="mt-4 text-lg">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                      do eiusmod tempor incididunt ut labore et dolore magna
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