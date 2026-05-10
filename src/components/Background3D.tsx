import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const starPalette = [
  new THREE.Color("#f7fbff"),
  new THREE.Color("#6bf0ff"),
  new THREE.Color("#6b8cff"),
  new THREE.Color("#f02cff"),
];

const StarTunnel = () => {
  const count = 1400;
  const pointsRef = useRef<THREE.Points>(null);
  const geometryRef = useRef<THREE.BufferGeometry>(null);

  const { positions, colors, speeds } = useMemo(() => {
    const nextPositions = new Float32Array(count * 3);
    const nextColors = new Float32Array(count * 3);
    const nextSpeeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 4.8 + Math.random() * 18;
      const depth = -90 + Math.random() * 105;
      const verticalStretch = 0.72 + Math.random() * 0.42;
      const color = starPalette[Math.floor(Math.random() * starPalette.length)];

      nextPositions[i * 3] = Math.cos(angle) * radius;
      nextPositions[i * 3 + 1] = Math.sin(angle) * radius * verticalStretch;
      nextPositions[i * 3 + 2] = depth;
      nextColors[i * 3] = color.r;
      nextColors[i * 3 + 1] = color.g;
      nextColors[i * 3 + 2] = color.b;
      nextSpeeds[i] = 8 + Math.random() * 18;
    }

    return { positions: nextPositions, colors: nextColors, speeds: nextSpeeds };
  }, []);

  useFrame((state, delta) => {
    const elapsed = state.clock.elapsedTime;

    if (pointsRef.current) {
      pointsRef.current.rotation.z = Math.sin(elapsed * 0.12) * 0.04;
      pointsRef.current.rotation.y = Math.sin(elapsed * 0.08) * 0.08;
    }

    for (let i = 0; i < count; i++) {
      const zIndex = i * 3 + 2;
      positions[zIndex] += speeds[i] * delta;

      if (positions[zIndex] > 16) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 4.8 + Math.random() * 18;
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = Math.sin(angle) * radius * (0.72 + Math.random() * 0.42);
        positions[zIndex] = -90;
      }
    }

    const positionAttribute = geometryRef.current?.getAttribute("position");
    if (positionAttribute) positionAttribute.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.075}
        vertexColors
        transparent
        opacity={0.88}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

const SpaceRings = () => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const elapsed = state.clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.rotation.z = elapsed * 0.035;
      groupRef.current.rotation.x = Math.sin(elapsed * 0.16) * 0.08;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, -34]}>
      {[-12, -3, 7].map((z, index) => (
        <mesh key={z} position={[0, 0, z]} rotation={[Math.PI / 2, 0, index * 0.8]}>
          <torusGeometry args={[7.2 + index * 3.1, 0.018, 8, 180]} />
          <meshBasicMaterial
            color={index % 2 === 0 ? "#6bf0ff" : "#f02cff"}
            transparent
            opacity={0.12}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
};

const NebulaGlow = () => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = state.clock.elapsedTime * -0.02;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, -42]}>
      <mesh position={[-4.5, 2.5, 0]}>
        <sphereGeometry args={[4.8, 32, 32]} />
        <meshBasicMaterial color="#244cff" transparent opacity={0.08} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh position={[5, -1.6, -4]}>
        <sphereGeometry args={[5.6, 32, 32]} />
        <meshBasicMaterial color="#f02cff" transparent opacity={0.07} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh position={[0.5, 0.2, -8]}>
        <sphereGeometry args={[6.8, 32, 32]} />
        <meshBasicMaterial color="#6bf0ff" transparent opacity={0.045} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
};

const Scene = () => {
  return (
    <>
      <NebulaGlow />
      <SpaceRings />
      <StarTunnel />
    </>
  );
};

const Background3D = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 14], fov: 78, near: 0.1, far: 130 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance", preserveDrawingBuffer: true }}
        style={{ background: "transparent", pointerEvents: "none" }}
      >
        <Scene />
      </Canvas>
      
      <div className="absolute inset-0 bg-gradient-to-b from-background/45 via-background/10 to-background/78 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(5,2,25,0.12)_34%,rgba(5,2,25,0.58)_100%)] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-cyan/5 via-transparent to-magenta/5 pointer-events-none" />
      
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)"
        }}
      />
    </div>
  );
};

export default Background3D;
