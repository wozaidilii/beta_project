import {
  hasModelAsset,
  type CategoryId,
  type ModelMountSlot,
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
  slotId?: string;
  slotKind?: ModelMountSlot["kind"];
  slotLabel?: string;
};

export type AssemblyMount = {
  ownAnchor: string;
  target?: AssemblyMountTarget;
  fallbackPosition?: Vec3;
  mode: "root" | "attached" | "fallback";
};

export type AssemblyDebugMetadata = {
  anchorNames: string[];
  mountSlotIds: string[];
  ownAnchorName: string;
  placementAnchor?: string;
  targetCategory?: CategoryId;
  targetAnchorName?: string;
  targetInstanceId?: string;
  targetResolved: boolean;
};

export type AssemblyMountSlot = ModelMountSlot & {
  position: Vec3;
  anchorResolved: boolean;
  instanceId: string;
  partId: string;
  category: CategoryId;
};

export type AssemblyValidationIssue = {
  id: string;
  severity: "warning" | "error";
  instanceId: string;
  partId: string;
  category: CategoryId;
  message: string;
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
  mountSlots: AssemblyMountSlot[];
  mount: AssemblyMount;
  visible: boolean;
  debug: AssemblyDebugMetadata;
};

export type AssemblyPlacement = InstalledPartInstance;

export type AssemblyPlan = {
  instances: InstalledPartInstance[];
  instancesByCategory: Partial<Record<CategoryId, InstalledPartInstance>>;
  placements: Partial<Record<CategoryId, AssemblyPlacement>>;
  validationIssues: AssemblyValidationIssue[];
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
  const validationIssues: AssemblyValidationIssue[] = [];

  for (const category of assemblyOrder) {
    const part = selectedParts[category];
    if (!hasModelAsset(part)) continue;

    const instance = getInstalledInstance(part, instancesByCategory);
    instancesByCategory[category] = instance;
    instances.push(instance);
    validationIssues.push(...validateInstalledInstance(instance));
  }

  return {
    instances,
    instancesByCategory,
    placements: instancesByCategory,
    validationIssues,
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
  const { attachTo, targetAnchor, targetInstance, targetSlot } = getMountTarget(
    part,
    model,
    instancesByCategory,
  );
  const fallbackPosition =
    model.placement?.fallbackPosition ?? rootPosition;
  const position = targetAnchor
    ? subtractVec(targetAnchor.position, ownAnchor.position)
    : fallbackPosition;
  const instanceId = createInstanceId(part);
  const anchorNames = Object.keys(model.anchorPoints ?? {});
  const mountSlots = getWorldMountSlots(model, part, instanceId, position);

  return {
    anchors: getWorldAnchors(model, position),
    category: part.category,
    debug: {
      anchorNames,
      mountSlotIds: mountSlots.map((slot) => slot.id),
      ownAnchorName,
      placementAnchor: model.placement?.anchor,
      targetAnchorName: targetSlot?.anchor ?? attachTo?.anchor,
      targetCategory: attachTo?.category,
      targetInstanceId: targetInstance?.instanceId,
      targetResolved: Boolean(targetAnchor),
    },
    fitSize,
    instanceId,
    model,
    mountSlots,
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
            slotId: targetSlot?.id,
            slotKind: targetSlot?.kind,
            slotLabel: targetSlot?.label,
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

function getWorldMountSlots(
  model: PartModel,
  part: Part,
  instanceId: string,
  modelPosition: Vec3,
): AssemblyMountSlot[] {
  return (model.mountSlots ?? []).map((slot) => {
    const anchor = model.anchorPoints?.[slot.anchor];
    return {
      ...slot,
      anchorResolved: Boolean(anchor),
      category: part.category,
      instanceId,
      partId: part.id,
      position: anchor ? addVec(modelPosition, anchor.position) : modelPosition,
    };
  });
}

function validateInstalledInstance(instance: InstalledPartInstance) {
  const issues: AssemblyValidationIssue[] = [];

  if (instance.category === "case" && instance.mountSlots.length === 0) {
    issues.push({
      category: instance.category,
      id: `${instance.instanceId}:missing-case-mount-slots`,
      instanceId: instance.instanceId,
      message: `${instance.part.name} 缺少机箱安装槽 inventory。`,
      partId: instance.partId,
      severity: "warning",
    });
  }

  for (const slot of instance.mountSlots) {
    if (!slot.anchorResolved) {
      issues.push({
        category: instance.category,
        id: `${instance.instanceId}:missing-slot-anchor:${slot.id}`,
        instanceId: instance.instanceId,
        message: `${instance.part.name} 的安装槽 ${slot.label} 引用了不存在的 anchor ${slot.anchor}。`,
        partId: instance.partId,
        severity: "error",
      });
    }
  }

  return issues;
}

function getMountTarget(
  part: Part,
  model: PartModel,
  instancesByCategory: Partial<Record<CategoryId, InstalledPartInstance>>,
) {
  const fanSlotTarget = getFanMountSlotTarget(part, instancesByCategory);
  if (fanSlotTarget) return fanSlotTarget;

  const attachTo = model.placement?.attachTo;
  if (!attachTo) {
    return {
      attachTo: undefined,
      targetAnchor: undefined,
      targetInstance: undefined,
      targetSlot: undefined,
    };
  }

  const targetInstance = instancesByCategory[attachTo.category];

  return {
    attachTo,
    targetAnchor: targetInstance?.anchors[attachTo.anchor],
    targetInstance,
    targetSlot: undefined,
  };
}

function getFanMountSlotTarget(
  part: Part,
  instancesByCategory: Partial<Record<CategoryId, InstalledPartInstance>>,
) {
  if (part.category !== "fans") return undefined;

  const targetInstance = instancesByCategory.case;
  const targetSlot = getPreferredFanMountSlot(targetInstance);
  if (!targetInstance || !targetSlot) return undefined;

  return {
    attachTo: {
      anchor: targetSlot.anchor,
      category: "case" as const,
    },
    targetAnchor: {
      label: targetSlot.label,
      position: targetSlot.position,
    },
    targetInstance,
    targetSlot,
  };
}

function getPreferredFanMountSlot(targetInstance?: InstalledPartInstance) {
  const fanSlots =
    targetInstance?.mountSlots
      .filter((slot) => slot.kind === "fanMount" && slot.anchorResolved)
      .sort(compareMountSlots) ?? [];
  const frontSlots = fanSlots
    .filter((slot) => slot.group === "front")
    .sort(compareMountSlots);

  return frontSlots[Math.floor(frontSlots.length / 2)] ?? fanSlots[0];
}

function compareMountSlots(left: AssemblyMountSlot, right: AssemblyMountSlot) {
  return (
    (left.priority ?? Number.MAX_SAFE_INTEGER) -
      (right.priority ?? Number.MAX_SAFE_INTEGER) || left.id.localeCompare(right.id)
  );
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
