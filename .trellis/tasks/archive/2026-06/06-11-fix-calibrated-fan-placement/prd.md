# PRD: Fix calibrated fan placement

## Problem

The previous calibration asset intake task reduced the trusted model database to a small core set, but the builder still renders fans away from their intended case fan mounts. That means the branch does not yet meet its real goal: current trusted assets should install into visually and semantically correct positions.

## Goal

For the current default build assets, case fans must visibly mount on the case fan positions in the 3D builder, not merely pass semantic assembly tests.

## Scope

- Fix the retained case/fan asset metadata or render transform logic needed for correct fan placement.
- Keep the trusted model database small; do not re-add uncalibrated assets.
- Add a regression check that catches visual-space fan placement drift.
- Preserve the existing assembly graph rule: installed position comes from parent slots and child anchors, not naked per-instance coordinates.

## Acceptance Criteria

- Default `thermalright-tl-c12c-3` fan instances render at the three front fan mount positions of the retained case asset.
- Fan instances remain attached to concrete `fanMount` slots and can still be removed individually.
- The validation/test suite fails if the fan slot coordinates no longer line up with the rendered case/fan coordinate space.
- No untrusted model records are reintroduced into `src/data/local-model-assets.json`.

## grill-with-docs Status

I did not run the full question-by-question `grill-with-docs` interview. This is a bug against an already-confirmed domain rule in `docs/CONTEXT.md`: final installed positions must come from the assembly graph aligning part anchors to parent mount slots. Existing docs and code are sufficient to proceed.
