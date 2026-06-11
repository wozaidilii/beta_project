import assert from "node:assert/strict";

import {
  getAssemblyPlan,
  type AssemblyFanInstallation,
  type InstalledPartInstance,
} from "~/lib/assembly-layout";
import { catalog, defaultSelection, type CategoryId } from "~/lib/catalog";

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
  "fans",
];

const plan = getAssemblyPlan(defaultSelection);

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
  pcCase.mountSlots.length >= 8,
  "case should expose a structured mount inventory",
);
assertCaseSlot("motherboardTray", "motherboard-tray.main");
assertCaseSlot("psuBay", "psu-bay.main");
assertCaseSlot("radiatorMount", "radiator.top");
assertCaseSlot("fanMount", "fan.front.120.1");
assertCaseSlot("fanMount", "fan.front.120.2");
assertCaseSlot("fanMount", "fan.front.120.3");
assertCaseSlot("expansionSlot", "expansion.rear");

assert.equal(motherboard.mount.target?.category, "case");
assert.equal(motherboard.mount.target?.anchor, "motherboardTray");
assert.equal(motherboard.mount.target?.instanceId, pcCase.instanceId);
assert.equal(motherboard.mount.mode, "attached");

assert.equal(cpu.mount.target?.category, "motherboard");
assert.equal(cpu.mount.target?.anchor, "cpuSocket");
assert.equal(cpu.mount.target?.instanceId, motherboard.instanceId);
assert.equal(cpu.mount.mode, "attached");

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

const replacedGpuPlan = getAssemblyPlan({
  ...defaultSelection,
  gpu: "rtx-5060-ti",
});
const replacedGpu = replacedGpuPlan.instancesByCategory.gpu;
assert.equal(replacedGpu?.partId, "rtx-5060-ti");
assert.equal(
  replacedGpu?.mount.target?.anchor,
  "pcieX16",
  "replacing GPU should keep the motherboard PCIe x16 installation",
);
assert.equal(
  replacedGpu?.mount.secondaryTargets?.[0]?.slotId,
  "expansion.rear",
  "replacing GPU should keep the case expansion-slot reference",
);

