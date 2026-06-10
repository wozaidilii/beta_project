import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const outFile = path.join(process.cwd(), "src/data/scraped-core-parts.json");

const seeds = [
  {
    id: "amd-7800x3d",
    category: "cpu",
    sourceName: "AMD official specifications",
    sourceUrl:
      "https://www.amd.com/en/products/processors/desktops/ryzen/7000-series/amd-ryzen-7-7800x3d.html",
    part: { socket: "AM5", tdp: 120, wattage: 120 },
    dimensions: { lengthMm: 40, widthMm: 40, heightMm: 4 },
    model: { kind: "parametric", slot: "cpu", mount: "socket-am5" },
    fallbackSpecs: {
      cores: 8,
      threads: 16,
      boostClock: "Up to 5 GHz",
      tdp: "120W",
      socket: "AM5",
    },
    patterns: {
      cores: /# of CPU Cores\s+(\d+)/i,
      threads: /# of Threads\s+(\d+)/i,
      boostClock: /Max\. Boost Clock\s+([^\n]+)/i,
      tdp: /Default TDP\s+([^\n]+)/i,
      socket: /CPU Socket\s+([^\n]+)/i,
    },
  },
  {
    id: "amd-9700x",
    category: "cpu",
    sourceName: "AMD official specifications",
    sourceUrl:
      "https://www.amd.com/en/products/processors/desktops/ryzen/9000-series/amd-ryzen-7-9700x.html",
    part: { socket: "AM5", tdp: 65, wattage: 88 },
    dimensions: { lengthMm: 40, widthMm: 40, heightMm: 4 },
    model: { kind: "parametric", slot: "cpu", mount: "socket-am5" },
    fallbackSpecs: {
      cores: 8,
      threads: 16,
      boostClock: "Up to 5.5 GHz",
      tdp: "65W",
      socket: "AM5",
    },
    patterns: {
      cores: /# of CPU Cores\s+(\d+)/i,
      threads: /# of Threads\s+(\d+)/i,
      boostClock: /Max\. Boost Clock\s+([^\n]+)/i,
      tdp: /Default TDP\s+([^\n]+)/i,
      socket: /CPU Socket\s+([^\n]+)/i,
    },
  },
  {
    id: "msi-b850m-mortar",
    category: "motherboard",
    sourceName: "MSI official specifications",
    sourceUrl: "https://www.msi.com/Motherboard/MAG-B850M-MORTAR-WIFI/Specification",
    part: {
      socket: "AM5",
      memoryType: "DDR5",
      formFactor: "Micro-ATX",
      m2Slots: 3,
    },
    dimensions: { lengthMm: 243.84, widthMm: 243.84, heightMm: 18 },
    model: { kind: "parametric", slot: "motherboard", mount: "case-standoffs" },
    fallbackSpecs: {
      chipset: "AMD B850",
      memory: "4x DDR5 UDIMM",
      storage: "3x M.2",
      pcbInfo: "mATX 243.84mm x 243.84mm",
    },
    patterns: {
      chipset: /Chipset\s+([^\n]+)/i,
      memory: /Memory\s+([^\n]+)/i,
      storage: /Storage\s+([^\n]+)/i,
      pcbInfo: /PCB Info\s+([^\n]+\n[^\n]+)/i,
    },
  },
  {
    id: "asus-b760m-plus",
    category: "motherboard",
    sourceName: "ASUS official specifications",
    sourceUrl:
      "https://www.asus.com/motherboards-components/motherboards/tuf-gaming/tuf-gaming-b760m-plus-wifi-ii/techspec/",
    part: {
      socket: "LGA1700",
      memoryType: "DDR5",
      formFactor: "Micro-ATX",
      m2Slots: 3,
    },
    dimensions: { lengthMm: 244, widthMm: 244, heightMm: 18 },
    model: { kind: "parametric", slot: "motherboard", mount: "case-standoffs" },
    patterns: {
      chipset: /Chipset\s+([^\n]+)/i,
      memory: /Memory\s+([^\n]+)/i,
      storage: /Supports\s+(3 x M\.2 slots[^\n]+)/i,
      formFactor: /Form Factor\s+([^\n]+\n[^\n]+)/i,
    },
  },
  {
    id: "rtx-5070-ti",
    category: "gpu",
    sourceName: "ASUS official specifications",
    sourceUrl:
      "https://www.asus.com/motherboards-components/graphics-cards/tuf-gaming/tuf-rtx5070ti-o16g-gaming/techspec/",
    part: {
      name: "TUF Gaming GeForce RTX 5070 Ti 16G OC",
      brand: "华硕",
      lengthMm: 329,
    },
    dimensions: { lengthMm: 329, heightMm: 140, thicknessMm: 62.5 },
    model: { kind: "parametric", slot: "gpu", mount: "pcie-x16" },
    patterns: {
      memory: /Video Memory\s+([^\n]+)/i,
      cudaCores: /CUDA Core\s+(\d+)/i,
      dimensions: /Dimensions\s+([0-9. x]+mm)/i,
      recommendedPsu: /Recommended PSU\s+([^\n]+)/i,
      powerConnectors: /Power Connectors\s+([^\n]+)/i,
      slot: /Slot\s+([^\n]+)/i,
    },
  },
  {
    id: "rtx-5060-ti",
    category: "gpu",
    sourceName: "ASUS official specifications",
    sourceUrl:
      "https://www.asus.com/motherboards-components/graphics-cards/dual/dual-rtx5060ti-16g/techspec/",
    part: {
      name: "Dual GeForce RTX 5060 Ti 16G",
      brand: "华硕",
      lengthMm: 229,
    },
    dimensions: { lengthMm: 229, heightMm: 120, thicknessMm: 50 },
    model: { kind: "parametric", slot: "gpu", mount: "pcie-x16" },
    patterns: {
      memory: /Video Memory\s+([^\n]+)/i,
      cudaCores: /CUDA Core\s+(\d+)/i,
      dimensions: /Dimensions\s+([0-9. x]+mm)/i,
      recommendedPsu: /Recommended PSU\s+([^\n]+)/i,
      powerConnectors: /Power Connectors\s+([^\n]+)/i,
      slot: /Slot\s+([^\n]+)/i,
    },
  },
  {
    id: "lianli-o11-air-mini",
    category: "case",
    sourceName: "LIAN LI official specifications",
    sourceUrl: "https://lian-li.com/product/o11-air-mini/",
    part: {
      supportedFormFactors: ["ATX", "Micro-ATX", "Mini-ITX"],
      gpuClearanceMm: 362,
      coolerClearanceMm: 170,
      radiatorSupportMm: 280,
    },
    dimensions: { depthMm: 400, widthMm: 288, heightMm: 384 },
    model: { kind: "parametric", slot: "case", mount: "root" },
    patterns: {
      dimension: /DIMENSION(?:\(D\))?\s+([^\n]+)/i,
      motherboardSupport: /MOTHERBOARD SUPPORT\s+([^\n]+)/i,
      gpuClearance: /GPU LENGTH CLEARANCE\s+([^\n]+)/i,
      cpuCoolerClearance: /CPU HEIGHT CLEARANCE\s+([^\n]+)/i,
      radiatorSupport: /RADIATOR SUPPORT\s+([\s\S]{0,120}?)(?:DRIVE SUPPORT|$)/i,
    },
  },
  {
    id: "fractal-north",
    category: "case",
    sourceName: "Fractal Design official specifications",
    sourceUrl: "https://www.fractal-design.com/products/cases/north/north/chalk-white/",
    part: {
      supportedFormFactors: ["ATX", "Micro-ATX", "Mini-ITX"],
      gpuClearanceMm: 355,
      coolerClearanceMm: 170,
      radiatorSupportMm: 360,
    },
    dimensions: { depthMm: 447, widthMm: 215, heightMm: 469 },
    model: { kind: "parametric", slot: "case", mount: "root" },
    patterns: {
      caseDimensions: /Case dimensions \(LxWxH\)\s+([^\n]+)/i,
      gpuMaxLength: /GPU max length\s+([^\n]+)/i,
      cpuCoolerMaxHeight: /CPU cooler max height\s+([^\n]+)/i,
      frontRadiator: /Front radiator\s+([^\n]+)/i,
      topRadiator: /Top radiator\s+([^\n]+)/i,
    },
  },
  {
    id: "lianli-galahad-360",
    category: "cooling",
    sourceName: "LIAN LI official specifications",
    sourceUrl: "https://lian-li.com/product/galahad-ii-trinity/",
    part: { radiatorMm: 360, coolingTdp: 320 },
    dimensions: {
      lengthMm: 397.5,
      widthMm: 119.2,
      heightMm: 27,
      pumpLengthMm: 74,
      pumpWidthMm: 74,
      pumpHeightMm: 69,
    },
    model: { kind: "parametric", slot: "cooling", mount: "top-radiator" },
    patterns: {
      radiatorSize: /RADIATOR SIZE\s+([^\n]+)/i,
      pumpSize: /PUMP SIZE\s+([^\n]+)/i,
      pumpSpeed: /PUMP SPEED\s+([^\n]+)/i,
      compatibleSockets: /COMPATIBLE CPU SOCKETS\s+([\s\S]{0,80}?)(?:WARRANTY|$)/i,
    },
  },
  {
    id: "seasonic-850-atx3",
    category: "psu",
    sourceName: "Seasonic official specifications",
    sourceUrl: "https://seasonic.com/focus-gx-atx-3/",
    part: { name: "FOCUS GX-850 ATX 3.1", psuWattage: 850 },
    dimensions: { lengthMm: 140, widthMm: 150, heightMm: 86 },
    model: { kind: "parametric", slot: "psu", mount: "psu-bay" },
    fallbackSpecs: {
      wattage: "850W",
      dimensions: "140 x 150 x 86 mm",
      standard: "ATX 3.1 & PCIe 5.1",
      cabling: "Fully Modular",
      warranty: "10 Years",
    },
    patterns: {
      dimensions: /Dimensions\s+([0-9 mm()LxW.H]+)/i,
      standard: /ATX Specifications\s+([^\n]+)/i,
      cabling: /Cabling\s+([^\n]+)/i,
      warranty: /Warranty\s+([^\n]+)/i,
    },
  },
];

