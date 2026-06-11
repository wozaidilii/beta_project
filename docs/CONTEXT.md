# PC Assembly Context

This context defines the product language for the 3D PC builder. It captures domain terms that should stay stable across PRDs, Trellis tasks, catalog data, model assets and UI copy.

## Language

**Realistic Assembly**:
A build preview is realistic when parts are installed into structurally correct semantic mounts and invalid missing mounts are surfaced instead of hidden with fake fallback placement. MVP realism does not require millimeter-accurate CAD geometry or production-grade texture fidelity; those belong to asset intake and human calibration.
_Avoid_: Pixel-perfect model realism, CAD accuracy, hand-tuned visual placement

**3D Installable Part**:
A catalog part is 3D installable only when it has a usable model asset and the assembly graph can resolve the required slot or anchor for its installation. Parts that are not 3D installable may remain selectable in catalog and build summaries, but they must not create fake scene instances.
_Avoid_: Placeholder install, fake mounted part, visual fallback part

**Parent Mount Dependency**:
An installed part depends on its required parent mount target. If the parent part, slot or anchor is missing or unresolved, the child part remains in the configuration surfaces but does not render as an orphaned 3D scene instance.
_Avoid_: Orphan fallback, floating child part, guessed parent position

**Installed Instance**:
A scene-level occurrence of a 3D installable part mounted to a specific slot or anchor. Installed instances, not catalog categories, are the unit for 3D selection, replacement, removal, visibility and installation conflicts.
_Avoid_: Category placement, product-level scene state, whole-category removal

**Installation Conflict**:
A selected part can remain in the product configuration while the assembly graph reports why it cannot be installed into the 3D scene. Installation conflicts should point to a concrete installed instance candidate or mount slot whenever possible.
_Avoid_: Silent incompatibility, hidden fallback, blocked product selection

**Setup**:
A saved build definition made of product selections and installed-instance overrides. A setup does not store final scene coordinates; positions are recalculated from current asset anchors, slots and assembly rules when the setup is loaded.
_Avoid_: Saved scene coordinates, frozen 3D layout, serialized rendered transform

**Asset Calibration**:
The process of correcting model anchors, slots, axes or bounds so future assemblies mount correctly. Asset calibration can be exported during local debug work, but production users must not directly write global model asset metadata.
_Avoid_: User-written global model edits, production debug write-back, setup-owned calibration

**Assembly Source of Truth**:
Final installed positions come from the assembly graph aligning part anchors to parent anchors or mount slots. Crawled product specifications decide compatibility and semantic mount choices; GLB asset metadata supplies scene coordinates, axes, anchors and slots. Debug mode is an asset-maintainer calibration tool, not the source of normal user assembly placement.
_Avoid_: Debug-driven assembly, user-tuned final positions, scraped scene coordinates
