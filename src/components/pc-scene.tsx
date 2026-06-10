"use client";

import {
  ContactShadows,
  Environment,
  OrbitControls,
  useGLTF,
} from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef, type ReactNode } from "react";
import { Box3, Vector3, type Group } from "three";

import {
  calculateBuild,
  categoryMeta,
  type CategoryId,
  type Part,
  type PartModel,
  type PartSelection,
} from "~/lib/catalog";
import {
  getAirCoolerSceneBox,
  getCaseSceneBox,
  getGpuSceneBox,
  getMotherboardSceneBox,
  getPsuSceneBox,
  getPumpSceneBox,
  getRadiatorSceneBox,
  type SceneBox,
} from "~/lib/model-layout";

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
  const caseBox = getCaseSceneBox(part.case);

  useFrame((_, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.04;
  });

  return (
    <group ref={group} rotation={[0, -0.48, 0]} position={[0, -0.08, 0]} scale={0.78}>
      <PartAsset part={part.case}>
        <CaseShell
          color={part.case?.color ?? "#d1d5db"}
          highlighted={activeCategory === "case"}
          size={caseBox}
          tone={tone}
        />
      </PartAsset>
      <PartAsset part={part.motherboard}>
        <Motherboard
          highlighted={activeCategory === "motherboard"}
          part={part.motherboard}
          tone={tone}
        />
      </PartAsset>
      <PartAsset part={part.cpu}>
        <CpuBlock
          color={part.cpu?.color ?? "#ef4444"}
          highlighted={activeCategory === "cpu"}
          tone={tone}
        />
      </PartAsset>
      <PartAsset part={part.cooling}>
        <Cooler
          highlighted={activeCategory === "cooling"}
          part={part.cooling}
          tone={tone}
        />
      </PartAsset>
      <PartAsset part={part.gpu}>
        <GpuCard
          highlighted={activeCategory === "gpu"}
          part={part.gpu}
          tone={tone}
        />
      </PartAsset>
      <PartAsset part={part.memory}>
        <MemorySticks
          color={part.memory?.color ?? "#f59e0b"}
          highlighted={activeCategory === "memory"}
          tone={tone}
        />
      </PartAsset>
      <Storage
        color={part.storage?.color ?? "#2563eb"}
        highlighted={activeCategory === "storage"}
        tone={tone}
      />
      <PartAsset part={part.psu}>
        <PowerSupply
          highlighted={activeCategory === "psu"}
          part={part.psu}
          tone={tone}
        />
      </PartAsset>
      <FanBank
        color={part.fans?.color ?? "#ec4899"}
        highlighted={activeCategory === "fans"}
        tone={tone}
      />
      <CableRuns tone={tone} />
    </group>
  );
}

function PartAsset({
  children,
  part,
}: {
  children: ReactNode;
  part?: Part;
}) {
  const model = part?.model;
  if (model?.kind !== "glb" || !model.assetUrl) return <>{children}</>;

  return (
    <Suspense fallback={children}>
      <GltfPart model={model} />
    </Suspense>
  );
}

