import { execFile } from "node:child_process";
import { createWriteStream } from "node:fs";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const cwd = process.cwd();
const defaultManifest = path.join(cwd, "src/data/sketchfab-model-candidates.json");
const defaultOutDir = path.join(cwd, "public/models/sketchfab");
const allowedLicenses = new Set(["by", "cc0"]);

const args = parseArgs(process.argv.slice(2));
const manifestFile = path.resolve(cwd, args.manifest ?? defaultManifest);
const outDir = path.resolve(cwd, args.out ?? defaultOutDir);
const token = process.env.SKETCHFAB_TOKEN;
const authHeader = process.env.SKETCHFAB_AUTH_HEADER ?? formatAuthHeader(token);

if (!authHeader) {
  throw new Error(
    "Missing SKETCHFAB_TOKEN. Create a Sketchfab API token and rerun.",
  );
}

const candidates = JSON.parse(await readFile(manifestFile, "utf8"));
const selected = candidates.filter((candidate) => {
  if (args.category && candidate.category !== args.category) return false;
  if (args.asset && candidate.assetId !== args.asset) return false;
  return true;
});

if (selected.length === 0) {
  throw new Error("No Sketchfab candidates matched the supplied filters.");
}

await mkdir(outDir, { recursive: true });
const imported = [];

for (const candidate of selected) {
  const model = await fetchJson(`https://api.sketchfab.com/v3/models/${candidate.uid}`);
  assertUsableModel(candidate, model);

  const download = await fetchJson(
    `https://api.sketchfab.com/v3/models/${candidate.uid}/download`,
  );
  const gltfUrl = download.gltf?.url;
  if (!gltfUrl) {
    throw new Error(`${candidate.assetId}: Sketchfab did not return a glTF download URL.`);
  }

  const assetDir = path.join(outDir, candidate.assetId);
  const workDir = await mkdtemp(path.join(tmpdir(), `${candidate.assetId}-`));
  const zipFile = path.join(workDir, "model.zip");
  const extractDir = path.join(workDir, "extract");

  await downloadFile(gltfUrl, zipFile);
  await mkdir(extractDir, { recursive: true });
  await execFileAsync("unzip", ["-q", "-o", zipFile, "-d", extractDir]);
  await rm(assetDir, { force: true, recursive: true });
  await copyDirectory(extractDir, assetDir);
  await rm(workDir, { force: true, recursive: true });

  const entrypoint = await findFirstFile(assetDir, ".gltf");
  if (!entrypoint) {
    throw new Error(`${candidate.assetId}: extracted archive has no .gltf file.`);
  }

  imported.push({
    ...candidate,
    assetUrl: toPublicModelUrl(entrypoint),
    importedAt: new Date().toISOString(),
  });
}

await writeFile(
  path.join(outDir, "attribution.json"),
  `${JSON.stringify(imported, null, 2)}\n`,
);
await writeFile(path.join(outDir, "ATTRIBUTION.md"), renderAttribution(imported));

console.log(
  JSON.stringify(
    {
      imported: imported.length,
      outDir,
      assets: imported.map(({ assetId, assetUrl }) => ({ assetId, assetUrl })),
    },
    null,
    2,
  ),
);

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--manifest") parsed.manifest = argv[++index];
    if (item === "--out") parsed.out = argv[++index];
    if (item === "--category") parsed.category = argv[++index];
    if (item === "--asset") parsed.asset = argv[++index];
  }
  return parsed;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Authorization: authHeader,
      "User-Agent": "cn-3d-pc-builder-sketchfab-importer",
    },
  });

  if (!response.ok) {
    throw new Error(`Sketchfab request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function formatAuthHeader(value) {
  if (!value) return undefined;
  if (value.startsWith("Bearer ") || value.startsWith("Token ")) return value;
  return `Token ${value}`;
}

function assertUsableModel(candidate, model) {
  if (!model.isDownloadable) {
    throw new Error(`${candidate.assetId}: model is no longer downloadable.`);
  }

  const slug = model.license?.slug;
  if (!allowedLicenses.has(slug)) {
    throw new Error(`${candidate.assetId}: unsupported license ${model.license?.label}.`);
  }
}

async function downloadFile(url, destination) {
  const response = await fetch(url, {
    headers: { "User-Agent": "cn-3d-pc-builder-sketchfab-importer" },
  });

  if (!response.ok || !response.body) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }

  await pipeline(response.body, createWriteStream(destination));
}

async function copyDirectory(from, to) {
  await mkdir(to, { recursive: true });
  for (const entry of await readdir(from, { withFileTypes: true })) {
    const source = path.join(from, entry.name);
    const target = path.join(to, entry.name);
    if (entry.isDirectory()) {
      await copyDirectory(source, target);
    } else if (entry.isFile()) {
      await mkdir(path.dirname(target), { recursive: true });
      await copyFile(source, target);
    }
  }
}

async function findFirstFile(directory, extension) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      const nested = await findFirstFile(filePath, extension);
      if (nested) return nested;
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(extension)) {
      return filePath;
    }
  }

  return undefined;
}

function toPublicModelUrl(filePath) {
  const relative = path.relative(path.join(cwd, "public"), filePath);
  return `/${relative.split(path.sep).join("/")}`;
}

function renderAttribution(items) {
  const lines = [
    "# Sketchfab Model Attribution",
    "",
    "Imported models in this directory are from Sketchfab and must keep attribution.",
    "",
  ];

  for (const item of items) {
    lines.push(
      `- ${item.name} by ${item.author}`,
      `  - Model: ${item.viewerUrl}`,
      `  - Author: ${item.authorUrl}`,
      `  - License: ${item.license} (${item.licenseUrl})`,
      `  - Local asset: ${item.assetUrl}`,
      "",
    );
  }

  return `${lines.join("\n")}\n`;
}
