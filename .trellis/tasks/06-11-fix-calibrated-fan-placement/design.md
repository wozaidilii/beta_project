# Design: Calibrated fan placement fix

## Feedback Loop

Use two checks:

- Scene-level browser inspection to confirm the reported visual symptom.
- Deterministic assembly/asset tests that compare fan instance positions to calibrated case fan slot positions and ensure untrusted replacements do not render.

## Likely Root Causes

1. The retained case GLB orientation or normalized bounding box does not match the current `frontFanMount*` coordinates.
2. The render layer normalizes GLB geometry with `autoCenter` and `fitSize`, while anchors are stored in already-normalized scene space.
3. The fan GLTF's local axis/thickness does not match the case slot plane.

## Fix Strategy

- Prefer correcting asset metadata in `src/data/local-model-assets.json` when the issue is model-specific.
- Only change shared render logic if the bug is caused by a generic mismatch between model normalization and anchor semantics.
- Keep fan placement slot-driven: `fan.mountFace` aligns to case `fan.front.120.*` slots.

## Regression Strategy

- Add a test seam that asserts visible fan instances occupy the expected case fan slot centers.
- Keep `npm run validate:models` as the gate for required anchor/slot fields.
- Run browser verification after the fix if a dev server can be started.
