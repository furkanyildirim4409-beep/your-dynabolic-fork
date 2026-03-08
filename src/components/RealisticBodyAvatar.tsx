import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";

interface BodyMeshProps {
  position: [number, number, number];
  scale: [number, number, number];
  isHotspot?: boolean;
  geometry?: "sphere" | "box" | "capsule";
}

const BodyMesh = ({ position, scale, isHotspot = false, geometry = "box" }: BodyMeshProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current && isHotspot) {
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.15 + 0.85;
      if (glowRef.current) {
        glowRef.current.scale.setScalar(pulse * 1.2);
      }
    }
  });

  return (
    <group position={position}>
      {/* Subsurface Glow for Hotspots */}
      {isHotspot && (
        <mesh ref={glowRef} scale={[scale[0] * 1.3, scale[1] * 1.3, scale[2] * 1.3]}>
          {geometry === "sphere" ? (
            <sphereGeometry args={[0.5, 32, 32]} />
          ) : (
            <boxGeometry args={[1, 1, 1]} />
          )}
          <meshBasicMaterial
            color="#ff2222"
            transparent
            opacity={0.3}
            side={THREE.BackSide}
          />
        </mesh>
      )}

      {/* Main Body Part */}
      <mesh ref={meshRef} scale={scale}>
        {geometry === "sphere" ? (
          <sphereGeometry args={[0.5, 32, 32]} />
        ) : geometry === "capsule" ? (
          <capsuleGeometry args={[0.5, 1, 16, 32]} />
        ) : (
          <boxGeometry args={[1, 1, 1]} />
        )}
        <meshStandardMaterial
          color={isHotspot ? "#e8b4a0" : "#d4a574"}
          roughness={0.4}
          metalness={0.1}
          emissive={isHotspot ? "#ff3333" : "#000000"}
          emissiveIntensity={isHotspot ? 0.15 : 0}
        />
      </mesh>
    </group>
  );
};

interface HumanBodyProps {
  waistScale?: number;
}

const HumanBody = ({ waistScale = 1 }: HumanBodyProps) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.003;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Head */}
      <BodyMesh position={[0, 2.1, 0]} scale={[0.55, 0.65, 0.6]} geometry="sphere" />

      {/* Neck */}
      <BodyMesh position={[0, 1.7, 0]} scale={[0.25, 0.25, 0.22]} geometry="capsule" />

      {/* Shoulders/Traps - HOTSPOT */}
      <BodyMesh position={[-0.45, 1.45, 0]} scale={[0.35, 0.25, 0.25]} isHotspot geometry="sphere" />
      <BodyMesh position={[0.45, 1.45, 0]} scale={[0.35, 0.25, 0.25]} isHotspot geometry="sphere" />

      {/* Chest - HOTSPOT */}
      <BodyMesh position={[0, 1.25, 0.05]} scale={[0.95, 0.45, 0.4]} isHotspot />

      {/* Upper Abs */}
      <BodyMesh position={[0, 0.9, 0]} scale={[0.75, 0.35, 0.35]} />

      {/* Lower Abs / Waist - Scalable */}
      <mesh position={[0, 0.55, 0]} scale={[0.65 * waistScale, 0.35, 0.32 * waistScale]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#d4a574" roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Hips/Pelvis */}
      <BodyMesh position={[0, 0.2, 0]} scale={[0.7, 0.25, 0.35]} />

      {/* Left Arm */}
      <BodyMesh position={[-0.65, 1.25, 0]} scale={[0.22, 0.35, 0.2]} />
      <BodyMesh position={[-0.65, 0.85, 0]} scale={[0.2, 0.35, 0.18]} />
      <BodyMesh position={[-0.65, 0.45, 0]} scale={[0.18, 0.35, 0.16]} />

      {/* Right Arm */}
      <BodyMesh position={[0.65, 1.25, 0]} scale={[0.22, 0.35, 0.2]} />
      <BodyMesh position={[0.65, 0.85, 0]} scale={[0.2, 0.35, 0.18]} />
      <BodyMesh position={[0.65, 0.45, 0]} scale={[0.18, 0.35, 0.16]} />

      {/* Left Leg */}
      <BodyMesh position={[-0.22, -0.2, 0]} scale={[0.28, 0.5, 0.28]} />
      <BodyMesh position={[-0.22, -0.7, 0]} scale={[0.24, 0.5, 0.24]} />
      <BodyMesh position={[-0.22, -1.2, 0]} scale={[0.2, 0.5, 0.2]} />

      {/* Right Leg */}
      <BodyMesh position={[0.22, -0.2, 0]} scale={[0.28, 0.5, 0.28]} />
      <BodyMesh position={[0.22, -0.7, 0]} scale={[0.24, 0.5, 0.24]} />
      <BodyMesh position={[0.22, -1.2, 0]} scale={[0.2, 0.5, 0.2]} />

      {/* Muscle Definition Lines (Subtle) */}
      <lineSegments position={[0, 0.9, 0.18]}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={4}
            array={new Float32Array([
              0, 0.15, 0,
              0, -0.15, 0,
              -0.15, 0, 0,
              0.15, 0, 0,
            ])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#8b7355" transparent opacity={0.3} />
      </lineSegments>
    </group>
  );
};

