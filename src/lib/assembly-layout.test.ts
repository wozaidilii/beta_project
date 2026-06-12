import assert from "node:assert/strict";

import {
  getAssemblyPlan,
  type AssemblyFanInstallation,
  type InstalledPartInstance,
} from "~/lib/assembly-layout";
import { calibrationSelection, catalog, type CategoryId } from "~/lib/catalog";

const expectedOrder: CategoryId[] = [
  "case",
  "motherboard",
  "cpu",
  "cooling",
  "gpu",
  "memory",
  "storage",
  "psu",
  "fans",
  "fans",
];

const plan = getAssemblyPlan(calibrationSelection);

assert.deepEqual(
  plan.instances.map((instance) => instance.category),
  expectedOrder,
  "default build should produce instances in deterministic assembly order",
);

for (const instance of plan.instances) {
  if (instance.category === "fans") {
    assert.match(
      instance.instanceId,
      /^fans:[\w-]+:fan\./,
      "fan instances should expose stable slot-based instance ids",
    );
  } else {
    assert.equal(
      instance.instanceId,
      `${instance.category}:${instance.partId}`,
      `${instance.category} should expose a stable category-part instance id`,
    );
  }
  assert.equal(instance.visible, true);
  assert.equal(instance.model.kind, "glb");
  assert.ok(instance.model.assetUrl);
  assert.ok(instance.part);
  assert.ok(instance.debug.anchorNames.length > 0);
}

const pcCase = requireInstance("case");
const motherboard = requireInstance("motherboard");
const cpu = requireInstance("cpu");
const cooling = requireInstance("cooling");
const gpu = requireInstance("gpu");
const storage = requireInstance("storage");
const psu = requireInstance("psu");
const fans = plan.instances.filter((instance) => instance.category === "fans");

assert.equal(
  plan.validationIssues.length,
  0,
  "default build model metadata should not report mount slot validation issues",
);
assert.ok(
  pcCase.mountSlots.length >= 7,
  "case should expose a structured mount inventory",
);
assertCaseSlot("motherboardTray", "motherboard-tray.main");
assertCaseSlot("psuBay", "psu-bay.main");
assertCaseSlot("radiatorMount", "radiator.top");
assertCaseSlot("fanMount", "fan.front.120.1");
assertCaseSlot("fanMount", "fan.front.120.2");
assertCaseSlot("expansionSlot", "expansion.rear");

assert.equal(motherboard.mount.target?.category, "case");
assert.equal(motherboard.mount.target?.anchor, "motherboardTray");
assert.equal(motherboard.mount.target?.instanceId, pcCase.instanceId);
assert.equal(motherboard.mount.mode, "attached");

assert.equal(cpu.mount.target?.category, "motherboard");
assert.equal(cpu.mount.target?.anchor, "cpuSocket");
assert.equal(cpu.mount.target?.instanceId, motherboard.instanceId);
assert.equal(cpu.mount.mode, "attached");

assert.equal(cooling.mount.target?.category, "motherboard");
assert.equal(cooling.mount.target?.anchor, "cpuSocket");
assert.equal(cooling.mount.target?.instanceId, motherboard.instanceId);
assert.equal(cooling.mount.mode, "attached");
assert.equal(cooling.role, "single");

assert.equal(gpu.mount.target?.category, "motherboard");
assert.equal(gpu.mount.target?.anchor, "pcieX16");
assert.equal(gpu.mount.target?.instanceId, motherboard.instanceId);
assert.equal(gpu.mount.mode, "attached");
assert.equal(
  gpu.mount.secondaryTargets?.[0]?.category,
  "case",
  "GPU should reference case expansion geometry as a secondary target",
);
assert.equal(gpu.mount.secondaryTargets?.[0]?.slotId, "expansion.rear");
assert.equal(gpu.mount.secondaryTargets?.[0]?.slotKind, "expansionSlot");
assert.deepEqual(gpu.debug.secondaryTargetSlotIds, ["expansion.rear"]);

const removedGpuPlan = getAssemblyPlan({
  ...calibrationSelection,
  gpu: undefined,
});
assert.equal(
  removedGpuPlan.instancesByCategory.gpu,
  undefined,
  "removing GPU should hide only the GPU instance",
);
assert.ok(
  removedGpuPlan.instancesByCategory.case,
  "removing GPU should preserve the case instance",
);
assert.ok(
  removedGpuPlan.instancesByCategory.motherboard,
  "removing GPU should preserve the motherboard instance",
);

