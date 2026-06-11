# 开发任务拆解: 参数驱动的真实 3D 主机装配系统

Source PRD: `docs/prd/anchor-based-realistic-pc-assembly.md`

Issue tracker is not configured in this workspace, so these are local Markdown issue drafts. Publish them to GitHub / Linear only after the breakdown is approved.

## Proposed Breakdown

1. **Build an installed-part assembly graph for the current default build**
   - **Type:** AFK
   - **Blocked by:** None - can start immediately
   - **User stories covered:** 2, 3, 4, 6, 15, 16, 25, 40, 41, 42

2. **Promote case mount inventory from single anchors to named install slots**
   - **Type:** AFK
   - **Blocked by:** 1
   - **User stories covered:** 1, 7, 8, 17, 18, 34, 36, 39

3. **Install, replace, and remove individual case fan instances**
   - **Type:** AFK
   - **Blocked by:** 1, 2
   - **User stories covered:** 7, 8, 9, 10, 11, 23, 24, 43, 44

4. **Mount PSU into the case PSU bay with replace and remove behavior**
   - **Type:** AFK
   - **Blocked by:** 1, 2
   - **User stories covered:** 6, 14, 21, 23, 44

5. **Make GPU insertion follow motherboard PCIe and case expansion geometry**
   - **Type:** AFK
   - **Blocked by:** 1, 2
   - **User stories covered:** 4, 5, 12, 13, 20, 22, 23, 44

6. **Split cooling into air-cooler and AIO pump/radiator installation paths**
   - **Type:** AFK
   - **Blocked by:** 1, 2
   - **User stories covered:** 16, 17, 18, 22, 23, 44

7. **Support storage as installed M.2 instances on motherboard slots**
   - **Type:** AFK
   - **Blocked by:** 1
   - **User stories covered:** 15, 23, 43, 44

8. **Show spatial compatibility conflicts in the scene and summary panel**
   - **Type:** AFK
   - **Blocked by:** 3, 4, 5, 6
   - **User stories covered:** 19, 20, 21, 22

9. **Upgrade debug calibration for slot-based assets**
   - **Type:** AFK
   - **Blocked by:** 1, 2, 3, 4
   - **User stories covered:** 31, 32, 33, 36, 37, 38, 39, 45

10. **Create an asset intake and validation workflow for production GLB assets**
    - **Type:** HITL
    - **Blocked by:** 1, 9
    - **User stories covered:** 25, 26, 31, 32, 33, 39

11. **Polish the technical assembly workbench visual experience**
    - **Type:** HITL
    - **Blocked by:** 3, 4, 5
    - **User stories covered:** 24, 28, 29, 30, 46, 47

12. **Add persistent regression coverage for realistic assembly workflows**
    - **Type:** AFK
    - **Blocked by:** 3, 4, 5, 6, 7, 8
    - **User stories covered:** 40, 41, 42, 43, 44, 45, 46

## Issue Drafts

## 1. Build an installed-part assembly graph for the current default build

### What to build

Create the first end-to-end assembly graph that converts the current build selection into installed part instances. The default build should still render case, motherboard, CPU, GPU, storage, cooling, PSU and fans, but scene rendering should consume installed instances rather than category-only placements.

This slice establishes the product boundary: catalog selection chooses parts, while the assembly graph decides what is installed, where it attaches, and what transform the scene should render.

### Acceptance criteria

- [ ] The current default build produces deterministic installed instances for all selected categories with stable instance ids.
- [ ] Each installed instance exposes part id, category, model asset, mount relationship, transform, visibility and debug metadata.
- [ ] The 3D scene consumes the installed assembly result without embedding category-specific mount rules inside render components.
- [ ] Current anchor behavior for case, motherboard, CPU, GPU, storage, cooling, PSU and fans remains visually functional.
- [ ] Unit coverage asserts that CPU aligns to motherboard socket, GPU aligns to motherboard PCIe, PSU aligns to case PSU bay, and storage aligns to motherboard M.2 for representative metadata.

### Blocked by

None - can start immediately

## 2. Promote case mount inventory from single anchors to named install slots

### What to build

Upgrade case model metadata from a few generic anchors into a structured mount inventory. A case should expose named install slots for motherboard tray, PSU bay, expansion slots, fan mounts, radiator mounts and future storage bays. The builder should use those slots to decide valid installation targets.

Debug mode should show these named slots so model calibration and user-facing placement can be reasoned about with real case vocabulary.

### Acceptance criteria

- [ ] Case assets can declare multiple fan mounts, radiator mounts and expansion slots with position, orientation, size support and labels.
- [ ] Existing case records are migrated from `frontFanMount` style anchors to structured mount inventory without breaking the default scene.
- [ ] Debug mode labels case install slots by name and group.
- [ ] Invalid or incomplete case mount metadata produces a clear local validation error or warning.
- [ ] Tests cover at least one case with front fan mounts, top radiator mount, PSU bay and motherboard tray.

