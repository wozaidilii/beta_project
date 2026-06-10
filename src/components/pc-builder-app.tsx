"use client";

import {
  AlertTriangle,
  Box,
  CheckCircle2,
  Cpu,
  Fan,
  Gauge,
  HardDrive,
  Layers3,
  MemoryStick,
  MonitorUp,
  Search,
  ShieldCheck,
  ShoppingCart,
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

export function PcBuilderApp() {
  const [selection, setSelection] = useState<PartSelection>(defaultSelection);
  const [activeCategory, setActiveCategory] = useState<CategoryId>("gpu");
  const [query, setQuery] = useState("");
  const [activeWorkspace, setActiveWorkspace] = useState<"builder" | "products">(
    "builder",
  );
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [activeScenario, setActiveScenario] =
    useState<(typeof scenarioLabels)[number]["key"]>("gaming");

  const summary = useMemo(() => calculateBuild(selection), [selection]);
  const selectedPart = summary.selectedParts[activeCategory];
  const activeOptions = useMemo(
    () =>
      catalog[activeCategory].filter((part) => partMatchesQuery(part, query)),
    [activeCategory, query],
  );
  const visibleCatalog = useMemo(
    () =>
      categoryIds.map((category) => ({
        category,
        parts: catalog[category].filter((part) => partMatchesQuery(part, query)),
      })),
    [query],
  );
  const productCount = useMemo(
    () => categoryIds.reduce((total, category) => total + catalog[category].length, 0),
    [],
  );

  const setPart = (part: Part) => {
    setSelection((current) => ({ ...current, [part.category]: part.id }));
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
        <aside
          aria-label="工作区导航"
          className={`workspace-dock ${isWorkspaceOpen ? "is-open" : ""}`}
          onFocus={() => setIsWorkspaceOpen(true)}
        >
          <nav className="dock-tab-rail" aria-label="页面模式">
            <button
              aria-pressed={activeWorkspace === "builder"}
              className={`dock-tab ${activeWorkspace === "builder" ? "is-active" : ""}`}
              onClick={() => {
                setActiveWorkspace("builder");
                setIsWorkspaceOpen(true);
              }}
              type="button"
            >
              <Cpu size={18} />
              <span>3D Builder</span>
            </button>
            <button
              aria-pressed={activeWorkspace === "products"}
              className={`dock-tab ${activeWorkspace === "products" ? "is-active" : ""}`}
              onClick={() => {
                setActiveWorkspace("products");
                setIsWorkspaceOpen(true);
              }}
              type="button"
            >
              <Box size={18} />
              <span>产品</span>
            </button>
          </nav>

          <div className="workspace-drawer panel">
            <div className="panel-heading drawer-heading">
              <div>
                <span className="eyebrow">
                  {activeWorkspace === "builder" ? "3D Builder" : "Product catalog"}
                </span>
                <h1>
                  {activeWorkspace === "builder"
                    ? categoryMeta[activeCategory].label
                    : `${productCount} 个产品`}
                </h1>
              </div>
              {activeWorkspace === "builder" ? (
                <ShieldCheck size={22} />
              ) : (
                <ShoppingCart size={22} />
              )}
            </div>

            <label className="search-box drawer-search">
              <Search size={17} />
              <input
                onChange={(event) => setQuery(event.target.value)}
                placeholder={
                  activeWorkspace === "builder"
                    ? "搜索当前分类"
                    : "搜索全部产品、品牌、渠道"
                }
                value={query}
              />
            </label>

            {activeWorkspace === "builder" ? (
              <>
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
              </>
            ) : (
              <div className="product-catalog">
                {visibleCatalog.map(({ category, parts }) => {
                  const Icon = categoryIcons[category];
                  if (parts.length === 0) return null;

                  return (
                    <section className="product-group" key={category}>
                      <button
                        className="product-group__heading"
                        onClick={() => {
                          setActiveCategory(category);
                          setActiveWorkspace("builder");
                        }}
                        style={
                          { "--tone": categoryMeta[category].tone } as React.CSSProperties
                        }
                        type="button"
                      >
                        <span>
                          <Icon size={17} />
                          {categoryMeta[category].label}
                        </span>
                        <strong>{parts.length}</strong>
                      </button>
                      <div className="product-list">
                        {parts.map((part) => (
                          <button
                            className={`product-row ${
                              selection[part.category] === part.id ? "is-selected" : ""
                            }`}
                            key={part.id}
                            onClick={() => {
                              setActiveCategory(part.category);
                              setPart(part);
                            }}
                            type="button"
                          >
                            <span
                              className="product-row__swatch"
                              style={{ background: part.color }}
                            />
                            <span className="product-row__body">
                              <span>{part.brand}</span>
                              <strong>{part.name}</strong>
                              <small>{part.series}</small>
                            </span>
                            <span className="product-row__meta">
                              {selection[part.category] === part.id ? "已装" : formatCny(part.price)}
                            </span>
                          </button>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        <section className="builder-grid">
          <section className="scene-panel" aria-label="3D 主机预览">
            <div className="scene-toolbar">
              <div>
                <span className="eyebrow">当前焦点</span>
                <strong>{selectedPart?.name ?? categoryMeta[activeCategory].label}</strong>
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
