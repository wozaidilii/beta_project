"use client";

import {
  ContactShadows,
  Environment,
  Html,
  OrbitControls,
  useGLTF,
} from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import { Box3, Vector3, type Group } from "three";

import {
  categoryMeta,
  type CategoryId,
  type PartSelection,
} from "~/lib/catalog";
import {
  getAssemblyPlacements,
  type AssemblyPlacement,
} from "~/lib/assembly-layout";

type PcSceneProps = {
  selection: PartSelection;
  activeCategory: CategoryId;
  debug?: boolean;
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

export function PcScene({ selection, activeCategory, debug = false }: PcSceneProps) {
  const activePosition = activePositions[activeCategory];
  const tone = categoryMeta[activeCategory].tone;

  return (
    <Canvas
      camera={{ position: [5.4, 2.7, 7.2], fov: 48 }}
      dpr={[1, 1.8]}
      gl={{ antialias: true, alpha: true }}
      shadows
    >
      <Suspense fallback={null}>
        <color attach="background" args={["#17191c"]} />
        <ambientLight intensity={0.68} />
        <spotLight
          angle={0.42}
          castShadow
          color="#ffffff"
          intensity={42}
          penumbra={0.45}
          position={[2.8, 4.8, 3.2]}
        />
        <pointLight color={tone} intensity={7} position={activePosition} />
        <PcRig debug={debug} selection={selection} />
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
  debug,
  selection,
}: {
  debug: boolean;
  selection: PartSelection;
}) {
  const group = useRef<Group>(null);
  const placements = useMemo(() => getAssemblyPlacements(selection), [selection]);

  useFrame((_, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.04;
  });

  return (
    <group ref={group} rotation={[0, -0.48, 0]} position={[0, -0.08, 0]} scale={0.78}>
      {Object.values(placements).map((placement) => (
        <GltfPart key={placement.part.id} placement={placement} />
      ))}
      {debug ? <DebugAssembly placements={Object.values(placements)} /> : null}
    </group>
  );
}

function GltfPart({ placement }: { placement: AssemblyPlacement }) {
  const model = placement.model;
  const gltf = useGLTF(model.assetUrl ?? "");
  const normalized = useMemo(() => {
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
      position={placement.position}
      rotation={placement.rotation}
      scale={normalized.scale}
    >
      <primitive object={normalized.clone} position={normalized.offset} />
    </group>
  );
}

function DebugAssembly({ placements }: { placements: AssemblyPlacement[] }) {
  return (
    <group>
      <axesHelper args={[0.85]} />
      {placements.map((placement) => (
        <group key={placement.part.id}>
          <group position={placement.position} rotation={placement.rotation}>
            <axesHelper args={[0.32]} />
            <mesh>
              <boxGeometry args={placement.fitSize} />
              <meshBasicMaterial
                color={categoryMeta[placement.category].tone}
                opacity={0.56}
                transparent
                wireframe
              />
            </mesh>
          </group>
          {Object.entries(placement.anchors).map(([name, anchor]) => (
            <group key={name} position={anchor.position}>
              <mesh>
                <sphereGeometry args={[0.035, 12, 12]} />
                <meshBasicMaterial color={categoryMeta[placement.category].tone} />
              </mesh>
              <Html center distanceFactor={8}>
                <span className="anchor-debug-label">
                  {categoryMeta[placement.category].shortLabel}.{anchor.label}
                </span>
              </Html>
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

function safeDivide(target: number, source: number) {
  return source === 0 ? 1 : target / source;
}
