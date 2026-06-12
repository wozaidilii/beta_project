# Implement: Remove misleading mock 3D asset bindings

1. Add/confirm calibration-only part IDs for each category needed by the 3D validation setup.
2. Rewrite `local-model-assets.json` so misleading real product bindings are removed.
3. Remove stale `model` fields from scraped real product data and stop importing scraped model metadata.
4. Export `calibrationSelection` and initialize the builder with it.
5. Change product and inventory list filters so real products remain visible without model assets.
6. Update model validation and tests to use the calibration setup.
7. Run model validation, assembly/render tests, typecheck, lint and build.