assert.equal(storage.mount.target?.category, "motherboard");
assert.equal(storage.mount.target?.anchor, "m2Slot");
assert.equal(storage.mount.target?.slotId, "m2.primary");
assert.equal(storage.mount.target?.slotKind, "m2Slot");
assert.equal(storage.mount.target?.instanceId, motherboard.instanceId);
assert.equal(storage.mount.mode, "attached");

const removedStoragePlan = getAssemblyPlan({
  ...calibrationSelection,
  storage: undefined,
});
assert.equal(
  removedStoragePlan.instancesByCategory.storage,
  undefined,
  "removing storage should hide only the storage instance",
);
assert.ok(
  removedStoragePlan.instancesByCategory.case,
  "removing storage should preserve the case instance",
);
assert.ok(
  removedStoragePlan.instancesByCategory.motherboard,
  "removing storage should preserve the motherboard instance",
);
assert.ok(
  removedStoragePlan.instancesByCategory.gpu,
  "removing storage should preserve the GPU instance",
);

const defaultMotherboardPart = catalog.motherboard.find(
  (part) => part.id === calibrationSelection.motherboard,
);
assert.ok(defaultMotherboardPart?.model, "default motherboard fixture should exist");
const originalMotherboardMountSlots = defaultMotherboardPart.model.mountSlots;
defaultMotherboardPart.model.mountSlots =
  originalMotherboardMountSlots?.filter((slot) => slot.kind !== "m2Slot") ?? [];
try {
  const noM2StoragePlan = getAssemblyPlan(calibrationSelection);
  assert.equal(
    noM2StoragePlan.instancesByCategory.storage,
    undefined,
    "missing motherboard M.2 slot should not create a fake storage placement",
  );
  assert.ok(
    noM2StoragePlan.validationIssues.some(
      (issue) => issue.id === "storage:calibration-m2-storage:missing-parent-mount",
    ),
    "missing motherboard M.2 slot should report an instance-scoped storage conflict",
  );
} finally {
  defaultMotherboardPart.model.mountSlots = originalMotherboardMountSlots;
}

assert.equal(psu.mount.target?.category, "case");
assert.equal(psu.mount.target?.anchor, "psuBay");
assert.equal(psu.mount.target?.slotId, "psu-bay.main");
assert.equal(psu.mount.target?.slotKind, "psuBay");
assert.equal(psu.mount.target?.instanceId, pcCase.instanceId);
assert.equal(psu.mount.mode, "attached");

const removedPsuPlan = getAssemblyPlan({
  ...calibrationSelection,
  psu: undefined,
});
assert.equal(
  removedPsuPlan.instancesByCategory.psu,
  undefined,
  "removing PSU should hide only the PSU instance",
);
assert.ok(
  removedPsuPlan.instancesByCategory.case,
  "removing PSU should preserve the case instance",
);
assert.ok(
  removedPsuPlan.instancesByCategory.motherboard,
  "removing PSU should preserve the motherboard instance",
);
assert.ok(
  removedPsuPlan.instancesByCategory.gpu,
  "removing PSU should preserve the GPU instance",
);

const removedCoolingPlan = getAssemblyPlan({
  ...calibrationSelection,
  cooling: undefined,
});
assert.equal(
  removedCoolingPlan.instancesByCategory.cooling,
  undefined,
  "removing cooling should remove all cooling-related installed instances",
);
assert.ok(
  removedCoolingPlan.instancesByCategory.case,
  "removing cooling should preserve the case instance",
);
assert.ok(
  removedCoolingPlan.instancesByCategory.motherboard,
  "removing cooling should preserve the motherboard instance",
);
assert.ok(
  removedCoolingPlan.instancesByCategory.gpu,
  "removing cooling should preserve the GPU instance",
);

assert.equal(fans.length, 2, "default CAD fan selection should install 2 fans");
assert.deepEqual(
  fans.map((fan) => fan.mount.target?.slotId),
  ["fan.front.120.1", "fan.front.120.2"],
  "default CAD fan pack should occupy the front fan slots in priority order",
);

