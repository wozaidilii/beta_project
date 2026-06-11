import fs from "node:fs";
import path from "node:path";

const cubePositions = [
  // front
  -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
  // back
  0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5,
  // top
  -0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5,
  // bottom
  -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5,
  // right
  0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5,
  // left
  -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5,
];

const cubeNormals = [
  0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
  0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
  0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
  0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
  1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
  -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
];

const cubeIndices = [
  0, 1, 2, 0, 2, 3,
  4, 5, 6, 4, 6, 7,
  8, 9, 10, 8, 10, 11,
  12, 13, 14, 12, 14, 15,
  16, 17, 18, 16, 18, 19,
  20, 21, 22, 20, 22, 23,
];

const positionBuffer = Buffer.from(new Float32Array(cubePositions).buffer);
const normalBuffer = Buffer.from(new Float32Array(cubeNormals).buffer);
const indexBuffer = Buffer.from(new Uint16Array(cubeIndices).buffer);
const binary = Buffer.concat([positionBuffer, normalBuffer, indexBuffer]);

const materials = [
  material("anodized dark frame", [0.05, 0.07, 0.08, 1], 0.55, 0.42),
  material("visible teal mount slots", [0.08, 0.8, 0.72, 0.62], 0.25, 0.55, true),
  material("smoked transparent bays", [0.34, 0.43, 0.5, 0.24], 0.05, 0.68, true),
  material("amber calibration marks", [1, 0.54, 0.12, 0.72], 0.1, 0.5, true),
  material("calibration product body", [0.12, 0.16, 0.2, 1], 0.15, 0.58),
  material("calibration connector", [0.93, 0.56, 0.18, 1], 0.2, 0.48),
  material("calibration fan blades", [0.12, 0.78, 0.9, 0.72], 0.1, 0.45, true),
];

writeModel("open-frame-case", createOpenFrameCaseNodes());
writeModel("atx-motherboard", [
  box("atx board slab", 4, [0, 0, 0], [1.55, 2.05, 0.045]),
  box("cpu socket marker", 5, [-0.06, 0.3, 0.07], [0.34, 0.34, 0.035]),
  box("pcie x16 slot marker", 5, [0.54, -0.6, 0.08], [0.78, 0.06, 0.055]),
  box("dimm slot marker a", 5, [0.24, 0.28, 0.09], [0.06, 0.72, 0.045]),
  box("dimm slot marker b", 5, [0.36, 0.28, 0.09], [0.06, 0.72, 0.045]),
  box("m2 slot marker", 5, [-0.22, -0.18, 0.09], [0.58, 0.08, 0.04]),
]);
writeModel("cpu-package", [
  box("cpu heat spreader", 4, [0, 0, 0], [0.46, 0.46, 0.045]),
  box("cpu contact marker", 5, [0, 0, -0.032], [0.38, 0.38, 0.018]),
]);
writeModel("gpu-card", [
  box("gpu shroud", 4, [0.35, 0, 0], [1.52, 0.42, 0.45]),
  box("pcie connector", 5, [0, 0, -0.28], [0.58, 0.06, 0.08]),
  box("gpu fan visual a", 6, [0.16, 0.01, 0.24], [0.3, 0.3, 0.035]),
  box("gpu fan visual b", 6, [0.66, 0.01, 0.24], [0.3, 0.3, 0.035]),
]);
writeModel("memory-kit", [
  box("memory module a", 4, [-0.08, 0, 0], [0.08, 0.74, 0.28]),
  box("memory module b", 4, [0.08, 0, 0], [0.08, 0.74, 0.28]),
  box("memory contacts", 5, [0, -0.39, 0], [0.2, 0.035, 0.08]),
]);
writeModel("m2-storage", [
  box("m2 ssd board", 4, [0, 0, 0], [0.58, 0.12, 0.035]),
  box("m2 connector", 5, [-0.31, 0, 0], [0.06, 0.11, 0.045]),
]);
writeModel("air-cooler", [
  box("cooler tower", 4, [0, 0.24, 0], [0.62, 0.72, 0.44]),
  box("cooler fan", 6, [0, 0.24, 0.25], [0.58, 0.58, 0.05]),
  box("cooler cold plate", 5, [0, -0.18, 0], [0.36, 0.08, 0.36]),
]);
writeModel("atx-psu", [
  box("psu body", 4, [0, 0, 0], [1.04, 0.58, 0.82]),
  box("psu mount face", 5, [0, 0, -0.43], [0.92, 0.48, 0.035]),
  box("psu fan grille", 6, [0, 0.31, 0], [0.48, 0.035, 0.48]),
]);
writeModel("120mm-fan", [
  box("fan frame top", 4, [0, 0.36, 0], [0.72, 0.055, 0.12]),
  box("fan frame bottom", 4, [0, -0.36, 0], [0.72, 0.055, 0.12]),
  box("fan frame left", 4, [-0.36, 0, 0], [0.055, 0.72, 0.12]),
  box("fan frame right", 4, [0.36, 0, 0], [0.055, 0.72, 0.12]),
  box("fan hub", 6, [0, 0, 0.01], [0.22, 0.22, 0.08]),
  box("fan blade horizontal", 6, [0, 0, 0.025], [0.58, 0.08, 0.045]),
  box("fan blade vertical", 6, [0, 0, 0.03], [0.08, 0.58, 0.045]),
]);

