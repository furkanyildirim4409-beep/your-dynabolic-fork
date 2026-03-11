import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

interface BodyMeshProps {
  position: [number, number, number];
  scale: [number, number, number];
  isHotspot?: boolean;
  geometry?: "sphere" | "box" | "capsule";
  customOpacity?: number;
}

// Holo-Tarama Efekti için Materyal Güçlendirildi
const BodyMesh = ({ position, scale, isHotspot = false, geometry = "box", customOpacity = 0.5 }: BodyMeshProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    // Nabız Atış animasyonu (Hologram Glitch ve Hotspot vurumu için)
    if (meshRef.current) {
      // Genel vücut hafif bir yüzey yansıma animasyonuna sahip
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.5 + position[0]) * 0.005;
    }

    if (meshRef.current && isHotspot) {
      const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.2 + 0.8;
      if (glowRef.current) {
        glowRef.current.scale.setScalar(pulse * 1.25);
      }
      meshRef.current.scale.set(
        scale[0] + Math.sin(state.clock.elapsedTime * 4) * 0.01,
        scale[1] + Math.sin(state.clock.elapsedTime * 4) * 0.01,
        scale[2] + Math.sin(state.clock.elapsedTime * 4) * 0.01,
      );
    }
  });

  return (
    <group position={position}>
      {/* Bio-Digital Subsurface Parlama (Yalnızca risk/hasar bölgelerinde) */}
      {isHotspot && (
        <mesh ref={glowRef} scale={[scale[0] * 1.4, scale[1] * 1.4, scale[2] * 1.4]}>
          {geometry === "sphere" ? (
            <sphereGeometry args={[0.5, 24, 24]} />
          ) : geometry === "capsule" ? (
            <capsuleGeometry args={[0.5, 1, 16, 32]} />
          ) : (
            <boxGeometry args={[1, 1, 1]} />
          )}
          <meshBasicMaterial
            color="#ff0055" // Cyberpunk Acı/Zarar uyarı Kırmızısı
            transparent
            opacity={0.25}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* Main Holographic Body Part */}
      <mesh ref={meshRef} scale={scale}>
        {geometry === "sphere" ? (
          <sphereGeometry args={[0.5, 32, 32]} />
        ) : geometry === "capsule" ? (
          <capsuleGeometry args={[0.5, 1, 16, 32]} />
        ) : (
          <boxGeometry args={[1, 1, 1]} />
        )}
        <meshPhysicalMaterial
          // Ten Renginden Cyber Mavi Holo Formuna geçiş (Saydam ve Neon hatlı)
          color={isHotspot ? "#ff1e46" : "#0284c7"}
          emissive={isHotspot ? "#99002b" : "#0ea5e9"}
          emissiveIntensity={isHotspot ? 0.8 : 0.3}
          transparent={true}
          opacity={isHotspot ? 0.75 : customOpacity}
          transmission={0.4} // Cam / Hologram Yarı-saydam doku yansıması
          roughness={0.1}
          metalness={0.8}
          clearcoat={1.0}
          clearcoatRoughness={0.2}
        />
      </mesh>
    </group>
  );
};

interface HumanBodyProps {
  waistScale?: number;
}

