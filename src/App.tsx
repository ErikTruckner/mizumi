import { Suspense, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { ScrollControls, Scroll } from "@react-three/drei";
import * as THREE from "three";
import Brush from "./components/Brush";
import CameraAnimator from "./components/CameraAnimator";
import NizumiLogo from "./components/NizumiLogo";

function App() {
  const sections = [
    {
      h2: "Canela Thin Italic",
      p: "You know AI is the most powerful tool humanity has ever built. <br> And somehow, you already feel behind.",
    },
    {
      p: "It's not your fault. <br> Silcon Valley released the future <br> without giving anyone the instruction manual.",
    },
    {
      p: "We build <i>Nizumi</i> to change this. <br> A warm, intuitive exosystem to help you understand <br> and personalize the AI landscape - for your life.",
    },
  ];

  const verts = [
    new THREE.Vector3(0, 15, 0),
    new THREE.Vector3(7.5, -25, 0),
    new THREE.Vector3(-15, -70, 0),

    new THREE.Vector3(30, -125, 0),
  ];

  const fullPathRef = useRef<THREE.CatmullRomCurve3 | null>(null);
  const brushGroupRef = useRef<THREE.Group>(null);

  return (
    <div className="w-screen h-screen">
      <Canvas
        className="absolute top-0 left-0"
        camera={{ position: [0, 0, 30], fov: 75 }}
        gl={{ antialias: true }}
        style={{ backgroundColor: "#FAF7F0" }}
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
                  debugVerts={true}
                />
              </group>
            </group>
            <CameraAnimator />
            <NizumiLogo position={verts[0]} />
            {/* <NizumiLogo position={verts[verts.length - 1]} />  */}
            <Scroll html>
              {sections.map((section, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-center w-screen h-screen p-8 bg-transparent`}
                  style={{
                    position: "absolute",
                    top: `${index * 100}vh`,
                    paddingTop: "30vh",
                  }}
                >
                  <div
                    className={`w-1/3 mx-auto ${
                      index === 1 ? "text-right" : "text-left"
                    }`}
                  >
                    {section.h2 && (
                      <h2
                        className="text-4xl font-bold"
                        style={{ fontFamily: "Canela-ThinItalic" }}
                        dangerouslySetInnerHTML={{ __html: section.h2 }}
                      />
                    )}
                    {section.p && (
                      <p
                        className="mt-4 text-lg"
                        dangerouslySetInnerHTML={{ __html: section.p }}
                      />
                    )}
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
