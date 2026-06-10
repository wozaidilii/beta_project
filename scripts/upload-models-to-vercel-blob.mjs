import { createReadStream } from "node:fs";
import {
  mkdir,
  readFile,
  readdir,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

import { put } from "@vercel/blob";

const cwd = process.cwd();
const defaultRoot = path.join(cwd, "public/models");
const defaultManifest = path.join(cwd, "output/vercel-blob-model-manifest.json");
const largeFileThresholdBytes = 4 * 1024 * 1024;
const defaultCacheSeconds = 60 * 60 * 24 * 365;

await loadEnvFile(path.join(cwd, ".env.local"));

const args = parseArgs(process.argv.slice(2));
const rootDir = path.resolve(cwd, args.root ?? defaultRoot);
const manifestFile = path.resolve(cwd, args.manifest ?? defaultManifest);
const prefix = trimSlashes(args.prefix ?? "models");
const concurrency = Number(args.concurrency ?? 3);
const dryRun = Boolean(args.dryRun);
const token = process.env.BLOB_READ_WRITE_TOKEN;
const oidcToken = args.oidcToken ?? process.env.VERCEL_OIDC_TOKEN;
const storeId = args.storeId ?? process.env.BLOB_STORE_ID;

if (!token && !(oidcToken && storeId) && !dryRun) {
  throw new Error(
    "Missing Blob credentials. Run `vercel env pull .env.local` and pass `--store-id store_...`, or export BLOB_READ_WRITE_TOKEN before uploading.",
  );
}

const files = (await walkFiles(rootDir)).filter(shouldUpload);
if (files.length === 0) {
  throw new Error(`No uploadable files found in ${rootDir}`);
}

const uploaded = [];
const startedAt = new Date().toISOString();

await runPool(files, concurrency, async (filePath, index) => {
  const fileStat = await stat(filePath);
  const relativePath = toPosix(path.relative(rootDir, filePath));
  const pathname = `${prefix}/${relativePath}`;
  const contentType = getContentType(filePath);

  if (dryRun) {
    uploaded.push({
      pathname,
      localPath: toPosix(path.relative(cwd, filePath)),
      size: fileStat.size,
      contentType,
    });
    console.log(
      `[dry-run ${index + 1}/${files.length}] ${pathname} ${formatBytes(fileStat.size)}`,
    );
    return;
  }

  const blob = await put(pathname, createReadStream(filePath), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: defaultCacheSeconds,
    contentType,
    multipart: fileStat.size >= largeFileThresholdBytes,
    ...getAuthOptions(),
  });

  uploaded.push({
    pathname: blob.pathname,
    url: blob.url,
    downloadUrl: blob.downloadUrl,
    localPath: toPosix(path.relative(cwd, filePath)),
    size: fileStat.size,
    contentType,
  });
  console.log(
    `[${index + 1}/${files.length}] ${pathname} ${formatBytes(fileStat.size)} -> ${blob.url}`,
  );
});

uploaded.sort((left, right) => left.pathname.localeCompare(right.pathname));

const baseUrl = inferModelAssetBaseUrl(uploaded);
const manifest = {
  uploadedAt: new Date().toISOString(),
  startedAt,
  sourceRoot: toPosix(path.relative(cwd, rootDir)),
  prefix,
  fileCount: uploaded.length,
  totalBytes: uploaded.reduce((total, item) => total + item.size, 0),
  modelAssetBaseUrl: baseUrl,
  env: {
    NEXT_PUBLIC_MODEL_ASSET_BASE_URL: baseUrl,
  },
  files: uploaded,
};

await mkdir(path.dirname(manifestFile), { recursive: true });
await writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(
  JSON.stringify(
    {
      uploaded: uploaded.length,
      totalBytes: manifest.totalBytes,
      manifestFile,
      NEXT_PUBLIC_MODEL_ASSET_BASE_URL: baseUrl,
    },
    null,
    2,
  ),
);

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--root") parsed.root = argv[++index];
    if (item === "--manifest") parsed.manifest = argv[++index];
    if (item === "--prefix") parsed.prefix = argv[++index];
    if (item === "--concurrency") parsed.concurrency = argv[++index];
    if (item === "--oidc-token") parsed.oidcToken = argv[++index];
    if (item === "--store-id") parsed.storeId = argv[++index];
    if (item === "--dry-run") parsed.dryRun = true;
  }
  return parsed;
}

function getAuthOptions() {
  if (token) return { token };
  return { oidcToken, storeId };
}

async function loadEnvFile(filePath) {
  let text;
  try {
    text = await readFile(filePath, "utf8");
  } catch {
    return;
  }

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = stripEnvQuotes(rawValue);
  }
}

function stripEnvQuotes(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

async function walkFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(filePath)));
    } else if (entry.isFile()) {
      files.push(filePath);
    }
  }

  return files;
}

function shouldUpload(filePath) {
  const name = path.basename(filePath);
  if (name === ".gitkeep") return false;
  return true;
}

async function runPool(items, limit, worker) {
  const safeLimit = Math.max(1, Number.isFinite(limit) ? limit : 1);
  let nextIndex = 0;

  async function runNext() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      await worker(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(safeLimit, items.length) }, () => runNext()),
  );
}

function getContentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const contentTypes = {
    ".bin": "application/octet-stream",
    ".glb": "model/gltf-binary",
    ".gltf": "model/gltf+json",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".json": "application/json; charset=utf-8",
    ".md": "text/markdown; charset=utf-8",
    ".png": "image/png",
    ".txt": "text/plain; charset=utf-8",
    ".webp": "image/webp",
  };

  return contentTypes[extension] ?? "application/octet-stream";
}

function inferModelAssetBaseUrl(items) {
  const firstUrl = items.find((item) => item.url)?.url;
  if (!firstUrl) return "";

  const marker = `/${prefix}/`;
  const index = firstUrl.indexOf(marker);
  return index >= 0 ? firstUrl.slice(0, index) : "";
}

function trimSlashes(value) {
  return value.replace(/^\/+|\/+$/g, "");
}

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function formatBytes(value) {
  if (value < 1024) return `${value}B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)}KB`;
  return `${(value / 1024 / 1024).toFixed(1)}MB`;
}
