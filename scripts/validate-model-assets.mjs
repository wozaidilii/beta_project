import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const assetsFile = path.join(projectRoot, "src/data/local-model-assets.json");
const catalogFile = path.join(projectRoot, "src/lib/catalog.ts");
const publicDir = path.join(projectRoot, "public");

const validCategories = new Set([
  "case",
  "cpu",
  "motherboard",
  "gpu",
  "memory",
  "storage",
  "cooling",
  "psu",
  "fans",
]);
const validAxisValues = new Set(["+x", "-x", "+y", "-y", "+z", "-z"]);
const validMountSlotKinds = new Set([
  "motherboardTray",
  "psuBay",
  "fanMount",
  "radiatorMount",
  "expansionSlot",
  "storageBay",
  "m2Slot",
]);

const requiredByCategory = {
  case: {
    anchors: [
      "root",
      "motherboardTray",
      "psuBay",
      "frontFanMount",
      "expansionSlots",
      "storageBay",
    ],
    slotKinds: [
      "motherboardTray",
      "psuBay",
      "fanMount",
      "expansionSlot",
    ],
  },
  cpu: {
    anchors: ["socketContact"],
    attachTo: { category: "motherboard", anchor: "cpuSocket" },
  },
  motherboard: {
    anchors: ["caseMount", "cpuSocket", "pcieX16", "dimmSlots", "m2Slot"],
    attachTo: { category: "case", anchor: "motherboardTray" },
    slotKinds: ["m2Slot"],
  },
  gpu: {
    anchors: ["pcieConnector"],
    attachTo: { category: "motherboard", anchor: "pcieX16" },
  },
  memory: {
    anchors: ["dimmSeat"],
    attachTo: { category: "motherboard", anchor: "dimmSlots" },
  },
  storage: {
    anchors: ["m2Connector"],
    attachTo: { category: "motherboard", anchor: "m2Slot" },
  },
  cooling: {
    anchors: ["coldPlate"],
    attachTo: { category: "motherboard", anchor: "cpuSocket" },
  },
  psu: {
    anchors: ["mountFace"],
    attachTo: { category: "case", anchor: "psuBay" },
  },
  fans: {
    anchors: ["mountFace"],
    attachTo: { category: "case", anchor: "frontFanMount" },
  },
};

const errors = [];
const warnings = [];

function main() {
  const assets = readJsonArray(assetsFile);
  const catalogSource = fs.readFileSync(catalogFile, "utf8");
  const catalogIds = extractCatalogIds(catalogSource);
  const defaultSelectionIds = extractDefaultSelectionIds(catalogSource);
  const assetIds = new Set();
  const categories = new Map();

  for (const [index, entry] of assets.entries()) {
    const pathLabel = `${entry?.id ?? `entry[${index}]`}`;
    validateEntry(entry, pathLabel, catalogIds, assetIds);
    const category = entry?.model?.slot;
    if (typeof category === "string") {
      categories.set(category, (categories.get(category) ?? 0) + 1);
    }
  }

  for (const [category, id] of Object.entries(defaultSelectionIds)) {
    if (!assetIds.has(id)) {
      errors.push(
        `defaultSelection.${category}=${id} is missing from local-model-assets.json`,
      );
    }
  }

  for (const category of validCategories) {
    if (!categories.has(category)) {
      errors.push(`missing at least one calibrated ${category} model asset`);
    }
  }

  if (errors.length > 0) {
    console.error("Model asset intake validation failed:");
    for (const error of errors) console.error(`- ${error}`);
    if (warnings.length > 0) {
      console.error("\nWarnings:");
      for (const warning of warnings) console.error(`- ${warning}`);
    }
    process.exit(1);
  }

  const summary = [...categories.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([category, count]) => `${category}:${count}`)
    .join(", ");
  console.log(
    `Model asset intake validation passed: ${assets.length} records (${summary})`,
  );
  if (warnings.length > 0) {
    for (const warning of warnings) console.warn(`Warning: ${warning}`);
  }
}

function readJsonArray(filePath) {
  const value = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!Array.isArray(value)) {
    errors.push(`${relative(filePath)} must contain a JSON array`);
    return [];
  }
  return value;
}

