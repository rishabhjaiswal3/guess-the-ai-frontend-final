import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sphere, Box, Torus, Icosahedron } from "@react-three/drei";
import * as THREE from "three";

const FloatingShape = ({ 
  position, 
  color, 
  speed = 1, 
  rotationSpeed = 0.5,
  type = "sphere" 
}: { 
  position: [number, number, number]; 
  color: string;
  speed?: number;
  rotationSpeed?: number;
  type?: "sphere" | "box" | "torus" | "icosahedron";
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.003 * rotationSpeed;
      meshRef.current.rotation.y += 0.005 * rotationSpeed;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed) * 0.3;
    }
  });

  const ShapeComponent = () => {
    switch (type) {
      case "box":
        return <Box args={[0.6, 0.6, 0.6]} ref={meshRef}><MeshDistortMaterial color={color} speed={2} distort={0.2} transparent opacity={0.7} /></Box>;
      case "torus":
        return <Torus args={[0.4, 0.15, 16, 32]} ref={meshRef}><MeshDistortMaterial color={color} speed={2} distort={0.1} transparent opacity={0.7} /></Torus>;
      case "icosahedron":
        return <Icosahedron args={[0.4]} ref={meshRef}><MeshDistortMaterial color={color} speed={2} distort={0.3} transparent opacity={0.7} /></Icosahedron>;
      default:
        return <Sphere args={[0.4, 32, 32]} ref={meshRef}><MeshDistortMaterial color={color} speed={3} distort={0.4} transparent opacity={0.6} /></Sphere>;
    }
  };

  return (
    <Float speed={speed * 2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh position={position}>
        <ShapeComponent />
      </mesh>
    </Float>
  );
};

const GridFloor = () => {
  const gridRef = useRef<THREE.GridHelper>(null);
  
  useFrame((state) => {
    if (gridRef.current) {
      gridRef.current.position.z = (state.clock.elapsedTime * 0.5) % 1;
    }
  });

  return (
    <group position={[0, -3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <gridHelper ref={gridRef} args={[50, 50, "#00ffff", "#ff00ff"]} />
    </group>
  );
};

const ParticleField = () => {
  const count = 200;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return pos;
  }, []);

  const pointsRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.02;
      pointsRef.current.rotation.x = state.clock.elapsedTime * 0.01;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#00ffff" transparent opacity={0.8} sizeAttenuation />
    </points>
  );
};

const Scene = () => {
  return (
    <>
      {/* <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} color="#00ffff" intensity={1} />
      <pointLight position={[-10, -10, -10]} color="#ff00ff" intensity={0.8} />
      <spotLight position={[0, 10, 0]} angle={0.3} penumbra={1} color="#8b5cf6" intensity={0.5} /> */}

      {/* Floating shapes */}
      {/* <FloatingShape position={[-4, 2, -5]} color="#00ffff" type="sphere" speed={0.8} />
      <FloatingShape position={[4, -1, -6]} color="#ff00ff" type="icosahedron" speed={1.2} />
      <FloatingShape position={[-3, -2, -4]} color="#8b5cf6" type="torus" speed={1} /> */}
      {/* <FloatingShape position={[3, 1.5, -5]} color="#00ffff" type="box" speed={0.9} /> */}
      {/* <FloatingShape position={[0, 3, -7]} color="#ff00ff" type="sphere" speed={0.7} />
      <FloatingShape position={[-5, 0, -8]} color="#8b5cf6" type="icosahedron" speed={1.1} />
      <FloatingShape position={[5, -2, -6]} color="#00ffff" type="torus" speed={0.85} /> */}

      <ParticleField />
      <GridFloor />
    </>
  );
};

const Background3D = () => {
  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <Scene />
      </Canvas>
      
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background/80 pointer-events-none" />
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
