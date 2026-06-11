# Improve builder debug calibration and workbench grid

## Goal

Make the builder usable as a human calibration workspace instead of relying on guessed model rotations. The previous fan roll change rotated the fan in the wrong direction, so the default asset should stop hard-coding that guess. Debug mode should expose enough controls and instructions for a human asset maintainer to select a fan, nudge or rotate it, compare it against the case mount, and export the resulting asset patch.

The builder background should also shift from decorative animated lines to a restrained grid workbench: dark, technical, and useful as spatial reference.

## What I already know

- The product context is a restrained technical 3D PC builder for China-focused DIY PC users.
- `impeccable` context says the interface should feel like a working builder tool and keep model placement inspectable.
- The project already has debug mode, instance selection, mount-slot labels, keyboard nudging, flipping, and local export to `/api/debug/model-anchors`.
- The previous change added `rotation[0] = 0.7854` to `thermalright-tl-c12c-3`; the user reports this direction is wrong and visually worse.
- The long-term PRD already states debug calibration is a local asset-maintainer workflow, not a production user write-back flow.

## Requirements

- Revert the incorrect default 45-degree fan roll guess for the current fan asset.
- Do not try to solve the fan's final real-world orientation automatically in this task.
- Improve debug mode so manual calibration is practical:
  - show the selected instance's current position and rotation values;
  - provide explicit rotation step controls for X/Y/Z axes in both directions;
  - keep keyboard nudging and existing instance/slot lists usable;
  - explain the recommended calibration flow directly in the debug panel.
- Make debug mode clear that exported rotations/anchors are asset calibration patches for maintainers.
- Replace the builder's decorative background with a workbench-like grid floor.
- Preserve the current black technical product UI style and avoid adding decorative marketing visuals.

## Acceptance Criteria

- [ ] Default fan metadata no longer contains the incorrect `rotation[0] = 0.7854` guess.
- [ ] Debug mode lets the user select an installed fan from a list without relying on mesh picking.
- [ ] Debug mode provides visible X/Y/Z rotation step controls and displays current transform values.
- [ ] Debug mode includes concise in-product calibration guidance for fan alignment.
- [ ] Export still writes rotation and anchor/position patches through the existing debug API.
- [ ] Builder background reads as a dark grid workbench, not a decorative animated hero background.
- [ ] Existing model validation, assembly, render-bounds, lint/type/build checks pass or any skipped check is explained.

## Out of Scope

- Automatically discovering the correct fan orientation from the GLB.
- Building a full asset-management backend or review queue.
- Production user write-back of model asset metadata.
- Replacing all current third-party GLB assets.

## Technical Notes

- `src/components/pc-scene.tsx` owns the 3D scene, debug overlay, transform controls, and debug export patch creation.
- `src/components/pc-builder-app.tsx` owns the builder wrapper and current dynamic background markup.
- `src/styles/globals.css` owns the builder and debug-mode visual styling.
- `src/data/local-model-assets.json` owns the current fan asset rotation metadata.
- `src/lib/assembly-layout.test.ts` currently asserts the wrong fan roll correction and must be updated.
- `grill-with-docs` was not fully called: this is a concrete bug/UI repair using existing PRD/domain rules, not a new domain-model decision. Ask the user before major PRD/design gates if a full `grill-with-docs` pass is desired.