function validateEntry(entry, pathLabel, catalogIds, assetIds) {
  if (!entry || typeof entry !== "object") {
    errors.push(`${pathLabel} must be an object`);
    return;
  }

  if (typeof entry.id !== "string" || entry.id.length === 0) {
    errors.push(`${pathLabel}.id must be a non-empty string`);
  } else {
    if (assetIds.has(entry.id)) errors.push(`${pathLabel}.id is duplicated`);
    assetIds.add(entry.id);
    if (!catalogIds.has(entry.id)) {
      errors.push(`${pathLabel}.id does not exist in src/lib/catalog.ts`);
    }
  }

  if (!entry.externalIds?.modelAssetId) {
    errors.push(`${pathLabel}.externalIds.modelAssetId is required`);
  }

  const model = entry.model;
  if (!model || typeof model !== "object") {
    errors.push(`${pathLabel}.model is required`);
    return;
  }

  if (model.kind !== "glb") {
    errors.push(`${pathLabel}.model.kind must be "glb"`);
  }

  if (!validCategories.has(model.slot)) {
    errors.push(`${pathLabel}.model.slot must be a supported part category`);
  }

  validateAssetUrl(model.assetUrl, `${pathLabel}.model.assetUrl`);
  validateVec3(model.fitSize, `${pathLabel}.model.fitSize`, {
    requirePositive: true,
  });
  validateVec3(model.rotation, `${pathLabel}.model.rotation`);
  validateAssetAxis(model.assetAxis, `${pathLabel}.model.assetAxis`);
  validateBoundingBox(model.boundingBoxMm, `${pathLabel}.model.boundingBoxMm`);
  validateAnchors(model.anchorPoints, `${pathLabel}.model.anchorPoints`);
  validatePlacement(
    model.placement,
    model.anchorPoints,
    model.slot,
    `${pathLabel}.model.placement`,
  );
  validateMountSlots(
    model.mountSlots,
    model.anchorPoints,
    model.slot,
    `${pathLabel}.model.mountSlots`,
  );
}

function validateAssetUrl(assetUrl, pathLabel) {
  if (typeof assetUrl !== "string" || assetUrl.length === 0) {
    errors.push(`${pathLabel} must be a non-empty string`);
    return;
  }

  if (!assetUrl.startsWith("/models/")) {
    errors.push(`${pathLabel} must point to a public /models asset`);
    return;
  }

  const localPath = path.join(publicDir, assetUrl.slice(1));
  if (!fs.existsSync(localPath)) {
    errors.push(`${pathLabel} points to a missing file: ${assetUrl}`);
  }
}

function validateAssetAxis(axis, pathLabel) {
  if (!axis || typeof axis !== "object") {
    errors.push(`${pathLabel} is required`);
    return;
  }

  const axes = [axis.right, axis.up, axis.forward];
  for (const [name, value] of [
    ["right", axis.right],
    ["up", axis.up],
    ["forward", axis.forward],
  ]) {
    if (!validAxisValues.has(value)) {
      errors.push(`${pathLabel}.${name} must be one of +x/-x/+y/-y/+z/-z`);
    }
  }

  const axisNames = axes
    .filter((value) => typeof value === "string")
    .map((value) => value.slice(1));
  if (new Set(axisNames).size !== axisNames.length) {
    errors.push(`${pathLabel} must use three distinct world axes`);
  }
}

function validateBoundingBox(box, pathLabel) {
  if (!box || typeof box !== "object") {
    errors.push(`${pathLabel} is required`);
    return;
  }

  const depth = box.depthMm ?? box.lengthMm;
  const dimensions = {
    depthMm: depth,
    widthMm: box.widthMm ?? box.thicknessMm,
    heightMm: box.heightMm,
  };
  for (const [name, value] of Object.entries(dimensions)) {
    if (!Number.isFinite(value) || value <= 0) {
      errors.push(`${pathLabel}.${name} must be a positive number`);
    }
  }
}

