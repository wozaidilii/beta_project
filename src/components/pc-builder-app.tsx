"use client";

import {
  AlertTriangle,
  Box,
  Bug,
  CheckCircle2,
  Cpu,
  Factory,
  Fan,
  Gauge,
  HardDrive,
  Layers3,
  MemoryStick,
  MonitorUp,
  Palette,
  RotateCcw,
  Ruler,
  Search,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Star,
  Upload,
  XCircle,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";

import { PcScene } from "~/components/pc-scene";
import {
  calculateBuild,
  catalog,
  categoryIds,
  categoryMeta,
  defaultSelection,
  formatCny,
  hasModelAsset,
  scoreLabel,
  starterBuilds,
  type CategoryId,
  type Part,
  type PartSelection,
  type Severity,
} from "~/lib/catalog";
import { describeDimensions } from "~/lib/model-layout";

const categoryIcons: Record<CategoryId, React.ComponentType<{ size?: number }>> = {
  cpu: Cpu,
  motherboard: Layers3,
  gpu: MonitorUp,
  memory: MemoryStick,
  storage: HardDrive,
  cooling: Gauge,
  psu: Zap,
  case: Box,
  fans: Fan,
};

const scenarioLabels = [
  { key: "gaming", label: "电竞" },
  { key: "creator", label: "创作" },
  { key: "ai", label: "AI" },
  { key: "quiet", label: "静音" },
] as const;

type WorkspaceMode = "builder" | "products" | "setups";
type ShopCategoryId = CategoryId;
type ProductVisualCategory = "builds" | CategoryId;
type ShopFilters = {
  brands: string[];
  colors: string[];
  sizes: string[];
  priceRange: [number, number];
};
type ShopFilterOptions = {
  brands: string[];
  colors: Array<{ value: string; label: string; swatch: string }>;
  sizes: string[];
  price: { min: number; max: number };
};
type SetupItem = {
  id: string;
  name: string;
  useCase: string;
  selection: Required<PartSelection>;
  sourceLabel: string;
};

const primaryShopCategoryIds: ShopCategoryId[] = [
  "case",
  "cpu",
  "motherboard",
  "gpu",
  "memory",
  "storage",
  "psu",
  "cooling",
];
const compactShopCategoryIds: ShopCategoryId[] = ["fans"];
const futureShopCategories = [
  "显示器",
  "键盘",
  "鼠标",
  "耳机",
  "声卡",
  "网卡",
  "采集卡",
  "配件",
];
const colorFamilyMeta = {
  black: { label: "黑色", swatch: "#111827" },
  white: { label: "白色", swatch: "#f8fafc" },
  gray: { label: "银灰", swatch: "#94a3b8" },
  red: { label: "红色", swatch: "#ef4444" },
  orange: { label: "橙色", swatch: "#f97316" },
  gold: { label: "金色", swatch: "#f59e0b" },
  green: { label: "绿色", swatch: "#22c55e" },
  teal: { label: "青色", swatch: "#14b8a6" },
  blue: { label: "蓝色", swatch: "#2563eb" },
  purple: { label: "紫色", swatch: "#7c3aed" },
  pink: { label: "粉色", swatch: "#d946ef" },
} as const;

type ColorFamily = keyof typeof colorFamilyMeta;

export function PcBuilderApp() {
  const [selection, setSelection] = useState<PartSelection>(defaultSelection);
  const [activeCategory, setActiveCategory] = useState<CategoryId>("gpu");
  const [query, setQuery] = useState("");
  const [activeWorkspace, setActiveWorkspace] =
    useState<WorkspaceMode>("builder");
  const [activeShopCategory, setActiveShopCategory] =
    useState<ShopCategoryId>("case");
  const [shopFilters, setShopFilters] =
    useState<ShopFilters>(() => getDefaultShopFilters(getShopFilterOptions("case")));
  const [uploadedSetups, setUploadedSetups] = useState<SetupItem[]>([]);
  const [setupUploadError, setSetupUploadError] = useState("");
  const [showAssemblyDebug, setShowAssemblyDebug] = useState(false);
  const [activeScenario, setActiveScenario] =
    useState<(typeof scenarioLabels)[number]["key"]>("gaming");

  const summary = useMemo(() => calculateBuild(selection), [selection]);
  const selectedPart = summary.selectedParts[activeCategory];
  const activeOptions = useMemo(
    () =>
      catalog[activeCategory].filter(
        (part) => partMatchesQuery(part, query) && hasModelAsset(part),
      ),
    [activeCategory, query],
  );
  const shopParts = useMemo(
    () =>
      catalog[activeShopCategory].filter((part) =>
        hasModelAsset(part) &&
        partMatchesQuery(part, query) &&
        partMatchesFilters(part, shopFilters),
      ),
    [activeShopCategory, query, shopFilters],
  );
  const popularSetups = useMemo<SetupItem[]>(
    () =>
      starterBuilds
        .filter((preset) => presetMatchesQuery(preset, query))
        .map((preset) => ({ ...preset, sourceLabel: "热门 Setup" })),
    [query],
  );
  const visibleUploadedSetups = useMemo(
    () => uploadedSetups.filter((setup) => presetMatchesQuery(setup, query)),
    [query, uploadedSetups],
  );
  const shopFilterOptions = useMemo(
    () => getShopFilterOptions(activeShopCategory),
    [activeShopCategory],
  );
  const shopTotalCount = useMemo(
    () =>
      categoryIds.reduce(
        (total, category) =>
          total + catalog[category].filter(hasModelAsset).length,
        0,
      ),
    [],
  );
  const activeShopCount = shopParts.length;

  const setPart = (part: Part) => {
    setSelection((current) => ({ ...current, [part.category]: part.id }));
  };
  const setShopCategory = (category: ShopCategoryId) => {
    setActiveShopCategory(category);
    setShopFilters(getDefaultShopFilters(getShopFilterOptions(category)));
  };
  const applySetup = (setup: SetupItem) => {
    setSelection(setup.selection);
    setActiveWorkspace("builder");
  };
  const handleSetupUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const payload = JSON.parse(await file.text()) as unknown;
      const setup = normalizeUploadedSetup(payload, file.name);
      setUploadedSetups((current) => [setup, ...current]);
      setSelection(setup.selection);
      setSetupUploadError("");
    } catch {
      setSetupUploadError("Setup 文件格式不匹配");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark">
            <Cpu size={18} />
          </div>
          <div>
            <span className="brand-name">装机舱 CN</span>
            <span className="brand-caption">3D 主机组装配置器</span>
          </div>
        </div>

        <div className="topbar-center">
          {scenarioLabels.map((scenario) => (
            <button
              className={`scenario-tab ${
                activeScenario === scenario.key ? "is-active" : ""
              }`}
              key={scenario.key}
              onClick={() => setActiveScenario(scenario.key)}
              type="button"
            >
              {scenario.label}
              <span>{summary.scores[scenario.key]}</span>
            </button>
          ))}
        </div>

        <div className="topbar-total">
          <span>估算总价</span>
          <strong>{formatCny(summary.totalPrice)}</strong>
        </div>
      </header>

      <section className="workspace-shell">
        <aside className="workspace-sidebar" aria-label="工作区导航">
          <span className="sidebar-kicker">工作区</span>
          <nav className="workspace-nav" aria-label="页面模式">
            <button
              aria-pressed={activeWorkspace === "builder"}
              className={`workspace-nav__button ${
                activeWorkspace === "builder" ? "is-active" : ""
              }`}
              onClick={() => setActiveWorkspace("builder")}
              type="button"
            >
              <Cpu size={20} />
              <span>3D Builder</span>
            </button>
            <button
              aria-pressed={activeWorkspace === "products"}
              className={`workspace-nav__button ${
                activeWorkspace === "products" ? "is-active" : ""
              }`}
              onClick={() => setActiveWorkspace("products")}
              type="button"
            >
              <ShoppingCart size={20} />
              <span>产品</span>
            </button>
            <button
              aria-pressed={activeWorkspace === "setups"}
              className={`workspace-nav__button ${
                activeWorkspace === "setups" ? "is-active" : ""
              }`}
              onClick={() => setActiveWorkspace("setups")}
              type="button"
            >
              <Sparkles size={20} />
              <span>预设 Set</span>
            </button>
          </nav>
        </aside>

        <section className="workspace-main">
          {activeWorkspace === "builder" ? (
            <section className="builder-grid" aria-label="3D Builder">
              <aside className="panel picker-panel" aria-label="配件库">
                <div className="panel-heading">
                  <div>
                    <span className="eyebrow">3D Builder</span>
                    <h1>{categoryMeta[activeCategory].label}</h1>
                  </div>
                  <ShieldCheck size={22} />
                </div>

                <label className="search-box">
                  <Search size={17} />
                  <input
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="搜索当前分类"
                    value={query}
                  />
                </label>

                <div className="category-rail">
                  {categoryIds.map((category) => {
                    const Icon = categoryIcons[category];
                    const isActive = category === activeCategory;
                    return (
                      <button
                        aria-label={categoryMeta[category].label}
                        className={`category-button ${isActive ? "is-active" : ""}`}
                        key={category}
                        onClick={() => setActiveCategory(category)}
                        style={
                          { "--tone": categoryMeta[category].tone } as React.CSSProperties
                        }
                        title={categoryMeta[category].label}
                        type="button"
                      >
                        <Icon size={18} />
                        <span>{categoryMeta[category].shortLabel}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="part-list">
                  {activeOptions.map((part) => (
                    <PartRow
                      isSelected={selection[activeCategory] === part.id}
                      key={part.id}
                      onSelect={() => setPart(part)}
                      part={part}
                    />
                  ))}
                </div>
              </aside>

              <section className="scene-panel" aria-label="3D 主机预览">
                <div className="scene-toolbar">
                  <div>
                    <span className="eyebrow">当前焦点</span>
                    <strong>
                      {selectedPart?.name ?? categoryMeta[activeCategory].label}
                    </strong>
                  </div>
                  <div className="scene-toolbar__badges">
                    <span>{summary.powerDraw}W 峰值</span>
                    <span>{summary.recommendedPsu}W 建议电源</span>
                    <button
                      aria-pressed={showAssemblyDebug}
                      className={`scene-debug-toggle ${
                        showAssemblyDebug ? "is-active" : ""
                      }`}
                      onClick={() => setShowAssemblyDebug((value) => !value)}
                      title="显示包围盒、anchor 点和坐标轴"
                      type="button"
                    >
                      <Bug size={14} />
                      <span>调试</span>
                    </button>
                  </div>
                </div>
                <PcScene
                  activeCategory={activeCategory}
                  debug={showAssemblyDebug}
                  selection={selection}
                />
              </section>

              <aside className="panel summary-panel" aria-label="装机清单">
                <div className="panel-heading">
                  <div>
                    <span className="eyebrow">装机清单</span>
                    <h2>{scoreLabel(summary.scores[activeScenario])}方案</h2>
                  </div>
                  <ShoppingCart size={22} />
                </div>

                <div className="price-block">
                  <span>RMB</span>
                  <strong>{formatCny(summary.totalPrice)}</strong>
                  <small>样例估价，不含显示器与外设</small>
                </div>

                <div className="score-stack">
                  {scenarioLabels.map((scenario) => (
                    <ScoreBar
                      active={activeScenario === scenario.key}
                      key={scenario.key}
                      label={scenario.label}
                      score={summary.scores[scenario.key]}
                    />
                  ))}
                </div>

                <div className="compatibility-box">
                  {summary.compatibility.map((issue) => (
                    <div className={`issue-row severity-${issue.severity}`} key={issue.id}>
                      <IssueIcon severity={issue.severity} />
                      <div>
                        <strong>{issue.title}</strong>
                        <span>{issue.detail}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="selected-list">
                  {categoryIds.map((category) => {
                    const Icon = categoryIcons[category];
                    const part = summary.selectedParts[category];
                    return (
                      <button
                        className="selected-line"
                        key={category}
                        onClick={() => {
                          setActiveCategory(category);
                          setActiveWorkspace("builder");
                        }}
                        type="button"
                      >
                        <Icon size={17} />
                        <span>{categoryMeta[category].shortLabel}</span>
                        <strong>{part?.name ?? "未选择"}</strong>
                      </button>
                    );
                  })}
                </div>

                <div className="channel-box">
                  {summary.channelTags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </aside>
            </section>
          ) : activeWorkspace === "products" ? (
            <section className="shop-page" aria-label="产品商城">
              <div className="shop-header">
                <div>
                  <span className="eyebrow">产品</span>
                  <h1>装机产品</h1>
                  <p>
                    当前显示 {activeShopCount} 个 / 全部 {shopTotalCount} 个 / 当前方案{" "}
                    {formatCny(summary.totalPrice)}
                  </p>
                </div>
                <label className="shop-search">
                  <Search size={18} />
                  <input
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="搜索产品、品牌、渠道"
                    value={query}
                  />
                </label>
              </div>

              <ShopCategoryMenu
                activeCategory={activeShopCategory}
                onSelect={setShopCategory}
              />

              <div className="shop-content">
                <ShopFilterSidebar
                  activeCategory={activeShopCategory}
                  filters={shopFilters}
                  onChange={setShopFilters}
                  onReset={() =>
                    setShopFilters(getDefaultShopFilters(shopFilterOptions))
                  }
                  options={shopFilterOptions}
                  resultCount={activeShopCount}
                />

                <div className="shop-grid">
                  {activeShopCount === 0 ? (
                    <div className="shop-empty">
                      <SlidersHorizontal size={22} />
                      <strong>没有符合条件的产品</strong>
                      <span>调整左侧筛选条件或重置价格范围后再查看。</span>
                    </div>
                  ) : shopParts.map((part) => (
                    <ShopProductCard
                      isSelected={selection[part.category] === part.id}
                      key={part.id}
                      onSelect={() => {
                        setActiveCategory(part.category);
                        setPart(part);
                      }}
                      part={part}
                    />
                  ))}
                </div>
              </div>
            </section>
          ) : (
            <section className="setups-page" aria-label="预设 Set">
              <div className="setups-header">
                <div>
                  <span className="eyebrow">预设 Set</span>
                  <h1>热门 Setup</h1>
                  <p>
                    {popularSetups.length + visibleUploadedSetups.length} 个完成方案 / 当前方案{" "}
                    {formatCny(summary.totalPrice)}
                  </p>
                </div>
                <label className="shop-search">
                  <Search size={18} />
                  <input
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="搜索 setup、用途"
                    value={query}
                  />
                </label>
              </div>

              <div className="setups-layout">
                <aside className="setup-upload-panel">
                  <div className="setup-upload-panel__heading">
                    <Upload size={20} />
                    <div>
                      <span className="eyebrow">我的 Setup</span>
                      <strong>上传配置</strong>
                    </div>
                  </div>
                  <label className="setup-upload-button">
                    <Upload size={17} />
                    <span>上传 Setup JSON</span>
                    <input
                      accept="application/json,.json"
                      onChange={handleSetupUpload}
                      type="file"
                    />
                  </label>
                  {setupUploadError ? (
                    <span className="setup-upload-error">{setupUploadError}</span>
                  ) : null}
                  <div className="setup-current-card">
                    <span>当前方案</span>
                    <strong>{formatCny(summary.totalPrice)}</strong>
                    <small>{summary.powerDraw}W 峰值 / {summary.recommendedPsu}W 电源</small>
                  </div>
                </aside>

                <div className="setup-list">
                  {visibleUploadedSetups.length > 0 ? (
                    <section className="setup-section">
                      <div className="setup-section__heading">
                        <span>我的上传</span>
                        <strong>{visibleUploadedSetups.length}</strong>
                      </div>
                      <div className="setup-grid">
                        {visibleUploadedSetups.map((setup) => (
                          <SetupCard
                            key={setup.id}
                            onApply={() => applySetup(setup)}
                            setup={setup}
                          />
                        ))}
                      </div>
                    </section>
                  ) : null}

                  <section className="setup-section">
                    <div className="setup-section__heading">
                      <span>热门完成方案</span>
                      <strong>{popularSetups.length}</strong>
                    </div>
                    <div className="setup-grid">
                      {popularSetups.map((setup) => (
                        <SetupCard
                          key={setup.id}
                          onApply={() => applySetup(setup)}
                          setup={setup}
                        />
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            </section>
          )}
        </section>
      </section>
    </main>
  );
}

function partMatchesQuery(part: Part, query: string) {
  const keyword = query.trim().toLowerCase();
  if (!keyword) return true;

  const haystack = `${part.name} ${part.brand} ${part.series} ${part.marketTags.join(
    " ",
  )}`.toLowerCase();

  return haystack.includes(keyword);
}

function presetMatchesQuery(
  preset: { name: string; useCase: string },
  query: string,
) {
  const keyword = query.trim().toLowerCase();
  if (!keyword) return true;

  return `${preset.name} ${preset.useCase}`.toLowerCase().includes(keyword);
}

function partMatchesFilters(part: Part, filters: ShopFilters) {
  if (filters.brands.length > 0 && !filters.brands.includes(part.brand)) {
    return false;
  }
  if (
    filters.colors.length > 0 &&
    !filters.colors.includes(getColorFamily(part.color))
  ) {
    return false;
  }
  const size = getSizeLabel(part);
  if (filters.sizes.length > 0 && (!size || !filters.sizes.includes(size))) {
    return false;
  }
  return priceWithin(part.price, filters);
}

function priceWithin(price: number, filters: ShopFilters) {
  const [min, max] = filters.priceRange;
  if (price < min) return false;
  if (price > max) return false;
  return true;
}

function getShopCategoryLabel(category: ProductVisualCategory) {
  return category === "builds" ? "整机" : categoryMeta[category].label;
}

function getShopCategoryTone(category: ProductVisualCategory) {
  return category === "builds" ? "#e6462f" : categoryMeta[category].tone;
}

function getShopCategoryIcon(category: ProductVisualCategory) {
  return category === "builds" ? Sparkles : categoryIcons[category];
}

function getShopCategoryCount(category: ShopCategoryId) {
  return catalog[category].filter(hasModelAsset).length;
}

function getShopFilterOptions(category: ShopCategoryId): ShopFilterOptions {
  const parts = catalog[category].filter(hasModelAsset);
  const prices = parts.map((part) => part.price);
  const colorMap = new Map<ColorFamily, { value: string; label: string; swatch: string }>();

  for (const part of parts) {
    const color = getColorFamily(part.color);
    colorMap.set(color, { value: color, ...colorFamilyMeta[color] });
  }

  return {
    brands: uniqueStrings(parts.map((part) => part.brand)),
    colors: Array.from(colorMap.values()),
    sizes: uniqueStrings(parts.map((part) => getSizeLabel(part)).filter(isString)),
    price: getPriceBounds(prices),
  };
}

function getDefaultShopFilters(options: ShopFilterOptions): ShopFilters {
  return {
    brands: [],
    colors: [],
    sizes: [],
    priceRange: [options.price.min, options.price.max],
  };
}

function shopFiltersAreActive(filters: ShopFilters, options: ShopFilterOptions) {
  return (
    filters.brands.length > 0 ||
    filters.colors.length > 0 ||
    filters.sizes.length > 0 ||
    filters.priceRange[0] > options.price.min ||
    filters.priceRange[1] < options.price.max
  );
}

function toggleFilterValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function clampPriceRange(
  value: [number, number],
  bounds: ShopFilterOptions["price"],
) {
  const [rawMin, rawMax] = value;
  const min = Math.max(bounds.min, Math.min(rawMin, bounds.max));
  const max = Math.max(bounds.min, Math.min(rawMax, bounds.max));
  return [Math.min(min, max), Math.max(min, max)] as [number, number];
}

function getPricePercent(value: number, bounds: ShopFilterOptions["price"]) {
  const span = bounds.max - bounds.min;
  if (span <= 0) return 0;
  return ((value - bounds.min) / span) * 100;
}

function getShopCategoryPreviewImage(category: ShopCategoryId) {
  return catalog[category].find(
    (part) => hasModelAsset(part) && part.productImageUrl,
  )?.productImageUrl;
}

function getImageBackground(imageUrl?: string) {
  if (!imageUrl) return undefined;
  return `linear-gradient(180deg, rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.42)), url("${imageUrl}")`;
}

function normalizeUploadedSetup(payload: unknown, fileName: string): SetupItem {
  if (!isRecord(payload)) {
    throw new Error("Invalid setup payload");
  }

  const selectionPayload = isRecord(payload.selection) ? payload.selection : payload;
  const selection = normalizeSetupSelection(selectionPayload);
  const fallbackName = fileName.replace(/\.json$/i, "") || "我的 Setup";

  return {
    id: `uploaded-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: typeof payload.name === "string" ? payload.name : fallbackName,
    useCase: typeof payload.useCase === "string" ? payload.useCase : "自定义上传",
    selection,
    sourceLabel: "我的上传",
  };
}

function normalizeSetupSelection(payload: Record<string, unknown>) {
  const selection = {} as Required<PartSelection>;

  for (const category of categoryIds) {
    const partId = payload[category];
    if (typeof partId !== "string") {
      throw new Error(`Missing ${category}`);
    }

    const exists = catalog[category].some((part) => part.id === partId);
    if (!exists) {
      throw new Error(`Unknown ${category}`);
    }

    selection[category] = partId;
  }

  return selection;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getPriceBounds(prices: number[]) {
  if (prices.length === 0) return { min: 0, max: 0 };
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, "zh-CN"));
}

function isString(value: string | undefined): value is string {
  return Boolean(value);
}

function getColorFamily(color: string): ColorFamily {
  const rgb = hexToRgb(color);
  if (!rgb) return "gray";

  const { h, l, s } = rgbToHsl(rgb.r, rgb.g, rgb.b);
  if (l >= 0.86 && s < 0.2) return "white";
  if (l <= 0.2 && s < 0.32) return "black";
  if (s < 0.22) return "gray";
  if (h < 18 || h >= 345) return "red";
  if (h < 42) return "orange";
  if (h < 62) return "gold";
  if (h < 155) return "green";
  if (h < 190) return "teal";
  if (h < 250) return "blue";
  if (h < 315) return "purple";
  return "pink";
}

function hexToRgb(color: string) {
  const normalized = color.replace("#", "");
  if (!/^[\da-f]{6}$/i.test(normalized)) return undefined;
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHsl(r: number, g: number, b: number) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l };

  const diff = max - min;
  const s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);
  let h = 0;

  if (max === red) h = (green - blue) / diff + (green < blue ? 6 : 0);
  if (max === green) h = (blue - red) / diff + 2;
  if (max === blue) h = (red - green) / diff + 4;

  return { h: h * 60, s, l };
}

function getSizeLabel(part: Part) {
  if (part.category === "case") {
    if (part.supportedFormFactors?.includes("ATX")) return "ATX 中塔";
    if (part.supportedFormFactors?.includes("Micro-ATX")) return "M-ATX 紧凑";
    if (part.supportedFormFactors?.includes("Mini-ITX")) return "Mini-ITX";
  }

  if (part.category === "motherboard") return part.formFactor;
  if (part.category === "gpu") {
    const length = part.lengthMm ?? part.dimensions?.lengthMm;
    if (!length) return undefined;
    if (length <= 260) return "短卡";
    if (length <= 320) return "标准长度";
    return "长卡";
  }

  if (part.category === "cooling") {
    if (part.radiatorMm) return `${part.radiatorMm}mm 冷排`;
    const height = part.heightMm ?? part.dimensions?.heightMm;
    if (!height) return undefined;
    return height <= 158 ? "中塔风冷" : "高塔风冷";
  }

  if (part.category === "psu") return part.psuFormFactor;
  if (part.category === "cpu") return part.socket;
  if (part.category === "memory") return part.memoryType;
  if (part.category === "storage") {
    const capacity = part.name.match(/\d+TB/i)?.[0];
    return capacity ? `${capacity.toUpperCase()} 容量` : "M.2 SSD";
  }
  if (part.category === "fans") return part.series.match(/\d+mm/i)?.[0] ?? "机箱风扇";
  return undefined;
}

function ShopCategoryMenu({
  activeCategory,
  onSelect,
}: {
  activeCategory: ShopCategoryId;
  onSelect: (category: ShopCategoryId) => void;
}) {
  const ActiveIcon = getShopCategoryIcon(activeCategory);
  const allCategories = [...primaryShopCategoryIds, ...compactShopCategoryIds];

  return (
    <div className="shop-category-dock" aria-label="产品分类">
      <div className="shop-category-dock__trigger" tabIndex={0}>
        <span
          className="shop-category-dock__active-icon"
          style={{ "--tone": getShopCategoryTone(activeCategory) } as React.CSSProperties}
        >
          <ActiveIcon size={28} />
        </span>
        <div>
          <span className="eyebrow">产品分类</span>
          <strong>{getShopCategoryLabel(activeCategory)}</strong>
          <small>鼠标靠近展开分类缩略图</small>
        </div>
        <div className="shop-category-dock__icons" aria-hidden="true">
          {allCategories.map((category) => {
            const Icon = getShopCategoryIcon(category);
            return (
              <span
                className={category === activeCategory ? "is-active" : ""}
                key={category}
                style={{ "--tone": getShopCategoryTone(category) } as React.CSSProperties}
              >
                <Icon size={15} />
              </span>
            );
          })}
        </div>
      </div>

      <div className="shop-category-menu">
        <div className="shop-category-menu__primary">
          {primaryShopCategoryIds.map((category) => (
            <ShopCategoryTile
              active={category === activeCategory}
              category={category}
              key={category}
              onSelect={onSelect}
            />
          ))}
        </div>

        <div className="shop-category-menu__side">
          <div className="shop-category-menu__compact">
            {compactShopCategoryIds.map((category) => (
              <ShopCategoryTile
                active={category === activeCategory}
                category={category}
                compact
                key={category}
                onSelect={onSelect}
              />
            ))}
          </div>

          <div className="shop-category-menu__other" aria-label="更多产品">
            <strong>其他产品</strong>
            {futureShopCategories.map((category) => (
              <span key={category}>{category}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ShopCategoryTile({
  active,
  category,
  compact = false,
  onSelect,
}: {
  active: boolean;
  category: ShopCategoryId;
  compact?: boolean;
  onSelect: (category: ShopCategoryId) => void;
}) {
  const Icon = getShopCategoryIcon(category);
  const previewImage = getShopCategoryPreviewImage(category);

  return (
    <button
      aria-pressed={active}
      className={`shop-category-tile ${compact ? "is-compact" : ""} ${
        active ? "is-active" : ""
      }`}
      onClick={() => onSelect(category)}
      style={{ "--tone": getShopCategoryTone(category) } as React.CSSProperties}
      type="button"
    >
      <span
        className={`shop-category-tile__visual ${
          previewImage ? "has-photo" : ""
        }`}
        aria-hidden="true"
        style={{ backgroundImage: getImageBackground(previewImage) }}
      >
        {previewImage ? null : <Icon size={compact ? 38 : 56} />}
      </span>
      <span className="shop-category-tile__label">{getShopCategoryLabel(category)}</span>
      <span className="shop-category-tile__count">{getShopCategoryCount(category)}</span>
    </button>
  );
}

function ShopFilterSidebar({
  activeCategory,
  filters,
  onChange,
  onReset,
  options,
  resultCount,
}: {
  activeCategory: ShopCategoryId;
  filters: ShopFilters;
  onChange: (filters: ShopFilters) => void;
  onReset: () => void;
  options: ShopFilterOptions;
  resultCount: number;
}) {
  const hasFilters = shopFiltersAreActive(filters, options);
  const priceDisabled = options.price.min === options.price.max;
  const priceStart = getPricePercent(filters.priceRange[0], options.price);
  const priceEnd = getPricePercent(filters.priceRange[1], options.price);
  const setPriceRange = (range: [number, number]) =>
    onChange({ ...filters, priceRange: clampPriceRange(range, options.price) });

  return (
    <aside className="shop-filter-sidebar" aria-label="产品筛选">
      <div className="shop-filter-sidebar__title">
        <SlidersHorizontal size={18} />
        <div>
          <strong>{getShopCategoryLabel(activeCategory)}筛选</strong>
          <span>{resultCount} 个结果</span>
        </div>
      </div>

      <fieldset className="shop-filter-group">
        <legend>
          <Factory size={15} />
          厂商
        </legend>
        <div className="shop-checkbox-list">
          {options.brands.length === 0 ? (
            <span className="shop-filter-empty">当前分类暂无厂商筛选</span>
          ) : null}
          {options.brands.map((brand) => (
            <label className="shop-checkbox" key={brand}>
              <input
                checked={filters.brands.includes(brand)}
                onChange={() =>
                  onChange({
                    ...filters,
                    brands: toggleFilterValue(filters.brands, brand),
                  })
                }
                type="checkbox"
              />
              <span className="shop-checkbox__box" />
              <strong>{brand}</strong>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="shop-filter-group">
        <legend>
          <Ruler size={15} />
          大小
        </legend>
        <div className="shop-checkbox-list">
          {options.sizes.length === 0 ? (
            <span className="shop-filter-empty">当前分类暂无尺寸筛选</span>
          ) : null}
          {options.sizes.map((size) => (
            <label className="shop-checkbox" key={size}>
              <input
                checked={filters.sizes.includes(size)}
                onChange={() =>
                  onChange({
                    ...filters,
                    sizes: toggleFilterValue(filters.sizes, size),
                  })
                }
                type="checkbox"
              />
              <span className="shop-checkbox__box" />
              <strong>{size}</strong>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="shop-filter-group">
        <legend>
          <Palette size={15} />
          颜色
        </legend>
        <div className="shop-checkbox-list">
          {options.colors.length === 0 ? (
            <span className="shop-filter-empty">当前分类暂无颜色筛选</span>
          ) : null}
          {options.colors.map((color) => (
            <label className="shop-checkbox shop-checkbox--color" key={color.value}>
              <input
                checked={filters.colors.includes(color.value)}
                onChange={() =>
                  onChange({
                    ...filters,
                    colors: toggleFilterValue(filters.colors, color.value),
                  })
                }
                type="checkbox"
              />
              <span className="shop-checkbox__box" />
              <i style={{ "--swatch": color.swatch } as React.CSSProperties} />
              <strong>{color.label}</strong>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="shop-filter-group shop-filter-group--price">
        <legend>价格区间</legend>
        <div
          className="shop-price-range"
          style={
            {
              "--price-start": `${priceStart}%`,
              "--price-end": `${priceEnd}%`,
            } as React.CSSProperties
          }
        >
          <div className="shop-price-range__labels">
            <span>{formatCny(filters.priceRange[0])}</span>
            <span>{formatCny(filters.priceRange[1])}</span>
          </div>
          <div className="shop-price-slider">
            <span className="shop-price-slider__track" />
            <span className="shop-price-slider__fill" />
            <input
              aria-label="最低价格"
              disabled={priceDisabled}
              max={options.price.max}
              min={options.price.min}
              onChange={(event) =>
                setPriceRange([Number(event.target.value), filters.priceRange[1]])
              }
              step="50"
              type="range"
              value={filters.priceRange[0]}
            />
            <input
              aria-label="最高价格"
              disabled={priceDisabled}
              max={options.price.max}
              min={options.price.min}
              onChange={(event) =>
                setPriceRange([filters.priceRange[0], Number(event.target.value)])
              }
              step="50"
              type="range"
              value={filters.priceRange[1]}
            />
          </div>
          <div className="shop-price-range__bounds">
            <span>{formatCny(options.price.min)}</span>
            <span>{formatCny(options.price.max)}</span>
          </div>
        </div>
      </fieldset>

      <button
        className="shop-filter-reset"
        disabled={!hasFilters}
        onClick={onReset}
        type="button"
      >
        <RotateCcw size={15} />
        <span>重置筛选</span>
      </button>
    </aside>
  );
}

function SetupCard({
  onApply,
  setup,
}: {
  onApply: () => void;
  setup: SetupItem;
}) {
  const setupSummary = calculateBuild(setup.selection);
  const selectedParts = setupSummary.selectedParts;
  const keyParts = (["cpu", "gpu", "case", "psu"] as const)
    .flatMap((category) => {
      const part = selectedParts[category];
      return part ? [part] : [];
    });

  return (
    <button className="setup-card" onClick={onApply} type="button">
      <ProductVisual category="builds" color="#e6462f" label={setup.name} />
      <span className="setup-card__body">
        <span className="setup-card__source">
          <Star size={14} />
          {setup.sourceLabel}
        </span>
        <strong>{setup.name}</strong>
        <small>{setup.useCase}</small>
        <span className="setup-card__parts">
          {keyParts.map((part) => (
            <span key={part.id}>{part.name}</span>
          ))}
        </span>
      </span>
      <span className="setup-card__footer">
        <strong>{formatCny(setupSummary.totalPrice)}</strong>
        <span>{setupSummary.powerDraw}W / {scoreLabel(setupSummary.scores.gaming)}</span>
      </span>
    </button>
  );
}

function ShopProductCard({
  isSelected,
  onSelect,
  part,
}: {
  isSelected: boolean;
  onSelect: () => void;
  part: Part;
}) {
  return (
    <button
      className={`shop-card ${isSelected ? "is-selected" : ""}`}
      onClick={onSelect}
      type="button"
    >
      <ProductVisual
        category={part.category}
        color={part.color}
        hasModel={hasModelAsset(part)}
        imageUrl={part.productImageUrl}
        label={part.name}
      />
      <span className="shop-card__body">
        <span className="shop-card__brand">{part.brand}</span>
        <strong>{part.name}</strong>
        <small>{part.series}</small>
        <SpecLine part={part} />
        <span className="shop-card__tags">
          {part.source ? <span>参数已导入</span> : null}
          {part.modelSource ? <span>真实模型</span> : null}
          {part.marketTags.slice(0, 3).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </span>
      </span>
      <span className="shop-card__footer">
        <strong>{formatCny(part.price)}</strong>
        <span>{isSelected ? "已装入" : "装入方案"}</span>
      </span>
    </button>
  );
}

function ProductVisual({
  category,
  color,
  hasModel = false,
  imageUrl,
  label,
}: {
  category: ProductVisualCategory;
  color: string;
  hasModel?: boolean;
  imageUrl?: string;
  label: string;
}) {
  const Icon = getShopCategoryIcon(category);
  const isBuild = category === "builds";

  return (
    <span
      aria-label={`${label} 商品图`}
      className={`shop-card__image ${imageUrl ? "has-photo" : ""} ${
        hasModel && !imageUrl ? "has-model" : ""
      }`}
      role="img"
      style={
        {
          "--product-color": color,
          backgroundImage: getImageBackground(imageUrl),
        } as React.CSSProperties
      }
    >
      {imageUrl ? null : <span className="shop-card__image-grid" />}
      {imageUrl ? null : isBuild ? <Icon size={48} /> : null}
      {hasModel && !imageUrl ? (
        <span className="shop-card__image-status">模型已接入</span>
      ) : null}
      <span className="shop-card__image-label">
        {hasModel ? "3D模型" : getShopCategoryLabel(category)}
      </span>
    </span>
  );
}

function PartRow({
  isSelected,
  onSelect,
  part,
}: {
  isSelected: boolean;
  onSelect: () => void;
  part: Part;
}) {
  return (
    <button
      className={`part-row ${isSelected ? "is-selected" : ""}`}
      onClick={onSelect}
      type="button"
    >
      <span className="part-row__swatch" style={{ background: part.color }} />
      <span className="part-row__body">
        <span className="part-row__brand">{part.brand}</span>
        <strong>{part.name}</strong>
        <small>{part.series}</small>
        <SpecLine part={part} />
        <span className="tag-line">
          {part.source ? <span>参数已导入</span> : null}
          {part.modelSource ? <span>真实模型</span> : null}
          {part.marketTags.slice(0, 3).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </span>
      </span>
      <span className="part-row__price">{formatCny(part.price)}</span>
    </button>
  );
}

function SpecLine({ part }: { part: Part }) {
  const dimensions = describeDimensions(part);
  const specs = [
    dimensions,
    part.gpuClearanceMm ? `显卡限长 ${part.gpuClearanceMm}mm` : undefined,
    part.coolerClearanceMm ? `散热限高 ${part.coolerClearanceMm}mm` : undefined,
    part.psuWattage ? `${part.psuWattage}W` : undefined,
    part.socket,
    part.memoryType,
  ].filter(Boolean);

  if (specs.length === 0) return null;

  return <small className="spec-line">{specs.slice(0, 3).join(" / ")}</small>;
}

function ScoreBar({
  active,
  label,
  score,
}: {
  active: boolean;
  label: string;
  score: number;
}) {
  return (
    <div className={`score-line ${active ? "is-active" : ""}`}>
      <div>
        <span>{label}</span>
        <strong>{score}</strong>
      </div>
      <div className="score-track">
        <span style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function IssueIcon({ severity }: { severity: Severity }) {
  if (severity === "error") return <XCircle size={18} />;
  if (severity === "warning") return <AlertTriangle size={18} />;
  return <CheckCircle2 size={18} />;
}