### Blocked by

- Issue 1

## 3. Install, replace, and remove individual case fan instances

### What to build

Make fans the first true multi-instance installation flow. A fan pack should expand into individual installed fan instances. The system should assign default case fan mounts, allow the user to choose a fan mount group, allow replacing one fan model while preserving the slot, and allow removing one fan without affecting the rest of the build.

This must be demoable from the Builder UI and visible in the 3D scene.

### Acceptance criteria

- [ ] A 3-pack fan selection renders three separate fan instances when the selected case has enough compatible mounts.
- [ ] Each fan instance has a stable id and selected case mount slot.
- [ ] The UI allows selecting one installed fan instance from the scene or a list.
- [ ] The user can remove one fan instance without removing other fans or resetting the build.
- [ ] The user can replace one fan instance with another fan part and keep the same mount slot when compatible.
- [ ] If the case has fewer compatible fan mounts than requested, the system renders only valid installations and reports a clear conflict.
- [ ] Tests cover one fan, a 3-pack, too many fans, replacement and removal.

### Blocked by

- Issue 1
- Issue 2

## 4. Mount PSU into the case PSU bay with replace and remove behavior

### What to build

Make PSU installation follow the selected case PSU bay. The user should see the PSU installed in the correct compartment and should be able to remove or replace it without disturbing other installed parts.

This slice should also connect PSU fit constraints to the installed scene state.

### Acceptance criteria

- [ ] PSU position is derived from the case PSU bay mount rather than a loose fallback coordinate.
- [ ] Replacing the PSU preserves the PSU bay installation when the new PSU fits.
- [ ] Removing the PSU hides only the PSU instance and keeps case, motherboard, GPU, fans and cooling unchanged.
- [ ] PSU form factor and length conflicts appear in the compatibility panel and are associated with the PSU instance.
- [ ] Tests cover valid ATX PSU, unsupported PSU form factor, excessive PSU length, replacement and removal.

### Blocked by

- Issue 1
- Issue 2

## 5. Make GPU insertion follow motherboard PCIe and case expansion geometry

### What to build

Improve GPU installation so it aligns to both motherboard PCIe x16 and case expansion slot geometry. The card should look inserted into the motherboard and oriented toward the case expansion slots. Replacement and removal should work without resetting the rest of the build.

### Acceptance criteria

- [ ] GPU transform is derived from GPU PCIe connector, motherboard PCIe x16 anchor and case expansion direction.
- [ ] GPU slot width and length constraints remain visible through compatibility results.
- [ ] Replacing the GPU keeps the same PCIe slot and updates clearance warnings if dimensions change.
- [ ] Removing the GPU hides only the GPU instance and preserves all other installed parts.
- [ ] Debug mode shows PCIe connector, motherboard PCIe anchor and case expansion slot references.
- [ ] Tests cover valid GPU, over-length GPU, over-slot GPU, replacement and removal.

### Blocked by

- Issue 1
- Issue 2

## 6. Split cooling into air-cooler and AIO pump/radiator installation paths

### What to build

Support cooling as real installed geometry instead of one generic part. Air coolers should mount to the CPU socket and respect cooler height. AIO coolers should install as related instances: pump block on CPU socket and radiator on a supported case radiator mount.

### Acceptance criteria

- [ ] Air cooler installation attaches to the motherboard CPU socket.
- [ ] AIO installation creates separate pump and radiator instances linked to the same cooling part.
- [ ] AIO pump attaches to CPU socket while radiator attaches to a valid case radiator mount.
- [ ] Unsupported radiator size or missing mount produces a clear conflict and does not silently place the radiator elsewhere.
- [ ] Removing cooling removes all cooling-related instances and preserves unrelated parts.
- [ ] Tests cover air cooler, valid AIO, unsupported radiator size and removal.

### Blocked by

- Issue 1
- Issue 2

## 7. Support storage as installed M.2 instances on motherboard slots

### What to build

Make storage installation instance-based for motherboard M.2 slots. The first release should support M.2 SSDs and should leave room for future 2.5-inch and 3.5-inch storage bays.

### Acceptance criteria

- [ ] M.2 storage parts install to motherboard M.2 slot anchors.
- [ ] Multiple M.2-capable storage instances can be represented when the motherboard has enough slots.
- [ ] Removing one storage instance preserves other installed parts.
- [ ] If no M.2 slot is available, the storage part is not placed into a fake position and a clear conflict is shown.
- [ ] Tests cover one M.2 drive, multiple M.2 drives and missing-slot behavior.

