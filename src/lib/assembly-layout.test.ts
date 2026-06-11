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

function requireInstance(category: CategoryId) {
  const instance = plan.instancesByCategory[category];
  assert.ok(instance, `${category} instance should exist`);
  return instance;
}
