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
