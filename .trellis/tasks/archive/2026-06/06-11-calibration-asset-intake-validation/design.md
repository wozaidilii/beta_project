# Design: Calibration model asset intake

## Data Boundary

`src/data/local-model-assets.json` is the trusted 3D model override layer. A part should only appear there when its model metadata is usable by the assembly graph. Catalog rows can still exist without a local model override.

This task does not delete product records from `catalog`, `scraped-core-parts.json` or OpenDB imports. It only removes untrusted scene assets from the 3D installability path.

## Calibration Set

Use a small set of representative catalog product ids for the default build:

- `lianli-o11-air-mini` for the case root and case mount inventory.
- `msi-b850m-mortar` for motherboard anchors and motherboard slots.
- `amd-7800x3d` for CPU socket attachment.
- `pa120-se` for air-cooler socket attachment.
- `rtx-5070-ti` for GPU PCIe attachment.
- `kingston-ddr5-32-6000` for memory attachment.
- `sn850x-2tb` for M.2 storage attachment.
- `seasonic-850-atx3` for PSU bay attachment.
- `thermalright-tl-c12c-3` for multi-fan case mount allocation.

The retained records can come from existing local or downloaded files, but they are trusted only because their axis, bounds, anchors, placement and slot metadata now pass the validator. This task does not certify final visual fidelity.

## Required Intake Contract

Every trusted model record requires:

- `model.kind = "glb"` and `model.assetUrl`.
- Local `/models/...` references must exist under `public/`.
- `model.assetAxis.right`, `model.assetAxis.up`, `model.assetAxis.forward`.
- `model.boundingBoxMm` with category-relevant physical dimensions.
- `model.anchorPoints` including the own placement anchor.
- `model.placement.anchor`.

Category-specific requirements:

- Case: `root`, `motherboardTray`, `psuBay`, `frontFanMount*`, `topRadiator`, `expansionSlots`; mount slots for motherboard tray, PSU bay, front fan mounts, top radiator, expansion and storage.
- Motherboard: `caseMount`, `cpuSocket`, `pcieX16`, `m2Slot`, `dimmSlots`; mount slots for M.2.
- CPU: `socketContact`.
- GPU: `pcieConnector`, placement attaches to motherboard `pcieX16`.
- PSU: `mountFace`, placement attaches to case `psuBay`.
- Fans: `mountFace`, placement attaches to case `frontFanMount`.
- Cooling: `coldPlate`, placement attaches to motherboard `cpuSocket`.
- Storage: `m2Connector`, placement attaches to motherboard `m2Slot`.
- Memory: `dimmSeat`, placement attaches to motherboard `dimmSlots`.

## Validator

Add `scripts/validate-model-assets.mjs` and `npm run validate:models`.

The script should parse the local model asset JSON, check record uniqueness, validate per-category required fields, verify local asset file existence, and ensure each asset id maps to an existing catalog product id by scanning project data sources. It should print concise errors and exit non-zero on failure.

## Tests

Add a focused TypeScript smoke test for model asset validation and keep the existing assembly regression test. Use the validator as a package script so CI/local validation can run the same contract without relying on the UI.
