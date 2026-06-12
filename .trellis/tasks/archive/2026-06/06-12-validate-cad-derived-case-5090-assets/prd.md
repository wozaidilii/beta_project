# Validate CAD-derived case and RTX 5090 assembly assets

## Goal

Validate whether a real CAD source can become a trusted 3D assembly asset for the builder, using the local `LIAN LI_O11 AIR MINI.stp` as the case candidate and an RTX 5090 asset search as the GPU candidate.

## User Problem

Current web-sourced GLB assets can look plausible but lack reliable units, axes, anchors, and mount metadata. This causes fans and GPUs to appear outside the case or rotated incorrectly. The user needs evidence that a CAD-derived intake path can produce assets that install into correct positions.

## Scope

- Install or locate FreeCAD locally for STEP inspection/conversion.
- Validate the local O11 Air Mini STEP file as a source asset.
- Convert or derive a web-renderable case asset when feasible.
- Search the web for a trustworthy RTX 5090 CAD/3D source.
- If no credible 5090 CAD is available, create a clearly labeled spec-derived calibration placeholder only for assembly verification.
- Add asset records only when they meet the project intake contract.
- Verify assembly rules with case, motherboard, fans, PSU, and GPU alignment.

## Out of Scope

- Building a complete production asset marketplace.
- Treating unlicensed community models as deployable real product assets.
- Publishing the original STEP file to production.
- Replacing manual debug calibration with a full authoring tool.

## Acceptance Criteria

- The O11 Air Mini STEP is classified with source format, unit, and conversion status.
- Any generated GLB is normalized and not bound to a real SKU unless source/legal status is explicit.
- The case asset has `boundingBoxMm`, `assetAxis`, and mount anchors for at least motherboard tray, PSU bay, expansion slots, and front fan mounts.
- The GPU candidate has either a trusted source asset or a clearly labeled spec-derived validation asset with PCIe connector anchor and bounding box.
- Project model validation and assembly tests pass.
- The final report states whether real O11 + 5090 assembly was proven, partially proven, or blocked by asset/source limitations.
