import type { Part } from "~/lib/catalog";

export type SceneBox = {
  width: number;
  height: number;
  depth: number;
};

const baseCase = {
  widthMm: 288,
  heightMm: 384,
  depthMm: 400,
  width: 3.08,
  height: 3.78,
  depth: 1.74,
};

const baseBoard = {
  widthMm: 244,
  lengthMm: 244,
  width: 1.55,
  height: 2.05,
};

export function getCaseSceneBox(part?: Part): SceneBox {
  const dimensions = part?.dimensions;

  return {
    width: scaleByBase(dimensions?.widthMm, baseCase.widthMm, baseCase.width, 2.25, 3.45),
    height: scaleByBase(
      dimensions?.heightMm,
      baseCase.heightMm,
      baseCase.height,
      3.25,
      4.75,
    ),
    depth: scaleByBase(dimensions?.depthMm, baseCase.depthMm, baseCase.depth, 1.5, 2.1),
  };
}

export function getMotherboardSceneBox(part?: Part): SceneBox {
  const dimensions = part?.dimensions;
  const width = scaleByBase(
    dimensions?.widthMm,
    baseBoard.widthMm,
    baseBoard.width,
    1.08,
    1.7,
  );
  const height = scaleByBase(
    dimensions?.lengthMm,
    baseBoard.lengthMm,
    baseBoard.height,
    1.1,
    2.7,
  );

  if (part?.formFactor === "ATX") {
    return { width: Math.max(width, 1.58), height: Math.max(height, 2.55), depth: 0.08 };
  }

  if (part?.formFactor === "Mini-ITX") {
    return { width: 1.08, height: 1.08, depth: 0.08 };
  }

  return { width, height, depth: 0.08 };
}

export function getGpuSceneBox(part?: Part): SceneBox {
  const dimensions = part?.dimensions;
  return {
    width: scaleByBase(
      dimensions?.lengthMm ?? part?.lengthMm,
      304,
      1.6,
      1.12,
      1.95,
    ),
    height: scaleByBase(dimensions?.heightMm, 140, 0.42, 0.32, 0.52),
    depth: scaleByBase(dimensions?.thicknessMm, 62.5, 0.58, 0.38, 0.72),
  };
}

export function getAirCoolerSceneBox(part?: Part): SceneBox {
  const dimensions = part?.dimensions;
  return {
    width: scaleByBase(dimensions?.widthMm, 135, 0.74, 0.56, 0.9),
    height: scaleByBase(dimensions?.heightMm ?? part?.heightMm, 155, 0.86, 0.62, 1.02),
    depth: scaleByBase(dimensions?.lengthMm, 125, 0.48, 0.36, 0.66),
  };
}

export function getRadiatorSceneBox(part?: Part): SceneBox {
  const dimensions = part?.dimensions;
  const radiatorMm = part?.radiatorMm ?? 240;

  return {
    width: scaleByBase(dimensions?.lengthMm ?? radiatorMm, 397.5, 1.92, 1.24, 2.15),
    height: scaleByBase(dimensions?.heightMm, 27, 0.22, 0.18, 0.32),
    depth: scaleByBase(dimensions?.widthMm, 119.2, 0.42, 0.34, 0.5),
  };
}

export function getPumpSceneBox(part?: Part): SceneBox {
  const dimensions = part?.dimensions;
  return {
    width: scaleByBase(dimensions?.pumpWidthMm, 74, 0.56, 0.42, 0.66),
    height: scaleByBase(dimensions?.pumpHeightMm, 69, 0.2, 0.14, 0.28),
    depth: scaleByBase(dimensions?.pumpLengthMm, 74, 0.56, 0.42, 0.66),
  };
}

export function getPsuSceneBox(part?: Part): SceneBox {
  const dimensions = part?.dimensions;
  return {
    width: scaleByBase(dimensions?.widthMm, 150, 1.05, 0.92, 1.2),
    height: scaleByBase(dimensions?.heightMm, 86, 0.58, 0.48, 0.7),
    depth: scaleByBase(dimensions?.lengthMm, 140, 0.82, 0.7, 0.96),
  };
}

export function describeDimensions(part?: Part) {
  const dimensions = part?.dimensions;
  if (!dimensions) return undefined;

  if (part?.category === "case" && dimensions.depthMm && dimensions.widthMm && dimensions.heightMm) {
    return `${dimensions.depthMm} x ${dimensions.widthMm} x ${dimensions.heightMm} mm`;
  }

  if (part?.category === "gpu" && dimensions.lengthMm && dimensions.heightMm) {
    return `${dimensions.lengthMm} x ${dimensions.heightMm} x ${
      dimensions.thicknessMm ?? "-"
    } mm`;
  }

  if (
    part?.category === "motherboard" &&
    dimensions.lengthMm &&
    dimensions.widthMm
  ) {
    return `${dimensions.lengthMm} x ${dimensions.widthMm} mm`;
  }

  if (dimensions.lengthMm && dimensions.widthMm && dimensions.heightMm) {
    return `${dimensions.lengthMm} x ${dimensions.widthMm} x ${dimensions.heightMm} mm`;
  }

  return undefined;
}

function scaleByBase(
  value: number | undefined,
  baseValue: number,
  baseSceneValue: number,
  min: number,
  max: number,
) {
  const scaled = ((value ?? baseValue) / baseValue) * baseSceneValue;
  return Math.max(min, Math.min(max, scaled));
}
