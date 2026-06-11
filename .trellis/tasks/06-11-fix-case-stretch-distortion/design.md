# Design: Uniform case scale with recalibrated fan slots

## Diagnosis

`fitMode: "stretch"` applies non-uniform scale at the render group. That can visually distort complex GLB hierarchies, especially when meshes have their own rotations. The current case should therefore stay on the default uniform `contain` mode.

With `contain`, the case rendered bounds are smaller than the old `fitSize` coordinate box. The old front fan X coordinate of `1.18` sits outside the uniformly scaled case bounds. Fan mount anchors must move into the actual rendered case coordinate space.

## Fix Strategy

- Remove `fitMode: "stretch"` from the case.
- Keep fan stretch for the simple fan asset because its own rendered dimensions are intentionally calibrated to `fitSize`.
- Move the case front fan anchors from `x = 1.18` to a value inside the uniform case front boundary.
- Update render-bounds test to reject stretched case assets.

## Validation

- `npm run test:render-bounds`
- `npm run validate:models`
- `npm run test:assembly`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