function createOpenFrameCaseNodes() {
  const nodes = [];

  for (const x of [-1.25, 1.25]) {
    for (const z of [-0.82, 0.82]) {
      nodes.push(box(`corner post ${x}:${z}`, 0, [x, 0, z], [0.08, 3.2, 0.08]));
    }
  }

  for (const y of [-1.6, 1.6]) {
    for (const z of [-0.82, 0.82]) {
      nodes.push(box(`horizontal x rail ${y}:${z}`, 0, [0, y, z], [2.58, 0.08, 0.08]));
    }
    for (const x of [-1.25, 1.25]) {
      nodes.push(box(`horizontal z rail ${x}:${y}`, 0, [x, y, 0], [0.08, 0.08, 1.72]));
    }
  }

  nodes.push(
    box("motherboard tray visual plane", 2, [-0.36, 0.08, -0.68], [1.58, 2.05, 0.035]),
    box("psu bay transparent volume", 2, [0.48, -1.18, -0.34], [1.12, 0.58, 0.86]),
    box("top radiator transparent volume", 2, [0, 1.18, -0.26], [1.78, 0.12, 0.78]),
    box("rear expansion slot marker", 3, [0.34, -0.48, -0.84], [0.68, 0.36, 0.035]),
  );

  for (const [index, y] of [0.52, 0, -0.52].entries()) {
    const label = index + 1;
    nodes.push(
      box(`front fan ${label} top rail`, 1, [1.18, y + 0.39, 0.14], [0.045, 0.05, 0.82]),
      box(`front fan ${label} bottom rail`, 1, [1.18, y - 0.39, 0.14], [0.045, 0.05, 0.82]),
      box(`front fan ${label} left rail`, 1, [1.18, y, -0.25], [0.045, 0.82, 0.05]),
      box(`front fan ${label} right rail`, 1, [1.18, y, 0.53], [0.045, 0.82, 0.05]),
    );
  }

  for (const [index, x] of [-0.42, 0.42].entries()) {
    const label = index + 1;
    nodes.push(
      box(`top fan ${label} front rail`, 1, [x, 1.18, 0.12], [0.78, 0.045, 0.05]),
      box(`top fan ${label} rear rail`, 1, [x, 1.18, -0.66], [0.78, 0.045, 0.05]),
      box(`top fan ${label} left rail`, 1, [x - 0.39, 1.18, -0.27], [0.05, 0.045, 0.78]),
      box(`top fan ${label} right rail`, 1, [x + 0.39, 1.18, -0.27], [0.05, 0.045, 0.78]),
    );
  }

  nodes.push(
    box("rear fan top rail", 1, [-1.18, 0.81, -0.36], [0.045, 0.05, 0.72]),
    box("rear fan bottom rail", 1, [-1.18, 0.03, -0.36], [0.045, 0.05, 0.72]),
    box("rear fan left rail", 1, [-1.18, 0.42, -0.72], [0.045, 0.78, 0.05]),
    box("rear fan right rail", 1, [-1.18, 0.42, 0], [0.045, 0.78, 0.05]),
  );

  return nodes;
}

function box(name, material, translation, scale) {
  return { name, mesh: material, translation, scale };
}

function material(name, baseColorFactor, metallicFactor, roughnessFactor, transparent = false) {
  return {
    name,
    pbrMetallicRoughness: {
      baseColorFactor,
      metallicFactor,
      roughnessFactor,
    },
    ...(transparent
      ? {
          alphaMode: "BLEND",
          doubleSided: true,
        }
      : {}),
  };
}

function writeModel(name, nodes) {
  const outDir = path.join("public", "models", "calibration", name);
  const outFile = path.join(outDir, "scene.gltf");
  const gltf = {
    asset: {
      version: "2.0",
      generator: "beta_project calibration fixture",
    },
    scenes: [{ nodes: nodes.map((_, index) => index) }],
    scene: 0,
    nodes,
    meshes: materials.map((_, materialIndex) => ({
      primitives: [
        {
          attributes: { POSITION: 0, NORMAL: 1 },
          indices: 2,
          material: materialIndex,
        },
      ],
    })),
    materials,
    buffers: [
      {
        uri: `data:application/octet-stream;base64,${binary.toString("base64")}`,
        byteLength: binary.byteLength,
      },
    ],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: positionBuffer.byteLength, target: 34962 },
      {
        buffer: 0,
        byteOffset: positionBuffer.byteLength,
        byteLength: normalBuffer.byteLength,
        target: 34962,
      },
      {
        buffer: 0,
        byteOffset: positionBuffer.byteLength + normalBuffer.byteLength,
        byteLength: indexBuffer.byteLength,
        target: 34963,
      },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 24,
        type: "VEC3",
        min: [-0.5, -0.5, -0.5],
        max: [0.5, 0.5, 0.5],
      },
      {
        bufferView: 1,
        componentType: 5126,
        count: 24,
        type: "VEC3",
        min: [-1, -1, -1],
        max: [1, 1, 1],
      },
      {
        bufferView: 2,
        componentType: 5123,
        count: cubeIndices.length,
        type: "SCALAR",
        min: [0],
        max: [23],
      },
    ],
  };

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, `${JSON.stringify(gltf, null, 2)}\n`);
  console.log(`Wrote ${outFile}`);
}
