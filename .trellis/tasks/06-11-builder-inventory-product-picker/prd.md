# PRD: Builder 背包式产品选择与评分变化

## Problem Statement

当前 Builder 已经有 3D 装配场景、产品页、预设 setup 和整体评分，但“在装机工作区里更换一个具体部件”的路径还不够像真实装机工具。

用户现在需要先在 Builder / 产品页 / 已选清单之间切换，才能理解当前已经安装了哪些部件、某个类别还能换成哪些产品、替换后整机评分会如何变化，以及是否可以直接跳转购买。这个流程对“边看 3D 装机边挑部件”的核心场景不够顺手。

目标用户希望 Builder 左侧像游戏装备栏一样展示当前已经安装的部件。每个类别旁边有 `+` 入口，点击后打开一个独立的全屏产品选择页，像游戏中打开背包：可以筛选 / 浏览当前类别的可选产品，点选后查看参数、评分变化、购买链接，并选择 `Add to build` 或 `Purchase`。

评分需要跟随部件变化即时反馈，但只保留当前项目已有的评分维度：游戏、AI、创作、静音。外观评分明确不进入本任务。

## Solution

在 3D Builder 工作区增加一个“已装部件列表 + 背包式产品选择 overlay”的工作流。

Builder 左侧显示当前 build 的已装部件状态。每个硬件类别显示类别名、当前选中产品、关键参数 / 状态，以及一个 `+` 按钮。点击 `+` 后，不在右侧抽屉或侧边栏里展开，而是进入一个全屏、可关闭的产品选择页面。这个页面视觉上应像游戏背包或装备选择界面：左侧保留类别 / 筛选，主体区域显示产品列表，右侧或底部显示当前选中产品详情。

产品详情必须支持两个明确动作：

- `Add to build`：把选中的产品加入当前 build，并关闭 overlay 回到 3D Builder。
- `Purchase`：打开可购买渠道链接，不改变当前 build。

`Add to build` 的行为按类别区分：

- CPU、主板、显卡、内存套条、散热、电源、机箱是单选类别，添加即替换当前选中产品。
- 风扇是多实例类别，应支持加入到可用机箱风扇位，并保留 instance / slot 语义；当无法安装时显示原因，不生成假的 3D 安装实例。
- 存储在本任务 MVP 中仍按单个 M.2 存储处理，多硬盘位属于后续扩展。

产品详情里的评分变化通过现有 build 评分逻辑计算：先用候选产品构造一次临时 selection，再调用当前评分汇总逻辑，与当前 build 的分数比较，显示游戏、AI、创作、静音四个维度的 `+/-` 差值。外观评分不显示、不计算、不新增字段。

购买入口继续使用项目自己的国内价格、缩略图和购买链接。OpenDB 只负责参数；3D 模型仍来自自己的 GLB / glTF 资产库。没有购买链接时，显示不可用状态，例如“暂无购买链接”，按钮不可点击。点击购买链接应打开新标签页，不触发 build 变更。

该任务不改变“真实装配”的来源。最终 3D 安装位置仍由 assembly graph、part 参数、case mount inventory、model anchors 和 asset metadata 决定；背包式产品选择只改变 build selection / fan installation state，不写入模型坐标。

## User Stories

1. As a DIY PC builder, I want to see currently installed parts in the Builder left panel, so that I always know what is already in my build.
2. As a DIY PC builder, I want every hardware category to show whether a product is selected, so that missing parts are obvious.
3. As a DIY PC builder, I want each category row to have a `+` action, so that I can choose or replace that category without leaving the Builder flow.
4. As a DIY PC builder, I want the `+` action to open a full-screen inventory-like product picker, so that choosing parts feels focused and game-like.
5. As a DIY PC builder, I want to close the inventory with Back or Esc, so that I can return to the 3D Builder without committing a change.
6. As a DIY PC builder, I want the inventory to list only products for the selected category by default, so that I do not need to re-filter manually.
7. As a DIY PC builder, I want product cards to show thumbnail, name, vendor, price and model availability, so that I can scan choices quickly.
8. As a DIY PC builder, I want filters such as color, size, vendor and price range to remain available, so that the inventory can scale beyond a few seed products.
9. As a DIY PC builder, I want checkbox filters for discrete attributes, so that filtering behavior is predictable.
10. As a DIY PC builder, I want price filtering to use a range slider, so that budget control is fast.
11. As a DIY PC builder, I want selecting a product to show a detail panel, so that I can inspect specifications before adding it.
12. As a DIY PC builder, I want product details to show category-specific parameters, so that GPU length, PSU wattage, case clearance and similar specs are visible.
13. As a DIY PC builder, I want product details to show compatibility or installation conflicts, so that I understand why something may not render in 3D.
14. As a DIY PC builder, I want product details to show score deltas, so that I can see how replacing a part changes the build.
15. As a DIY PC builder, I want score deltas for 游戏, AI, 创作 and 静音, so that the scoring matches the existing builder summary.
16. As a DIY PC builder, I do not want an 外观 score, so that scoring stays focused on current performance and quietness metrics.
17. As a DIY PC builder, I want `Add to build` to replace single-selection categories, so that CPU / GPU / motherboard swaps are direct.
18. As a DIY PC builder, I want replacing a single-selection part to preserve unrelated parts, so that experimentation does not reset the build.
19. As a DIY PC builder, I want adding fans to respect case fan slots, so that fan products install into real mount locations.
20. As a DIY PC builder, I want fan install failures to be shown as conflicts, so that the UI does not pretend unsupported fans are installed.
21. As a DIY PC builder, I want storage to stay as one M.2 selection in the MVP, so that the first implementation remains clear.
22. As a DIY PC builder, I want `Purchase` to open a buy link without changing my build, so that shopping and configuration are separate.
23. As a DIY PC builder, I want missing purchase links to be clearly disabled, so that I do not click dead actions.
24. As a DIY PC builder, I want the 3D scene to update after `Add to build`, so that the new component appears if it is 3D installable.
25. As a DIY PC builder, I want non-installable products to remain selectable in configuration surfaces but not fake-rendered, so that the scene stays trustworthy.
26. As a small PC shop, I want to open the picker quickly while presenting a build, so that I can compare parts with a customer.
27. As a small PC shop, I want score changes to be visible before adding, so that I can explain upgrades and tradeoffs.
28. As a small PC shop, I want purchase links separated from build changes, so that quote exploration does not accidentally mutate the setup.
29. As a developer, I want score delta calculation to reuse the existing build summary logic, so that scoring stays consistent.
30. As a developer, I want the inventory overlay to reuse existing catalog, filter and product data concepts, so that this does not create a second product system.
31. As a developer, I want the picker to mutate only selection / fan installation state, so that assembly anchors remain the source of truth for 3D placement.
32. As a developer, I want the overlay to be keyboard accessible, so that Esc, focus order and button states can be tested.

