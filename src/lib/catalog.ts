import scrapedCoreParts from "~/data/scraped-core-parts.json";

export const categoryIds = [
  "cpu",
  "motherboard",
  "gpu",
  "memory",
  "storage",
  "cooling",
  "psu",
  "case",
  "fans",
] as const;

export type CategoryId = (typeof categoryIds)[number];
export type SocketType = "AM5" | "LGA1851" | "LGA1700";
export type MemoryType = "DDR5" | "DDR4";
export type FormFactor = "ATX" | "Micro-ATX" | "Mini-ITX";
export type Severity = "error" | "warning" | "ok";
export type Vec3 = [number, number, number];

export type PartSource = {
  sourceName: string;
  sourceUrl: string;
  scrapedAt: string;
};

export type PhysicalDimensions = {
  lengthMm?: number;
  widthMm?: number;
  heightMm?: number;
  depthMm?: number;
  thicknessMm?: number;
  pumpLengthMm?: number;
  pumpWidthMm?: number;
  pumpHeightMm?: number;
};

export type PartModel = {
  kind: "parametric" | "glb";
  slot: CategoryId;
  mount?: string;
  assetUrl?: string;
  position?: Vec3;
  rotation?: Vec3;
  scale?: number | Vec3;
};

export type Part = {
  id: string;
  category: CategoryId;
  name: string;
  brand: string;
  series: string;
  price: number;
  color: string;
  marketTags: string[];
  metrics: {
    gaming: number;
    creator: number;
    ai: number;
    quiet: number;
  };
  socket?: SocketType;
  memoryType?: MemoryType;
  formFactor?: FormFactor;
  supportedFormFactors?: FormFactor[];
  wattage?: number;
  tdp?: number;
  coolingTdp?: number;
  lengthMm?: number;
  gpuClearanceMm?: number;
  heightMm?: number;
  coolerClearanceMm?: number;
  radiatorMm?: number;
  radiatorSupportMm?: number;
  m2Slots?: number;
  psuWattage?: number;
  source?: PartSource;
  dimensions?: PhysicalDimensions;
  model?: PartModel;
  scrapedSpecs?: Record<string, string | number | boolean | string[]>;
};

type ScrapedPartRecord = {
  id: string;
  category: CategoryId;
  source: PartSource;
  part?: Partial<
    Pick<
      Part,
      | "name"
      | "brand"
      | "socket"
      | "memoryType"
      | "formFactor"
      | "supportedFormFactors"
      | "wattage"
      | "tdp"
      | "coolingTdp"
      | "lengthMm"
      | "gpuClearanceMm"
      | "heightMm"
      | "coolerClearanceMm"
      | "radiatorMm"
      | "radiatorSupportMm"
      | "m2Slots"
      | "psuWattage"
    >
  >;
  dimensions?: PhysicalDimensions;
  model?: PartModel;
  scrapedSpecs?: Record<string, string | number | boolean | string[]>;
};

const scrapedPartMap = new Map(
  (scrapedCoreParts as unknown as ScrapedPartRecord[]).map((record) => [
    record.id,
    record,
  ]),
);

function withScrapedPart<T extends Part>(part: T): T {
  const scraped = scrapedPartMap.get(part.id);
  if (!scraped) return part;

  return {
    ...part,
    ...scraped.part,
    source: scraped.source,
    dimensions: scraped.dimensions,
    model: scraped.model,
    scrapedSpecs: scraped.scrapedSpecs,
  };
}

export type PartSelection = Partial<Record<CategoryId, string>>;

export type CompatibilityIssue = {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
};

export type BuildSummary = {
  selectedParts: Partial<Record<CategoryId, Part>>;
  totalPrice: number;
  powerDraw: number;
  recommendedPsu: number;
  compatibility: CompatibilityIssue[];
  scores: {
    gaming: number;
    creator: number;
    ai: number;
    quiet: number;
  };
  channelTags: string[];
};

export const categoryMeta: Record<
  CategoryId,
  { label: string; shortLabel: string; tone: string }