function GltfPart({ model }: { model: PartModel }) {
  const gltf = useGLTF(model.assetUrl ?? "");
  const { clone, offset, scale } = useMemo(() => {
    const scene = gltf.scene.clone(true);
    scene.traverse((object) => {
      if ("isMesh" in object && object.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });

    const box = new Box3().setFromObject(scene);
    const size = new Vector3();
    const center = new Vector3();
    box.getSize(size);
    box.getCenter(center);

    const fitScale = model.fitSize
      ? new Vector3(
          safeDivide(model.fitSize[0], size.x),
          safeDivide(model.fitSize[1], size.y),
          safeDivide(model.fitSize[2], size.z),
        )
      : new Vector3(1, 1, 1);
    const userScale = Array.isArray(model.scale)
      ? new Vector3(model.scale[0], model.scale[1], model.scale[2])
      : new Vector3(model.scale ?? 1, model.scale ?? 1, model.scale ?? 1);
    const finalScale = fitScale.multiply(userScale);
    const localOffset =
      model.autoCenter === false
        ? new Vector3(0, 0, 0)
        : center.clone().multiplyScalar(-1);

    return {
      clone: scene,
      offset: localOffset,
      scale: finalScale,
    };
  }, [gltf.scene, model]);

  return (
    <group
      position={model.position ?? [0, 0, 0]}
      rotation={model.rotation ?? [0, 0, 0]}
      scale={scale}
    >
      <primitive object={clone} position={offset} />
    </group>
  );
}

function safeDivide(target: number, source: number) {
  return source === 0 ? 1 : target / source;
}

function CaseShell({
  color,
  highlighted,
  size,
  tone,
}: {
  color: string;
  highlighted: boolean;
  size: SceneBox;
  tone: string;
}) {
  const emissive = highlighted ? tone : "#000000";
  const panel = 0.12;
  const glassWidth = Math.max(0.2, size.width - 0.26);
  const glassHeight = Math.max(0.2, size.height - 0.3);

  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0, -size.depth / 2]}>
        <boxGeometry args={[size.width, size.height, panel]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={highlighted ? 0.18 : 0} metalness={0.5} roughness={0.48} />
      </mesh>
      <mesh castShadow position={[-size.width / 2, 0, 0]}>
        <boxGeometry args={[panel, size.height, size.depth]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={highlighted ? 0.18 : 0} metalness={0.45} roughness={0.48} />
      </mesh>
      <mesh castShadow position={[size.width / 2, 0, 0]}>
        <boxGeometry args={[panel, size.height, size.depth]} />
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
      <mesh castShadow position={[0, size.height / 2, 0]}>
        <boxGeometry args={[size.width, panel, size.depth]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={highlighted ? 0.18 : 0} metalness={0.45} roughness={0.48} />
      </mesh>
      <mesh castShadow position={[0, -size.height / 2, 0]}>
        <boxGeometry args={[size.width, panel, size.depth]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={highlighted ? 0.18 : 0} metalness={0.45} roughness={0.48} />
      </mesh>
      <mesh position={[0, 0, size.depth / 2 + 0.01]}>
        <boxGeometry args={[glassWidth, glassHeight, 0.035]} />
        <meshPhysicalMaterial
          color="#dbeafe"
          opacity={0.17}
          roughness={0.08}
          metalness={0}
          transmission={0.4}
          transparent
        />
      </mesh>
      <mesh position={[0, 0, size.depth / 2 + 0.05]}>
        <boxGeometry args={[Math.max(0.2, size.width - 0.14), Math.max(0.2, size.height - 0.18), 0.025]} />
        <meshStandardMaterial color={tone} opacity={highlighted ? 0.32 : 0.1} transparent />
      </mesh>
    </group>
  );
}

function Motherboard({
  highlighted,
  part,
  tone,
}: {
  highlighted: boolean;
  part?: Part;
  tone: string;
}) {
  const color = part?.color ?? "#111827";
  const size = getMotherboardSceneBox(part);
  const portY = size.height * 0.32;
  const slotY = -size.height * 0.4;

  return (
    <group position={[-0.36, 0.08, -0.7]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[size.width, size.height, size.depth]} />
        <meshStandardMaterial color={color} emissive={tone} emissiveIntensity={highlighted ? 0.22 : 0.02} metalness={0.25} roughness={0.52} />
      </mesh>
      {[-0.36, -0.12, 0.12, 0.36].map((ratio) => (
        <mesh key={ratio} position={[ratio * size.width, slotY, 0.07]}>
          <boxGeometry args={[size.width * 0.15, 0.12, 0.05]} />
          <meshStandardMaterial color="#334155" metalness={0.45} roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[size.width * 0.34, portY, 0.07]}>
        <boxGeometry args={[size.width * 0.2, 0.22, 0.08]} />
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
  highlighted,
  part,
  tone,
}: {
  highlighted: boolean;
  part?: Part;
  tone: string;
}) {
  const color = part?.color ?? "#94a3b8";
  const radiator = Boolean(part?.radiatorMm);

  if (radiator) {
    const radiatorSize = getRadiatorSceneBox(part);
    const pumpSize = getPumpSceneBox(part);
    const fanOffset = radiatorSize.width > 1.75 ? 0.48 : 0.36;

    return (
      <group>
        <mesh castShadow position={[0, 1.56, -0.15]}>
          <boxGeometry args={[radiatorSize.width, radiatorSize.height, radiatorSize.depth]} />
          <meshStandardMaterial color={color} emissive={tone} emissiveIntensity={highlighted ? 0.28 : 0.02} metalness={0.45} roughness={0.36} />
        </mesh>
        <FanRotor color={tone} highlighted={highlighted} position={[-fanOffset, 1.57, 0.1]} scale={0.58} />
        <FanRotor color={tone} highlighted={highlighted} position={[fanOffset, 1.57, 0.1]} scale={0.58} />
        {radiatorSize.width > 1.86 ? (
          <FanRotor color={tone} highlighted={highlighted} position={[0, 1.57, 0.1]} scale={0.58} />
        ) : null}
        <mesh castShadow position={[-0.42, 0.38, -0.42]}>
          <cylinderGeometry args={[pumpSize.width / 2, pumpSize.width / 2, pumpSize.height, 48]} />
          <meshStandardMaterial color={color} emissive={tone} emissiveIntensity={highlighted ? 0.3 : 0.04} metalness={0.65} roughness={0.24} />
        </mesh>
      </group>
    );
  }

  const towerSize = getAirCoolerSceneBox(part);

  return (
    <group position={[-0.42, 0.38, -0.42]}>
      <mesh castShadow>
        <boxGeometry args={[towerSize.width, towerSize.height, towerSize.depth]} />
        <meshStandardMaterial color={color} emissive={tone} emissiveIntensity={highlighted ? 0.3 : 0.03} metalness={0.55} roughness={0.4} />
      </mesh>
      {[-0.32, -0.11, 0.11, 0.32].map((ratio) => (
        <mesh key={ratio} position={[ratio * towerSize.width, 0, towerSize.depth / 2 + 0.04]}>
          <boxGeometry args={[0.05, towerSize.height * 1.05, 0.06]} />
          <meshStandardMaterial color="#f8fafc" metalness={0.7} roughness={0.32} />
        </mesh>
      ))}
    </group>
  );
}

function GpuCard({
  highlighted,
  part,
  tone,
}: {
  highlighted: boolean;
  part?: Part;
  tone: string;
}) {
  const color = part?.color ?? "#76b900";
  const size = getGpuSceneBox(part);
  const fanOffset = size.width > 1.45 ? 0.34 : 0.22;

  return (
    <group position={[0.18, -0.52, -0.2]}>
      <mesh castShadow>
        <boxGeometry args={[size.width, size.height, size.depth]} />
        <meshStandardMaterial color={color} emissive={tone} emissiveIntensity={highlighted ? 0.34 : 0.05} metalness={0.32} roughness={0.44} />
      </mesh>
      <FanRotor color="#111827" highlighted={highlighted} position={[-fanOffset, 0.03, size.depth / 2 + 0.03]} scale={0.42} />
      <FanRotor color="#111827" highlighted={highlighted} position={[fanOffset, 0.03, size.depth / 2 + 0.03]} scale={0.42} />
      {size.width > 1.7 ? (
        <FanRotor color="#111827" highlighted={highlighted} position={[0, 0.03, size.depth / 2 + 0.03]} scale={0.42} />
      ) : null}
      <mesh position={[-size.width / 2 - 0.06, -0.01, 0]}>
        <boxGeometry args={[0.08, size.height + 0.12, size.depth + 0.1]} />
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
  highlighted,
  part,
  tone,
}: {
  highlighted: boolean;
  part?: Part;
  tone: string;
}) {
  const color = part?.color ?? "#f59e0b";
  const size = getPsuSceneBox(part);

  return (
    <group position={[0.45, -1.34, -0.36]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[size.width, size.height, size.depth]} />
        <meshStandardMaterial color={color} emissive={tone} emissiveIntensity={highlighted ? 0.24 : 0.03} metalness={0.55} roughness={0.42} />
      </mesh>
      <mesh position={[-size.width * 0.2, 0.01, size.depth / 2 + 0.02]} rotation={[Math.PI / 2, 0, 0]}>
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