function validateAnchors(anchorPoints, pathLabel) {
  if (!anchorPoints || typeof anchorPoints !== "object") {
    errors.push(`${pathLabel} is required`);
    return;
  }

  const names = Object.keys(anchorPoints);
  if (names.length === 0) {
    errors.push(`${pathLabel} must contain at least one anchor`);
  }

  for (const name of names) {
    const anchor = anchorPoints[name];
    if (!anchor || typeof anchor !== "object") {
      errors.push(`${pathLabel}.${name} must be an object`);
      continue;
    }
    validateVec3(anchor.position, `${pathLabel}.${name}.position`);
  }
}

function validatePlacement(placement, anchorPoints, category, pathLabel) {
  if (!placement || typeof placement !== "object") {
    errors.push(`${pathLabel} is required`);
    return;
  }

  if (!anchorPoints?.[placement.anchor]) {
    errors.push(`${pathLabel}.anchor must reference a local anchor`);
  }

  validateVec3(placement.fallbackPosition, `${pathLabel}.fallbackPosition`, {
    optional: category !== "case",
  });

  const required = requiredByCategory[category];
  if (required?.anchors) {
    for (const anchor of required.anchors) {
      if (!anchorPoints?.[anchor]) {
        errors.push(`${pathLabel} missing required ${category} anchor: ${anchor}`);
      }
    }
  }

  if (required?.attachTo) {
    const attachTo = placement.attachTo;
    if (
      attachTo?.category !== required.attachTo.category ||
      attachTo?.anchor !== required.attachTo.anchor
    ) {
      errors.push(
        `${pathLabel}.attachTo must target ${required.attachTo.category}.${required.attachTo.anchor}`,
      );
    }
  }
}

function validateMountSlots(mountSlots, anchorPoints, category, pathLabel) {
  const slots = mountSlots ?? [];
  if (!Array.isArray(slots)) {
    errors.push(`${pathLabel} must be an array when present`);
    return;
  }

  const required = requiredByCategory[category];
  const seen = new Set();
  const slotKinds = new Set();

  for (const [index, slot] of slots.entries()) {
    const slotLabel = `${pathLabel}[${index}]`;
    if (!slot || typeof slot !== "object") {
      errors.push(`${slotLabel} must be an object`);
      continue;
    }
    if (typeof slot.id !== "string" || slot.id.length === 0) {
      errors.push(`${slotLabel}.id must be a non-empty string`);
    } else if (seen.has(slot.id)) {
      errors.push(`${slotLabel}.id is duplicated`);
    }
    seen.add(slot.id);

    if (!validMountSlotKinds.has(slot.kind)) {
      errors.push(`${slotLabel}.kind is not a supported mount slot kind`);
    } else {
      slotKinds.add(slot.kind);
    }

    if (!anchorPoints?.[slot.anchor]) {
      errors.push(`${slotLabel}.anchor must reference an existing anchor`);
    }
  }

  for (const slotKind of required?.slotKinds ?? []) {
    if (!slotKinds.has(slotKind)) {
      errors.push(`${pathLabel} missing required ${category} slot kind: ${slotKind}`);
    }
  }
}

function validateVec3(value, pathLabel, options = {}) {
  if (value == null && options.optional) return;
  if (
    !Array.isArray(value) ||
    value.length !== 3 ||
    !value.every((item) => Number.isFinite(item))
  ) {
    errors.push(`${pathLabel} must be a numeric [x, y, z] tuple`);
    return;
  }

  if (options.requirePositive && value.some((item) => item <= 0)) {
    errors.push(`${pathLabel} values must be positive`);
  }
}

function extractCatalogIds(source) {
  return new Set(
    [...source.matchAll(/\bid:\s*"([^"]+)"/g)].map((match) => match[1]),
  );
}

function extractDefaultSelectionIds(source) {
  const match = source.match(
    /export const defaultSelection:[\s\S]*?=\s*\{([\s\S]*?)\};/,
  );
  if (!match) {
    warnings.push("could not locate defaultSelection in src/lib/catalog.ts");
    return {};
  }

  return Object.fromEntries(
    [...match[1].matchAll(/(\w+):\s*"([^"]+)"/g)].map((entry) => [
      entry[1],
      entry[2],
    ]),
  );
}

function relative(filePath) {
  return path.relative(projectRoot, filePath);
}

main();