> = {
  cpu: { label: "处理器", shortLabel: "CPU", tone: "#e6462f" },
  motherboard: { label: "主板", shortLabel: "主板", tone: "#14b8a6" },
  gpu: { label: "显卡", shortLabel: "GPU", tone: "#7c3aed" },
  memory: { label: "内存", shortLabel: "内存", tone: "#f59e0b" },
  storage: { label: "硬盘", shortLabel: "硬盘", tone: "#2563eb" },
  cooling: { label: "散热", shortLabel: "散热", tone: "#06b6d4" },
  psu: { label: "电源", shortLabel: "电源", tone: "#22c55e" },
  case: { label: "机箱", shortLabel: "机箱", tone: "#64748b" },
  fans: { label: "风扇", shortLabel: "风扇", tone: "#ec4899" },
};

export const catalog: Record<CategoryId, Part[]> = {
  cpu: [
    withScrapedPart({
      id: "amd-7800x3d",
      category: "cpu",
      name: "Ryzen 7 7800X3D",
      brand: "AMD",
      series: "8 核 3D V-Cache",
      price: 2399,
      color: "#f97316",
      marketTags: ["京东自营", "盒装", "电竞热门"],
      socket: "AM5",
      wattage: 120,
      tdp: 120,
      metrics: { gaming: 96, creator: 76, ai: 62, quiet: 78 },
    }),
    withScrapedPart({
      id: "amd-9700x",
      category: "cpu",
      name: "Ryzen 7 9700X",
      brand: "AMD",
      series: "8 核 Zen 5",
      price: 2199,
      color: "#ef4444",
      marketTags: ["天猫旗舰", "盒装", "低功耗"],
      socket: "AM5",
      wattage: 88,
      tdp: 65,
      metrics: { gaming: 88, creator: 82, ai: 64, quiet: 88 },
    }),
    {
      id: "intel-265k",
      category: "cpu",
      name: "Core Ultra 7 265K",
      brand: "Intel",
      series: "20 核混合架构",
      price: 2799,
      color: "#38bdf8",
      marketTags: ["京东自营", "盒装", "生产力"],
      socket: "LGA1851",
      wattage: 165,
      tdp: 125,
      metrics: { gaming: 89, creator: 91, ai: 72, quiet: 68 },
    },
    {
      id: "intel-14700f",
      category: "cpu",
      name: "Core i7-14700F",
      brand: "Intel",
      series: "20 核无核显",
      price: 2099,
      color: "#2563eb",
      marketTags: ["拼多多百亿补贴", "散片", "性价比"],
      socket: "LGA1700",
      wattage: 180,
      tdp: 65,
      metrics: { gaming: 84, creator: 86, ai: 65, quiet: 61 },
    },
  ],
  motherboard: [
    withScrapedPart({
      id: "msi-b850m-mortar",
      category: "motherboard",
      name: "MAG B850M MORTAR WIFI",
      brand: "微星",
      series: "AM5 / DDR5 / Wi-Fi 7",
      price: 1399,
      color: "#0f172a",
      marketTags: ["京东自营", "M-ATX", "国补可用"],
      socket: "AM5",
      memoryType: "DDR5",
      formFactor: "Micro-ATX",
      m2Slots: 3,
      metrics: { gaming: 82, creator: 80, ai: 78, quiet: 76 },
    }),
    withScrapedPart({
      id: "asus-b760m-plus",
      category: "motherboard",
      name: "TUF GAMING B760M-PLUS WIFI II",
      brand: "华硕",
      series: "LGA1700 / DDR5",
      price: 1199,
      color: "#1f2937",
      marketTags: ["天猫旗舰", "M-ATX", "D5"],
      socket: "LGA1700",
      memoryType: "DDR5",
      formFactor: "Micro-ATX",
      m2Slots: 3,
      metrics: { gaming: 78, creator: 76, ai: 74, quiet: 74 },
    }),
    {
      id: "gigabyte-z890-aorus",
      category: "motherboard",
      name: "Z890 AORUS ELITE WIFI7",
      brand: "技嘉",
      series: "LGA1851 / ATX",
      price: 2199,
      color: "#111827",
      marketTags: ["京东自营", "ATX", "PCIe 5.0"],
      socket: "LGA1851",
      memoryType: "DDR5",
      formFactor: "ATX",
      m2Slots: 4,
      metrics: { gaming: 88, creator: 90, ai: 88, quiet: 78 },
    },
    {
      id: "colorful-b760m-ddr4",
      category: "motherboard",
      name: "CVN B760M FROZEN WIFI D4",
      brand: "七彩虹",
      series: "LGA1700 / DDR4",
      price: 829,
      color: "#e5e7eb",
      marketTags: ["线下装机店", "M-ATX", "D4"],
      socket: "LGA1700",
      memoryType: "DDR4",
      formFactor: "Micro-ATX",
      m2Slots: 2,
      metrics: { gaming: 70, creator: 68, ai: 66, quiet: 72 },
    },
  ],
  gpu: [
    withScrapedPart({
      id: "rtx-5070-ti",
      category: "gpu",
      name: "GeForce RTX 5070 Ti 16G",
      brand: "NVIDIA",
      series: "2K 高刷 / CUDA",
      price: 6499,
      color: "#76b900",
      marketTags: ["京东自营", "DLSS", "AI 创作"],
      wattage: 285,
      lengthMm: 304,
      metrics: { gaming: 93, creator: 88, ai: 91, quiet: 70 },
    }),
    withScrapedPart({
      id: "rtx-5060-ti",
      category: "gpu",
      name: "GeForce RTX 5060 Ti 16G",
      brand: "NVIDIA",
      series: "1080p / 小机箱友好",
      price: 3299,
      color: "#22c55e",
      marketTags: ["天猫旗舰", "DLSS", "低功耗"],
      wattage: 180,
      lengthMm: 242,
      metrics: { gaming: 76, creator: 72, ai: 78, quiet: 82 },
    }),
    {
      id: "rx-9070-xt",
      category: "gpu",
      name: "Radeon RX 9070 XT 16G",
      brand: "AMD",
      series: "2K 光栅性能",
      price: 4999,
      color: "#dc2626",
      marketTags: ["拼多多百亿补贴", "FSR", "大显存"],
      wattage: 304,
      lengthMm: 330,
      metrics: { gaming: 90, creator: 80, ai: 74, quiet: 66 },
    },
    {
      id: "rtx-4080-super",
      category: "gpu",
      name: "GeForce RTX 4080 SUPER 16G",
      brand: "NVIDIA",
      series: "4K / 渲染",
      price: 7999,
      color: "#16a34a",
      marketTags: ["线下装机店", "CUDA", "旗舰库存"],
      wattage: 320,
      lengthMm: 340,
      metrics: { gaming: 98, creator: 95, ai: 94, quiet: 62 },
    },
  ],
  memory: [
    {
      id: "kingston-ddr5-32-6000",
      category: "memory",
      name: "FURY Beast DDR5 32GB 6000",
      brand: "金士顿",
      series: "16GB x2 / CL30",
      price: 699,
      color: "#111827",
      marketTags: ["京东自营", "D5", "甜点频率"],
      memoryType: "DDR5",
      metrics: { gaming: 84, creator: 78, ai: 76, quiet: 90 },
    },
    {
      id: "gskill-ddr5-64-6400",
      category: "memory",
      name: "Trident Z5 DDR5 64GB 6400",
      brand: "芝奇",
      series: "32GB x2 / CL32",
      price: 1399,
      color: "#b91c1c",
      marketTags: ["天猫旗舰", "D5", "创作容量"],
      memoryType: "DDR5",
      metrics: { gaming: 88, creator: 92, ai: 86, quiet: 86 },
    },
    {
      id: "asgard-ddr5-48-7200",
      category: "memory",
      name: "女武神 DDR5 48GB 7200",
      brand: "阿斯加特",
      series: "24GB x2 / 高频",
      price: 1099,
      color: "#d946ef",
      marketTags: ["拼多多百亿补贴", "D5", "RGB"],
      memoryType: "DDR5",
      metrics: { gaming: 90, creator: 86, ai: 82, quiet: 78 },
    },
    {
      id: "gloway-ddr4-32-3600",
      category: "memory",
      name: "弈 Pro DDR4 32GB 3600",
      brand: "光威",
      series: "16GB x2 / D4",
      price: 459,
      color: "#0ea5e9",
      marketTags: ["线下装机店", "D4", "预算"],
      memoryType: "DDR4",
      metrics: { gaming: 68, creator: 66, ai: 62, quiet: 88 },
    },
  ],
  storage: [
    {
      id: "sn850x-2tb",
      category: "storage",
      name: "WD_BLACK SN850X 2TB",
      brand: "西部数据",
      series: "PCIe 4.0 / 7300MB/s",
      price: 899,
      color: "#111827",
      marketTags: ["京东自营", "游戏盘", "五年质保"],
      metrics: { gaming: 86, creator: 88, ai: 80, quiet: 92 },
    },
    {
      id: "zhitai-tiplus7100-1tb",
      category: "storage",
      name: "TiPlus7100 1TB",
      brand: "致态",
      series: "国产颗粒 / PCIe 4.0",
      price: 499,
      color: "#2563eb",
      marketTags: ["天猫旗舰", "国产", "性价比"],
      metrics: { gaming: 76, creator: 74, ai: 72, quiet: 92 },
    },
    {
      id: "samsung-990-pro-4tb",
      category: "storage",
      name: "990 PRO 4TB",
      brand: "三星",
      series: "PCIe 4.0 / 大容量",
      price: 1999,
      color: "#1d4ed8",
      marketTags: ["京东自营", "创作盘", "旗舰"],
      metrics: { gaming: 90, creator: 96, ai: 90, quiet: 92 },
    },
  ],
  cooling: [
    {
      id: "pa120-se",
      category: "cooling",
      name: "Peerless Assassin 120 SE",
      brand: "利民",
      series: "双塔风冷",
      price: 199,
      color: "#94a3b8",
      marketTags: ["京东自营", "静音", "性价比"],
      coolingTdp: 220,
      heightMm: 157,
      metrics: { gaming: 78, creator: 76, ai: 72, quiet: 86 },
    },
    {
      id: "deepcool-ls520",
      category: "cooling",
      name: "冰堡垒 LS520 SE",
      brand: "九州风神",
      series: "240 一体水",
      price: 399,
      color: "#38bdf8",
      marketTags: ["天猫旗舰", "ARGB", "240 冷排"],
      coolingTdp: 250,
      radiatorMm: 240,
      metrics: { gaming: 84, creator: 82, ai: 78, quiet: 76 },
    },
    withScrapedPart({
      id: "lianli-galahad-360",
      category: "cooling",
      name: "Galahad II Trinity 360",
      brand: "联力",
      series: "360 一体水",
      price: 899,
      color: "#06b6d4",
      marketTags: ["京东自营", "360 冷排", "高负载"],
      coolingTdp: 320,
      radiatorMm: 360,
      metrics: { gaming: 92, creator: 94, ai: 90, quiet: 72 },
    }),
  ],
  psu: [
    {
      id: "huntkey-650-gold",
      category: "psu",
      name: "MVP K650 金牌",
      brand: "航嘉",
      series: "650W / ATX 2.x",
      price: 429,
      color: "#111827",
      marketTags: ["线下装机店", "金牌", "预算"],
      psuWattage: 650,
      metrics: { gaming: 70, creator: 68, ai: 66, quiet: 72 },
    },
    {
      id: "superflower-750-gold",
      category: "psu",
      name: "Leadex III 750W 金牌",
      brand: "振华",
      series: "750W / 全模组",
      price: 649,
      color: "#fbbf24",
      marketTags: ["京东自营", "金牌", "全模组"],
      psuWattage: 750,
      metrics: { gaming: 80, creator: 78, ai: 76, quiet: 80 },
    },
    withScrapedPart({
      id: "seasonic-850-atx3",
      category: "psu",
      name: "FOCUS GX-850 ATX 3.0",
      brand: "海韵",
      series: "850W / 12V-2x6",
      price: 899,
      color: "#f59e0b",
      marketTags: ["天猫旗舰", "ATX 3.0", "显卡新接口"],
      psuWattage: 850,
      metrics: { gaming: 88, creator: 86, ai: 88, quiet: 84 },
    }),
    {
      id: "rog-1000-platinum",
      category: "psu",
      name: "ROG LOKI 1000W 白金",
      brand: "华硕",
      series: "1000W / SFX-L",
      price: 1599,
      color: "#ef4444",
      marketTags: ["京东自营", "白金", "高端小箱"],
      psuWattage: 1000,
      metrics: { gaming: 94, creator: 94, ai: 94, quiet: 88 },
    },
  ],
  case: [
    {
      id: "jonsbo-d31",
      category: "case",
      name: "D31 MESH 副屏版",
      brand: "乔思伯",
      series: "M-ATX / 紧凑风道",
      price: 399,
      color: "#d1d5db",
      marketTags: ["天猫旗舰", "M-ATX", "桌面紧凑"],
      supportedFormFactors: ["Micro-ATX", "Mini-ITX"],
      gpuClearanceMm: 330,
      coolerClearanceMm: 168,
      radiatorSupportMm: 360,
      metrics: { gaming: 78, creator: 76, ai: 74, quiet: 76 },
    },
    withScrapedPart({
      id: "lianli-o11-air-mini",
      category: "case",
      name: "O11 AIR MINI",
      brand: "联力",
      series: "ATX / 海景房风道",
      price: 799,
      color: "#f8fafc",
      marketTags: ["京东自营", "ATX", "展示向"],
      supportedFormFactors: ["ATX", "Micro-ATX", "Mini-ITX"],
      gpuClearanceMm: 362,
      coolerClearanceMm: 170,
      radiatorSupportMm: 360,
      metrics: { gaming: 88, creator: 84, ai: 82, quiet: 82 },
    }),
    {
      id: "sama-quzao",
      category: "case",
      name: "趣造 2 Air",
      brand: "先马",
      series: "M-ATX / 高性价比",
      price: 299,
      color: "#111827",
      marketTags: ["拼多多百亿补贴", "M-ATX", "预算"],
      supportedFormFactors: ["Micro-ATX", "Mini-ITX"],
      gpuClearanceMm: 350,
      coolerClearanceMm: 165,
      radiatorSupportMm: 240,
      metrics: { gaming: 74, creator: 70, ai: 70, quiet: 68 },
    },
    withScrapedPart({
      id: "fractal-north",
      category: "case",
      name: "North Mesh",
      brand: "Fractal",
      series: "ATX / 木纹前脸",
      price: 1099,
      color: "#b45309",
      marketTags: ["线下装机店", "ATX", "静音美学"],
      supportedFormFactors: ["ATX", "Micro-ATX", "Mini-ITX"],
      gpuClearanceMm: 355,
      coolerClearanceMm: 170,
      radiatorSupportMm: 240,
      metrics: { gaming: 84, creator: 82, ai: 80, quiet: 90 },
    }),
  ],
  fans: [
    {
      id: "thermalright-tl-c12c-3",
      category: "fans",
      name: "TL-C12C 三联包",
      brand: "利民",
      series: "120mm / PWM",
      price: 79,
      color: "#94a3b8",
      marketTags: ["京东自营", "静音", "三联包"],
      wattage: 9,
      metrics: { gaming: 72, creator: 72, ai: 70, quiet: 82 },
    },
    {
      id: "lianli-sl-inf-3",
      category: "fans",
      name: "UNI FAN SL-INF 三联包",
      brand: "联力",
      series: "120mm / 积木风扇",
      price: 499,
      color: "#ec4899",
      marketTags: ["天猫旗舰", "ARGB", "展示向"],
      wattage: 15,
      metrics: { gaming: 80, creator: 78, ai: 76, quiet: 78 },
    },
    {
      id: "noctua-a12x25-3",
      category: "fans",
      name: "NF-A12x25 PWM 三只",
      brand: "Noctua",
      series: "120mm / 静音旗舰",
      price: 829,
      color: "#a16207",
      marketTags: ["线下装机店", "静音", "旗舰"],
      wattage: 6,
      metrics: { gaming: 84, creator: 82, ai: 80, quiet: 96 },
    },
  ],
};