// Koordinat Analizi: Beden Yapınıza %100 Uyarlandı!
// Boyun-Trapez ilişkisi kalına, Omuz başları daha düşük, Geniş Göğüs kafesi (Thorax).
// Özellikle yanlara sarkan orta kalınlık "waist bölgesi" ve sağlam bacak temelleri aktarıldı.
const HumanBody = ({ waistScale = 1 }: HumanBodyProps) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.004; // Çok hafif hızlandırılmış dönüş
    }
  });

  return (
    <group ref={groupRef}>
      {/* Head */}
      <BodyMesh position={[0, 2.1, 0]} scale={[0.55, 0.65, 0.6]} geometry="sphere" customOpacity={0.4} />
      {/* Neck & Traps - Biraz kalınlaştırılmış, yüke yatkın */}
      <BodyMesh position={[0, 1.75, 0]} scale={[0.3, 0.3, 0.28]} geometry="capsule" />
      {/* Shoulders - Düşük, V-tip değil, küt ve dolgun */}
      <BodyMesh position={[-0.52, 1.48, 0]} scale={[0.38, 0.3, 0.3]} geometry="sphere" customOpacity={0.6} />
      <BodyMesh position={[0.52, 1.48, 0]} scale={[0.38, 0.3, 0.3]} geometry="sphere" customOpacity={0.6} />
      {/* Chest (Pectorals / Lat bölgesi) - Dışa Doğru Hacimli Analiz - HOTSPOT (Göğüs yorgun sayıldı) */}
      <BodyMesh position={[0, 1.3, 0.08]} scale={[1.15, 0.5, 0.45]} isHotspot />
      {/* Upper Abs / Mid Core - Kalınlaşma Başlangıcı */}
      <BodyMesh position={[0, 0.95, 0.05]} scale={[0.9, 0.35, 0.4]} />
      {/* Lower Abs / Waist - Kalın bel ("Love Handle / Yan Genişlikleri" X axis = 1.0 (Eski koddaki dar 0.65 iptal edildi) ) */}
      <mesh position={[0, 0.6, 0.02]} scale={[1.05 * waistScale, 0.4, 0.42 * waistScale]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhysicalMaterial
          color="#0284c7"
          emissive="#0ea5e9"
          emissiveIntensity={0.2}
          transparent={true}
          opacity={0.4}
          transmission={0.4}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>
      {/* Hips/Pelvis - Leğen Genişliğine uygun */}
      <BodyMesh position={[0, 0.25, 0]} scale={[0.95, 0.3, 0.45]} customOpacity={0.6} />
      {/* Left Arm - Ağırlaştırılmış / Dolgun Kas Analizi */}
      <BodyMesh position={[-0.72, 1.25, 0]} scale={[0.26, 0.38, 0.24]} isHotspot /> {/* Omuz Altı Başlar HOTSPOT */}
      <BodyMesh position={[-0.72, 0.85, 0]} scale={[0.24, 0.35, 0.22]} />
      <BodyMesh position={[-0.72, 0.45, 0]} scale={[0.2, 0.32, 0.18]} />
      {/* Right Arm */}
      <BodyMesh position={[0.72, 1.25, 0]} scale={[0.26, 0.38, 0.24]} isHotspot />
      <BodyMesh position={[0.72, 0.85, 0]} scale={[0.24, 0.35, 0.22]} />
      <BodyMesh position={[0.72, 0.45, 0]} scale={[0.2, 0.32, 0.18]} />
      {/* Left Leg - Üst Ekstremitelerde kalın ve oturaklı bacak hesabı */}
      <BodyMesh position={[-0.26, -0.2, 0]} scale={[0.35, 0.55, 0.32]} geometry="capsule" />
      <BodyMesh position={[-0.26, -0.75, 0]} scale={[0.28, 0.55, 0.26]} geometry="capsule" />
      <BodyMesh position={[-0.26, -1.25, 0]} scale={[0.22, 0.4, 0.2]} />
      {/* Left Foot */}
      <BodyMesh position={[-0.26, -1.55, 0.05]} scale={[0.18, 0.15, 0.28]} />
      {/* Right Leg */}
      <BodyMesh position={[0.26, -0.2, 0]} scale={[0.35, 0.55, 0.32]} geometry="capsule" />
      <BodyMesh position={[0.26, -0.75, 0]} scale={[0.28, 0.55, 0.26]} geometry="capsule" />
      <BodyMesh position={[0.26, -1.25, 0]} scale={[0.22, 0.4, 0.2]} />
      {/* Right Foot */}
      <BodyMesh position={[0.26, -1.55, 0.05]} scale={[0.18, 0.15, 0.28]} />
      {/* Orta Beden/Omurga Core Enerji Teli Gösterimi */}
      <lineSegments position={[0, 1.0, 0.1]}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={
              new Float32Array([
                0,
                0.8,
                -0.1, // Neck center
                0,
                -1.2,
                -0.1, // Crotch / bottom core
              ])
            }
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#00ffff" transparent opacity={0.6} />
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

// Tasarımı Futüristik Veri Penceresine (Terminal UI) Dönüştürüldü
const MeasurementLabel = ({ value, label, className }: { value?: number | null; label: string; className: string }) => {
  if (!value) return null;
  return (
    <div
      className={`absolute flex items-center gap-1.5 backdrop-blur-xl bg-slate-900/60 border-l-[3px] border-cyan-400 text-xs px-2.5 py-1 rounded shadow-[0_0_10px_rgba(34,211,238,0.2)] text-cyan-100 font-bold uppercase tracking-wide pointer-events-none transform hover:scale-105 transition-all ${className}`}
    >
      <span className="text-cyan-400 font-mono text-[9px] w-2 h-2 rounded-full border border-cyan-400 mr-0.5 animate-ping" />
      {label} <span className="opacity-40">|</span> <span className="text-white text-sm">{value}</span>
      <span className="text-[9px] text-cyan-500 font-mono ml-0.5 lowercase">cm</span>
    </div>
  );
};

const RealisticBodyAvatar = ({ waistScale = 1.0, measurements }: RealisticBodyAvatarProps) => {
  return (
    // Arkasındaki ızgara (Grid) / Teknoloji hissini verecek Arka Plan UI Elementi eklendi.
    <div className="w-full h-[600px] relative bg-[#060e14] bg-[linear-gradient(rgba(34,211,238,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.05)_1px,transparent_1px)] bg-[size:15px_15px] border border-cyan-900/40 rounded-3xl overflow-hidden inner-shadow">
      <div className="absolute top-4 left-5 flex flex-col pointer-events-none z-10">
        <h3 className="text-[10px] text-cyan-500 font-black tracking-[0.2em] uppercase leading-none mb-1">
          Volumetrik
        </h3>
        <span className="text-white text-sm uppercase tracking-widest border-b border-cyan-800 pb-1">
          Vücut Analizi
        </span>
      </div>

      <Canvas camera={{ position: [0, 0.3, 16], fov: 20 }}>
        {/* Lights - Cilt dokusu ışıkları (warm) iptal edildi; Siber Tarama ışıkları eklendi */}
        <ambientLight intensity={0.5} color="#052031" />
        <directionalLight position={[2, 5, 2]} intensity={2.0} color="#06b6d4" /> {/* Core Cyan Spotlight */}
        <directionalLight position={[-4, 2, -2]} intensity={1.5} color="#0055ff" /> {/* Deep Blue Backlight */}
        <pointLight position={[0, -1, 3]} intensity={2.0} color="#ff0044" /> {/* Zeminden vuran alt uyarı ısığı */}
        <HumanBody waistScale={waistScale} />
        <OrbitControls
          enableZoom={true}
          maxDistance={10}
          minDistance={5}
          enablePan={false}
          minPolarAngle={Math.PI / 4} // Üstten aşırı kamerayı kesmek için ayarladık
          maxPolarAngle={Math.PI / 1.5}
          autoRotate={false}
        />
      </Canvas>

      {/* Cyber/Digital Measurement Labels - Konumlandırmalar dinamik alana oturtuldu */}
      {measurements && (
        <div className="absolute inset-0 pointer-events-none">
          <MeasurementLabel value={measurements.shoulder} label="OMUZ Çapı" className="top-[22%] right-4" />
          <MeasurementLabel value={measurements.chest} label="Göğüs" className="top-[33%] right-8" />
          <MeasurementLabel value={measurements.waist} label="Core/Bel" className="top-[45%] right-8" />
          <MeasurementLabel value={measurements.hips} label="Pelvıs/Kalça" className="top-[55%] right-6" />
          <MeasurementLabel value={measurements.neck} label="C-OMURGA" className="top-[14%] left-4" />
          <MeasurementLabel value={measurements.arm} label="Brakiyal" className="top-[35%] left-2" />
          <MeasurementLabel value={measurements.thigh} label="Kuadriseps" className="bottom-[22%] left-6" />
        </div>
      )}

      {/* Üst Vinyet Gölgelemesi Taramaları Yüzünden Aydınlatma Hatası Yok Etmek İçin Efekt Girdi  */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]" />

      {/* Cyber HUD Damage Radar / Risk Göstergesi Tesisatı Alt Çubuk*/}
      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between pointer-events-none border-t border-cyan-800/30 pt-2">
        <div className="flex items-center gap-2 bg-rose-900/20 px-3 py-1.5 rounded-lg border border-rose-900/50 backdrop-blur-md">
          <div className="relative">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 absolute inset-0 animate-ping opacity-60" />
            <div className="w-2.5 h-2.5 rounded-full bg-rose-600 relative z-10" />
          </div>
          <span className="text-rose-400 text-[10px] font-bold uppercase tracking-wider mt-px">
            Hedef: Metabolik Stres Aktif
          </span>
        </div>

        <div className="text-[9px] text-cyan-600 font-mono flex gap-3 text-right">
          <div>
            AXIS <br />
            <span className="text-cyan-400">Y-STAB</span>
          </div>
          <div>
            DIAGNOSTIC
            <br />
            <span className="text-cyan-400">100% ONLINE</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealisticBodyAvatar;
