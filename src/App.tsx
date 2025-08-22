import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { ScrollControls, Scroll } from "@react-three/drei";
import * as THREE from "three";
import Brush from "./components/Brush";

function App() {
  return (
    <div className="w-screen h-screen">
      <Canvas
        className="absolute top-0 left-0"
        camera={{ position: [0, 0, 30], fov: 75 }} // Pulled back camera on z=20 to see entire stroke (adjust z for more/less zoom out)
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          <ScrollControls pages={5} damping={0.1}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            <group scale={[1, 1, 1]}>
              <Brush
                verts={[
                  new THREE.Vector3(0, 15, 0),
                  new THREE.Vector3(10, -1, 0),
                  new THREE.Vector3(0, -10, 0),
                  new THREE.Vector3(0, -15, 0),
                  new THREE.Vector3(0, -20, 0),
                  new THREE.Vector3(0, -25, 0),
                ]}
              />
            </group>

            {/* HTML sections inside Scroll html, positioned for 5 pages */}
            <Scroll html>
              <div
                className="flex items-center justify-start w-screen h-screen p-8 bg-transparent"
                style={{ position: "absolute", top: "0vh" }}
              >
                <div className="w-1/2">
                  <h2 className="text-4xl font-bold">Section 1 Title</h2>
                  <p className="mt-4 text-lg">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                    do eiusmod tempor incididunt ut labore et dolore magna
                    aliqua.
                  </p>
                </div>
              </div>
              <div
                className="flex items-center justify-end w-screen h-screen p-8 bg-transparent"
                style={{ position: "absolute", top: "100vh" }}
              >
                <div className="w-1/2">
                  <h2 className="text-4xl font-bold">Section 2 Title</h2>
                  <p className="mt-4 text-lg">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                    do eiusmod tempor incididunt ut labore et dolore magna
                    aliqua.
                  </p>
                </div>
              </div>
              <div
                className="flex items-center justify-start w-screen h-screen p-8 bg-transparent"
                style={{ position: "absolute", top: "200vh" }}
              >
                <div className="w-1/2">
                  <h2 className="text-4xl font-bold">Section 3 Title</h2>
                  <p className="mt-4 text-lg">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                    do eiusmod tempor incididunt ut labore et dolore magna
                    aliqua.
                  </p>
                </div>
              </div>
              <div
                className="flex items-center justify-end w-screen h-screen p-8 bg-transparent"
                style={{ position: "absolute", top: "300vh" }}
              >
                <div className="w-1/2">
                  <h2 className="text-4xl font-bold">Section 4 Title</h2>
                  <p className="mt-4 text-lg">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                    do eiusmod tempor incididunt ut labore et dolore magna
                    aliqua.
                  </p>
                </div>
              </div>
              <div
                className="flex items-center justify-start w-screen h-screen p-8 bg-transparent"
                style={{ position: "absolute", top: "400vh" }}
              >
                <div className="w-1/2">
                  <h2 className="text-4xl font-bold">Section 5 Title</h2>
                  <p className="mt-4 text-lg">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                    do eiusmod tempor incididunt ut labore et dolore magna
                    aliqua.
                  </p>
                </div>
              </div>
            </Scroll>
          </ScrollControls>
        </Suspense>
      </Canvas>
    </div>
  );
}

export default App;
