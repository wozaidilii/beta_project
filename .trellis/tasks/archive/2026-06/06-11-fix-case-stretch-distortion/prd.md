# PRD: Fix case stretch distortion

## Problem

The previous fan placement fix used `fitMode: "stretch"` on the retained case model. That made fan bounding boxes fit inside the expected coordinates, but it also distorted the case into a skewed/parallelogram-like shape.

## Goal

Keep the current trusted assets installable while preserving the case model's visual shape. The case must render with uniform scaling; fan slots should be recalibrated to that rendered coordinate space.

## Scope

- Remove non-uniform stretch from the complex case asset.
- Recalibrate current case fan mount anchors so the existing default fan pack still renders inside the case.
- Strengthen the render-bounds regression so it fails if a case asset uses non-uniform stretch.
- Keep the local model asset database small and do not reintroduce untrusted models.

## Acceptance Criteria

- `lianli-o11-air-mini` no longer uses `fitMode: "stretch"`.
- Default front fans render within the uniformly scaled case bounds.
- `npm run test:render-bounds` fails if a case model is stretched or if default fans drift outside the case bounds.
- Existing model intake and assembly tests continue to pass.

## grill-with-docs Status

I did not run the full question-by-question `grill-with-docs` interview. This is a regression from the previous implementation: the established domain rule is still that asset calibration must align anchors with rendered geometry without visual distortion.
