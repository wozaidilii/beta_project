"use client";

import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import type { Group } from "three";

import {
  calculateBuild,
  categoryMeta,
  type CategoryId,
  type PartSelection,
} from "~/lib/catalog";

type PcSceneProps = {
  selection: PartSelection;
  activeCategory: CategoryId;
};

const activePositions: Record<CategoryId, [number, number, number]> = {
  cpu: [-0.42, 0.38, -0.65],
  motherboard: [-0.34, 0.08, -0.72],
  gpu: [0.14, -0.52, -0.2],
  memory: [-0.08, 0.36, -0.54],
  storage: [-0.82, -0.38, -0.51],
  cooling: [-0.42, 0.38, -0.46],
  psu: [0.45, -1.33, -0.32],
  case: [0, 0, 0],
  fans: [1.28, 0.18, 0.14],
};

export function PcScene({ selection, activeCategory }: PcSceneProps) {
  const summary = useMemo(() => calculateBuild(selection), [selection]);

  return (
    <Canvas
      camera={{ position: [5.4, 2.7, 7.2], fov: 48 }}
      dpr={[1, 1.8]}
      gl={{ antialias: true, alpha: true }}
      shadows
    >
      <Suspense fallback={null}>
        <color attach="background" args={["#17191c"]} />
        <ambientLight intensity={0.62} />
        <spotLight
          angle={0.42}
          castShadow
          color="#ffffff"
          intensity={42}
          penumbra={0.45}
          position={[2.8, 4.8, 3.2]}
        />
        <pointLight color={categoryMeta[activeCategory].tone} intensity={5.5} position={[1.8, 1.4, 1.8]} />
        <PcRig activeCategory={activeCategory} selection={selection} />
        <ActiveMarker category={activeCategory} />
        <Bench totalPrice={summary.totalPrice} />
        <ContactShadows
          blur={2.6}
          far={9}
          opacity={0.36}
          position={[0, -2.12, 0]}
          scale={7}
        />
        <Environment preset="city" />
        <OrbitControls
          autoRotate
          autoRotateSpeed={0.28}
          enableDamping
          enablePan={false}
          maxDistance={8}
          maxPolarAngle={Math.PI / 2.05}
          minDistance={4.2}
          minPolarAngle={Math.PI / 5}
          target={[0, -0.08, 0]}
        />
      </Suspense>
    </Canvas>
  );
}

function PcRig({
  activeCategory,
  selection,
}: {
  activeCategory: CategoryId;
  selection: PartSelection;
}) {
  const group = useRef<Group>(null);
  const summary = useMemo(() => calculateBuild(selection), [selection]);
  const part = summary.selectedParts;
  const tone = categoryMeta[activeCategory].tone;

  useFrame((_, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.04;
  });

  return (
    <group ref={group} rotation={[0, -0.48, 0]} position={[0, -0.08, 0]} scale={0.78}>
      <CaseShell
        color={part.case?.color ?? "#d1d5db"}
        highlighted={activeCategory === "case"}
        tone={tone}
      />
      <Motherboard
        color={part.motherboard?.color ?? "#111827"}
        highlighted={activeCategory === "motherboard"}
        tone={tone}
      />
      <CpuBlock
        color={part.cpu?.color ?? "#ef4444"}
        highlighted={activeCategory === "cpu"}
        tone={tone}
      />
      <Cooler
        color={part.cooling?.color ?? "#94a3b8"}
        highlighted={activeCategory === "cooling"}
        tone={tone}
        radiator={Boolean(part.cooling?.radiatorMm)}
      />
      <GpuCard
        color={part.gpu?.color ?? "#76b900"}
        highlighted={activeCategory === "gpu"}
        tone={tone}
        length={part.gpu?.lengthMm ?? 300}
      />
      <MemorySticks
        color={part.memory?.color ?? "#f59e0b"}
        highlighted={activeCategory === "memory"}
        tone={tone}
      />
      <Storage
        color={part.storage?.color ?? "#2563eb"}
        highlighted={activeCategory === "storage"}
        tone={tone}
      />
      <PowerSupply
        color={part.psu?.color ?? "#f59e0b"}
        highlighted={activeCategory === "psu"}
        tone={tone}
      />
      <FanBank
        color={part.fans?.color ?? "#ec4899"}
        highlighted={activeCategory === "fans"}
        tone={tone}
      />
      <CableRuns tone={tone} />
    </group>
  );
}

