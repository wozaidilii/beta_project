# Implement Plan

## Baseline

This task starts from the current local branch, where the assembly system already has:

- Installed part instances generated from the selected build.
- Case mount inventory support for motherboard tray, PSU bay, fan mounts, radiator mounts, expansion slots and storage bays.
- Multi-instance fan installation with replace/remove behavior.
- PSU bay placement with remove behavior.
- A calibration open-frame case asset for validating slot placement.
- Unit tests covering fan and PSU installation behavior.

## Next Development Order

1. Validate the task setup and switch the task from `planning` to `in_progress`.
2. Continue with GPU insertion:
   - Preserve GPU as an installed instance with stable id.
   - Keep PCIe connector alignment to the selected motherboard slot.
   - Add case expansion slot reference to the mounted GPU instance.
   - Preserve replacement/removal behavior without resetting other installed parts.
   - Cover valid GPU, over-length GPU, over-slot GPU, replacement and removal with tests where project data allows.
3. Extend cooling:
   - Keep air coolers attached to CPU socket.
   - Represent AIO pump and radiator as related instances.
   - Attach radiators only to supported case radiator mounts.
4. Make debug mode minimally usable before the remaining asset-sensitive slices:
   - Keep debug mode as an asset-maintainer calibration tool, not the source of normal assembly placement.
   - Let maintainers select installed instances from a stable list instead of relying on mesh picking.
   - Show case mount slots in a separate list so fan, radiator, PSU and expansion positions can be inspected without selecting meshes.
   - Preserve keyboard nudge, flip and export for installed instances.
   - Defer full slot-aware calibration/export and asset intake validation to the later debug calibration slice.
5. Extend storage:
   - Represent M.2 drives as installed instances on motherboard M.2 slots.
   - Avoid fake fallback placement when no slot exists.
6. Connect compatibility conflicts to installed instances and slots.
7. Upgrade debug export so attached instances update anchors or slots rather than root coordinates.

## Validation Strategy

Run the project checks after each meaningful implementation slice:

- `rtk npm run test:assembly`
- `rtk npm run typecheck`
- `rtk npm run lint`
- `rtk npm run build`

For UI-affecting changes, run a local dev server and browser/canvas verification when tooling is available.

## Current Progress

- Steps 2 and 3 are implemented: GPU installation references the motherboard PCIe slot and case expansion slot; cooling supports air cooler CPU attachment and AIO pump/radiator instances.
- Step 4 is implemented as a minimal debug-mode usability fix: maintainers can select installed instances from a list, inspect mount slots from a separate list, avoid accidental movement when a slot is selected, and enter a full-screen debug workspace where ordinary builder UI is hidden and the debug menu scrolls independently.
- Step 5 is implemented for the current single-drive storage scope: M.2 storage attaches to a motherboard `m2Slot` mount slot and is skipped when no structured M.2 slot exists.
- Step 6 is implemented at the issue surface level: assembly validation issues carry instance and slot metadata, and the builder compatibility panel renders those labels.
- Step 7 remains deferred with the full debug calibration flow: slot-aware export, asset intake validation, and richer anchor calibration should stay in the PRD back half rather than this minimal debug fix.
