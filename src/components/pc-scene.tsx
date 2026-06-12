"use client";

import {
  ContactShadows,
  Environment,
  Grid,
  Html,
  OrbitControls,
  TransformControls,
  useGLTF,
} from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Box3, DoubleSide, Vector3, type Group } from "three";
import type { TransformControls as TransformControlsImpl } from "three-stdlib";

import {
  categoryMeta,
  type CategoryId,
  type PartSelection,
  type Vec3,
} from "~/lib/catalog";
import {
  getAssemblyPlan,
  type AssemblyOptions,
  type AssemblyMountSlot,
  type AssemblyPlacement,
} from "~/lib/assembly-layout";

type PcSceneProps = {
  selection: PartSelection;
  activeCategory: CategoryId;
  assemblyOptions?: AssemblyOptions;
  debug?: boolean;
};

type DebugExportStatus = {
  kind: "idle" | "dirty" | "saving" | "saved" | "error";
  message: string;
};

type DebugModelPatch = {
  partId: string;
  partName: string;
  patch:
    | {
        type: "fallbackPosition";
        position: Vec3;
      }
    | {
        type: "anchorPoint";
        anchor: string;
        position: Vec3;
      }
    | {
        type: "rotation";
        rotation: Vec3;
      };
};

type FlipAxis = "x" | "y" | "z";
type RotationDirection = -1 | 1;
type NudgeDirection = "left" | "right" | "up" | "down" | "forward" | "back";

type DebugSlotTarget = {
  slot: AssemblyMountSlot;
  parent: AssemblyPlacement;
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
  fans: [0.84, 0.18, 0.14],
};