export const defaultSelection: Required<PartSelection> = {
  cpu: "amd-7800x3d",
  motherboard: "msi-b850m-mortar",
  gpu: "rtx-5070-ti",
  memory: "kingston-ddr5-32-6000",
  storage: "sn850x-2tb",
  cooling: "pa120-se",
  psu: "seasonic-850-atx3",
  case: "lianli-o11-air-mini",
  fans: "thermalright-tl-c12c-3",
};

export const starterBuilds: Array<{
  id: string;
  name: string;
  useCase: string;
  selection: Required<PartSelection>;
}> = [
  {
    id: "balanced-2k",
    name: "2K 电竞均衡",
    useCase: "高刷网游 / 3A",
    selection: defaultSelection,
  },
  {
    id: "creator-quiet",
    name: "安静创作",
    useCase: "剪辑 / 摄影 / 多任务",
    selection: {
      cpu: "amd-9700x",
      motherboard: "msi-b850m-mortar",
      gpu: "rtx-5060-ti",
      memory: "gskill-ddr5-64-6400",
      storage: "samsung-990-pro-4tb",
      cooling: "pa120-se",
      psu: "superflower-750-gold",
      case: "fractal-north",
      fans: "noctua-a12x25-3",
    },
  },
  {
    id: "budget-esports",
    name: "预算电竞",
    useCase: "1080p / 网吧同款",
    selection: {
      cpu: "intel-14700f",
      motherboard: "colorful-b760m-ddr4",
      gpu: "rtx-5060-ti",
      memory: "gloway-ddr4-32-3600",
      storage: "zhitai-tiplus7100-1tb",
      cooling: "pa120-se",
      psu: "huntkey-650-gold",
      case: "sama-quzao",
      fans: "thermalright-tl-c12c-3",
    },
  },
  {
    id: "ai-workstation",
    name: "AI 小工作站",
    useCase: "本地推理 / 渲染",
    selection: {
      cpu: "intel-265k",
      motherboard: "gigabyte-z890-aorus",
      gpu: "rtx-4080-super",
      memory: "gskill-ddr5-64-6400",
      storage: "samsung-990-pro-4tb",
      cooling: "lianli-galahad-360",
      psu: "rog-1000-platinum",
      case: "lianli-o11-air-mini",
      fans: "lianli-sl-inf-3",
    },
  },
];

