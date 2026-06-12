# Fix debug mode exit and part list overlay

## Goal

Restore debug mode usability. After entering debug mode, the user must be able to exit debug mode and see the installed part selection list. The previous debug controls were rendered from inside the Three.js Canvas through drei `Html`, which makes the UI depend on Canvas/Suspense/layering behavior and is too fragile for the core calibration workflow.

## User Report

- Clicking "退出调试" has no effect.
- The debug part selection list is not visible.

## Diagnosis Hypotheses

1. The debug tools list is coupled to the Canvas `Html` overlay and can fail to render when Canvas/Suspense/model loading state changes.
2. Canvas/Html overlay layering can intercept or sit above normal DOM controls, making the external exit button unreliable.
3. Debug mode should not require a 3D-rendered HTML bridge for critical UI controls; it should render as ordinary DOM in the scene panel.

## Requirements

- Keep the existing debug selection, nudge, rotate, flip and export behavior.
- Render the debug tools panel as ordinary React DOM outside the `<Canvas>`, not through drei `Html`.
- Keep the panel absolutely positioned within the scene panel and scrollable.
- Ensure the "退出调试" button remains normal DOM and clickable above the scene.
- Do not change model asset positions or rotations in this task.

## Acceptance Criteria

- [ ] Entering debug mode shows the debug tools panel with "部件实例" list.
- [ ] The "退出调试" button exits debug mode.
- [ ] Debug panel still supports instance selection, mount-slot selection, rotation/nudge controls and export.
- [ ] Typecheck, lint and build pass.
- [ ] Relevant focused tests pass or skipped checks are explained.

## Out of Scope

- Changing the correct fan orientation.
- Adding new model calibration data.
- Building browser E2E tests if the browser tool is not available in this session.

## grill-with-docs Status

Not fully called. This is a concrete debug UI regression with a clear failure report and existing product/domain rules. It does not introduce a new domain model or long-term terminology.