const cameraTarget: Vec3 = [0, -0.08, 0];
const rigPosition: Vec3 = [0, -0.08, 0];
const rigScale = 1.2;
const debugRigScale = 1.48;
const nudgeStep = 0.04;
const fastNudgeMultiplier = 5;
const rotationStep = Math.PI / 36;
const fastRotationMultiplier = 3;
export function PcScene({
  selection,
  activeCategory,
  assemblyOptions,
  debug = false,
}: PcSceneProps) {
  const activePosition = activePositions[activeCategory];
  const assemblyPlan = useMemo(
    () => getAssemblyPlan(selection, assemblyOptions),
    [assemblyOptions, selection],
  );
  const placementList = useMemo(
    () => assemblyPlan.instances.filter((instance) => instance.visible),
    [assemblyPlan.instances],
  );
  const debugSlotTargets = useMemo(
    () => getDebugSlotTargets(placementList),
    [placementList],
  );
  const [debugPositions, setDebugPositions] = useState<Record<string, Vec3>>({});
  const [debugRotations, setDebugRotations] = useState<Record<string, Vec3>>({});
  const [exportStatus, setExportStatus] = useState<DebugExportStatus>({
    kind: "idle",
    message: "",
  });
  const [isTransforming, setIsTransforming] = useState(false);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const tone = categoryMeta[activeCategory].tone;

  useEffect(() => {
    if (!debug) {
      setIsTransforming(false);
      setSelectedInstanceId(null);
      setDebugPositions({});
      setDebugRotations({});
      setExportStatus({ kind: "idle", message: "" });
      setSelectedSlotId(null);
      return;
    }

    setSelectedInstanceId(
      placementList.find(
        (placement) =>
          placement.instanceId ===
          assemblyPlan.instancesByCategory[activeCategory]?.instanceId,
      )?.instanceId ??
        placementList[0]?.instanceId ??
        null,
    );
    setSelectedSlotId(null);
  }, [activeCategory, assemblyPlan.instancesByCategory, debug, placementList]);

  const selectInstance = useCallback((instanceId: string) => {
    setSelectedInstanceId(instanceId);
    setSelectedSlotId(null);
  }, []);

  const selectSlot = useCallback((slotId: string) => {
    setSelectedSlotId(slotId);
    setSelectedInstanceId(null);
  }, []);

  useEffect(() => {
    setDebugPositions({});
    setDebugRotations({});
    setExportStatus({ kind: "idle", message: "" });
  }, [assemblyOptions, selection]);

  const movedCount = new Set([
    ...Object.keys(debugPositions),
    ...Object.keys(debugRotations),
  ]).size;

  const nudgeSelectedPart = useCallback(
    (direction: NudgeDirection, multiplier = 1) => {
      if (!selectedInstanceId) return;

      const placement = placementList.find(
        (item) => item.instanceId === selectedInstanceId,
      );
      if (!placement) return;

      const delta = getNudgeDelta(direction, multiplier);
      setDebugPositions((current) => {
        const base = current[selectedInstanceId] ?? placement.position;
        return {
          ...current,
          [selectedInstanceId]: roundVec(addVec(base, delta)),
        };
      });
      setExportStatus({ kind: "dirty", message: "有未导出的按键位移" });
    },
    [placementList, selectedInstanceId],
  );

  const rotateSelectedPart = useCallback(
    (axis: FlipAxis, direction: RotationDirection, multiplier = 1) => {
      if (!selectedInstanceId) return;

      const placement = placementList.find(
        (item) => item.instanceId === selectedInstanceId,
      );
      if (!placement) return;

      setDebugRotations((current) => {
        const base = current[selectedInstanceId] ?? placement.rotation;
        return {
          ...current,
          [selectedInstanceId]: rotateByStep(base, axis, direction, multiplier),
        };
      });
      setExportStatus({
        kind: "dirty",
        message: "有未导出的旋转校准",
      });
    },
    [placementList, selectedInstanceId],
  );

  useEffect(() => {
    if (!debug || !selectedInstanceId) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;

      const direction = getArrowNudgeDirection(event.key);
      if (direction) {
        event.preventDefault();
        nudgeSelectedPart(
          direction,
          event.shiftKey ? fastNudgeMultiplier : 1,
        );
        return;
      }

      const rotationShortcut = getRotationShortcut(event.key);
      if (!rotationShortcut) return;

      event.preventDefault();
      rotateSelectedPart(
        rotationShortcut.axis,
        rotationShortcut.direction,
        event.shiftKey ? fastRotationMultiplier : 1,
      );
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [debug, nudgeSelectedPart, rotateSelectedPart, selectedInstanceId]);

  return (
    <>
      <Canvas
        camera={{ position: [3.7, 2.05, 4.65], fov: 38 }}
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
          <WorkbenchGrid debug={debug} />
          <PcRig
            debugPositions={debugPositions}
            debugRotations={debugRotations}
            debug={debug}
            isTransforming={isTransforming}
            placements={placementList}
            selectedInstanceId={selectedInstanceId}
            selectedSlotId={selectedSlotId}
            setDebugPosition={(instanceId, position) => {
              setDebugPositions((current) => ({
                ...current,
                [instanceId]: roundVec(position),
              }));
              setExportStatus({ kind: "dirty", message: "有未导出的调试偏移" });
            }}
            setIsTransforming={setIsTransforming}
            setSelectedInstanceId={selectInstance}
            setSelectedSlotId={selectSlot}
          />
          <ContactShadows
            blur={2.6}
            far={9}
            opacity={0.36}
            position={[0, -2.28, 0]}
            scale={7.6}
          />
          <Environment preset="city" />
          <OrbitControls
            autoRotate={!debug}
            autoRotateSpeed={0.28}
            enabled={!isTransforming}
            enableDamping
            enablePan={false}
            enableRotate
            maxDistance={7.4}
            maxPolarAngle={Math.PI / 2.05}
            minDistance={2.25}
            minPolarAngle={Math.PI / 5}
            rotateSpeed={0.72}
            target={cameraTarget}
          />
        </Suspense>
      </Canvas>
      {debug ? (
        <DebugExportOverlay
          debugPositions={debugPositions}
          debugRotations={debugRotations}
          onFlip={(axis) => {
            if (!selectedInstanceId) return;

            const placement = placementList.find(
              (item) => item.instanceId === selectedInstanceId,
            );
            if (!placement) return;

            setDebugRotations((current) => ({
              ...current,
              [selectedInstanceId]: flipRotation(
                current[selectedInstanceId] ?? placement.rotation,
                axis,
              ),
            }));
            setExportStatus({ kind: "dirty", message: "有未导出的翻转配置" });
          }}
          movedCount={movedCount}
          onExport={async () => {
            await exportDebugModelConfig({
              debugPositions,
              debugRotations,
              placementList,
              setExportStatus,
            });
          }}
          onNudge={nudgeSelectedPart}
          onRotate={rotateSelectedPart}
          onSelect={selectInstance}
          onSelectSlot={selectSlot}
          placements={placementList}
          selectedInstanceId={selectedInstanceId}
          selectedSlotId={selectedSlotId}
          slotTargets={debugSlotTargets}
          status={exportStatus}
        />
      ) : null}
    </>
  );
}

function WorkbenchGrid({ debug }: { debug: boolean }) {
  return (
    <group position={[0, -2.34, 0]}>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.012, 0]}>
        <planeGeometry args={[8.4, 8.4]} />
        <meshStandardMaterial color="#070b0d" metalness={0.12} roughness={0.92} />
      </mesh>
      <Grid
        args={[8.4, 8.4]}
        cellColor={debug ? "#25414c" : "#1d3038"}
        cellSize={0.2}
        cellThickness={0.38}
        fadeDistance={6.8}
        fadeStrength={1.35}
        infiniteGrid={false}
        sectionColor={debug ? "#5eead4" : "#33515d"}
        sectionSize={0.8}
        sectionThickness={debug ? 1.15 : 0.78}
      />
    </group>
  );
}