export function getPart(partId?: string) {
  if (!partId) return undefined;
  return categoryIds
    .flatMap((category) => catalog[category])
    .find((part) => part.id === partId);
}

export function getSelectedParts(selection: PartSelection) {
  return categoryIds.reduce<Partial<Record<CategoryId, Part>>>((acc, category) => {
    const part = getPart(selection[category]);
    if (part) acc[category] = part;
    return acc;
  }, {});
}

export function formatCny(value: number) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 0,
  }).format(value);
}

export function scoreLabel(score: number) {
  if (score >= 92) return "旗舰";
  if (score >= 84) return "高端";
  if (score >= 74) return "主流";
  return "入门";
}

export function calculateBuild(selection: PartSelection): BuildSummary {
  const selectedParts = getSelectedParts(selection);
  const totalPrice = Object.values(selectedParts).reduce(
    (total, part) => total + part.price,
    0,
  );
  const powerDraw = Math.round(
    Object.values(selectedParts).reduce(
      (total, part) => total + (part.wattage ?? 0),
      0,
    ) + 85,
  );
  const recommendedPsu = Math.ceil((powerDraw * 1.35) / 50) * 50;
  const compatibility = getCompatibilityIssues(selectedParts, recommendedPsu);
  const scores = getScores(selectedParts, compatibility);
  const channelTags = Array.from(
    new Set(Object.values(selectedParts).flatMap((part) => part.marketTags)),
  ).slice(0, 8);

  return {
    selectedParts,
    totalPrice,
    powerDraw,
    recommendedPsu,
    compatibility,
    scores,
    channelTags,
  };
}

