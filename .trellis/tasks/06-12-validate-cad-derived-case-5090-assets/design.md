# Design

## Asset Source Classification

Use three source levels:

- `cad-source`: engineering CAD source with units and product structure.
- `trusted-visual`: official or authorized visual 3D asset with usable dimensions.
- `spec-derived-validation`: generated from public dimensions for assembly logic only.

Only `cad-source` and explicitly authorized `trusted-visual` assets may be bound to real commerce SKUs for production display.

## Conversion Path

The preferred local path is:

1. Inspect STEP metadata and units.
2. Import into FreeCAD.
3. Export simplified mesh to GLB/OBJ.
4. Normalize axis, origin, scale, and bounds.
5. Add anchor/mount metadata.
6. Run model and assembly validation.

If FreeCAD cannot export GLB directly, export OBJ/DAE/STL as an intermediate and convert with Blender or a Node-based glTF pipeline in a follow-up step.

## O11 Air Mini Validation

The STEP file is useful as the geometry source and reference for anchors. Production publication is blocked until source authorization is known. For this task, use it as a local validation source and do not copy the original STEP into `public/`.

## RTX 5090 Validation

Priority order:

1. Official NVIDIA or board-vendor CAD/3D files.
2. Authorized vendor press/developer asset with dimensions.
3. Community CAD only for local inspection, not production binding.
4. Spec-derived validation asset when no trustworthy CAD is available.

For assembly verification, the minimum GPU contract is length, slot width, height, PCIe connector anchor, I/O bracket face, and approximate bounding box.
