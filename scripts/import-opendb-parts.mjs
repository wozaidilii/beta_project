import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const repo = "buildcores/buildcores-open-db";
const branch = "main";
const cwd = process.cwd();
const defaultMapFile = path.join(cwd, "src/data/opendb-import-map.json");
const defaultOutFile = path.join(cwd, "src/data/opendb-parts.json");
const githubToken = process.env.GITHUB_TOKEN;

const args = parseArgs(process.argv.slice(2));
const mapFile = path.resolve(cwd, args.map ?? defaultMapFile);
const outFile = path.resolve(cwd, args.out ?? defaultOutFile);
const now = new Date().toISOString();

const targets = JSON.parse(await readFile(mapFile, "utf8"));
const imported = [];
const skipped = [];

for (const target of targets) {
  try {
    const match = target.opendbId
      ? {
          opendbId: target.opendbId,
          path: `open-db/${target.openDbCategory}/${target.opendbId}.json`,
        }
      : await findOpenDbFile(target);

    if (!match) {
      skipped.push({ id: target.id, reason: "No OpenDB match found" });
      continue;
    }

    const document = await fetchOpenDbJson(match.path);
    const normalized = normalizeOpenDbRecord(target, match, document);
    if (!normalized.part || Object.keys(normalized.part).length === 0) {
      skipped.push({ id: target.id, reason: "No compatible fields mapped" });
      continue;
    }

    imported.push(normalized);
  } catch (error) {
    skipped.push({
      id: target.id,
      reason: error instanceof Error ? error.message : String(error),
    });
  }
}

await writeFile(outFile, `${JSON.stringify(imported, null, 2)}\n`);

console.log(
  JSON.stringify(
    {
      imported: imported.length,
      skipped: skipped.length,
      skippedItems: skipped,
      outFile,
    },
    null,
    2,
  ),
);

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--map") parsed.map = argv[++index];
    if (item === "--out") parsed.out = argv[++index];
  }
  return parsed;
}

async function findOpenDbFile(target) {
  if (!target.search) return undefined;
  if (!githubToken) {
    throw new Error("GitHub code search requires GITHUB_TOKEN or an explicit opendbId");
  }

  const query = [
    `repo:${repo}`,
    `path:open-db/${target.openDbCategory}`,
    JSON.stringify(target.search),
  ].join(" ");
  const url = `https://api.github.com/search/code?q=${encodeURIComponent(query)}&per_page=5`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${githubToken}`,
      "User-Agent": "cn-3d-pc-builder-opendb-importer",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub search failed: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  const item = payload.items?.find((entry) =>
    entry.path?.startsWith(`open-db/${target.openDbCategory}/`),
  );

  if (!item?.path) return undefined;

  return {
    opendbId: path.basename(item.path, ".json"),
    path: item.path,
  };
}

async function fetchOpenDbJson(filePath) {
  const rawUrl = `https://raw.githubusercontent.com/${repo}/${branch}/${filePath}`;
  const response = await fetch(rawUrl, {
    headers: { "User-Agent": "cn-3d-pc-builder-opendb-importer" },
  });

  if (!response.ok) {
    throw new Error(`OpenDB raw fetch failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function normalizeOpenDbRecord(target, match, document) {
  const part = compactObject({
    ...mapCommonFields(target.category, document),
    ...mapCategoryFields(target.category, document),
  });
  const dimensions = mapDimensions(target.category, document);

  return {
    id: target.id,
    category: target.category,
    part,
    ...(Object.keys(dimensions).length > 0 ? { dimensions } : {}),
    externalIds: {
      opendb_id: document.opendb_id ?? match.opendbId,
    },
    source: {
      sourceName: "BuildCores OpenDB",
      sourceUrl: `https://github.com/${repo}/blob/${branch}/${match.path}`,
      scrapedAt: now,
    },
    openDbSpecs: compactObject({
      name: document.metadata?.name,
      manufacturer: document.metadata?.manufacturer,
      series: document.metadata?.series,
      variant: document.metadata?.variant,
      chipset: document.chipset,
      chipsetManufacturer: document.chipset_manufacturer,
      manufacturerUrl: document.general_product_information?.manufacturer_url,
    }),
    importStatus: "ok",
  };
}

