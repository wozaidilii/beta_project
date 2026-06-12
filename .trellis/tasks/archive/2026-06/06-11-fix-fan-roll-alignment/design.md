# Design: Fan roll calibration

## Diagnosis

The current fan rotation is `[0, 1.5708, 0]`, which rotates the fan normal to the case front plane. The visible 45-degree diamond means the asset also needs an in-plane roll correction.

Because the fan model is symmetric in bounding-box space, bbox containment tests cannot detect this. The assembly test should assert the calibrated rotation metadata directly until a richer visual-orientation test exists.

## Fix Strategy

- Add a 45-degree roll correction to the fan model rotation.
- Keep `fitMode: "stretch"` on the fan only, because it is a simple slab-like asset and render-bounds covers containment.
- Do not change case anchors or fan slot allocation.

## Validation

- `npm run validate:models`
- `npm run test:models`
- `npm run test:assembly`
- `npm run test:render-bounds`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