function CaseShell({
  color,
  highlighted,
  tone,
}: {
  color: string;
  highlighted: boolean;
  tone: string;
}) {
  const emissive = highlighted ? tone : "#000000";

  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0, -0.82]}>
        <boxGeometry args={[3.08, 3.78, 0.12]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={highlighted ? 0.18 : 0} metalness={0.5} roughness={0.48} />
      </mesh>
      <mesh castShadow position={[-1.58, 0, 0]}>
        <boxGeometry args={[0.12, 3.78, 1.74]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={highlighted ? 0.18 : 0} metalness={0.45} roughness={0.48} />
      </mesh>
      <mesh castShadow position={[1.58, 0, 0]}>
        <boxGeometry args={[0.12, 3.78, 1.74]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={highlighted ? 0.18 : 0}
          metalness={0.45}
          opacity={0.16}
          roughness={0.48}
          transparent
        />
      </mesh>
      <mesh castShadow position={[0, 1.92, 0]}>
        <boxGeometry args={[3.08, 0.12, 1.74]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={highlighted ? 0.18 : 0} metalness={0.45} roughness={0.48} />
      </mesh>
      <mesh castShadow position={[0, -1.92, 0]}>
        <boxGeometry args={[3.08, 0.12, 1.74]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={highlighted ? 0.18 : 0} metalness={0.45} roughness={0.48} />
      </mesh>
      <mesh position={[0, 0, 0.88]}>
        <boxGeometry args={[2.82, 3.48, 0.035]} />
        <meshPhysicalMaterial
          color="#dbeafe"
          opacity={0.17}
          roughness={0.08}
          metalness={0}
          transmission={0.4}
          transparent
        />
      </mesh>
      <mesh position={[0, 0, 0.92]}>
        <boxGeometry args={[2.94, 3.6, 0.025]} />
        <meshStandardMaterial color={tone} opacity={highlighted ? 0.32 : 0.1} transparent />
      </mesh>
    </group>
  );
}

function Motherboard({
  color,
  highlighted,
  tone,
}: {
  color: string;
  highlighted: boolean;
  tone: string;
}) {
  return (
    <group position={[-0.36, 0.08, -0.7]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.55, 2.15, 0.08]} />
        <meshStandardMaterial color={color} emissive={tone} emissiveIntensity={highlighted ? 0.22 : 0.02} metalness={0.25} roughness={0.52} />
      </mesh>
      {[-0.56, -0.18, 0.2, 0.56].map((x) => (
        <mesh key={x} position={[x, -0.86, 0.07]}>
          <boxGeometry args={[0.24, 0.12, 0.05]} />
          <meshStandardMaterial color="#334155" metalness={0.45} roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[0.52, 0.7, 0.07]}>
        <boxGeometry args={[0.32, 0.22, 0.08]} />
        <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.32} />
      </mesh>
    </group>
  );
}

function CpuBlock({
  color,
  highlighted,
  tone,
}: {
  color: string;
  highlighted: boolean;
  tone: string;
}) {
  return (
    <group position={[-0.42, 0.38, -0.61]}>
      <mesh castShadow>
        <boxGeometry args={[0.5, 0.5, 0.11]} />
        <meshStandardMaterial color="#d6d3d1" emissive={tone} emissiveIntensity={highlighted ? 0.35 : 0.03} metalness={0.75} roughness={0.22} />
      </mesh>
      <mesh position={[0, 0, 0.08]}>
        <boxGeometry args={[0.34, 0.34, 0.03]} />
        <meshStandardMaterial color={color} emissive={tone} emissiveIntensity={highlighted ? 0.28 : 0} />
      </mesh>
    </group>
  );
}

function Cooler({
  color,
  highlighted,
  radiator,
  tone,
}: {
  color: string;
  highlighted: boolean;
  radiator: boolean;
  tone: string;
}) {
  if (radiator) {
    return (
      <group>
        <mesh castShadow position={[0, 1.56, -0.15]}>
          <boxGeometry args={[1.74, 0.22, 0.42]} />
          <meshStandardMaterial color={color} emissive={tone} emissiveIntensity={highlighted ? 0.28 : 0.02} metalness={0.45} roughness={0.36} />
        </mesh>
        <FanRotor color={tone} highlighted={highlighted} position={[-0.45, 1.57, 0.1]} scale={0.58} />
        <FanRotor color={tone} highlighted={highlighted} position={[0.45, 1.57, 0.1]} scale={0.58} />
        <mesh castShadow position={[-0.42, 0.38, -0.42]}>
          <cylinderGeometry args={[0.28, 0.28, 0.18, 48]} />
          <meshStandardMaterial color={color} emissive={tone} emissiveIntensity={highlighted ? 0.3 : 0.04} metalness={0.65} roughness={0.24} />
        </mesh>
      </group>
    );
  }

  return (
    <group position={[-0.42, 0.38, -0.42]}>
      <mesh castShadow>
        <boxGeometry args={[0.74, 0.74, 0.48]} />
        <meshStandardMaterial color={color} emissive={tone} emissiveIntensity={highlighted ? 0.3 : 0.03} metalness={0.55} roughness={0.4} />
      </mesh>
      {[-0.24, -0.08, 0.08, 0.24].map((x) => (
        <mesh key={x} position={[x, 0, 0.28]}>
          <boxGeometry args={[0.05, 0.78, 0.06]} />
          <meshStandardMaterial color="#f8fafc" metalness={0.7} roughness={0.32} />
        </mesh>
      ))}
    </group>
  );
}

function GpuCard({
  color,
  highlighted,
  length,
  tone,
}: {
  color: string;
  highlighted: boolean;
  length: number;
  tone: string;
}) {
  const cardLength = Math.min(Math.max(length / 190, 1.24), 1.9);

  return (
    <group position={[0.18, -0.52, -0.2]}>
      <mesh castShadow>
        <boxGeometry args={[cardLength, 0.34, 0.58]} />
        <meshStandardMaterial color={color} emissive={tone} emissiveIntensity={highlighted ? 0.34 : 0.05} metalness={0.32} roughness={0.44} />
      </mesh>
      <FanRotor color="#111827" highlighted={highlighted} position={[-0.36, 0.03, 0.32]} scale={0.42} />
      <FanRotor color="#111827" highlighted={highlighted} position={[0.32, 0.03, 0.32]} scale={0.42} />
      <mesh position={[-cardLength / 2 - 0.06, -0.01, 0]}>
        <boxGeometry args={[0.08, 0.46, 0.68]} />
        <meshStandardMaterial color="#e5e7eb" metalness={0.72} roughness={0.28} />
      </mesh>
    </group>
  );
}

function MemorySticks({
  color,
  highlighted,
  tone,
}: {
  color: string;
  highlighted: boolean;
  tone: string;
}) {
  return (
    <group position={[-0.06, 0.36, -0.5]}>
      {[-0.08, 0.1].map((x) => (
        <mesh key={x} castShadow position={[x, 0, 0]}>
          <boxGeometry args={[0.055, 0.86, 0.18]} />
          <meshStandardMaterial color={color} emissive={tone} emissiveIntensity={highlighted ? 0.34 : 0.04} metalness={0.35} roughness={0.42} />
        </mesh>
      ))}
    </group>
  );
}

function Storage({
  color,
  highlighted,
  tone,
}: {
  color: string;
  highlighted: boolean;
  tone: string;
}) {
  return (
    <group position={[-0.82, -0.38, -0.5]} rotation={[0, 0, -0.08]}>
      <mesh castShadow>
        <boxGeometry args={[0.18, 0.88, 0.06]} />
        <meshStandardMaterial color={color} emissive={tone} emissiveIntensity={highlighted ? 0.38 : 0.04} metalness={0.45} roughness={0.36} />
      </mesh>
      <mesh position={[0, 0.26, 0.06]}>
        <boxGeometry args={[0.14, 0.16, 0.04]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.4} roughness={0.34} />
      </mesh>
    </group>
  );
}

function PowerSupply({
  color,
  highlighted,
  tone,
}: {
  color: string;
  highlighted: boolean;
  tone: string;
}) {
  return (
    <group position={[0.45, -1.34, -0.36]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.05, 0.58, 0.82]} />
        <meshStandardMaterial color={color} emissive={tone} emissiveIntensity={highlighted ? 0.24 : 0.03} metalness={0.55} roughness={0.42} />
      </mesh>
      <mesh position={[-0.22, 0.01, 0.43]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.19, 0.018, 12, 48]} />
        <meshStandardMaterial color="#e5e7eb" metalness={0.55} roughness={0.36} />
      </mesh>
    </group>
  );
}

function FanBank({
  color,
  highlighted,
  tone,
}: {
  color: string;
  highlighted: boolean;
  tone: string;
}) {
  return (
    <group>
      {[-0.76, 0, 0.76].map((y) => (
        <FanRotor
          key={y}
          color={highlighted ? tone : color}
          highlighted={highlighted}
          position={[1.48, y, 0.14]}
          scale={0.48}
        />
      ))}
    </group>
  );
}

function FanRotor({
  color,
  highlighted,
  position,
  scale,
}: {
  color: string;
  highlighted: boolean;
  position: [number, number, number];
  scale: number;
}) {
  const rotor = useRef<Group>(null);

  useFrame((_, delta) => {
    if (!rotor.current) return;
    rotor.current.rotation.z += delta * (highlighted ? 5.8 : 2.2);
  });

  return (
    <group position={position} scale={scale}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.44, 0.035, 16, 64]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={highlighted ? 0.22 : 0.03} metalness={0.3} roughness={0.34} />
      </mesh>
      <group ref={rotor}>
        <mesh>
          <boxGeometry args={[0.74, 0.055, 0.035]} />
          <meshStandardMaterial color="#e5e7eb" emissive={color} emissiveIntensity={highlighted ? 0.18 : 0} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.74, 0.055, 0.035]} />
          <meshStandardMaterial color="#e5e7eb" emissive={color} emissiveIntensity={highlighted ? 0.18 : 0} />
        </mesh>
      </group>
      <mesh>
        <cylinderGeometry args={[0.08, 0.08, 0.06, 32]} />
        <meshStandardMaterial color="#111827" metalness={0.4} roughness={0.36} />
      </mesh>
    </group>
  );
}

