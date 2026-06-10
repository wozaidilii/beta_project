import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import type { Vec3 } from "~/lib/catalog";

type DebugModelPatch = {
  partId: string;
  partName?: string;
  patch:
    | {
        type: "fallbackPosition";
        position: Vec3;
      }
    | {
        type: "anchorPoint";
        anchor: string;
        position: Vec3;
      }
    | {
        type: "rotation";
        rotation: Vec3;
      };
};

type LocalModelRecord = {
  id: string;
  model?: {
    anchorPoints?: Record<string, { label?: string; position: Vec3 }>;
    placement?: {
      anchor?: string;
      fallbackPosition?: Vec3;
    };
    rotation?: Vec3;
  };
};

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "模型配置写入只允许在本地开发环境使用。" },
      { status: 403 },
    );
  }

  const body = (await request.json()) as { patches?: DebugModelPatch[] };
  const patches = body.patches ?? [];

  if (!Array.isArray(patches) || patches.length === 0) {
    return NextResponse.json({ error: "没有可写入的调试 patch。" }, { status: 400 });
  }

  const filePath = path.join(process.cwd(), "src/data/local-model-assets.json");
  const raw = await readFile(filePath, "utf8");
  const records = JSON.parse(raw) as LocalModelRecord[];
  const recordMap = new Map(records.map((record) => [record.id, record]));
  const updated: string[] = [];

  for (const patch of patches) {
    const record = recordMap.get(patch.partId);
    if (!record?.model) continue;

    if (patch.patch.type === "fallbackPosition") {
      record.model.placement ??= {};
      record.model.placement.fallbackPosition = patch.patch.position;
      updated.push(patch.partId);
      continue;
    }

    if (patch.patch.type === "rotation") {
      record.model.rotation = patch.patch.rotation;
      updated.push(patch.partId);
      continue;
    }

    record.model.anchorPoints ??= {};
    const existing = record.model.anchorPoints[patch.patch.anchor];
    record.model.anchorPoints[patch.patch.anchor] = {
      label: existing?.label ?? patch.patch.anchor,
      position: patch.patch.position,
    };
    updated.push(patch.partId);
  }

  if (updated.length === 0) {
    return NextResponse.json(
      { error: "没有匹配到可更新的模型资产记录。" },
      { status: 404 },
    );
  }

  await writeFile(filePath, `${JSON.stringify(records, null, 2)}\n`);

  return NextResponse.json({
    file: "src/data/local-model-assets.json",
    updated: updated.length,
    updatedIds: updated,
  });
}
