# Implementation: Builder Inventory Product Picker

## Implemented Scope

- Replaced the Builder left picker panel with an installed-parts list.
- Added one `+` action per hardware category to open a focused Part Inventory overlay.
- Reused existing catalog filtering concepts in the inventory: brand, size, color and price range.
- Added product detail inspection with parameters, domestic purchase links, candidate compatibility and score deltas.
- Kept score dimensions to gaming, AI, creator and quiet. No appearance score was added.
- Added explicit `Add to build` mutation. Product-card click only selects a candidate.
- Purchase links open external channels and do not mutate build state.
- Added a pure score-delta helper that reuses the existing build summary calculation.
- Preserved assembly source of truth: the picker mutates selection/fan state only, not model anchors or scene coordinates.

## Files

- `src/components/pc-builder-app.tsx`
- `src/styles/globals.css`
- `src/lib/score-deltas.ts`
- `src/lib/score-deltas.test.ts`
- `.trellis/spec/frontend/component-guidelines.md`
- `.trellis/spec/lessons.md`

## Validation Notes

- `calculateBuild` impact analysis returned HIGH risk, so its scoring semantics were not changed.
- The new helper calls `calculateBuild` instead of duplicating scoring math.
- GitNexus `detect-changes --scope all` reports critical because the main Builder page changed broadly; this is expected for this UI task and is covered by lint, typecheck, build, focused helper tests, assembly tests and browser/CDP smoke checks.

## Completed Checks

- `rtk npm run typecheck`
- `rtk npm run lint`
- `rtk ./node_modules/.bin/tsx src/lib/score-deltas.test.ts`
- `rtk npm run test:assembly`
- `rtk npm run build`
- Chrome CDP desktop smoke test: installed rows, category `+`, overlay, filters, product detail, score deltas, purchase section and Add-to-build close behavior.
- Chrome CDP mobile smoke test: overlay opens at 390px-class viewport without horizontal overflow.
