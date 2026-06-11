import fs from "node:fs";
import path from "node:path";

const outDir = path.join("public", "models", "calibration", "open-frame-case");
const outFile = path.join(outDir, "scene.gltf");

const positions = [
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

const normals = [
  0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
  0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
  0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
  0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
  1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
  -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
];

const indices = [
  0, 1, 2, 0, 2, 3,
  4, 5, 6, 4, 6, 7,
  8, 9, 10, 8, 10, 11,
  12, 13, 14, 12, 14, 15,
  16, 17, 18, 16, 18, 19,
  20, 21, 22, 20, 22, 23,
];

const positionBuffer = Buffer.from(new Float32Array(positions).buffer);
const normalBuffer = Buffer.from(new Float32Array(normals).buffer);
const indexBuffer = Buffer.from(new Uint16Array(indices).buffer);
const binary = Buffer.concat([positionBuffer, normalBuffer, indexBuffer]);

const materials = [
  {
    name: "anodized dark frame",
    pbrMetallicRoughness: {
      baseColorFactor: [0.05, 0.07, 0.08, 1],
      metallicFactor: 0.55,
      roughnessFactor: 0.42,
    },
  },
  {
    name: "visible teal mount slots",
    pbrMetallicRoughness: {
      baseColorFactor: [0.08, 0.8, 0.72, 0.62],
      metallicFactor: 0.25,
      roughnessFactor: 0.55,
    },
    alphaMode: "BLEND",
    doubleSided: true,
  },
  {
    name: "smoked transparent bays",
    pbrMetallicRoughness: {
      baseColorFactor: [0.34, 0.43, 0.5, 0.24],
      metallicFactor: 0.05,
      roughnessFactor: 0.68,
    },
    alphaMode: "BLEND",
    doubleSided: true,
  },
  {
    name: "amber calibration marks",
    pbrMetallicRoughness: {
      baseColorFactor: [1, 0.54, 0.12, 0.72],
      metallicFactor: 0.1,
      roughnessFactor: 0.5,
    },
    alphaMode: "BLEND",
    doubleSided: true,
  },
];

const meshes = materials.map((_, material) => ({
  primitives: [
    {
      attributes: { POSITION: 0, NORMAL: 1 },
      indices: 2,
      material,
    },
  ],
}));

const nodes = [];

function box(name, material, translation, scale) {
  nodes.push({
    name,
    mesh: material,
    translation,
    scale,
  });
}

for (const x of [-1.25, 1.25]) {
  for (const z of [-0.82, 0.82]) {
    box(`corner post ${x}:${z}`, 0, [x, 0, z], [0.08, 3.2, 0.08]);
  }
}

for (const y of [-1.6, 1.6]) {
  for (const z of [-0.82, 0.82]) {
    box(`horizontal x rail ${y}:${z}`, 0, [0, y, z], [2.58, 0.08, 0.08]);
  }
  for (const x of [-1.25, 1.25]) {
    box(`horizontal z rail ${x}:${y}`, 0, [x, y, 0], [0.08, 0.08, 1.72]);
  }
}

box("motherboard tray visual plane", 2, [-0.36, 0.08, -0.68], [1.58, 2.05, 0.035]);
box("psu bay transparent volume", 2, [0.48, -1.18, -0.34], [1.12, 0.58, 0.86]);
box("top radiator transparent volume", 2, [0, 1.18, -0.26], [1.78, 0.12, 0.78]);
box("rear expansion slot marker", 3, [0.34, -0.48, -0.84], [0.68, 0.36, 0.035]);

for (const [index, y] of [0.52, 0, -0.52].entries()) {
  const label = index + 1;
  box(`front fan ${label} top rail`, 1, [1.18, y + 0.39, 0.14], [0.045, 0.05, 0.82]);
  box(`front fan ${label} bottom rail`, 1, [1.18, y - 0.39, 0.14], [0.045, 0.05, 0.82]);
  box(`front fan ${label} left rail`, 1, [1.18, y, -0.25], [0.045, 0.82, 0.05]);
  box(`front fan ${label} right rail`, 1, [1.18, y, 0.53], [0.045, 0.82, 0.05]);
}

for (const [index, x] of [-0.42, 0.42].entries()) {
  const label = index + 1;
  box(`top fan ${label} front rail`, 1, [x, 1.18, 0.12], [0.78, 0.045, 0.05]);
  box(`top fan ${label} rear rail`, 1, [x, 1.18, -0.66], [0.78, 0.045, 0.05]);
  box(`top fan ${label} left rail`, 1, [x - 0.39, 1.18, -0.27], [0.05, 0.045, 0.78]);
  box(`top fan ${label} right rail`, 1, [x + 0.39, 1.18, -0.27], [0.05, 0.045, 0.78]);
}

box("rear fan top rail", 1, [-1.18, 0.81, -0.36], [0.045, 0.05, 0.72]);
box("rear fan bottom rail", 1, [-1.18, 0.03, -0.36], [0.045, 0.05, 0.72]);
box("rear fan left rail", 1, [-1.18, 0.42, -0.72], [0.045, 0.78, 0.05]);
box("rear fan right rail", 1, [-1.18, 0.42, 0], [0.045, 0.78, 0.05]);

const gltf = {
  asset: {
    version: "2.0",
    generator: "beta_project calibration fixture",
  },
  scenes: [{ nodes: nodes.map((_, index) => index) }],
  scene: 0,
  nodes,
  meshes,
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
      count: indices.length,
      type: "SCALAR",
      min: [0],
      max: [23],
    },
  ],
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, `${JSON.stringify(gltf, null, 2)}\n`);
console.log(`Wrote ${outFile}`);
