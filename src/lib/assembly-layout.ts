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

export type AssemblyPlacement = {
  category: CategoryId;
  part: Part;
  model: PartModel & { kind: "glb"; assetUrl: string };
  position: Vec3;
  rotation: Vec3;
  fitSize: Vec3;
  anchors: Record<string, AnchorWorldPoint>;
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
  const selectedParts = getSelectedParts(selection);
  const placements: Partial<Record<CategoryId, AssemblyPlacement>> = {};

  for (const category of assemblyOrder) {
    const part = selectedParts[category];
    if (!hasModelAsset(part)) continue;

    const placement = getPlacement(part, placements);
    placements[category] = placement;
  }

  return placements;
}

function getPlacement(
  part: Part & { model: PartModel & { kind: "glb"; assetUrl: string } },
  placements: Partial<Record<CategoryId, AssemblyPlacement>>,
): AssemblyPlacement {
  const model = part.model;
  const rotation = model.rotation ?? [0, 0, 0];
  const fitSize = model.fitSize ?? defaultFitSize;
  const ownAnchorName = model.placement?.anchor ?? "origin";
  const ownAnchor = getLocalAnchor(model, ownAnchorName);
  const targetAnchor = getTargetAnchor(model, placements);
  const fallbackPosition =
    model.placement?.fallbackPosition ?? rootPosition;
  const position = targetAnchor
    ? subtractVec(targetAnchor.position, ownAnchor.position)
    : fallbackPosition;

  return {
    anchors: getWorldAnchors(model, position),
    category: part.category,
    fitSize,
    model,
    part,
    position,
    rotation,
  };
}

function getTargetAnchor(
  model: PartModel,
  placements: Partial<Record<CategoryId, AssemblyPlacement>>,
) {
  const attachTo = model.placement?.attachTo;
  if (!attachTo) return undefined;

  return placements[attachTo.category]?.anchors[attachTo.anchor];
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

function addVec(left: Vec3, right: Vec3): Vec3 {
  return [left[0] + right[0], left[1] + right[1], left[2] + right[2]];
}

function subtractVec(left: Vec3, right: Vec3): Vec3 {
  return [left[0] - right[0], left[1] - right[1], left[2] - right[2]];
}