function PcRig({
  debug,
  debugPositions,
  debugRotations,
  isTransforming,
  placements,
  selectedInstanceId,
  selectedSlotId,
  setDebugPosition,
  setIsTransforming,
  setSelectedInstanceId,
  setSelectedSlotId,
}: {
  debug: boolean;
  debugPositions: Record<string, Vec3>;
  debugRotations: Record<string, Vec3>;
  isTransforming: boolean;
  placements: AssemblyPlacement[];
  selectedInstanceId: string | null;
  selectedSlotId: string | null;
  setDebugPosition: (instanceId: string, position: Vec3) => void;
  setIsTransforming: (value: boolean) => void;
  setSelectedInstanceId: (instanceId: string) => void;
  setSelectedSlotId: (slotId: string) => void;
}) {
  const group = useRef<Group>(null);

  useFrame((_, delta) => {
    if (!group.current || debug || isTransforming) return;
    group.current.rotation.y += delta * 0.04;
  });

  return (
    <group
      ref={group}
      rotation={[0, -0.48, 0]}
      position={rigPosition}
      scale={debug ? debugRigScale : rigScale}
    >
      {Object.values(placements).map((placement) => (
        <ModelLoadBoundary
          key={placement.instanceId}
          assetUrl={placement.model.assetUrl}
        >
          <GltfPart
            debugPosition={debugPositions[placement.instanceId]}
            debugRotation={debugRotations[placement.instanceId]}
            debug={debug}
            isSelected={selectedInstanceId === placement.instanceId}
            onSelect={() => setSelectedInstanceId(placement.instanceId)}
            onTransformEnd={() => setIsTransforming(false)}
            onTransformMove={(position) =>
              setDebugPosition(placement.instanceId, position)
            }
            onTransformStart={() => setIsTransforming(true)}
            placement={placement}
          />
        </ModelLoadBoundary>
      ))}
      {debug ? (
        <DebugAssembly
          debugPositions={debugPositions}
          debugRotations={debugRotations}
          onSelect={setSelectedInstanceId}
          onSelectSlot={setSelectedSlotId}
          placements={Object.values(placements)}
          selectedInstanceId={selectedInstanceId}
          selectedSlotId={selectedSlotId}
        />
      ) : null}
    </group>
  );
}