const removedGpuPlan = getAssemblyPlan({
  ...defaultSelection,
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
assert.equal(storage.mount.target?.instanceId, motherboard.instanceId);
assert.equal(storage.mount.mode, "attached");

assert.equal(psu.mount.target?.category, "case");
assert.equal(psu.mount.target?.anchor, "psuBay");
assert.equal(psu.mount.target?.slotId, "psu-bay.main");
assert.equal(psu.mount.target?.slotKind, "psuBay");
assert.equal(psu.mount.target?.instanceId, pcCase.instanceId);
assert.equal(psu.mount.mode, "attached");

const replacedPsuPlan = getAssemblyPlan({
  ...defaultSelection,
  psu: "rog-1000-platinum",
});
const replacedPsu = replacedPsuPlan.instancesByCategory.psu;
assert.equal(replacedPsu?.partId, "rog-1000-platinum");
assert.equal(
  replacedPsu?.mount.target?.slotId,
  "psu-bay.main",
  "replacing PSU should preserve the case PSU bay installation",
);

const removedPsuPlan = getAssemblyPlan({
  ...defaultSelection,
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

const overLengthGpuPlan = getAssemblyPlan({
  ...defaultSelection,
  case: "jonsbo-d31",
  gpu: "rtx-4080-super",
});
assert.equal(
  overLengthGpuPlan.instancesByCategory.gpu,
  undefined,
  "over-length GPU should not create a fake installable 3D instance",
);
assert.ok(
  overLengthGpuPlan.validationIssues.some(
    (issue) =>
      issue.id === "gpu:rtx-4080-super:gpu-length-over-clearance",
  ),
  "over-length GPU should report an instance-scoped assembly conflict",
);

const wideGpu = catalog.gpu.find((part) => part.id === "rtx-5060-ti");
assert.ok(wideGpu, "test GPU fixture should exist");
const originalSlotWidth = wideGpu.totalSlotWidth;
wideGpu.totalSlotWidth = 8;
try {
  const overSlotGpuPlan = getAssemblyPlan({
    ...defaultSelection,
    case: "jonsbo-d31",
    gpu: "rtx-5060-ti",
  });
  assert.equal(
    overSlotGpuPlan.instancesByCategory.gpu,
    undefined,
    "over-slot GPU should not create a fake installable 3D instance",
  );
  assert.ok(
    overSlotGpuPlan.validationIssues.some(
      (issue) =>
        issue.id === "gpu:rtx-5060-ti:gpu-slot-width-over-expansion",
    ),
    "over-slot GPU should report an instance-scoped assembly conflict",
  );
} finally {
  wideGpu.totalSlotWidth = originalSlotWidth;
}

assert.equal(fans.length, 3, "default 3-pack fan selection should install 3 fans");
assert.deepEqual(
  fans.map((fan) => fan.mount.target?.slotId),
  ["fan.front.120.1", "fan.front.120.2", "fan.front.120.3"],
  "default fan pack should occupy the front fan slots in priority order",
);

for (const fan of fans) {
  assert.equal(fan.mount.target?.category, "case");
  assert.equal(fan.mount.target?.slotKind, "fanMount");
  assert.equal(fan.mount.target?.instanceId, pcCase.instanceId);
  assert.equal(fan.mount.mode, "attached");
  assert.equal(
    fan.position[0],
    1.18,
    "front fans should mount inside the case front panel instead of outside the chassis",
  );
  assert.equal(
    fan.rotation[1],
    1.5708,
    "front fan models should face the case front fan mount plane",
  );
}

const singleFanPlan = getAssemblyPlan(defaultSelection, {
  fanInstallations: [
    {
      instanceId: "fans:single-front-middle",
      partId: "thermalright-tl-c12c-3",
      slotId: "fan.front.120.2",
    },
  ],
});
const singleFans = singleFanPlan.instances.filter(
  (instance) => instance.category === "fans",
);
assert.equal(singleFans.length, 1, "explicit fan state should support one fan");
assert.equal(singleFans[0]?.instanceId, "fans:single-front-middle");
assert.equal(singleFans[0]?.mount.target?.slotId, "fan.front.120.2");

const fanState = toFanInstallationState(fans);
const replacedPlan = getAssemblyPlan(defaultSelection, {
  fanInstallations: fanState.map((fan) =>
    fan.slotId === "fan.front.120.2"
      ? { ...fan, partId: "lianli-sl-inf-3" }
      : fan,
  ),
});
const replacedFan = replacedPlan.instances.find(
  (instance) => instance.mount.target?.slotId === "fan.front.120.2",
);
assert.equal(replacedFan?.partId, "lianli-sl-inf-3");
assert.equal(
  replacedFan?.instanceId,
  fans.find((fan) => fan.mount.target?.slotId === "fan.front.120.2")?.instanceId,
  "replacing a fan should preserve the installed fan instance id",
);

const removedPlan = getAssemblyPlan(defaultSelection, {
  fanInstallations: fanState.filter((fan) => fan.slotId !== "fan.front.120.2"),
});
const remainingFanSlots = removedPlan.instances
  .filter((instance) => instance.category === "fans")
  .map((instance) => instance.mount.target?.slotId);
assert.deepEqual(
  remainingFanSlots,
  ["fan.front.120.1", "fan.front.120.3"],
  "removing one fan should preserve the other installed fan instances",
);

const tooManyFanPlan = getAssemblyPlan(defaultSelection, {
  fanInstallations: [
    ...fanState,
    {
      instanceId: "fans:invalid-side-slot",
      partId: "thermalright-tl-c12c-3",
      slotId: "fan.side.120.1",
    },
  ],
});
assert.equal(
  tooManyFanPlan.instances.filter((instance) => instance.category === "fans").length,
  3,
  "invalid requested fan slots should not create fake fan placements",
);
assert.ok(
  tooManyFanPlan.validationIssues.some(
    (issue) => issue.id === "fans:invalid-side-slot:missing-fan-slot",
  ),
  "invalid requested fan slots should report a clear conflict",
);

const calibrationCasePlan = getAssemblyPlan({
  ...defaultSelection,
  case: "calibration-open-frame",
});
const calibrationFans = calibrationCasePlan.instances.filter(
  (instance) => instance.category === "fans",
);
assert.equal(
  calibrationCasePlan.validationIssues.length,
  0,
  "calibration case should provide complete mount metadata for the default build",
);
assert.deepEqual(
  calibrationFans.map((fan) => fan.mount.target?.slotId),
  ["fan.front.120.1", "fan.front.120.2", "fan.front.120.3"],
  "calibration case should let default fan pack visibly occupy the three front fan mounts",
);
assert.deepEqual(
  calibrationFans.map((fan) => fan.position),
  [
    [1.18, 0.52, 0.14],
    [1.18, 0, 0.14],
    [1.18, -0.52, 0.14],
  ],
  "calibration case fan positions should match the visible front fan rails",
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
