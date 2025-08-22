import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { ScrollControls } from "@react-three/drei";
import * as THREE from "three";
import ShaderBrush from "./components/ShaderBrush";
function App() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      {/* Optional HTML overlay for page sections (ensure total height matches ScrollControls pages) */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 1,
          height: "300vh",
        }}
      >
        <div style={{ height: "100vh" }}>Section 1 (Top)</div>
        <div style={{ height: "100vh" }}>Section 2 (Middle)</div>
        <div style={{ height: "100vh" }}>Section 3 (Bottom)</div>
      </div>

      <Canvas
        style={{ position: "absolute", top: 0, left: 0 }}
        camera={{ position: [0, 0, 5], fov: 75 }} // Adjust camera to frame the full path
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          <ScrollControls pages={3} damping={0.1}>
            {" "}
            {/* Virtual scroll height to match content */}
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            {/* Updated ShaderBrush with S-like spline path */}
            <ShaderBrush
              curvePoints={[
                new THREE.Vector2(0.5, 1.0), // Start: Center top
                new THREE.Vector2(0.7, 0.8), // Swoop right
                new THREE.Vector2(0.9, 0.6), // Peak right
                new THREE.Vector2(0.7, 0.4), // Curve back
                new THREE.Vector2(0.3, 0.2), // Swoop left
                new THREE.Vector2(0.5, 0.0), // End: Center bottom
              ]}
              sections={[
                { start: 0, color: "#000000" }, // Black at start
                { start: 0.3, color: "#FF0000" }, // Red mid
                { start: 0.6, color: "#0000FF" }, // Blue end
              ]}
              noiseScale={0.02} // Subtle imperfection
              brushWidth={0.05} // Stroke thickness
              tipFadeLength={0.05} // Soft tip fade for organic end
            />
            {/* Optional: Other elements like orbs */}
          </ScrollControls>
        </Suspense>
      </Canvas>
    </div>
  );
}

export default App;
