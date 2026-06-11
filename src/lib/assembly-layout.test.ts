import assert from "node:assert/strict";

import { getAssemblyPlan } from "~/lib/assembly-layout";
import { defaultSelection, type CategoryId } from "~/lib/catalog";

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
];

const plan = getAssemblyPlan(defaultSelection);

assert.deepEqual(
  plan.instances.map((instance) => instance.category),
  expectedOrder,
  "default build should produce instances in deterministic assembly order",
);

for (const instance of plan.instances) {
  assert.equal(
    instance.instanceId,
    `${instance.category}:${instance.partId}`,
    `${instance.category} should expose a stable category-part instance id`,
  );
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
const fans = requireInstance("fans");

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

assert.equal(storage.mount.target?.category, "motherboard");
assert.equal(storage.mount.target?.anchor, "m2Slot");
assert.equal(storage.mount.target?.instanceId, motherboard.instanceId);
assert.equal(storage.mount.mode, "attached");

assert.equal(psu.mount.target?.category, "case");
assert.equal(psu.mount.target?.anchor, "psuBay");
assert.equal(psu.mount.target?.instanceId, pcCase.instanceId);
assert.equal(psu.mount.mode, "attached");

assert.equal(fans.mount.target?.category, "case");
assert.equal(fans.mount.target?.anchor, "frontFanMountMiddle");
assert.equal(fans.mount.target?.slotId, "fan.front.120.2");
assert.equal(fans.mount.target?.slotKind, "fanMount");
assert.equal(fans.mount.target?.instanceId, pcCase.instanceId);
assert.equal(fans.mount.mode, "attached");
assert.equal(
  fans.position[0],
  1.18,
  "front fan should mount inside the case front panel instead of outside the chassis",
);
assert.equal(
  fans.rotation[1],
  1.5708,
  "front fan model should face the case front fan mount plane",
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