### Blocked by

- Issue 1

## 8. Show spatial compatibility conflicts in the scene and summary panel

### What to build

Connect compatibility results to scene-level feedback. When a selected part has a spatial conflict, the user should see it in the compatibility panel and also understand which installed instance or mount is involved in the 3D scene.

### Acceptance criteria

- [ ] Spatial conflicts are associated with installed part instances or mount slots.
- [ ] GPU length, GPU slot width, PSU form factor, PSU length, cooler height and radiator support conflicts are visible in the summary panel.
- [ ] Scene feedback highlights the relevant installed part or mount without overwhelming normal preview mode.
- [ ] Conflict feedback does not move parts to impossible fallback positions.
- [ ] Tests cover at least one scene-associated conflict for GPU, PSU and cooling.

### Blocked by

- Issue 3
- Issue 4
- Issue 5
- Issue 6

## 9. Upgrade debug calibration for slot-based assets

### What to build

Extend debug mode so slot-based assets can be calibrated without falling back to one-off scene coordinates. Debug tools should support selecting installed instances and mount slots, nudging/flipping, and exporting changes back to the correct model asset or case mount inventory.

### Acceptance criteria

- [ ] Debug mode lists installed instances and case mount slots separately.
- [ ] Keyboard nudge, flip and selection behavior works for installed instances.
- [ ] Exported changes update anchor or slot metadata rather than raw root positions when an instance has a parent mount.
- [ ] Local debug export remains disabled in production.
- [ ] Export results identify which asset or slot was updated.
- [ ] Tests cover patch generation for root fallback, attached anchor updates, rotation updates and case mount slot updates.

### Blocked by

- Issue 1
- Issue 2
- Issue 3
- Issue 4

## 10. Create an asset intake and validation workflow for production GLB assets

### What to build

Define and implement a repeatable asset intake workflow so real GLB / glTF models can be added safely. This should validate normalized axes, bounding boxes, required anchors, required case mount inventory and production asset URLs.

This slice is marked HITL because visual quality and real product resemblance require human review before assets are considered production-ready.

### Acceptance criteria

- [ ] Asset validation reports missing required fields by category and mount type.
- [ ] The workflow distinguishes commerce images, OpenDB parameters and 3D model assets.
- [ ] Assets without required metadata are blocked from 3D installation or clearly marked as not installable.
- [ ] Production model URLs can be validated against the public asset store path.
- [ ] A maintainer checklist exists for visual review: orientation, scale, texture quality, anchor accuracy and source attribution.
- [ ] At least one case, GPU, PSU and fan asset passes the validation workflow.

### Blocked by

- Issue 1
- Issue 9

## 11. Polish the technical assembly workbench visual experience

### What to build

Refine the normal builder view so it feels like a premium technical assembly workstation. The visual language should remain restrained: black surface, CAD-like grid, PCB-like signals, subtle diagnostic scan and clear model lighting. It should not expose debug wireframes in normal mode.

This slice is marked HITL because the user should approve the final feel.

### Acceptance criteria

- [ ] Normal mode shows clean installed parts with optional subtle mount hover or selection feedback.
- [ ] Debug-only visuals remain hidden unless debug mode is active.
- [ ] Technical background effects respect reduced-motion preferences.
- [ ] Selected installed part feedback is visible but not distracting.
- [ ] The visual design supports common viewport sizes without text or controls overlapping the 3D canvas.
- [ ] User review confirms the result feels technical, realistic and not like a decorative landing page.

### Blocked by

- Issue 3
- Issue 4
- Issue 5

## 12. Add persistent regression coverage for realistic assembly workflows

### What to build

Add durable tests for the core realistic assembly workflows so future model and catalog changes do not break placement, replacement, removal or compatibility behavior.

### Acceptance criteria

- [ ] Assembly engine tests cover default build placement and installed instance identity.
- [ ] UI-level tests cover installing, replacing and removing fan, PSU, GPU, cooling and storage where implemented.
- [ ] Asset schema validation tests cover valid and invalid metadata for each supported category.
- [ ] Compatibility tests verify conflict text and scene-associated conflict metadata.
- [ ] Canvas smoke checks verify model loading does not throw for representative assets.
- [ ] The project validation command set documents which checks should run before merging assembly changes.

### Blocked by

- Issue 3
- Issue 4
- Issue 5
- Issue 6
- Issue 7
- Issue 8

## Review Questions

1. Does this granularity feel right, or should fan / PSU / GPU be merged into a larger first implementation milestone?
2. Are the dependency relationships correct?
3. Should the HITL slices be limited to asset intake and final visual polish, or should fan mount UX also require explicit design review?
4. Should these remain local Markdown tasks, or should I publish them to GitHub issues after you confirm the breakdown?
