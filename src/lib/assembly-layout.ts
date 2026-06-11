import {
  hasModelAsset,
  type CategoryId,
  type Part,
  type PartModel,
  type PartSelection,
  type Vec3,
} from "~/lib/catalog";
import { getSelectedParts } from "~/lib/catalog";

export type AnchorWorldPoint = {
  label: string;
  position: Vec3;
};

export type AssemblyMountTarget = {
  category: CategoryId;
  anchor: string;
  instanceId?: string;
  resolved: boolean;
};

export type AssemblyMount = {
  ownAnchor: string;
  target?: AssemblyMountTarget;
  fallbackPosition?: Vec3;
  mode: "root" | "attached" | "fallback";
};

export type AssemblyDebugMetadata = {
  anchorNames: string[];
  ownAnchorName: string;
  placementAnchor?: string;
  targetCategory?: CategoryId;
  targetAnchorName?: string;
  targetInstanceId?: string;
  targetResolved: boolean;
};

export type InstalledPartInstance = {
  instanceId: string;
  partId: string;
  category: CategoryId;
  part: Part;
  model: PartModel & { kind: "glb"; assetUrl: string };
  position: Vec3;
  rotation: Vec3;
  fitSize: Vec3;
  anchors: Record<string, AnchorWorldPoint>;
  mount: AssemblyMount;
  visible: boolean;
  debug: AssemblyDebugMetadata;
};

export type AssemblyPlacement = InstalledPartInstance;

export type AssemblyPlan = {
  instances: InstalledPartInstance[];
  instancesByCategory: Partial<Record<CategoryId, InstalledPartInstance>>;
  placements: Partial<Record<CategoryId, AssemblyPlacement>>;
};

const defaultFitSize: Vec3 = [0.6, 0.6, 0.6];
const rootPosition: Vec3 = [0, 0, 0];
const assemblyOrder: CategoryId[] = [
  "case",
  "motherboard",
  "cpu",
  "cooling",
  "gpu",
  "memory",
  "storage",
  "psu",
  "fans",
];

export function getAssemblyPlacements(selection: PartSelection) {
  return getAssemblyPlan(selection).placements;
}

export function getAssemblyPlan(selection: PartSelection): AssemblyPlan {
  const selectedParts = getSelectedParts(selection);
  const instancesByCategory: Partial<Record<CategoryId, InstalledPartInstance>> = {};
  const instances: InstalledPartInstance[] = [];

  for (const category of assemblyOrder) {
    const part = selectedParts[category];
    if (!hasModelAsset(part)) continue;

    const instance = getInstalledInstance(part, instancesByCategory);
    instancesByCategory[category] = instance;
    instances.push(instance);
  }

  return {
    instances,
    instancesByCategory,
    placements: instancesByCategory,
  };
}

function getInstalledInstance(
  part: Part & { model: PartModel & { kind: "glb"; assetUrl: string } },
  instancesByCategory: Partial<Record<CategoryId, InstalledPartInstance>>,
): InstalledPartInstance {
  const model = part.model;
  const rotation = model.rotation ?? [0, 0, 0];
  const fitSize = model.fitSize ?? defaultFitSize;
  const ownAnchorName = model.placement?.anchor ?? "origin";
  const ownAnchor = getLocalAnchor(model, ownAnchorName);
  const { targetAnchor, targetInstance } = getTargetAnchor(
    model,
    instancesByCategory,
  );
  const attachTo = model.placement?.attachTo;
  const fallbackPosition =
    model.placement?.fallbackPosition ?? rootPosition;
  const position = targetAnchor
    ? subtractVec(targetAnchor.position, ownAnchor.position)
    : fallbackPosition;
  const instanceId = createInstanceId(part);
  const anchorNames = Object.keys(model.anchorPoints ?? {});

  return {
    anchors: getWorldAnchors(model, position),
    category: part.category,
    debug: {
      anchorNames,
      ownAnchorName,
      placementAnchor: model.placement?.anchor,
      targetAnchorName: attachTo?.anchor,
      targetCategory: attachTo?.category,
      targetInstanceId: targetInstance?.instanceId,
      targetResolved: Boolean(targetAnchor),
    },
    fitSize,
    instanceId,
    model,
    mount: {
      fallbackPosition,
      mode: attachTo ? (targetAnchor ? "attached" : "fallback") : "root",
      ownAnchor: ownAnchorName,
      target: attachTo
        ? {
            anchor: attachTo.anchor,
            category: attachTo.category,
            instanceId: targetInstance?.instanceId,
            resolved: Boolean(targetAnchor),
          }
        : undefined,
    },
    part,
    partId: part.id,
    position,
    rotation,
    visible: true,
  };
}

function getTargetAnchor(
  model: PartModel,
  instancesByCategory: Partial<Record<CategoryId, InstalledPartInstance>>,
) {
  const attachTo = model.placement?.attachTo;
  if (!attachTo) {
    return {
      targetAnchor: undefined,
      targetInstance: undefined,
    };
  }

  const targetInstance = instancesByCategory[attachTo.category];

  return {
    targetAnchor: targetInstance?.anchors[attachTo.anchor],
    targetInstance,
  };
}

function getWorldAnchors(model: PartModel, modelPosition: Vec3) {
  const anchors = model.anchorPoints ?? {};
  return Object.fromEntries(
    Object.entries(anchors).map(([name, anchor]) => [
      name,
      {
        label: anchor.label ?? name,
        position: addVec(modelPosition, anchor.position),
      },
    ]),
  ) as Record<string, AnchorWorldPoint>;
}

function getLocalAnchor(model: PartModel, name: string) {
  return (
    model.anchorPoints?.[name] ?? {
      label: name,
      position: rootPosition,
    }
  );
}

function createInstanceId(part: Part) {
  return `${part.category}:${part.id}`;
}

function addVec(left: Vec3, right: Vec3): Vec3 {
  return [left[0] + right[0], left[1] + right[1], left[2] + right[2]];
}

function subtractVec(left: Vec3, right: Vec3): Vec3 {
  return [left[0] - right[0], left[1] - right[1], left[2] - right[2]];
}
