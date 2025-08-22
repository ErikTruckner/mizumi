import React, { useRef } from "react";
import { useFrame, extend } from "@react-three/fiber";
import { useScroll } from "@react-three/drei";
import * as THREE from "three";
import { ShaderMaterial } from "three";

// Extend ShaderMaterial for R3F
extend({ ShaderMaterial });

interface ShaderBrushProps {
  curvePoints?: THREE.Vector2[]; // Array of points defining the spline path in UV space (x: 0-1, y: 1 top to 0 bottom)
  sections?: { start: number; color: string }[];
  noiseScale?: number;
  brushWidth?: number;
  tipFadeLength?: number; // Length of soft fade at the tip
}

const ShaderBrush: React.FC<ShaderBrushProps> = ({
  curvePoints = [],
  sections = [],
  noiseScale = 0.02,
  brushWidth = 0.05,
  tipFadeLength = 0.05,
}) => {
  const scroll = useScroll();
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  // Default to straight line if no curvePoints provided
  const points =
    curvePoints.length > 0
      ? curvePoints
      : [new THREE.Vector2(0.5, 1), new THREE.Vector2(0.5, 0)];

  // Max points for shader array (adjust if needed)
  const MAX_POINTS = 16;

  // Flatten points to Float32Array and pad to MAX_POINTS * 2
  const curvePointsFlat = new Float32Array(MAX_POINTS * 2);
  for (let i = 0; i < Math.min(points.length, MAX_POINTS); i++) {
    curvePointsFlat[i * 2] = points[i].x;
    curvePointsFlat[i * 2 + 1] = points[i].y;
  }
  // Remaining elements are 0 by default, which is fine since numPoints limits the loop

  // Geometry: Wider to accommodate swoops
  const geometry = new THREE.PlaneGeometry(2, 10, 1, 128);

  // Uniforms
  const uniforms = {
    progress: { value: 0 },
    color: { value: new THREE.Color("black") },
    time: { value: 0 },
    noiseScale: { value: noiseScale },
    brushWidth: { value: brushWidth },
    tipFadeLength: { value: tipFadeLength },
    numPoints: { value: Math.min(points.length, MAX_POINTS) },
    curvePoints: { value: curvePointsFlat },
  };

  // Simple noise function
  const noise = `
    float noise(vec2 st) {
      return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453);
    }
  `;

  // Capsule SDF
  const sdf = `
    float sdCapsule(vec2 p, vec2 a, vec2 b, float r) {
      vec2 pa = p - a, ba = b - a;
      float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
      return length(pa - ba * h) - r;
    }
  `;

  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float progress;
    uniform vec3 color;
    uniform float time;
    uniform float noiseScale;
    uniform float brushWidth;
    uniform float tipFadeLength;
    uniform int numPoints;
    uniform vec2 curvePoints[ ${MAX_POINTS} ];

    varying vec2 vUv;

    ${noise}
    ${sdf}

    void main() {
      vec2 uv = vUv;

      // Invert y for downward flow
      float reveal = 1.0 - uv.y;

      // Clip unrevealed part
      if (reveal > progress) {
        discard;
      }

      // Compute min distance to the polyline segments
      float dist = 1e20;
      for (int i = 0; i < ${MAX_POINTS - 1}; i++) {
        if (i >= numPoints - 1) break;
        vec2 a = curvePoints[i];
        vec2 b = curvePoints[i + 1];
        dist = min(dist, sdCapsule(uv, a, b, brushWidth * 0.5));
      }

      // Add noise for organic imperfection (centered around 0)
      float n = (noise(uv * 20.0 + time * 0.5) - 0.5) * noiseScale;
      dist += n;

      // Brush mask (1 inside, 0 outside with AA)
      float brush = 1.0 - smoothstep(-0.01, 0.01, dist);

      // Soft fade at the tip for rounded/organic end
      float tipFade = smoothstep(progress - tipFadeLength, progress, reveal);
      brush *= tipFade;

      // Pulse/breath for life
      float pulse = 0.8 + 0.2 * sin(time * 0.5 + uv.y * 5.0);
      brush *= pulse;

      gl_FragColor = vec4(color * brush, brush);
    }
  `;

  useFrame((state) => {
    if (materialRef.current) {
      const progress = scroll.offset;
      materialRef.current.uniforms.progress.value = progress;
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;

      // Handle color sections
      for (let i = sections.length - 1; i >= 0; i--) {
        if (progress >= sections[i].start) {
          materialRef.current.uniforms.color.value.set(sections[i].color);
          break;
        }
      }
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry} position={[0, 0, 0]}>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent={true}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

export default ShaderBrush;
