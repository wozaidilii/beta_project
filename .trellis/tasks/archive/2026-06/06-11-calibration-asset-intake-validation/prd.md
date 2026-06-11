# PRD: Calibration asset intake validation

## Problem

The builder currently mixes trusted and untrusted model overrides in `src/data/local-model-assets.json`. Many entries point to downloaded Sketchfab or ad-hoc GLB assets whose axes, scale, bounds and anchors are not verified. That makes the main builder scene look unreliable even though the assembly engine already works from anchor and mount-slot metadata.

We need to clear unusable model overrides from the trusted model database and replace them with a small calibration set whose metadata follows the intake contract. Product catalog data, domestic prices, thumbnails and OpenDB compatibility parameters should stay available; only 3D installability should be narrowed to assets that pass validation.

## Scope

- Keep product/catalog data intact.
- Replace the local model override layer with a calibration-only set.
- Use existing local calibration assets where possible instead of introducing new downloaded models.
- Add a repeatable asset intake validator that fails on missing required model metadata.
- Connect the validator to package scripts so future model additions can be checked before merge.
- Preserve the existing assembly test behavior against the calibration set.

## In Scope

- A trusted calibration case with structured mount slots.
- One representative 3D installable product per core category needed by the default build.
- Required metadata validation for `assetAxis`, `boundingBoxMm`, `anchorPoints`, `placement`, and case/motherboard mount slots.
- Verification that local model asset ids still map to real catalog products.
- Verification that referenced local model files exist.
- Regression tests that assert the default build still assembles cleanly.

## Out of Scope

- Downloading new third-party GLB/CAD assets.
- Cleaning physical files under `public/models/`; this task only removes unusable records from the trusted model database.
- Final visual asset polish.
- Full browser-based calibration UI.
- Production asset-admin workflow.

## Acceptance Criteria

- `src/data/local-model-assets.json` no longer lists broad uncalibrated model overrides as trusted installable records.
- Any retained downloaded/ad-hoc model source must pass the same intake metadata validator as local calibration assets.
- The remaining local model asset records form a coherent calibration build.
- Running the new validation command succeeds for the calibration model database.
- Removing a required anchor, mount slot, bounding box or local asset file would fail validation.
- `npm run test:assembly`, type-check, lint and build continue to pass.

## grill-with-docs Status

I did not run the full question-by-question `grill-with-docs` interview. I used its evidence-first workflow by reading the product context, existing PRD/design docs and code. The request boundary is already defined by project facts: keep commerce data separate, make model metadata the 3D installability gate, and treat debug/calibration as an asset-maintainer workflow.
