# Implementation Plan

1. Replace `src/data/local-model-assets.json` with the calibration-only trusted set.
2. Add `scripts/validate-model-assets.mjs`.
3. Add `validate:models` and `test:models` package scripts.
4. Use `test:models` as the validator smoke test.
5. Update assembly tests so they no longer require uncalibrated replacement models to render.
6. Run validation:
   - `rtk npm run validate:models`
   - `rtk npm run test:models`
   - `rtk npm run test:assembly`
   - `rtk npm run typecheck`
   - `rtk npm run lint`
   - `rtk npm run build`

## Implementation Notes

- Do not delete product catalog rows.
- Do not delete physical downloaded model files in this task.
- The trusted model database should be intentionally small until each real GLB passes intake.
- Calibration metadata should remain explicit and readable because future assets will copy this pattern.
