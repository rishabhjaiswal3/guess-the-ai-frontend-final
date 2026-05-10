import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Line } from '@react-three/drei';
import * as THREE from 'three';

function NeuralNodes() {
  const pointsRef = useRef<THREE.Points>(null);
  const lineRef = useRef<THREE.Group>(null);

  // Generate random points for nodes
  const count = 40;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return pos;
  }, [count]);

  // Generate lines between close points
  const lines = useMemo(() => {
    const tempLines: [number, number, number][][] = [];
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const dx = positions[i * 3] - positions[j * 3];
        const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
        const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < 3) {
          tempLines.push([
            [positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]],
            [positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]],
          ]);
        }
      }
    }
    return tempLines;
  }, [positions]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (pointsRef.current) {
      pointsRef.current.rotation.y = time * 0.1;
      pointsRef.current.rotation.x = time * 0.05;
    }
    if (lineRef.current) {
      lineRef.current.rotation.y = time * 0.1;
      lineRef.current.rotation.x = time * 0.05;
    }
  });

  return (
    <group>
      <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#27e7ff"
          size={0.15}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>
      <group ref={lineRef}>
        {lines.map((line, i) => (
          <Line
            key={i}
            points={line}
            color="#9b64ff"
            lineWidth={0.5}
            transparent
            opacity={0.2}
          />
        ))}
      </group>
    </group>
  );
}

export default function NeuralNetwork3D() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <NeuralNodes />
      </Canvas>
    </div>
  );
}
