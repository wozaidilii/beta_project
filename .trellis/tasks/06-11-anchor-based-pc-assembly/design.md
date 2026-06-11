# Design: Anchor-based realistic PC assembly

## Product Boundary

This task continues the parameter-driven 3D PC assembly work. The catalog, compatibility data and model assets stay separate:

- Catalog/product pages own domestic thumbnails, prices and purchase links.
- OpenDB-style data owns physical compatibility parameters.
- Local/Vercel Blob GLB assets own visual appearance, anchors and mount slots.
- The assembly engine converts the current user selection into installed part instances.
- The Three.js scene renders the assembly result and should not contain business mount rules.

## Assembly Model

The case is the root installation context. Case model metadata exposes a mount inventory: motherboard tray, PSU bay, fan mounts, radiator mounts, expansion slots and storage bays. Dependent parts attach by aligning their own anchor to a target anchor or slot:

- Motherboard `mountFace` -> case `motherboardTray`
- CPU `contactPatch` -> motherboard `cpuSocket`
- GPU `pcieConnector` -> motherboard `pcieX16`, then oriented by case expansion geometry
- PSU `mountFace` -> case `psuBay`
- Fans `mountFace` -> compatible case `fanMount` slots
- Storage `m2Edge` -> motherboard `m2Slot`
- Cooling pump/air cooler -> motherboard `cpuSocket`
- AIO radiator -> compatible case `radiatorMount`

Installed instances are distinct from category selections. A single selected fan pack can produce multiple fan instances, and each instance can be removed or replaced without resetting unrelated parts.

Installed instances are the state unit for 3D builder interactions. Catalog categories and product rows can remain product-level surfaces, but the scene, debug controls, replacement, removal, visibility and conflicts should point to concrete installed instances.

MVP realistic assembly means structurally correct semantic installation. It does not require CAD-level physical precision or final production texture quality. If a part lacks a valid slot or anchor, the assembly engine should expose that as unavailable or conflicted instead of hiding it behind a fake fallback placement.

Catalog selection is broader than 3D installation. A part without a usable model asset, slot or anchor can still appear in product and build-summary surfaces, but the scene should render only resolved installed instances.

The assembly graph must not render orphan fallback geometry. A child part that cannot resolve its parent mount target remains selected in configuration state and emits an installation conflict, but it does not become a loose scene instance.

Compatibility is advisory at product-selection time and authoritative at 3D-installation time. Users may select incompatible parts, but the scene should render only structurally installable instances and surface installation conflicts against instance candidates or mount slots.

Setups are declarative inputs to the assembly engine. They store selected products and installed-instance overrides, not final transforms. Reloading a setup should recalculate transforms from the latest model anchors, slots and assembly rules.

Asset calibration write-back is not a production-user feature. Debug mode may export anchor or slot patches for local development and asset-admin review, while production setup uploads remain limited to selections and instance overrides.

## Current Baseline

The local branch already contains the first assembly graph foundation, structured case slots, multi-fan installation behavior, PSU bay mounting, and a calibration open-frame case asset for validating placement changes.

These are treated as baseline work for this Trellis task because they were developed immediately before the task was recreated and still need to be carried through the remaining realistic assembly slices.

## Remaining Design Slices

1. GPU insertion should resolve both motherboard PCIe anchor alignment and case expansion slot orientation/clearance.
2. Cooling should split into air-cooler and AIO pump/radiator installation paths.
3. Storage should become installed M.2 instances instead of a single category placement.
4. Compatibility conflicts should be associated with installed instances or slots so the scene and summary panel describe the same problem.
5. Debug calibration should operate on anchors and slots, not loose scene coordinates.
6. Asset intake should validate required anchors, bounding boxes, axis normalization and production asset URLs before a model can be trusted.

## UX Direction

The builder remains a dark technical workbench. Normal mode should show clean installed hardware and subtle mount affordances. Debug mode can show bounding boxes, anchor points, axes, labels, selectable instance lists, keyboard nudging and export controls.

The application should not fall back to generated placeholder geometry for parts that lack GLB assets. Missing models should be treated as non-visual or unavailable for 3D assembly.