function CableRuns({ tone }: { tone: string }) {
  return (
    <group>
      <Cable position={[0.32, -0.08, -0.15]} scale={[1, 1.1, 1]} tone={tone} />
      <Cable position={[0.52, -0.82, -0.12]} scale={[0.82, 0.9, 1]} tone="#f59e0b" />
      <Cable position={[-0.96, -0.28, -0.2]} scale={[0.72, 0.72, 1]} tone="#06b6d4" />
    </group>
  );
}

function Cable({
  position,
  scale,
  tone,
}: {
  position: [number, number, number];
  scale: [number, number, number];
  tone: string;
}) {
  return (
    <mesh position={position} rotation={[0.28, 0.1, 0.72]} scale={scale}>
      <torusGeometry args={[0.48, 0.018, 10, 80, Math.PI * 1.18]} />
      <meshStandardMaterial color={tone} emissive={tone} emissiveIntensity={0.12} roughness={0.42} />
    </mesh>
  );
}

function ActiveMarker({ category }: { category: CategoryId }) {
  const marker = useRef<Group>(null);
  const tone = categoryMeta[category].tone;
  const position = activePositions[category];

  useFrame((state) => {
    if (!marker.current) return;
    marker.current.rotation.y = state.clock.elapsedTime * 0.8;
    marker.current.position.y =
      position[1] + Math.sin(state.clock.elapsedTime * 2.1) * 0.035;
  });

  return (
    <group ref={marker} position={position}>
      <mesh>
        <torusGeometry args={[0.34, 0.012, 12, 72]} />
        <meshStandardMaterial color={tone} emissive={tone} emissiveIntensity={0.75} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.22, 0.009, 12, 72]} />
        <meshStandardMaterial color="#ffffff" emissive={tone} emissiveIntensity={0.55} />
      </mesh>
    </group>
  );
}

function Bench({ totalPrice }: { totalPrice: number }) {
  const width = Math.min(2.6, Math.max(1.2, totalPrice / 7000));
  return (
    <group position={[0, -2.08, 0]}>
      <mesh receiveShadow>
        <boxGeometry args={[4.8, 0.08, 3.2]} />
        <meshStandardMaterial color="#23262b" roughness={0.65} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.052, 1.34]}>
        <boxGeometry args={[width, 0.016, 0.08]} />
        <meshStandardMaterial color="#14b8a6" emissive="#14b8a6" emissiveIntensity={0.35} />
      </mesh>
    </group>
  );
}
