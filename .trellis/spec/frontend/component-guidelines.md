# Component Guidelines

> How components are built in this project.

---

## Overview

<!--
Document your project's component conventions here.

Questions to answer:
- What component patterns do you use?
- How are props defined?
- How do you handle composition?
- What accessibility standards apply?
-->

(To be filled by the team)

---

## Component Structure

<!-- Standard structure of a component file -->

(To be filled by the team)

---

## Props Conventions

<!-- How props should be defined and typed -->

(To be filled by the team)

---

## Styling Patterns

<!-- How styles are applied (CSS modules, styled-components, Tailwind, etc.) -->

Use the existing global CSS class naming pattern for page-level and complex
interactive surfaces. Keep state classes explicit, for example
`.is-debug-mode` on a parent shell and targeted descendant selectors for the
layout changes it controls.

---

## Accessibility

<!-- A11y requirements and patterns -->

(To be filled by the team)

### Builder Inventory Overlays Separate Selection From Mutation

Builder product selection surfaces should keep browsing, inspection, purchase,
and build mutation as separate user actions.

Required behavior:
- Use a viewport-bound overlay such as `position: fixed` for focused inventory
  or equipment-picker flows. Do not expand long product lists inside the narrow
  Builder sidebar.
- Category `+` actions may open the inventory, but product-card clicks should
  only select a candidate and show details. Build state changes only through an
  explicit `Add to build` action.
- Purchase links must open external channels without mutating the build.
- Score deltas should be derived by temporarily applying the candidate to the
  current selection and reusing the existing build scoring function.
- Product selection UI must not write model anchors, debug calibration patches,
  or final scene coordinates.

Wrong:
```tsx
<ProductCard onClick={() => setSelection({ ...selection, gpu: part.id })} />
```

Correct:
```tsx
<ProductCard onClick={() => setSelectedCandidate(part.id)} />
<button onClick={() => addToBuild(selectedCandidate)}>Add to build</button>
```

---

## Common Mistakes

<!-- Component-related mistakes your team has made -->

### Canvas Debug Overlays Must Be Viewport-Bound

3D maintenance panels rendered over a Canvas must not rely on the Canvas
container's internal height or pointer model as the only way to operate the UI.

Required behavior:
- Entering a debug/calibration mode should prioritize the 3D work area and hide
  non-essential builder UI.
- Keep an obvious exit control visible outside the debug panel.
- Position maintenance panels with viewport-bound layout such as `position:
  fixed` when they can outgrow the Canvas container.
- Give every long debug menu and nested option list explicit `max-height` plus
  `overflow: auto`.
- Provide list-based selection for debug targets; mesh picking can be a shortcut
  but cannot be the only selection path.

Wrong:
```css
.scene-debug-tools {
  position: absolute;
  bottom: 16px;
  left: 16px;
}
```

Correct:
```css
.app-shell.is-debug-mode .scene-debug-tools {
  position: fixed;
  top: 16px;
  right: 16px;
  bottom: 16px;
  overflow-y: auto;
}
```
