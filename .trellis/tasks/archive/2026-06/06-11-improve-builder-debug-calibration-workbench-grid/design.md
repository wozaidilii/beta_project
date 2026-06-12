# Design

## Product Direction

Treat debug mode as a calibration bench. The scene should become visually quieter and more spatially legible when debug is enabled: large 3D canvas, hidden non-debug UI, visible grid floor, object list, slot list, transform values, and explicit controls.

This task avoids another guessed model fix. The correct flow is:

1. Select the fan instance from the debug list.
2. Use X/Y/Z rotation step controls and keyboard nudges to line it up with the visible case mount slot.
3. Compare the fan bbox, anchor label, and mount-slot label.
4. Export the patch once the visual result is correct.
5. Review the resulting `local-model-assets.json` diff before committing.

## Implementation Plan

- Add a `rotateSelectedPart(axis, direction, multiplier)` path in `PcScene` beside existing nudge/flip controls.
- Add a small rotation step constant using 5-degree increments. Shift accelerates to larger steps when using keyboard shortcuts.
- Add keyboard shortcuts that do not conflict with text inputs:
  - arrow keys keep nudging in X/Y;
  - `[` / `]` rotate X;
  - `;` / `'` rotate Y;
  - `,` / `.` rotate Z.
- Extend `DebugExportOverlay` props with current debug positions/rotations and rotate callback.
- Show current selected transform values in compact monospace rows.
- Add concise calibration guidance in the panel.
- Simplify the background component markup to workbench grid layers and update CSS accordingly.
- Revert the current fan `rotation[0]` to `0`.
- Update assembly tests to assert that the default fan no longer includes the rejected roll guess.

## UX Notes

- The debug menu remains pointer-enabled but scrollable, so it does not block the whole scene.
- The large canvas still allows OrbitControls in debug mode when the transform gizmo is not being dragged.
- Use familiar buttons and dense labels; no hero copy, no decorative card grid.
- Workbench grid uses perspective and muted blue/teal lines for spatial reference, not animated background decoration.
