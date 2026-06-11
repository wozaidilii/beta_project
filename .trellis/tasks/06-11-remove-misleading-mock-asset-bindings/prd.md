# PRD: Remove misleading mock 3D asset bindings

## Problem

The builder currently binds real purchasable products to generic or unrelated GLB/glTF assets. The most visible example is `lianli-o11-air-mini` using `/models/gaming_pc_case.glb`, which makes the UI imply a real Lian Li O11 Air Mini model when the asset is only a generic case mesh. The same issue affects other real product IDs that are treated as 3D installable because they have unverified model metadata.

This is misleading and also makes assembly debugging impossible to reason about: when a fan looks wrong, it is unclear whether the assembly engine is wrong or the underlying model/anchor data is fake.

## Goal

Separate real commerce products from generated calibration assets. Real products should remain selectable and purchasable, but they must not render fake 3D geometry unless they have a verified calibrated model record. The 3D builder should use an explicitly labeled calibration setup for assembly validation.

## Requirements

- Remove local model override records that bind real product IDs to generic, unrelated, or unverified 3D assets.
- Remove stale scraped `model` fields from real product data, and prevent scraped data from injecting 3D installability.
- Keep real catalog products, pricing, thumbnails and purchase links available in product/setup surfaces.
- Introduce a clearly named calibration selection for the 3D builder and model validation tests.
- Use generated calibration assets where they are intended to validate assembly logic, not represent real products.
- Ensure product lists no longer depend on `hasModelAsset`; purchasable products should not disappear because their 3D model is unavailable.
- Ensure 3D scene rendering still uses only parts with calibrated model assets.
- Make validation enforce the calibration selection instead of forcing every default commerce product to have a local model override.

## Out of Scope

- Downloading or certifying real Lian Li, MSI, ASUS, Thermalright, etc. production assets.
- Building a full vendor/CAD ingestion workflow.
- Solving final visual fidelity for real PC products.
- Reworking scoring, compatibility, or purchase flows beyond removing the fake 3D gate.

## Asset Strategy Decision

For now, generate and maintain a small calibration asset set for proving the assembly graph. Real product models should be added later only when an intake record includes trustworthy axes, bounds, anchors and mount slots. Generic Sketchfab meshes are acceptable as candidate downloads or visual inspiration, but not as real product bindings.

## Acceptance Criteria

- `lianli-o11-air-mini` no longer maps to `/models/gaming_pc_case.glb`.
- Real catalog products without verified models remain visible in product and inventory lists.
- The default 3D builder scene uses a clearly labeled calibration setup, not a fake real-product setup.
- `src/data/local-model-assets.json` contains calibration-only trusted model records or genuinely verified records, with no misleading real-product-to-generic-model binding.
- `src/data/scraped-core-parts.json` no longer carries stale `model` fields for real products.
- `npm run validate:models`, `npm run test:assembly`, `npm run test:render-bounds`, `npm run typecheck`, `npm run lint` and `npm run build` pass.

## grill-with-docs Status

I did not run the full question-by-question `grill-with-docs` interview. I read the skill, `docs/CONTEXT.md`, previous Trellis task artifacts and current code, then used its evidence-first rule. The boundary is already established in project language: crawled product specs decide compatibility, GLB asset metadata supplies scene coordinates, and debug/calibration is an asset-maintainer workflow. The user explicitly requested removing misleading mock data.
