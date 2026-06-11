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
4. Extend storage:
   - Represent M.2 drives as installed instances on motherboard M.2 slots.
   - Avoid fake fallback placement when no slot exists.
5. Connect compatibility conflicts to installed instances and slots.
6. Upgrade debug export so attached instances update anchors or slots rather than root coordinates.

## Validation Strategy

Run the project checks after each meaningful implementation slice:

- `rtk npm run test:assembly`
- `rtk npm run typecheck`
- `rtk npm run lint`
- `rtk npm run build`

For UI-affecting changes, run a local dev server and browser/canvas verification when tooling is available.
