# PRD: Fix fan roll alignment

## Problem

Default case fans are installed at the correct front fan slots, but the fan model appears rotated about 45 degrees within the mount plane. The current metadata only points the fan normal toward the case front; it does not correct the fan asset's in-plane roll.

## Goal

The retained default fan asset should visually align with the case fan mounts: front fans should face the case panel and their square frame should align horizontally/vertically with the case, not as a diamond.

## Scope

- Calibrate the current `thermalright-tl-c12c-3` fan model rotation.
- Keep slot-driven fan placement and individual fan removal unchanged.
- Add a regression check that records the expected fan roll metadata.
- Do not add new fan assets.

## Acceptance Criteria

- Default front fans no longer render with a 45-degree in-plane roll.
- Fan instances still target `fan.front.120.1/2/3` and remain inside the case bounds.
- `npm run test:assembly`, `npm run test:render-bounds`, and `npm run validate:models` pass.

## grill-with-docs Status

I did not run the full question-by-question `grill-with-docs` interview. This is an implementation bug in the existing calibration branch; the product boundary is already defined by the assembly source-of-truth language in `docs/CONTEXT.md`.