function getScores(
  selectedParts: Partial<Record<CategoryId, Part>>,
  compatibility: CompatibilityIssue[],
) {
  const parts = Object.values(selectedParts);
  const average = (key: keyof Part["metrics"]) =>
    Math.round(
      parts.reduce((total, part) => total + part.metrics[key], 0) /
        Math.max(parts.length, 1),
    );
  const hardPenalty = compatibility.filter(
    (issue) => issue.severity === "error",
  ).length;
  const softPenalty = compatibility.filter(
    (issue) => issue.severity === "warning",
  ).length;
  const penalty = hardPenalty * 16 + softPenalty * 4;

  return {
    gaming: clampScore(
      Math.round(
        (selectedParts.gpu?.metrics.gaming ?? average("gaming")) * 0.48 +
          (selectedParts.cpu?.metrics.gaming ?? average("gaming")) * 0.28 +
          (selectedParts.memory?.metrics.gaming ?? average("gaming")) * 0.14 +
          average("gaming") * 0.1 -
          penalty,
      ),
    ),
    creator: clampScore(
      Math.round(
        (selectedParts.cpu?.metrics.creator ?? average("creator")) * 0.32 +
          (selectedParts.gpu?.metrics.creator ?? average("creator")) * 0.28 +
          (selectedParts.memory?.metrics.creator ?? average("creator")) * 0.2 +
          (selectedParts.storage?.metrics.creator ?? average("creator")) * 0.12 +
          average("creator") * 0.08 -
          penalty,
      ),
    ),
    ai: clampScore(
      Math.round(
        (selectedParts.gpu?.metrics.ai ?? average("ai")) * 0.58 +
          (selectedParts.memory?.metrics.ai ?? average("ai")) * 0.16 +
          (selectedParts.cpu?.metrics.ai ?? average("ai")) * 0.16 +
          average("ai") * 0.1 -
          penalty,
      ),
    ),
    quiet: clampScore(Math.round(average("quiet") - softPenalty * 5)),
  };
}

