"use client";

import {
  AlertTriangle,
  Box,
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

type WorkspaceMode = "builder" | "products";
type ShopCategoryId = "builds" | CategoryId;
type ShopFilters = {
  brand: string;
  color: string;
  size: string;
  minPrice: string;
  maxPrice: string;
};
type ShopFilterOptions = {
  brands: string[];
  colors: Array<{ value: string; label: string; swatch: string }>;
  sizes: string[];
  price: { min: number; max: number };
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
const compactShopCategoryIds: ShopCategoryId[] = ["fans", "builds"];
const defaultShopFilters: ShopFilters = {
  brand: "all",
  color: "all",
  size: "all",
  minPrice: "",
  maxPrice: "",
};
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
    useState<ShopFilters>(defaultShopFilters);
  const [activeScenario, setActiveScenario] =
    useState<(typeof scenarioLabels)[number]["key"]>("gaming");

  const summary = useMemo(() => calculateBuild(selection), [selection]);
  const selectedPart = summary.selectedParts[activeCategory];
  const activeOptions = useMemo(
    () =>
      catalog[activeCategory].filter((part) => partMatchesQuery(part, query)),
    [activeCategory, query],
  );
  const shopParts = useMemo(
    () =>
      activeShopCategory === "builds"
        ? []
        : catalog[activeShopCategory].filter((part) =>
            partMatchesQuery(part, query) && partMatchesFilters(part, shopFilters),
          ),
    [activeShopCategory, query, shopFilters],
  );
  const shopBuilds = useMemo(
    () =>
      starterBuilds.filter(
        (preset) =>
          presetMatchesQuery(preset, query) &&
          presetMatchesPriceFilter(preset, shopFilters),
      ),
    [query, shopFilters],
  );
  const shopFilterOptions = useMemo(
    () => getShopFilterOptions(activeShopCategory),
    [activeShopCategory],
  );
  const shopTotalCount = useMemo(
    () =>
      starterBuilds.length +
      categoryIds.reduce((total, category) => total + catalog[category].length, 0),
    [],
  );
  const activeShopCount =
    activeShopCategory === "builds" ? shopBuilds.length : shopParts.length;

  const setPart = (part: Part) => {
    setSelection((current) => ({ ...current, [part.category]: part.id }));
  };
  const setShopCategory = (category: ShopCategoryId) => {
    setActiveShopCategory(category);
    setShopFilters(defaultShopFilters);
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
                  </div>
                </div>
                <PcScene activeCategory={activeCategory} selection={selection} />
                <div className="preset-strip" aria-label="装机预设">
                  {starterBuilds.map((preset) => (
                    <button
                      className="preset-chip"
                      key={preset.id}
                      onClick={() => setSelection(preset.selection)}
                      type="button"
                    >
                      <Sparkles size={15} />
                      <span>{preset.name}</span>
                      <small>{preset.useCase}</small>
                    </button>
                  ))}
                </div>
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
          ) : (
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

              <ShopFilterBar
                activeCategory={activeShopCategory}
                filters={shopFilters}
                onChange={setShopFilters}
                onReset={() => setShopFilters(defaultShopFilters)}
                options={shopFilterOptions}
                resultCount={activeShopCount}
              />

              <div className="shop-grid">
                {activeShopCount === 0 ? (
                  <div className="shop-empty">
                    <SlidersHorizontal size={22} />
                    <strong>没有符合条件的产品</strong>
                    <span>调整筛选条件或清空价格范围后再查看。</span>
                  </div>
                ) : activeShopCategory === "builds"
                  ? shopBuilds.map((preset) => {
                      const presetSummary = calculateBuild(preset.selection);
                      return (
                        <button
                          className="shop-card shop-card--build"
                          key={preset.id}
                          onClick={() => setSelection(preset.selection)}
                          type="button"
                        >
                          <ProductVisual
                            category="builds"
                            color="#e6462f"
                            label={preset.name}
                          />
                          <span className="shop-card__body">
                            <span className="shop-card__brand">整机方案</span>
                            <strong>{preset.name}</strong>
                            <small>{preset.useCase}</small>
                            <span className="shop-card__tags">
                              <span>{presetSummary.powerDraw}W 峰值</span>
                              <span>{presetSummary.recommendedPsu}W 电源</span>
                              <span>{scoreLabel(presetSummary.scores[activeScenario])}</span>
                            </span>
                          </span>
                          <span className="shop-card__footer">
                            <strong>{formatCny(presetSummary.totalPrice)}</strong>
                            <span>装入方案</span>
                          </span>
                        </button>
                      );
                    })
                  : shopParts.map((part) => (
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
  preset: (typeof starterBuilds)[number],
  query: string,
) {
  const keyword = query.trim().toLowerCase();
  if (!keyword) return true;

  return `${preset.name} ${preset.useCase}`.toLowerCase().includes(keyword);
}

function partMatchesFilters(part: Part, filters: ShopFilters) {
  if (filters.brand !== "all" && part.brand !== filters.brand) return false;
  if (filters.color !== "all" && getColorFamily(part.color) !== filters.color) {
    return false;
  }
  if (filters.size !== "all" && getSizeLabel(part) !== filters.size) return false;
  return priceWithin(part.price, filters);
}

function presetMatchesPriceFilter(
  preset: (typeof starterBuilds)[number],
  filters: ShopFilters,
) {
  return priceWithin(calculateBuild(preset.selection).totalPrice, filters);
}

function priceWithin(price: number, filters: ShopFilters) {
  const min = parsePriceInput(filters.minPrice);
  const max = parsePriceInput(filters.maxPrice);
  if (min !== undefined && price < min) return false;
  if (max !== undefined && price > max) return false;
  return true;
}

function parsePriceInput(value: string) {
  if (value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function getShopCategoryLabel(category: ShopCategoryId) {
  return category === "builds" ? "整机" : categoryMeta[category].label;
}

function getShopCategoryTone(category: ShopCategoryId) {
  return category === "builds" ? "#e6462f" : categoryMeta[category].tone;
}

function getShopCategoryIcon(category: ShopCategoryId) {
  return category === "builds" ? Sparkles : categoryIcons[category];
}

function getShopCategoryCount(category: ShopCategoryId) {
  return category === "builds" ? starterBuilds.length : catalog[category].length;
}

function getShopFilterOptions(category: ShopCategoryId): ShopFilterOptions {
  const prices =
    category === "builds"
      ? starterBuilds.map((preset) => calculateBuild(preset.selection).totalPrice)
      : catalog[category].map((part) => part.price);

  if (category === "builds") {
    return {
      brands: [],
      colors: [],
      sizes: [],
      price: getPriceBounds(prices),
    };
  }

  const parts = catalog[category];
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
  return (
    <div className="shop-category-menu" aria-label="产品分类">
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
      <span className="shop-category-tile__visual" aria-hidden="true">
        <Icon size={compact ? 38 : 56} />
      </span>
      <span className="shop-category-tile__label">{getShopCategoryLabel(category)}</span>
      <span className="shop-category-tile__count">{getShopCategoryCount(category)}</span>
    </button>
  );
}

function ShopFilterBar({
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
  const hasFilters =
    filters.brand !== "all" ||
    filters.color !== "all" ||
    filters.size !== "all" ||
    filters.minPrice !== "" ||
    filters.maxPrice !== "";

  return (
    <div className="shop-filter-bar" aria-label="产品筛选">
      <div className="shop-filter-bar__title">
        <SlidersHorizontal size={18} />
        <div>
          <strong>{getShopCategoryLabel(activeCategory)}筛选</strong>
          <span>{resultCount} 个结果</span>
        </div>
      </div>

      <label className="shop-filter-control">
        <span>
          <Factory size={15} />
          厂商
        </span>
        <select
          onChange={(event) => onChange({ ...filters, brand: event.target.value })}
          value={filters.brand}
        >
          <option value="all">全部厂商</option>
          {options.brands.map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </select>
      </label>

      <label className="shop-filter-control">
        <span>
          <Ruler size={15} />
          大小
        </span>
        <select
          onChange={(event) => onChange({ ...filters, size: event.target.value })}
          value={filters.size}
        >
          <option value="all">全部尺寸</option>
          {options.sizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>

      <div className="shop-filter-control shop-filter-control--color">
        <span>
          <Palette size={15} />
          颜色
        </span>
        <div className="shop-color-swatches">
          <button
            aria-pressed={filters.color === "all"}
            className={filters.color === "all" ? "is-active" : ""}
            onClick={() => onChange({ ...filters, color: "all" })}
            type="button"
          >
            全部
          </button>
          {options.colors.map((color) => (
            <button
              aria-label={color.label}
              aria-pressed={filters.color === color.value}
              className={filters.color === color.value ? "is-active" : ""}
              key={color.value}
              onClick={() => onChange({ ...filters, color: color.value })}
              style={{ "--swatch": color.swatch } as React.CSSProperties}
              title={color.label}
              type="button"
            />
          ))}
        </div>
      </div>

      <div className="shop-filter-control shop-filter-control--price">
        <span>价格范围</span>
        <div className="shop-price-inputs">
          <input
            aria-label="最低价格"
            inputMode="numeric"
            min="0"
            onChange={(event) => onChange({ ...filters, minPrice: event.target.value })}
            placeholder={`${options.price.min}`}
            type="number"
            value={filters.minPrice}
          />
          <span>-</span>
          <input
            aria-label="最高价格"
            inputMode="numeric"
            min="0"
            onChange={(event) => onChange({ ...filters, maxPrice: event.target.value })}
            placeholder={`${options.price.max}`}
            type="number"
            value={filters.maxPrice}
          />
        </div>
      </div>

      <button
        className="shop-filter-reset"
        disabled={!hasFilters}
        onClick={onReset}
        type="button"
      >
        <RotateCcw size={15} />
        <span>重置</span>
      </button>
    </div>
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
      <ProductVisual category={part.category} color={part.color} label={part.name} />
      <span className="shop-card__body">
        <span className="shop-card__brand">{part.brand}</span>
        <strong>{part.name}</strong>
        <small>{part.series}</small>
        <SpecLine part={part} />
        <span className="shop-card__tags">
          {part.source ? <span>参数已导入</span> : null}
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
  label,
}: {
  category: ShopCategoryId;
  color: string;
  label: string;
}) {
  const Icon = getShopCategoryIcon(category);

  return (
    <span
      aria-label={`${label} 商品图`}
      className="shop-card__image"
      role="img"
      style={{ "--product-color": color } as React.CSSProperties}
    >
      <span className="shop-card__image-grid" />
      <Icon size={48} />
      <span className="shop-card__image-label">{getShopCategoryLabel(category)}</span>
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