function mapCommonFields(category, document) {
  if (category === "cpu") {
    return {
      socket: normalizeSocket(document.socket),
      tdp: numberOrUndefined(document.tdp),
      wattage: numberOrUndefined(document.tdp),
    };
  }

  if (category === "motherboard") {
    return {
      socket: normalizeSocket(document.socket),
      memoryType: normalizeMemoryType(document.memory_type ?? document.memory),
      formFactor: normalizeFormFactor(document.form_factor),
      m2Slots: countOrNumber(
        document.m2_slots ?? document.m2_slots_count ?? document.storage?.m2_slots,
      ),
    };
  }

  if (category === "gpu") {
    return {
      wattage: numberOrUndefined(document.tdp),
      lengthMm: numberOrUndefined(document.length),
      caseExpansionSlotWidth: numberOrUndefined(document.case_expansion_slot_width),
      totalSlotWidth: numberOrUndefined(document.total_slot_width),
    };
  }

  if (category === "psu") {
    return {
      psuWattage: numberOrUndefined(document.wattage ?? document.power),
      psuFormFactor: document.form_factor,
    };
  }

  return {};
}

function mapCategoryFields(category, document) {
  if (category === "case") {
    return {
      supportedFormFactors: normalizeFormFactors(
        document.supported_motherboard_form_factors,
      ),
      supportedPsuFormFactors: arrayOrUndefined(
        document.supported_power_supply_form_factors,
      ),
      gpuClearanceMm: numberOrUndefined(document.max_video_card_length),
      coolerClearanceMm: numberOrUndefined(document.max_cpu_cooler_height),
      maxPsuLengthMm: numberOrUndefined(document.max_psu_length),
      caseExpansionSlots: numberOrUndefined(document.expansion_slots),
    };
  }

  if (category === "cooling") {
    return {
      heightMm: numberOrUndefined(document.height ?? document.cooler_height),
      radiatorMm: firstNumber(
        document.radiator_size ?? document.radiator_length ?? document.radiator,
      ),
      coolingTdp: numberOrUndefined(document.tdp ?? document.cooling_capacity),
    };
  }

  return {};
}

function mapDimensions(category, document) {
  if (category === "case" && document.dimensions_mm) {
    return compactObject({
      depthMm: numberOrUndefined(document.dimensions_mm.depth),
      widthMm: numberOrUndefined(document.dimensions_mm.width),
      heightMm: numberOrUndefined(document.dimensions_mm.height),
    });
  }

  return compactObject({
    lengthMm: numberOrUndefined(document.length ?? document.dimensions_mm?.length),
    widthMm: numberOrUndefined(document.width ?? document.dimensions_mm?.width),
    heightMm: numberOrUndefined(document.height ?? document.dimensions_mm?.height),
  });
}

function normalizeMemoryType(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return normalizeMemoryType(value.ram_type ?? value.type);
  }
  if (typeof value !== "string") return undefined;
  if (/DDR5/i.test(value)) return "DDR5";
  if (/DDR4/i.test(value)) return "DDR4";
  return undefined;
}

function normalizeSocket(value) {
  if (typeof value !== "string") return undefined;
  const normalized = value.toUpperCase().replace(/\s+/g, "");
  if (normalized === "AM5" || normalized === "LGA1851" || normalized === "LGA1700") {
    return normalized;
  }
  return undefined;
}

function normalizeFormFactor(value) {
  if (typeof value !== "string") return undefined;
  const normalized = value.toLowerCase().replace(/[\s_-]+/g, "");
  if (normalized.includes("microatx") || normalized.includes("matx")) {
    return "Micro-ATX";
  }
  if (normalized.includes("miniitx")) return "Mini-ITX";
  if (normalized.includes("atx")) return "ATX";
  return undefined;
}

function normalizeFormFactors(values) {
  const items = arrayOrUndefined(values)
    ?.map((item) => normalizeFormFactor(item))
    .filter(Boolean);
  return items && items.length > 0 ? Array.from(new Set(items)) : undefined;
}

function arrayOrUndefined(value) {
  return Array.isArray(value) && value.length > 0 ? value : undefined;
}

function countOrNumber(value) {
  if (Array.isArray(value)) return value.length;
  return numberOrUndefined(value);
}

function firstNumber(value) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return undefined;
  const match = value.match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : undefined;
}

function numberOrUndefined(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") return firstNumber(value);
  return undefined;
}

function compactObject(object) {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => {
      if (value === undefined || value === null) return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    }),
  );
}
