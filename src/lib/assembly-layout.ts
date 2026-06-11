import {
  catalog,
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
  slotCount?: number;
};

export type AssemblyMount = {
  ownAnchor: string;
  target?: AssemblyMountTarget;
  secondaryTargets?: AssemblyMountTarget[];
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
  secondaryTargetSlotIds: string[];
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

export type AssemblyFanInstallation = {
  instanceId?: string;
  partId: string;
  slotId: string;
  removed?: boolean;
};

export type AssemblyOptions = {
  fanInstallations?: AssemblyFanInstallation[];
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

export function getAssemblyPlacements(
  selection: PartSelection,
  options?: AssemblyOptions,
) {
  return getAssemblyPlan(selection, options).placements;
}

export function getAssemblyPlan(
  selection: PartSelection,
  options: AssemblyOptions = {},
): AssemblyPlan {
  const selectedParts = getSelectedParts(selection);
  const instancesByCategory: Partial<Record<CategoryId, InstalledPartInstance>> = {};
  const instances: InstalledPartInstance[] = [];
  const validationIssues: AssemblyValidationIssue[] = [];

  for (const category of assemblyOrder) {
    const part = selectedParts[category];
    if (!hasModelAsset(part)) continue;

    if (category === "fans") {
      const fanResult = getInstalledFanInstances(
        part,
        instancesByCategory,
        options,
      );
      for (const instance of fanResult.instances) {
        instancesByCategory.fans ??= instance;
        instances.push(instance);
        validationIssues.push(...validateInstalledInstance(instance));
      }
      validationIssues.push(...fanResult.validationIssues);
      continue;
    }

    const instance = getInstalledInstance(part, instancesByCategory);
    const installationIssues = getBlockingInstallationIssues(
      instance,
      instancesByCategory,
    );
    validationIssues.push(...installationIssues);
    if (installationIssues.length > 0) continue;

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
  installation?: {
    instanceId?: string;
    targetInstance?: InstalledPartInstance;
    targetSlot?: AssemblyMountSlot;
  },
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
    installation,
  );
  const secondaryTargets = getSecondaryMountTargets(part, instancesByCategory);
  const fallbackPosition =
    model.placement?.fallbackPosition ?? rootPosition;
  const position = targetAnchor
    ? subtractVec(targetAnchor.position, ownAnchor.position)
    : fallbackPosition;
  const instanceId = installation?.instanceId ?? createInstanceId(part);
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
      secondaryTargetSlotIds: secondaryTargets
        .map((target) => target.slotId)
        .filter((slotId): slotId is string => Boolean(slotId)),
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
            slotCount: targetSlot?.count,
          }
        : undefined,
      secondaryTargets,
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

function getBlockingInstallationIssues(
  instance: InstalledPartInstance,
  instancesByCategory: Partial<Record<CategoryId, InstalledPartInstance>>,
) {
  const issues: AssemblyValidationIssue[] = [];

  if (instance.mount.target && !instance.mount.target.resolved) {
    issues.push({
      category: instance.category,
      id: `${instance.instanceId}:missing-parent-mount`,
      instanceId: instance.instanceId,
      message: `${instance.part.name} 缺少可解析的父级安装点 ${instance.mount.target.category}.${instance.mount.target.anchor}，不会生成孤儿 3D 实例。`,
      partId: instance.partId,
      severity: "warning",
    });
  }

  if (instance.category === "gpu") {
    issues.push(...getGpuInstallationIssues(instance, instancesByCategory));
  }

  return issues;
}

function getGpuInstallationIssues(
  instance: InstalledPartInstance,
  instancesByCategory: Partial<Record<CategoryId, InstalledPartInstance>>,
) {
  const issues: AssemblyValidationIssue[] = [];
  const pcCase = instancesByCategory.case;
  const expansionTarget = instance.mount.secondaryTargets?.find(
    (target) => target.slotKind === "expansionSlot",
  );

  if (!pcCase || !expansionTarget?.resolved) {
    issues.push({
      category: "gpu",
      id: `${instance.instanceId}:missing-case-expansion-slot`,
      instanceId: instance.instanceId,
      message: `${instance.part.name} 缺少可解析的机箱扩展槽，不能生成可信的显卡安装实例。`,
      partId: instance.partId,
      severity: "warning",
    });
    return issues;
  }

  const gpuLengthMm =
    instance.part.lengthMm ??
    instance.part.dimensions?.lengthMm ??
    instance.model.boundingBoxMm?.lengthMm;
  const caseGpuClearanceMm = pcCase.part.gpuClearanceMm;
  if (
    gpuLengthMm &&
    caseGpuClearanceMm &&
    gpuLengthMm > caseGpuClearanceMm
  ) {
    issues.push({
      category: "gpu",
      id: `${instance.instanceId}:gpu-length-over-clearance`,
      instanceId: instance.instanceId,
      message: `${instance.part.name} 长 ${gpuLengthMm}mm，${pcCase.part.name} 显卡限长 ${caseGpuClearanceMm}mm，3D 场景不会假装可安装。`,
      partId: instance.partId,
      severity: "error",
    });
  }

  const gpuSlotWidth =
    instance.part.totalSlotWidth ?? instance.part.caseExpansionSlotWidth;
  const caseExpansionSlots =
    expansionTarget.slotCount ?? pcCase.part.caseExpansionSlots;
  if (
    gpuSlotWidth &&
    caseExpansionSlots &&
    gpuSlotWidth > caseExpansionSlots
  ) {
    issues.push({
      category: "gpu",
      id: `${instance.instanceId}:gpu-slot-width-over-expansion`,
      instanceId: instance.instanceId,
      message: `${instance.part.name} 约 ${gpuSlotWidth} 槽，${pcCase.part.name} 的 ${expansionTarget.slotLabel ?? "扩展槽"} 只有 ${caseExpansionSlots} 槽，3D 场景不会假装可安装。`,
      partId: instance.partId,
      severity: "error",
    });
  }

  return issues;
}

function getInstalledFanInstances(
  selectedFanPart: Part & { model: PartModel & { kind: "glb"; assetUrl: string } },
  instancesByCategory: Partial<Record<CategoryId, InstalledPartInstance>>,
  options: AssemblyOptions,
) {
  const targetInstance = instancesByCategory.case;
  const compatibleSlots = getCompatibleFanMountSlots(selectedFanPart, targetInstance);
  const requestedInstallations =
    options.fanInstallations?.filter((installation) => !installation.removed) ??
    getDefaultFanInstallations(selectedFanPart, compatibleSlots);
  const validationIssues: AssemblyValidationIssue[] = [];
  const instances: InstalledPartInstance[] = [];

  for (const installation of requestedInstallations) {
    const targetSlot = compatibleSlots.find((slot) => slot.id === installation.slotId);
    const fanPart = getFanPartById(installation.partId) ?? selectedFanPart;
    if (!targetInstance || !targetSlot) {
      validationIssues.push({
        category: "fans",
        id: `${installation.instanceId ?? installation.partId}:missing-fan-slot`,
        instanceId: installation.instanceId ?? `fans:${installation.partId}`,
        message: `${fanPart.name} 请求的风扇安装位 ${installation.slotId} 不存在或不兼容。`,
        partId: fanPart.id,
        severity: "warning",
      });
      continue;
    }

    if (!hasModelAsset(fanPart)) {
      validationIssues.push({
        category: "fans",
        id: `${installation.instanceId ?? installation.partId}:missing-fan-model`,
        instanceId: installation.instanceId ?? `fans:${installation.partId}`,
        message: `${fanPart.name} 缺少可安装的 3D 模型资产。`,
        partId: fanPart.id,
        severity: "warning",
      });
      continue;
    }

    instances.push(
      getInstalledInstance(fanPart, instancesByCategory, {
        instanceId: installation.instanceId ?? createFanInstanceId(fanPart, targetSlot),
        targetInstance,
        targetSlot,
      }),
    );
  }

  if (!options.fanInstallations && compatibleSlots.length < getFanPackQuantity(selectedFanPart)) {
    validationIssues.push({
      category: "fans",
      id: `fans:${selectedFanPart.id}:not-enough-fan-slots`,
      instanceId: `fans:${selectedFanPart.id}`,
      message: `${selectedFanPart.name} 需要 ${getFanPackQuantity(
        selectedFanPart,
      )} 个兼容风扇位，当前机箱只能安装 ${compatibleSlots.length} 个。`,
      partId: selectedFanPart.id,
      severity: "warning",
    });
  }

  return { instances, validationIssues };
}

function getDefaultFanInstallations(
  fanPart: Part,
  compatibleSlots: AssemblyMountSlot[],
): AssemblyFanInstallation[] {
  return compatibleSlots.slice(0, getFanPackQuantity(fanPart)).map((slot) => ({
    instanceId: createFanInstanceId(fanPart, slot),
    partId: fanPart.id,
    slotId: slot.id,
  }));
}

function getCompatibleFanMountSlots(
  fanPart: Part,
  targetInstance?: InstalledPartInstance,
) {
  const fanSizeMm = getFanSizeMm(fanPart);
  return (
    targetInstance?.mountSlots
      .filter((slot) => slot.kind === "fanMount" && slot.anchorResolved)
      .filter(
        (slot) =>
          !fanSizeMm ||
          !slot.supportedFanSizesMm ||
          slot.supportedFanSizesMm.includes(fanSizeMm),
      )
      .sort(compareMountSlots) ?? []
  );
}

function getMountTarget(
  part: Part,
  model: PartModel,
  instancesByCategory: Partial<Record<CategoryId, InstalledPartInstance>>,
  installation?: {
    targetInstance?: InstalledPartInstance;
    targetSlot?: AssemblyMountSlot;
  },
) {
  const fanSlotTarget = getFanMountSlotTarget(part, instancesByCategory, installation);
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
  const targetSlot = targetInstance?.mountSlots.find(
    (slot) => slot.anchor === attachTo.anchor,
  );

  return {
    attachTo,
    targetAnchor: targetInstance?.anchors[attachTo.anchor],
    targetInstance,
    targetSlot,
  };
}

function getSecondaryMountTargets(
  part: Part,
  instancesByCategory: Partial<Record<CategoryId, InstalledPartInstance>>,
): AssemblyMountTarget[] {
  if (part.category !== "gpu") return [];

  const pcCase = instancesByCategory.case;
  const expansionSlot = getCaseExpansionSlot(pcCase);
  if (!pcCase || !expansionSlot) return [];

  return [
    {
      anchor: expansionSlot.anchor,
      category: "case",
      instanceId: pcCase.instanceId,
      resolved: expansionSlot.anchorResolved,
      slotCount: expansionSlot.count ?? pcCase.part.caseExpansionSlots,
      slotId: expansionSlot.id,
      slotKind: expansionSlot.kind,
      slotLabel: expansionSlot.label,
    },
  ];
}

function getCaseExpansionSlot(targetInstance?: InstalledPartInstance) {
  return (
    targetInstance?.mountSlots
      .filter((slot) => slot.kind === "expansionSlot" && slot.anchorResolved)
      .sort(compareMountSlots)[0]
  );
}

function getFanMountSlotTarget(
  part: Part,
  instancesByCategory: Partial<Record<CategoryId, InstalledPartInstance>>,
  installation?: {
    targetInstance?: InstalledPartInstance;
    targetSlot?: AssemblyMountSlot;
  },
) {
  if (part.category !== "fans") return undefined;

  const targetInstance = installation?.targetInstance ?? instancesByCategory.case;
  const targetSlot =
    installation?.targetSlot ??
    getCompatibleFanMountSlots(part, targetInstance)[0];
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

function getFanPartById(partId: string) {
  return catalog.fans.find((part) => part.id === partId);
}

function createFanInstanceId(part: Part, slot: AssemblyMountSlot) {
  return `fans:${part.id}:${slot.id}`;
}

function getFanPackQuantity(part: Part) {
  const text = `${part.name} ${part.series} ${part.marketTags.join(" ")}`;
  const explicitCount = text.match(/(\d+)\s*(?:pack|联包|只)/i)?.[1];
  if (explicitCount) return Number.parseInt(explicitCount, 10);
  if (text.includes("三联包") || text.includes("三只")) return 3;
  return 1;
}

function getFanSizeMm(part: Part) {
  const text = `${part.name} ${part.series}`;
  const explicitSize = text.match(/(\d{2,3})\s*mm/i)?.[1];
  if (explicitSize) return Number.parseInt(explicitSize, 10);
  const size = part.model?.boundingBoxMm;
  return size?.lengthMm ?? size?.widthMm;
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