for (const fan of fans) {
  assert.equal(fan.mount.target?.category, "case");
  assert.equal(fan.mount.target?.slotKind, "fanMount");
  assert.equal(fan.mount.target?.instanceId, pcCase.instanceId);
  assert.equal(fan.mount.mode, "attached");
  assert.equal(
    fan.position[0],
    0.98,
    "front fans should mount on the CAD-derived front panel anchors",
  );
  assert.equal(
    fan.rotation[1],
    1.5708,
    "front fan models should face the case front fan mount plane",
  );
  assert.equal(
    fan.rotation[0],
    0,
    "front fan models should not ship an unverified roll guess; use debug calibration to export the correct asset rotation",
  );
}

const singleFanPlan = getAssemblyPlan(calibrationSelection, {
  fanInstallations: [
    {
      instanceId: "fans:single-front-second",
      partId: "cad-120mm-fan-validation",
      slotId: "fan.front.120.2",
    },
  ],
});
const singleFans = singleFanPlan.instances.filter(
  (instance) => instance.category === "fans",
);
assert.equal(singleFans.length, 1, "explicit fan state should support one fan");
assert.equal(singleFans[0]?.instanceId, "fans:single-front-second");
assert.equal(singleFans[0]?.mount.target?.slotId, "fan.front.120.2");

const fanState = toFanInstallationState(fans);
const secondFan = fans.find(
  (fan) => fan.mount.target?.slotId === "fan.front.120.2",
);
assert.ok(secondFan, "default fan pack should include the second front fan");
const uncalibratedFanPlan = getAssemblyPlan(calibrationSelection, {
  fanInstallations: fanState.map((fan) =>
    fan.slotId === "fan.front.120.2"
      ? { ...fan, partId: "lianli-sl-inf-3" }
      : fan,
  ),
});
const uncalibratedFanIssue = uncalibratedFanPlan.validationIssues.find(
  (issue) => issue.id === `${secondFan.instanceId}:missing-fan-model`,
);
assert.equal(
  uncalibratedFanPlan.instances.filter((instance) => instance.category === "fans")
    .length,
  1,
  "uncalibrated fan replacement should not create a fake fan instance",
);
assert.ok(uncalibratedFanIssue);

const removedPlan = getAssemblyPlan(calibrationSelection, {
  fanInstallations: fanState.filter((fan) => fan.slotId !== "fan.front.120.2"),
});
const remainingFanSlots = removedPlan.instances
  .filter((instance) => instance.category === "fans")
  .map((instance) => instance.mount.target?.slotId);
assert.deepEqual(
  remainingFanSlots,
  ["fan.front.120.1"],
  "removing one fan should preserve the other installed fan instances",
);

const tooManyFanPlan = getAssemblyPlan(calibrationSelection, {
  fanInstallations: [
    ...fanState,
    {
      instanceId: "fans:invalid-side-slot",
      partId: "cad-120mm-fan-validation",
      slotId: "fan.side.120.1",
    },
  ],
});
const invalidFanSlotIssue = tooManyFanPlan.validationIssues.find(
  (issue) => issue.id === "fans:invalid-side-slot:missing-fan-slot",
);
assert.equal(
  tooManyFanPlan.instances.filter((instance) => instance.category === "fans").length,
  2,
  "invalid requested fan slots should not create fake fan placements",
);
assert.ok(invalidFanSlotIssue);
assert.equal(
  invalidFanSlotIssue.slotId,
  "fan.side.120.1",
  "invalid fan conflict should preserve the requested slot id",
);
assert.equal(
  invalidFanSlotIssue.slotKind,
  "fanMount",
  "invalid requested fan slots should report a clear conflict",
);

function requireInstance(category: CategoryId) {
  const instance = plan.instancesByCategory[category];
  assert.ok(instance, `${category} instance should exist`);
  return instance;
}

function assertCaseSlot(kind: string, id: string) {
  const slot = pcCase.mountSlots.find((item) => item.id === id);
  assert.ok(slot, `case should expose ${id}`);
  assert.equal(slot.kind, kind);
  assert.equal(slot.anchorResolved, true, `${id} should resolve to an anchor`);
}

function toFanInstallationState(
  installedFans: InstalledPartInstance[],
): AssemblyFanInstallation[] {
  return installedFans.map((fan) => {
    const slotId = fan.mount.target?.slotId;
    assert.ok(slotId, `${fan.instanceId} should target a fan slot`);
    return {
      instanceId: fan.instanceId,
      partId: fan.partId,
      slotId,
    };
  });
}