export interface AvatarMeasurements {
  neck?: number | null;
  chest?: number | null;
  shoulder?: number | null;
  waist?: number | null;
  hips?: number | null;
  arm?: number | null;
  thigh?: number | null;
}

interface RealisticBodyAvatarProps {
  waistScale?: number;
  measurements?: AvatarMeasurements;
}

const MeasurementLabel = ({ value, label, className }: { value?: number | null; label: string; className: string }) => {
  if (!value) return null;
  return (
    <div className={`absolute backdrop-blur-md bg-muted/30 border border-border/40 text-[10px] px-2 py-0.5 rounded-full text-foreground font-medium whitespace-nowrap pointer-events-none ${className}`}>
      {label}: {value}cm
    </div>
  );
};

const RealisticBodyAvatar = ({ waistScale = 1, measurements }: RealisticBodyAvatarProps) => {
  return (
    <div className="w-full h-72 relative">
      <Canvas camera={{ position: [0, 0.5, 4.5], fov: 45 }}>
        {/* Lighting for Realistic Skin */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={1} color="#fff5e6" />
        <directionalLight position={[-5, 3, -5]} intensity={0.3} color="#e6f0ff" />
        <pointLight position={[0, 3, 2]} intensity={0.5} color="#ffccaa" />
        
        {/* Subtle Rim Light for Definition */}
        <pointLight position={[-3, 0, -3]} intensity={0.3} color="#ccff00" />

        <HumanBody waistScale={waistScale} />
        
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.5}
          autoRotate={false}
        />
      </Canvas>

      {/* Measurement Labels */}
      {measurements && (
        <div className="absolute inset-0 pointer-events-none">
          <MeasurementLabel value={measurements.shoulder} label="Omuz" className="top-[18%] right-2" />
          <MeasurementLabel value={measurements.chest} label="Göğüs" className="top-[30%] right-2" />
          <MeasurementLabel value={measurements.waist} label="Bel" className="top-[42%] right-2" />
          <MeasurementLabel value={measurements.hips} label="Kalça" className="top-[52%] right-2" />
          <MeasurementLabel value={measurements.arm} label="Kol" className="top-[30%] left-1" />
          <MeasurementLabel value={measurements.neck} label="Boyun" className="top-[12%] left-1" />
          <MeasurementLabel value={measurements.thigh} label="Bacak" className="bottom-[18%] left-1" />
        </div>
      )}

      {/* Sweat/Glow Effect Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-20 h-32 bg-gradient-radial from-white/5 to-transparent rounded-full blur-xl" />
      </div>

      {/* Subsurface Scattering Indicator */}
      <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-destructive/20 px-2 py-1 rounded-lg">
        <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
        <span className="text-destructive text-[10px] font-medium">AĞRI BÖLGESİ</span>
      </div>
    </div>
  );
};

export default RealisticBodyAvatar;