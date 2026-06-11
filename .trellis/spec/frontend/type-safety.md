# Type Safety

> Type safety patterns in this project.

---

## Overview

<!--
Document your project's type safety conventions here.

Questions to answer:
- What type system do you use?
- How are types organized?
- What validation library do you use?
- How do you handle type inference?
-->

(To be filled by the team)

---

## Type Organization

<!-- Where types are defined, shared types vs local types -->

(To be filled by the team)

---

## Validation

<!-- Runtime validation patterns (Zod, Yup, io-ts, etc.) -->

### Scenario: Model Asset Intake Contract

#### 1. Scope / Trigger

- Trigger: any change to `src/data/local-model-assets.json`, model asset paths under `public/models/`, or default build ids in `src/lib/catalog.ts`.
- Reason: the builder treats local model asset records as the trusted 3D installability layer. Catalog products may exist without 3D models, but a model record must be usable by anchor-based assembly.

#### 2. Signatures

- Command: `npm run validate:models`
- Smoke test alias: `npm run test:models`
- Script: `scripts/validate-model-assets.mjs`
- Data file: `src/data/local-model-assets.json`

#### 3. Contracts

Each trusted model asset record must include:

- `id`: catalog product id present in `src/lib/catalog.ts`.
- `externalIds.modelAssetId`: stable model asset id.
- `model.kind`: `"glb"`.
- `model.slot`: one of the project `CategoryId` values.
- `model.assetUrl`: local `/models/...` path that exists under `public/`.
- `model.fitSize`: positive numeric `[x, y, z]`.
- `model.fitMode`: keep complex case/chassis assets on uniform `"contain"`
  scaling unless there is a dedicated visual review proving non-uniform scale
  is safe. `"stretch"` is acceptable for simple slab-like assets only when
  `test:render-bounds` verifies the rendered bbox and anchor space still align.
- `model.rotation`: numeric `[x, y, z]`.
- `model.assetAxis.right/up/forward`: distinct `+x/-x/+y/-y/+z/-z` axes.
- `model.boundingBoxMm`: positive physical dimensions; `lengthMm` or `depthMm`, plus `widthMm` or `thicknessMm`, plus `heightMm`.
- `model.anchorPoints`: named anchors with numeric `position` tuples.
- `model.placement.anchor`: local anchor name.
- `model.placement.attachTo`: required for non-case parts and must target the expected parent anchor.
- `model.mountSlots`: required for parent parts that expose install positions, especially case and motherboard.

#### 4. Validation & Error Matrix

- Missing local file -> validation error.
- Duplicate model id -> validation error.
- Model id not in catalog -> validation error.
- Missing default build model id -> validation error.
- Missing category-required anchor -> validation error.
- Mount slot references a missing anchor -> validation error.
- Missing case/motherboard required slot kind -> validation error.
- Missing category coverage for the core calibration build -> validation error.
- Case/chassis asset uses `fitMode: "stretch"` -> validation error.

#### 5. Good/Base/Bad Cases

- Good: one validated record per core category with real local file references, explicit anchors, placement and slot metadata.
- Base: catalog product exists without `local-model-assets.json` entry; it remains purchasable/listable but is not trusted as a 3D installable part.
- Bad: adding a downloaded GLB path without `assetAxis`, `boundingBoxMm`, anchor points and placement metadata.

#### 6. Tests Required

- Run `npm run validate:models` after every model asset data change.
- Run `npm run test:models` as the package-level smoke test.
- Run `npm run test:assembly` to confirm default calibrated assets still assemble without validation issues.
- Run `npm run test:render-bounds` when changing `fitSize`, `fitMode`, case
  anchors, case mount slots, fan anchors, fan rotation, or category focus
  positions. This catches visual bbox drift and case scale distortion that
  semantic assembly tests cannot see.
- Run `npm run build` for Next.js type and route validation.

#### 7. Wrong vs Correct

Wrong:

```json
{
  "id": "some-gpu",
  "model": {
    "kind": "glb",
    "slot": "gpu",
    "assetUrl": "/models/vendor-gpu.glb"
  }
}
```

Correct:

```json
{
  "id": "some-gpu",
  "model": {
    "kind": "glb",
    "slot": "gpu",
    "assetUrl": "/models/vendor-gpu.glb",
    "assetAxis": { "right": "+x", "up": "+y", "forward": "+z" },
    "boundingBoxMm": { "lengthMm": 304, "heightMm": 140, "thicknessMm": 62.5 },
    "anchorPoints": {
      "pcieConnector": { "position": [0, 0, 0] }
    },
    "placement": {
      "anchor": "pcieConnector",
      "attachTo": { "category": "motherboard", "anchor": "pcieX16" }
    }
  },
  "externalIds": { "modelAssetId": "vendor-gpu" }
}
```

---

## Common Patterns

<!-- Type utilities, generics, type guards -->

(To be filled by the team)

---

## Forbidden Patterns

<!-- any, type assertions, etc. -->

(To be filled by the team)