function getCompatibilityIssues(
  selectedParts: Partial<Record<CategoryId, Part>>,
  recommendedPsu: number,
) {
  const issues: CompatibilityIssue[] = [];
  const cpu = selectedParts.cpu;
  const motherboard = selectedParts.motherboard;
  const gpu = selectedParts.gpu;
  const memory = selectedParts.memory;
  const cooling = selectedParts.cooling;
  const psu = selectedParts.psu;
  const pcCase = selectedParts.case;

  for (const category of categoryIds) {
    if (!selectedParts[category]) {
      issues.push({
        id: `missing-${category}`,
        severity: "warning",
        title: `${categoryMeta[category].label}未选择`,
        detail: "清单未完整，报价和兼容性只能作为草稿。",
      });
    }
  }

  if (cpu && motherboard && cpu.socket !== motherboard.socket) {
    issues.push({
      id: "socket",
      severity: "error",
      title: "CPU 与主板插槽不匹配",
      detail: `${cpu.name} 是 ${cpu.socket}，${motherboard.name} 是 ${motherboard.socket}。`,
    });
  }

  if (memory && motherboard && memory.memoryType !== motherboard.memoryType) {
    issues.push({
      id: "memory",
      severity: "error",
      title: "内存规格不匹配",
      detail: `${memory.name} 是 ${memory.memoryType}，主板需要 ${motherboard.memoryType}。`,
    });
  }

  if (
    motherboard &&
    pcCase?.supportedFormFactors &&
    !pcCase.supportedFormFactors.includes(motherboard.formFactor ?? "ATX")
  ) {
    issues.push({
      id: "form-factor",
      severity: "error",
      title: "主板尺寸超过机箱支持",
      detail: `${pcCase.name} 不支持 ${motherboard.formFactor} 主板。`,
    });
  }

  if (gpu?.lengthMm && pcCase?.gpuClearanceMm && gpu.lengthMm > pcCase.gpuClearanceMm) {
    issues.push({
      id: "gpu-length",
      severity: "error",
      title: "显卡长度超限",
      detail: `${gpu.name} 长 ${gpu.lengthMm}mm，${pcCase.name} 限长 ${pcCase.gpuClearanceMm}mm。`,
    });
  }

  if (
    cooling?.heightMm &&
    pcCase?.coolerClearanceMm &&
    cooling.heightMm > pcCase.coolerClearanceMm
  ) {
    issues.push({
      id: "cooler-height",
      severity: "error",
      title: "风冷高度超限",
      detail: `${cooling.name} 高 ${cooling.heightMm}mm，机箱限高 ${pcCase.coolerClearanceMm}mm。`,
    });
  }

  if (
    cooling?.radiatorMm &&
    pcCase?.radiatorSupportMm &&
    cooling.radiatorMm > pcCase.radiatorSupportMm
  ) {
    issues.push({
      id: "radiator",
      severity: "error",
      title: "冷排尺寸超限",
      detail: `${cooling.name} 是 ${cooling.radiatorMm} 冷排，机箱最高支持 ${pcCase.radiatorSupportMm}。`,
    });
  }

  if (cpu?.tdp && cooling?.coolingTdp && cooling.coolingTdp < cpu.tdp * 1.7) {
    issues.push({
      id: "thermal-headroom",
      severity: "warning",
      title: "散热余量偏紧",
      detail: `${cpu.name} 建议预留更高散热能力，长时间烤机会更稳。`,
    });
  }

  if (psu?.psuWattage && psu.psuWattage < recommendedPsu) {
    issues.push({
      id: "psu",
      severity: "error",
      title: "电源功率不足",
      detail: `估算峰值 ${recommendedPsu}W，当前电源 ${psu.psuWattage}W。`,
    });
  } else if (psu?.psuWattage && psu.psuWattage < recommendedPsu + 100) {
    issues.push({
      id: "psu-headroom",
      severity: "warning",
      title: "电源升级余量较少",
      detail: `当前 ${psu.psuWattage}W 可用，但后续升级高端显卡会受限。`,
    });
  }

  if (!issues.some((issue) => issue.severity !== "ok")) {
    issues.push({
      id: "ready",
      severity: "ok",
      title: "兼容性通过",
      detail: "插槽、内存、机箱空间、散热和电源余量均可落地。",
    });
  }

  return issues;
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, score));
}
