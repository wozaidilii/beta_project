# Design: Remove misleading mock 3D asset bindings

## Data Boundary

`catalog` remains the source for purchasable products. `local-model-assets.json` is only the trusted 3D installability layer. A real product can be purchasable and scoreable without being 3D installable.

Scraped product data may enrich specs, dimensions, thumbnails and purchase links, but must not inject `model` metadata. 3D installability only comes from trusted model asset records.

## Calibration Selection

Add a separate `calibrationSelection` export for model validation and default 3D assembly validation. This avoids forcing `defaultSelection` commerce products to carry fake model records.

## Product UI

Replace product-list and inventory-list filtering from `hasModelAsset(part)` to a commerce-facing predicate. `hasModelAsset` should stay scoped to 3D rendering and assembly.

## Model Validation

Update the validator to inspect `calibrationSelection` instead of `defaultSelection`, and to continue requiring one calibrated model per category for the validation setup.

## Generated Assets

Use generated calibration assets for the validation setup. These assets must be clearly named and not presented as real products.
