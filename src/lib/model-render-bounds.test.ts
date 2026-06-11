import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  Box3,
  Euler,
  Matrix4,
  Vector3,
  type Object3D,
} from "three";

import { getAssemblyPlan } from "~/lib/assembly-layout";
import {
  calibrationSelection,
  type PartModel,
  type Vec3,
} from "~/lib/catalog";

type ImageBitmapStub = {
  close: () => void;
};

type ProgressEventInitStub = {
  lengthComputable?: boolean;
  loaded?: number;
  total?: number;
};

const nativeFetch = globalThis.fetch.bind(globalThis);
const modelBoundsCache = new Map<string, Promise<Box3>>();

Object.defineProperty(globalThis, "self", {
  configurable: true,
  value: globalThis,
});
globalThis.ProgressEvent ??= class ProgressEvent {
  readonly lengthComputable?: boolean;
  readonly loaded?: number;
  readonly total?: number;
  readonly type: string;

  constructor(type: string, init?: ProgressEventInitStub) {
    this.type = type;
    this.lengthComputable = init?.lengthComputable;
    this.loaded = init?.loaded;
    this.total = init?.total;
  }
} as typeof ProgressEvent;
globalThis.createImageBitmap ??= async () =>
  ({ close() {} }) as ImageBitmapStub as ImageBitmap;
globalThis.fetch = async (input, init) => {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;
  if (url.startsWith("file://")) {
    const data = await fs.readFile(fileURLToPath(url));
    return new Response(data);
  }
  return nativeFetch(input, init);
};

const plan = getAssemblyPlan(calibrationSelection);
const pcCase = plan.instancesByCategory.case;
const fans = plan.instances.filter((instance) => instance.category === "fans");

assert.ok(pcCase, "default build should include a visible case model");
assert.equal(fans.length, 3, "default fan pack should install three fans");
assert.notEqual(
  pcCase.model.fitMode,
  "stretch",
  "complex case models should keep uniform scaling to avoid visual distortion",
);

const caseBounds = await getRenderedBounds(pcCase.model, pcCase.position, pcCase.rotation);

for (const fan of fans) {
  assert.ok(
    containsMountedFan(caseBounds, fan.position, fan.fitSize, 0.04),
    `${fan.instanceId} should mount within the calibrated case bounds`,
  );
}

async function getRenderedBounds(model: PartModel, position: Vec3, rotation: Vec3) {
  assert.ok(model.assetUrl, "rendered model test requires a local assetUrl");
  const sourceBounds = await getSourceBounds(model.assetUrl);
  const sourceSize = new Vector3();
  const sourceCenter = new Vector3();
  sourceBounds.getSize(sourceSize);
  sourceBounds.getCenter(sourceCenter);

  const fitScale = getFitScale(model.fitSize, sourceSize, model.fitMode);
  const userScale = Array.isArray(model.scale)
    ? new Vector3(model.scale[0], model.scale[1], model.scale[2])
    : new Vector3(model.scale ?? 1, model.scale ?? 1, model.scale ?? 1);
  const finalScale = fitScale.multiply(userScale);
  const localOffset =
    model.autoCenter === false
      ? new Vector3(0, 0, 0)
      : sourceCenter.clone().multiplyScalar(-1);

  const matrix = new Matrix4()
    .makeTranslation(position[0], position[1], position[2])
    .multiply(new Matrix4().makeRotationFromEuler(new Euler(...rotation)))
    .multiply(new Matrix4().makeScale(finalScale.x, finalScale.y, finalScale.z))
    .multiply(new Matrix4().makeTranslation(localOffset.x, localOffset.y, localOffset.z));

  return sourceBounds.clone().applyMatrix4(matrix);
}

function getSourceBounds(assetUrl: string) {
  const cached = modelBoundsCache.get(assetUrl);
  if (cached) return cached;

  const promise = loadModel(assetUrl).then((scene) => new Box3().setFromObject(scene));
  modelBoundsCache.set(assetUrl, promise);
  return promise;
}

async function loadModel(assetUrl: string): Promise<Object3D> {
  const filePath = path.join(process.cwd(), "public", assetUrl.slice(1));
  const resourcePath = `${pathToFileURL(path.dirname(filePath)).href}/`;
  const loader = new GLTFLoader();

  if (path.extname(filePath) === ".glb") {
    const buffer = await fs.readFile(filePath);
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    );
    const gltf = await new Promise<{ scene: Object3D }>((resolve, reject) =>
      loader.parse(arrayBuffer, resourcePath, resolve, reject),
    );
    return gltf.scene;
  }

  const gltfSource = await fs.readFile(filePath, "utf8");
  const gltf = await new Promise<{ scene: Object3D }>((resolve, reject) =>
    loader.parse(gltfSource, resourcePath, resolve, reject),
  );
  return gltf.scene;
}

function getFitScale(
  fitSize: Vec3 | undefined,
  sourceSize: Vector3,
  fitMode: "contain" | "stretch" = "contain",
) {
  if (!fitSize) return new Vector3(1, 1, 1);

  const axisScale = new Vector3(
    safeDivide(fitSize[0], sourceSize.x),
    safeDivide(fitSize[1], sourceSize.y),
    safeDivide(fitSize[2], sourceSize.z),
  );

  if (fitMode === "stretch") return axisScale;

  const uniformScale = Math.min(axisScale.x, axisScale.y, axisScale.z);
  return new Vector3(uniformScale, uniformScale, uniformScale);
}

function containsMountedFan(outer: Box3, center: Vec3, fitSize: Vec3, tolerance: number) {
  const halfPlaneSize = Math.max(fitSize[0], fitSize[1]) / 2;
  const halfThickness = fitSize[2] / 2;
  return (
    center[0] - halfThickness >= outer.min.x - tolerance &&
    center[0] + halfThickness <= outer.max.x + tolerance &&
    center[1] - halfPlaneSize >= outer.min.y - tolerance &&
    center[1] + halfPlaneSize <= outer.max.y + tolerance &&
    center[2] - halfPlaneSize >= outer.min.z - tolerance &&
    center[2] + halfPlaneSize <= outer.max.z + tolerance
  );
}

function safeDivide(left: number, right: number) {
  return right === 0 ? 1 : left / right;
}
