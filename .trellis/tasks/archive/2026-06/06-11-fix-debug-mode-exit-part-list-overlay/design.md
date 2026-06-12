# Design

## Root Cause Direction

Critical debug controls should not live inside the Three.js Canvas. The debug menu is product UI, not scene geometry. It should be rendered as a normal DOM sibling of the Canvas so it is independent of GLTF loading, Suspense timing, and drei `Html` implementation details.

## Implementation

- Change `PcScene` to return a fragment containing:
  - the existing `<Canvas>`;
  - `DebugExportOverlay` as a normal DOM component when `debug` is true.
- Change `DebugExportOverlay` to return `<div className="scene-debug-tools">` directly instead of `<Html fullscreen>`.
- Keep anchor labels in `DebugAssembly` using `<Html>` because those labels belong inside the 3D scene and are non-critical.
- Leave `scene-debug-tools` CSS as absolute/fixed overlay. Since it is now a direct child of the scene panel, its existing absolute positioning can work without Canvas dependency.

## Validation Notes

- Use build/type/lint as primary checks.
- If a browser tool is unavailable, validate that the route serves locally via `curl` and document the missing screenshot check.