## Implementation Decisions

- The Builder left panel becomes the primary installed-parts list for this workflow.
- The installed-parts list should show all current hardware categories, including empty / missing states.
- Each category row should expose a compact `+` action for opening product selection.
- The `+` action opens a full-screen Part Inventory overlay, not a right drawer and not an inline expansion inside the sidebar.
- The inventory starts scoped to the category that opened it.
- The inventory should preserve the existing black, technical visual direction and feel integrated with the Builder, not like a separate marketplace page.
- The inventory can reuse existing product card, category metadata, filter and thumbnail concepts, but the interaction model is Builder-first.
- The inventory should support product list scanning, candidate selection and product detail inspection in one focused view.
- Filters should include checkbox groups for discrete values such as color, size / specification and vendor, plus a range slider for price.
- Product detail should include price, thumbnail, domestic purchase links, category-specific parameters, compatibility hints and score deltas.
- Score deltas should be calculated by constructing a temporary build selection for the candidate and comparing its build summary to the current build summary.
- Score delta dimensions are only gaming, AI, creator and quiet.
- No appearance / aesthetics score should be added.
- `Add to build` closes the overlay after a successful selection mutation.
- `Purchase` opens a new tab and does not mutate the build.
- Missing purchase links produce a disabled purchase action with clear unavailable copy.
- Single-selection categories replace the current selected part.
- Fan selection should route through installed instance / slot semantics rather than treating fans as a simple category-only value.
- Storage remains a single M.2 product in the MVP.
- The 3D scene should continue to render only parts with usable model assets and resolved assembly placements.
- The inventory must not introduce generated 3D fallback geometry for missing GLB / glTF models.
- The feature should not alter model asset metadata, debug calibration exports or anchor placement rules.
- Product images and commerce data remain separate from GLB / glTF assets.
- The existing Product workspace can continue to exist as a browsing / shopping surface; this PRD only adds the Builder inventory selection flow.

## Testing Decisions

- Good tests should assert externally visible behavior: opening the picker from a category, choosing a product, seeing score deltas, adding to build and purchase links not mutating state.
- The highest-value pure logic seam is a score-delta helper that compares current selection with candidate selection using the existing build summary calculation.
- Existing score logic should not be duplicated in UI components.
- UI behavior should be tested at the component or browser-smoke level where practical: `+` opens the full-screen inventory, Esc / Back closes it, `Add to build` updates the selected product, and `Purchase` does not update selection.
- Filter behavior should cover checkbox groups and price range changes against the existing catalog data.
- Category replacement tests should cover at least CPU or GPU as a single-selection category.
- Fan behavior should cover that selected fan products use existing installation state and do not bypass assembly conflict reporting.
- Missing purchase-link behavior should verify disabled state and no navigation attempt.
- Build validation should continue to run typecheck, lint and production build.
- If no stable UI test harness exists yet, the initial implementation can rely on focused pure tests plus browser smoke verification, while avoiding brittle screenshot-only assertions.

## Out of Scope

- Adding an appearance / aesthetics score.
- Implementing payment, cart, checkout or order tracking.
- Live Taobao / JD crawling during user interaction.
- Replacing the existing product page entirely.
- Multi-drive storage bay management beyond one M.2 storage selection.
- Full fan slot manual planning UX beyond the existing installed instance / slot model.
- Changing anchor-based assembly rules, model normalization, debug calibration or asset write-back.
- Adding generated 3D placeholder geometry for products without GLB / glTF assets.
- Creating or importing new product data as part of this task.

## Further Notes

- This task is a UI / product-flow layer on top of the existing catalog, scoring and assembly foundations.
- The confirmed UX direction is “game inventory / equipment picker,” not marketplace sidebar and not right-hand drawer.
- The most important implementation risk is accidentally forking product browsing logic instead of reusing existing catalog/filter/scoring concepts.
- The second implementation risk is confusing product selection with installed instances, especially for fans.
- The feature should keep ordinary users away from debug calibration concepts; debug mode remains a separate asset-maintainer workflow.