function compactText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "\n")
    .replace(/<style[\s\S]*?<\/style>/gi, "\n")
    .replace(/<[^>]+>/g, "\n")
    .replace(/&nbsp;/g, " ")
    .replace(/&times;/g, "x")
    .replace(/&amp;/g, "&")
    .replace(/&#8482;|&trade;/g, "™")
    .replace(/&#174;|&reg;/g, "®")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function normalizeMatch(value) {
  return value.replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
}

async function scrapeSeed(seed) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  const response = await fetch(seed.sourceUrl, {
    signal: controller.signal,
    headers: {
      "user-agent":
        "Mozilla/5.0 (compatible; beta-project-part-scraper/0.1; +https://github.com/wozaidilii/beta_project)",
    },
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const text = compactText(await response.text());
  const scrapedSpecs = {};

  for (const [key, pattern] of Object.entries(seed.patterns)) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const value = normalizeMatch(match[1]);
      scrapedSpecs[key] = /^\d+$/.test(value) ? Number(value) : value;
    }
  }

  return scrapedSpecs;
}

const scrapedAt = new Date().toISOString();
const records = [];

for (const seed of seeds) {
  const { fallbackSpecs = {}, sourceName, sourceUrl, ...record } = seed;
  delete record.patterns;
  try {
    const scrapedSpecs = await scrapeSeed(seed);
    records.push({
      ...record,
      source: { sourceName, sourceUrl, scrapedAt },
      part: record.part,
      dimensions: record.dimensions,
      model: record.model,
      scrapedSpecs: { ...fallbackSpecs, ...scrapedSpecs },
      scrapeStatus: "ok",
    });
  } catch (error) {
    records.push({
      ...record,
      source: { sourceName, sourceUrl, scrapedAt },
      part: record.part,
      dimensions: record.dimensions,
      model: record.model,
      scrapedSpecs: fallbackSpecs,
      scrapeStatus: "failed",
      scrapeError: error instanceof Error ? error.message : String(error),
    });
  }
}

await mkdir(path.dirname(outFile), { recursive: true });
await writeFile(outFile, `${JSON.stringify(records, null, 2)}\n`);
console.log(`Wrote ${records.length} scraped part records to ${outFile}`);