class ModelLoadBoundary extends Component<
  { assetUrl: string; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(previousProps: { assetUrl: string }) {
    if (previousProps.assetUrl !== this.props.assetUrl && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

function GltfPart({
  debug,
  debugPosition,
  debugRotation,
  isSelected,
  onSelect,
  onTransformEnd,
  onTransformMove,
  onTransformStart,
  placement,
}: {
  debug: boolean;
  debugPosition?: Vec3;
  debugRotation?: Vec3;
  isSelected: boolean;
  onSelect: () => void;
  onTransformEnd: () => void;
  onTransformMove: (position: Vec3) => void;
  onTransformStart: () => void;
  placement: AssemblyPlacement;
}) {
  const model = placement.model;
  const transformControls = useRef<TransformControlsImpl | null>(null);
  const currentPosition = debugPosition ?? placement.position;
  const currentRotation = debugRotation ?? placement.rotation;
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

    const fitScale = getFitScale(model.fitSize, size, model.fitMode);
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

  const handleSelect = debug
    ? (event: { stopPropagation: () => void }) => {
        event.stopPropagation();
        onSelect();
      }
    : undefined;

  if (debug && isSelected) {
    return (
      <TransformControls
        ref={transformControls}
        mode="translate"
        onObjectChange={() => {
          const position = getTransformObjectPosition(transformControls.current);
          if (position) onTransformMove(vectorToVec3(position));
        }}
        onMouseDown={onTransformStart}
        onMouseUp={() => {
          const position = getTransformObjectPosition(transformControls.current);
          if (position) onTransformMove(vectorToVec3(position));
          onTransformEnd();
        }}
        onPointerDown={handleSelect}
        position={currentPosition}
        rotation={currentRotation}
        scale={normalized.scale}
        showX
        showY
        showZ
        size={0.92}
        space="local"
      >
        <primitive object={normalized.clone} position={normalized.offset} />
      </TransformControls>
    );
  }

  return (
    <group
      onPointerDown={handleSelect}
      position={currentPosition}
      rotation={currentRotation}
      scale={normalized.scale}
    >
      <primitive object={normalized.clone} position={normalized.offset} />
    </group>
  );
}

function DebugAssembly({
  debugPositions,
  debugRotations,
  onSelect,
  onSelectSlot,
  placements,
  selectedInstanceId,
  selectedSlotId,
}: {
  debugPositions: Record<string, Vec3>;
  debugRotations: Record<string, Vec3>;
  onSelect: (instanceId: string) => void;
  onSelectSlot: (slotId: string) => void;
  placements: AssemblyPlacement[];
  selectedInstanceId: string | null;
  selectedSlotId: string | null;
}) {
  return (
    <group>
      <axesHelper args={[0.85]} />
      {placements.map((placement) => {
        const currentPosition =
          debugPositions[placement.instanceId] ?? placement.position;
        const currentRotation =
          debugRotations[placement.instanceId] ?? placement.rotation;

        return (
        <group key={placement.instanceId}>
          <group position={currentPosition} rotation={currentRotation}>
            <axesHelper args={[0.32]} />
            <mesh
              onPointerDown={(event) => {
                event.stopPropagation();
                onSelect(placement.instanceId);
              }}
            >
              <boxGeometry args={placement.fitSize} />
              <meshBasicMaterial
                color="#ffffff"
                depthWrite={false}
                opacity={0.035}
                side={DoubleSide}
                transparent
              />
            </mesh>
            <mesh>
              <boxGeometry args={placement.fitSize} />
              <meshBasicMaterial
                color={
                  selectedInstanceId === placement.instanceId
                    ? "#fbbf24"
                    : categoryMeta[placement.category].tone
                }
                opacity={selectedInstanceId === placement.instanceId ? 0.86 : 0.56}
                transparent
                wireframe
              />
            </mesh>
          </group>
          {Object.entries(placement.model.anchorPoints ?? {}).map(([name, anchor]) => (
            <group key={name} position={addVec(currentPosition, anchor.position)}>
              <mesh>
                <sphereGeometry args={[0.035, 12, 12]} />
                <meshBasicMaterial color={categoryMeta[placement.category].tone} />
              </mesh>
              <Html center distanceFactor={8} pointerEvents="none">
                <span className="anchor-debug-label">
                  {categoryMeta[placement.category].shortLabel}.{anchor.label}
                </span>
              </Html>
            </group>
          ))}
          {placement.mountSlots.map((slot) => {
            const anchor = placement.model.anchorPoints?.[slot.anchor];
            const slotPosition = anchor
              ? addVec(currentPosition, anchor.position)
              : currentPosition;
            const isSelectedSlot = selectedSlotId === slot.id;

            return (
              <group key={slot.id} position={slotPosition}>
                <mesh
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    onSelectSlot(slot.id);
                  }}
                >
                  <boxGeometry
                    args={isSelectedSlot ? [0.1, 0.1, 0.1] : [0.06, 0.06, 0.06]}
                  />
                  <meshBasicMaterial
                    color={
                      isSelectedSlot
                        ? "#fbbf24"
                        : slot.anchorResolved
                          ? "#5eead4"
                          : "#ff8a78"
                    }
                    opacity={isSelectedSlot ? 1 : 0.82}
                    transparent
                  />
                </mesh>
                <Html center distanceFactor={7} pointerEvents="none">
                  <span
                    className={`anchor-debug-label ${
                      isSelectedSlot ? "is-selected" : ""
                    }`}
                  >
                    {slot.kind}.{slot.label}
                  </span>
                </Html>
              </group>
            );
          })}
        </group>
        );
      })}
    </group>
  );
}

function safeDivide(target: number, source: number) {
  return source === 0 ? 1 : target / source;
}

function getDebugSlotTargets(placements: AssemblyPlacement[]): DebugSlotTarget[] {
  return placements.flatMap((placement) =>
    placement.mountSlots.map((slot) => ({
      parent: placement,
      slot,
    })),
  );
}

function getDebugInstanceBadge(placement: AssemblyPlacement) {
  if (placement.role === "aio-radiator") return "冷排";
  if (placement.role === "aio-pump") return "泵头";
  if (placement.category === "fans") return "风扇";
  return categoryMeta[placement.category].shortLabel;
}

function DebugExportOverlay({
  debugPositions,
  debugRotations,
  movedCount,
  onFlip,
  onExport,
  onNudge,
  onRotate,
  onSelect,
  onSelectSlot,
  placements,
  selectedInstanceId,
  selectedSlotId,
  slotTargets,
  status,
}: {
  debugPositions: Record<string, Vec3>;
  debugRotations: Record<string, Vec3>;
  movedCount: number;
  onFlip: (axis: FlipAxis) => void;
  onExport: () => Promise<void>;
  onNudge: (direction: NudgeDirection, multiplier?: number) => void;
  onRotate: (
    axis: FlipAxis,
    direction: RotationDirection,
    multiplier?: number,
  ) => void;
  onSelect: (instanceId: string) => void;
  onSelectSlot: (slotId: string) => void;
  placements: AssemblyPlacement[];
  selectedInstanceId: string | null;
  selectedSlotId: string | null;
  slotTargets: DebugSlotTarget[];
  status: DebugExportStatus;
}) {
  const disabled = movedCount === 0 || status.kind === "saving";
  const selectedPlacement = placements.find(
    (placement) => placement.instanceId === selectedInstanceId,
  );
  const selectedSlot = slotTargets.find((target) => target.slot.id === selectedSlotId);
  const selectedTitle =
    selectedPlacement?.part.name ??
    (selectedSlot ? `安装位：${selectedSlot.slot.label}` : "未选中");
  const selectedTransform = selectedPlacement
    ? {
        position:
          debugPositions[selectedPlacement.instanceId] ?? selectedPlacement.position,
        rotation:
          debugRotations[selectedPlacement.instanceId] ?? selectedPlacement.rotation,
      }
    : undefined;

  return (
    <div className="scene-debug-tools" data-debug-overlay="true">
      <div className="scene-debug-tools__header">
        <span>调试目标</span>
        <strong>{selectedTitle}</strong>
        {selectedSlot ? (
          <small>
            {selectedSlot.parent.part.name} · {selectedSlot.slot.kind}
          </small>
        ) : null}
      </div>
        <div className="scene-debug-tools__guide">
          <strong>风扇校准流程</strong>
          <span>从下方列表选中风扇，不依赖点选模型。</span>
          <span>先用 X/Y/Z 旋转让风扇框对齐机箱安装位，再用方向键微调位置。</span>
          <span>确认 bbox、anchor 和 slot 标签重合后，导出资产校准 patch。</span>
        </div>
        {selectedTransform ? (
          <div className="scene-debug-tools__readout">
            <span>当前读数</span>
            <code>pos {formatVec(selectedTransform.position)}</code>
            <code>rot {formatRotationDegrees(selectedTransform.rotation)}</code>
            <small>导出写回使用弧度；界面显示角度便于人工判断。</small>
          </div>
        ) : null}
        <div className="scene-debug-tools__section">
          <span>部件实例</span>
          <div className="scene-debug-tools__list">
            {placements.map((placement) => (
              <button
                aria-pressed={placement.instanceId === selectedInstanceId}
                className={`scene-debug-part ${
                  placement.instanceId === selectedInstanceId ? "is-selected" : ""
                }`}
                data-debug-instance-id={placement.instanceId}
                key={placement.instanceId}
                onClick={() => onSelect(placement.instanceId)}
                type="button"
              >
                <span>{getDebugInstanceBadge(placement)}</span>
                <strong>{placement.part.name}</strong>
              </button>
            ))}
          </div>
        </div>
        <div className="scene-debug-tools__section">
          <span>机箱安装位</span>
          <div className="scene-debug-tools__slot-list">
            {slotTargets.map(({ parent, slot }) => (
              <button
                aria-pressed={slot.id === selectedSlotId}
                className={`scene-debug-slot ${
                  slot.id === selectedSlotId ? "is-selected" : ""
                }`}
                data-debug-slot-id={slot.id}
                key={`${parent.instanceId}:${slot.id}`}
                onClick={() => onSelectSlot(slot.id)}
                type="button"
              >
                <span>{slot.kind}</span>
                <strong>{slot.label}</strong>
                <small>{parent.part.name}</small>
              </button>
            ))}
          </div>
        </div>
        <div className="scene-debug-tools__flip">
          <span>翻转</span>
          {(["x", "y", "z"] as const).map((axis) => (
            <button
              disabled={!selectedInstanceId}
              key={axis}
              onClick={() => onFlip(axis)}
              type="button"
            >
              {axis.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="scene-debug-tools__rotate">
          <span>旋转微调</span>
          {(["x", "y", "z"] as const).map((axis) => (
            <div key={axis}>
              <button
                disabled={!selectedInstanceId}
                onClick={() => onRotate(axis, -1)}
                type="button"
              >
                {axis.toUpperCase()} -5°
              </button>
              <button
                disabled={!selectedInstanceId}
                onClick={() => onRotate(axis, 1)}
                type="button"
              >
                {axis.toUpperCase()} +5°
              </button>
            </div>
          ))}
          <small>[ ] 调 X，; &apos; 调 Y，, . 调 Z，Shift 加速</small>
        </div>
        <div className="scene-debug-tools__nudge">
          <span>部件位移</span>
          <button
            aria-label="向上移动"
            className="is-up"
            disabled={!selectedInstanceId}
            onClick={() => onNudge("up")}
            type="button"
          >
            ↑
          </button>
          <button
            aria-label="向左移动"
            className="is-left"
            disabled={!selectedInstanceId}
            onClick={() => onNudge("left")}
            type="button"
          >
            ←
          </button>
          <button
            aria-label="向右移动"
            className="is-right"
            disabled={!selectedInstanceId}
            onClick={() => onNudge("right")}
            type="button"
          >
            →
          </button>
          <button
            aria-label="向下移动"
            className="is-down"
            disabled={!selectedInstanceId}
            onClick={() => onNudge("down")}
            type="button"
          >
            ↓
          </button>
          <button
            aria-label="向前移动"
            className="is-forward"
            disabled={!selectedInstanceId}
            onClick={() => onNudge("forward")}
            type="button"
          >
            前
          </button>
          <button
            aria-label="向后移动"
            className="is-back"
            disabled={!selectedInstanceId}
            onClick={() => onNudge("back")}
            type="button"
          >
            后
          </button>
          <small>方向键移动，Shift 加速</small>
        </div>
        <div className="scene-debug-export">
          <button
            className="scene-debug-export__button"
            disabled={disabled}
            onClick={() => {
              void onExport();
            }}
            type="button"
          >
            {status.kind === "saving" ? "写入中..." : "导出资产校准"}
          </button>
          <span className={`scene-debug-export__status is-${status.kind}`}>
            {status.message || "旋转、移动或翻转后可写回模型配置"}
          </span>
        </div>
    </div>
  );
}

async function exportDebugModelConfig({
  debugPositions,
  debugRotations,
  placementList,
  setExportStatus,
}: {
  debugPositions: Record<string, Vec3>;
  debugRotations: Record<string, Vec3>;
  placementList: AssemblyPlacement[];
  setExportStatus: (status: DebugExportStatus) => void;
}) {
  const patches = createDebugModelPatches(
    placementList,
    debugPositions,
    debugRotations,
  );

  if (patches.length === 0) {
    setExportStatus({ kind: "idle", message: "没有需要导出的调试偏移" });
    return;
  }

  setExportStatus({ kind: "saving", message: `准备写入 ${patches.length} 项` });

  try {
    const response = await fetch("/api/debug/model-anchors", {
      body: JSON.stringify({ patches }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });
    const result = (await response.json()) as {
      error?: string;
      updated?: number;
    };

    if (!response.ok) {
      throw new Error(result.error ?? "写入失败");
    }

    setExportStatus({
      kind: "saved",
      message: `已写入 ${result.updated ?? patches.length} 项模型配置`,
    });
  } catch (error) {
    setExportStatus({
      kind: "error",
      message: error instanceof Error ? error.message : "写入失败",
    });
  }
}

function createDebugModelPatches(
  placementList: AssemblyPlacement[],
  debugPositions: Record<string, Vec3>,
  debugRotations: Record<string, Vec3>,
): DebugModelPatch[] {
  const patches: DebugModelPatch[] = [];
  const currentAnchors = new Map<CategoryId, Record<string, Vec3>>();

  for (const placement of placementList) {
    const currentPosition =
      debugPositions[placement.instanceId] ?? placement.position;
    const anchorPoints = placement.model.anchorPoints ?? {};
    const mountTarget = placement.mount.target;

    if (debugPositions[placement.instanceId]) {
      if (mountTarget?.resolved) {
        const targetAnchor = currentAnchors.get(mountTarget.category)?.[
          mountTarget.anchor
        ];
        const ownAnchorName = placement.mount.ownAnchor;

        if (targetAnchor) {
          patches.push({
            partId: placement.part.id,
            partName: placement.part.name,
            patch: {
              anchor: ownAnchorName,
              position: roundVec(subtractVec(targetAnchor, currentPosition)),
              type: "anchorPoint",
            },
          });
        }
      } else {
        patches.push({
          partId: placement.part.id,
          partName: placement.part.name,
          patch: {
            position: roundVec(currentPosition),
            type: "fallbackPosition",
          },
        });
      }
    }

    if (debugRotations[placement.instanceId]) {
      patches.push({
        partId: placement.part.id,
        partName: placement.part.name,
        patch: {
          rotation: roundVec(debugRotations[placement.instanceId]),
          type: "rotation",
        },
      });
    }

    const anchorMap = Object.fromEntries(
      Object.entries(anchorPoints).map(([name, anchor]) => [
        name,
        addVec(currentPosition, anchor.position),
      ]),
    ) as Record<string, Vec3>;

    currentAnchors.set(placement.category, anchorMap);
  }

  return patches;
}

function addVec(left: Vec3, right: Vec3): Vec3 {
  return [left[0] + right[0], left[1] + right[1], left[2] + right[2]];
}

function subtractVec(left: Vec3, right: Vec3): Vec3 {
  return [left[0] - right[0], left[1] - right[1], left[2] - right[2]];
}

function getNudgeDelta(direction: NudgeDirection, multiplier: number): Vec3 {
  const step = nudgeStep * multiplier;

  switch (direction) {
    case "left":
      return [-step, 0, 0];
    case "right":
      return [step, 0, 0];
    case "up":
      return [0, step, 0];
    case "down":
      return [0, -step, 0];
    case "forward":
      return [0, 0, step];
    case "back":
      return [0, 0, -step];
  }
}

function getArrowNudgeDirection(key: string): NudgeDirection | undefined {
  if (key === "ArrowLeft") return "left";
  if (key === "ArrowRight") return "right";
  if (key === "ArrowUp") return "up";
  if (key === "ArrowDown") return "down";
  return undefined;
}

function getRotationShortcut(
  key: string,
): { axis: FlipAxis; direction: RotationDirection } | undefined {
  if (key === "[") return { axis: "x", direction: -1 };
  if (key === "]") return { axis: "x", direction: 1 };
  if (key === ";") return { axis: "y", direction: -1 };
  if (key === "'") return { axis: "y", direction: 1 };
  if (key === ",") return { axis: "z", direction: -1 };
  if (key === ".") return { axis: "z", direction: 1 };
  return undefined;
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();

  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    target.isContentEditable
  );
}

function vectorToVec3(vector: Vector3): Vec3 {
  return [vector.x, vector.y, vector.z];
}

function flipRotation(rotation: Vec3, axis: FlipAxis): Vec3 {
  const next: Vec3 = [...rotation];
  const index = getAxisIndex(axis);
  next[index] = normalizeRadians(next[index] + Math.PI);
  return roundVec(next);
}

function rotateByStep(
  rotation: Vec3,
  axis: FlipAxis,
  direction: RotationDirection,
  multiplier: number,
): Vec3 {
  const next: Vec3 = [...rotation];
  const index = getAxisIndex(axis);
  next[index] = normalizeRadians(
    next[index] + rotationStep * direction * multiplier,
  );
  return roundVec(next);
}

function getAxisIndex(axis: FlipAxis) {
  return axis === "x" ? 0 : axis === "y" ? 1 : 2;
}

function normalizeRadians(value: number) {
  const fullTurn = Math.PI * 2;
  const normalized = ((value + Math.PI) % fullTurn + fullTurn) % fullTurn - Math.PI;
  return Number(normalized.toFixed(4));
}

function getTransformObjectPosition(controls: TransformControlsImpl | null) {
  return (
    controls as unknown as { object?: { position?: Vector3 } } | null
  )?.object?.position;
}

function roundVec(vector: Vec3): Vec3 {
  return vector.map((value) => Number(value.toFixed(4))) as Vec3;
}

function formatVec(vector: Vec3) {
  return vector.map((value) => value.toFixed(3)).join(" / ");
}

function formatRotationDegrees(vector: Vec3) {
  return vector
    .map((value) => `${((value * 180) / Math.PI).toFixed(1)}°`)
    .join(" / ");
}

function getFitScale(
  fitSize: Vec3 | undefined,
  sourceSize: Vector3,
  fitMode: "contain" | "stretch" = "contain",
) {
  if (!fitSize) return new Vector3(1, 1, 1);

  const axisScale = new Vector3(
    safeDivide(fitSize[0], sourceSize.x),
    safeDivide(fitSize[1], sourceSize.y),
    safeDivide(fitSize[2], sourceSize.z),
  );

  if (fitMode === "stretch") return axisScale;

  const uniformScale = Math.min(axisScale.x, axisScale.y, axisScale.z);
  return new Vector3(uniformScale, uniformScale, uniformScale);
}
