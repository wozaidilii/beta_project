# PRD: 参数驱动的真实 3D 主机装配系统

## Problem Statement

当前 3D Builder 已经可以加载 GLB / glTF 模型，并通过基础的 anchor 配置把 CPU、主板、显卡、硬盘、电源、风扇和机箱放到同一个场景中。但用户真正想要的是“像真实装机一样”的装配体验：给定具体部件参数和模型后，系统能自动判断每个部件应该安装到哪里，并且在更换、移除、重新选择部件时，3D 场景能稳定、可信地更新。

现在的主要问题是，装配仍容易退化成“把模型摆到看起来差不多的位置”。风扇应该装到机箱前部、顶部、底部还是后部，电源应该插入哪个电源仓，显卡应该从主板 PCIe x16 插槽延伸到机箱扩展槽，水冷冷排应该挂到顶部或前部，这些都需要由参数、机箱结构、部件 mount 能力和模型 anchor 共同决定，而不是靠裸坐标反复微调。

从用户角度看，失败表现包括：

- 部件位置不真实，显得像漂浮、穿模、错位或方向错误。
- 更换另一个风扇、显卡、电源后，新部件没有装到同一类真实安装位。
- 无法单独移除某个部件，导致比较方案时必须重新开始。
- 风扇、电源、冷排等机箱挂载类部件没有明确安装槽位。
- 调试模型时能临时移动，但难以形成可复用的资产入库标准。
- 3D 效果不够像高端装机工作台，缺少科技感、结构感和真实装配反馈。

## Solution

构建一套参数驱动的 3D 装配系统，把“产品参数、模型资产、机箱结构和用户选择”拆成清晰的数据层和渲染层。

系统应以装配规则为核心：每个模型资产入库时记录标准化后的坐标轴、真实尺寸、包围盒、可用 anchor、可连接 mount；每个机箱记录主板托盘、电源仓、风扇位、冷排位、硬盘位、扩展槽等安装点；每个部件声明自己需要挂载的接口，例如显卡使用 `pcieConnector` 对齐主板 `pcieX16`，电源使用 `mountFace` 对齐机箱 `psuBay`，风扇使用 `mountFace` 对齐机箱的某个 `fanMount`。

用户选择或移除部件时，装配引擎根据当前 build selection 生成完整装配结果。3D 场景只消费装配结果，不再直接决定业务安装规则。装配结果应包含每个部件实例的位置、旋转、缩放、占用槽位、连接关系、可见状态、冲突状态和调试信息。

最终体验应是：

- 用户选择机箱后，场景展示真实机箱结构和可用安装位。
- 用户选择主板后，主板自动安装到机箱主板托盘。
- 用户选择 CPU 后，CPU 自动安装到主板 CPU socket。
- 用户选择显卡后，显卡自动插入主板 PCIe x16，并与机箱扩展槽方向一致。
- 用户选择电源后，电源自动进入机箱电源仓。
- 用户选择风扇后，系统优先分配可用风扇位，并支持用户切换前部、顶部、底部、后部等安装位。
- 用户更换风扇时，只替换风扇实例，不影响机箱、主板、显卡、电源等其他部件。
- 用户移除某一部件时，该部件从装配树和 3D 场景中消失，相关依赖项保留或进入待安装状态。
- 用户进入调试模式时，可以看到 anchor、包围盒、坐标轴、安装槽名称和冲突提示。
- 普通模式下保持科技感、真实感和可读性，避免调试信息干扰装机预览。

## User Stories

1. As a DIY PC builder, I want the case model to define real installation zones, so that every other part has a believable place to mount.
2. As a DIY PC builder, I want the motherboard to attach to the case motherboard tray automatically, so that I do not need to manually align it.
3. As a DIY PC builder, I want the CPU to attach to the selected motherboard socket, so that CPU placement always follows the motherboard model.
4. As a DIY PC builder, I want the GPU to align its PCIe connector to the motherboard PCIe x16 slot, so that the GPU looks inserted rather than floating.
5. As a DIY PC builder, I want the GPU to respect case expansion slot direction and clearance, so that the final build looks like a real PC.
6. As a DIY PC builder, I want the PSU to mount into the case PSU bay, so that the power supply appears in the correct lower or rear compartment.
7. As a DIY PC builder, I want case fans to mount to real fan positions, so that front, top, rear, bottom and side fans appear where the case supports them.
8. As a DIY PC builder, I want to choose which fan mount group to use, so that I can compare airflow layouts.
9. As a DIY PC builder, I want multi-pack fans to create multiple fan instances, so that a 3-pack appears as three separate installed fans.
10. As a DIY PC builder, I want to remove one fan instance without removing the whole build, so that I can quickly compare visual and airflow layouts.
11. As a DIY PC builder, I want to replace a selected fan with another fan model, so that the new fan keeps the same installed mount position.
12. As a DIY PC builder, I want to replace a GPU while keeping the rest of the build unchanged, so that I can compare card size and visual fit.
13. As a DIY PC builder, I want to remove the GPU from the build, so that I can inspect motherboard and case layout without it.
14. As a DIY PC builder, I want to remove the PSU from the build, so that I can compare cable-space and case interior visibility.
15. As a DIY PC builder, I want storage devices to mount to motherboard M.2 slots when appropriate, so that SSD placement follows real board slots.
16. As a DIY PC builder, I want air coolers to attach to the CPU socket and respect cooler height, so that cooling compatibility feels physically grounded.
17. As a DIY PC builder, I want AIO pumps and radiators to be treated as related but separate installed parts, so that the pump mounts on the CPU and the radiator mounts on the case.
18. As a DIY PC builder, I want unsupported radiator mount positions to be disabled, so that I do not create impossible builds.
19. As a DIY PC builder, I want the system to warn me when the selected case does not support the selected motherboard form factor, so that I can avoid invalid builds.
20. As a DIY PC builder, I want the system to warn me when GPU length exceeds case clearance, so that the 3D preview does not imply an impossible build.
21. As a DIY PC builder, I want the system to warn me when PSU length or form factor does not fit the case, so that the installed PSU position remains trustworthy.
22. As a DIY PC builder, I want conflicts to be visible both in the compatibility panel and in the 3D scene, so that I understand whether a problem is logical or spatial.
23. As a DIY PC builder, I want installed parts to have clear selection states, so that I can identify which part I am replacing or removing.
24. As a DIY PC builder, I want hover or selection feedback on mount positions, so that I can understand where a part will be installed before choosing it.
25. As a DIY PC builder, I want real GLB / glTF models to be used whenever available, so that the preview resembles the actual product.
26. As a DIY PC builder, I want missing model assets to show as unavailable rather than falling back to fake generated shapes, so that I can trust the visual preview.
27. As a DIY PC builder, I want product thumbnails and purchase information to remain separate from 3D model assets, so that commerce data can be updated without changing assembly behavior.
28. As a small PC assembly shop, I want presets to load as completed builds, so that I can show popular setups quickly.
29. As a small PC assembly shop, I want to adjust one part in a preset without rebuilding the entire setup, so that customer comparisons are fast.
30. As a small PC assembly shop, I want the preview to look technical and premium, so that it feels credible when shown to customers.
31. As a model asset maintainer, I want every imported GLB to be normalized to a consistent unit, axis and scale standard, so that assembly rules work across assets from different sources.
32. As a model asset maintainer, I want every model asset to declare its bounding box in millimeters, so that compatibility and scene scale can be validated.
33. As a model asset maintainer, I want every model asset to declare required anchor points, so that the assembly engine can attach it without hard-coded coordinates.
34. As a model asset maintainer, I want case assets to declare installable slots, so that fans, radiators, PSU and motherboard can mount to case-defined positions.
35. As a model asset maintainer, I want motherboard assets to declare CPU socket, PCIe x16, DIMM slots and M.2 slots, so that dependent parts attach to the board.
36. As a model asset maintainer, I want debug mode to show bounding boxes, anchor points, axes and slot names, so that I can diagnose wrong placement quickly.
37. As a model asset maintainer, I want debug adjustments to export back to asset metadata, so that manual calibration becomes reusable configuration.
38. As a model asset maintainer, I want exported debug changes to update anchors rather than naked scene coordinates when a part is attached to another part, so that calibration survives parent movement.
39. As a model asset maintainer, I want asset validation to detect missing anchors for a category, so that bad assets do not enter the production catalog.
40. As a developer, I want the assembly engine to generate a deterministic assembly graph from the current selection, so that tests can assert behavior without relying on screenshots.
41. As a developer, I want render components to consume assembly results without embedding mount rules, so that future mount types can be added safely.
42. As a developer, I want category-level compatibility rules and model-level placement rules to remain separate, so that OpenDB parameters do not become visual model dependencies.
43. As a developer, I want the scene to support multiple instances of the same category, so that fan packs, multiple SSDs and future storage bays can be represented.
44. As a developer, I want removal and replacement actions to operate on installed instances, so that category selection and scene instance state do not fight each other.
45. As a developer, I want debug mode to support keyboard nudging, flipping and selected-part lists, so that calibration works even when mesh picking is unreliable.
46. As a developer, I want reduced-motion preferences respected for background and scene effects, so that the technical visual style remains accessible.
47. As a developer, I want the final visual style to use restrained technological motion, so that the app feels like a hardware builder tool rather than a gaming landing page.

## Implementation Decisions

- The assembly system should be driven by asset metadata and part parameters, not raw scene coordinates.
- The core domain object should be an assembly graph or assembly plan generated from the selected build.
- The assembly graph should support both single-slot categories and multi-instance categories.
- Existing categories can stay as the commerce/catalog browsing layer, but 3D assembly should distinguish category selection from installed part instances.
- A part instance should include stable identity, category, part id, selected model asset, mount target, current mount slot, transform result and visibility state.
- Case models should become the root of the assembly graph.
- Case metadata should expose named installation zones such as motherboard tray, PSU bay, expansion slots, fan mounts, radiator mounts and storage bays.
- Motherboard models should expose named anchors such as CPU socket, PCIe x16, DIMM slots and M.2 slots.
- GPU models should expose a PCIe connector anchor and bounding data that can be checked against case clearance and slot width.
- PSU models should expose a mount face anchor and bounding data that can be checked against PSU bay length and supported form factor.
- Fan models should expose a mount face anchor and fan size metadata. Fan packs should be expanded into individual fan instances.
- Cooling models should support both air-cooler and AIO semantics. AIO should support at least pump-to-CPU and radiator-to-case relationships.
- Storage models should support M.2 mounting first, with future expansion for 2.5-inch and 3.5-inch bays.
- Attachment should be expressed as own anchor aligned to target anchor, with rotation and axis normalization applied before final transform.
- The existing asset fields for axis, bounding box, anchor points, fit size, placement and rotation should be formalized into a stricter asset schema.
- The asset schema should define required anchors per category and mount type.
- The asset schema should allow case-specific mount arrays rather than a single generic fan mount.
- The assembly engine should choose default mount positions deterministically, using priority rules that feel realistic.
- Users should be able to override mount positions where multiple valid slots exist.
- Replacement should preserve the selected mount slot when the new part supports it.
- Removal should remove only the selected installed instance and should not reset unrelated selections.
- Parts without model assets should be excluded from 3D installation actions or shown as non-visual catalog choices, depending on product policy.
- Compatibility issues should influence both panel warnings and scene affordances, but should not silently move parts to impossible positions.
- Debug mode should remain a local-development tool and should not write model metadata in production.
- Debug exports should prefer updating anchor metadata when a part has a parent mount, and fallback root position only for root-level objects.
- The scene should keep a restrained black, technical visual direction: CAD grid, PCB-like signals, subtle scan lines and clear workbench lighting.
- Ordinary users should see clean installed parts and optional mount highlights, not raw debugging geometry.
- The product page should continue to use domestic prices, images and purchase links independently from OpenDB and model assets.
- OpenDB should continue to provide physical and compatibility parameters, not final appearance or model identity.
- Vercel Blob or another public asset store should remain the deployment path for production model assets, while local development can use local public assets.

## Testing Decisions

- Good tests should assert external behavior: selected parts produce expected assembly results, UI actions change installed instances, and compatibility warnings appear when build constraints are violated.
- Tests should avoid asserting private helper implementation details or exact Three.js object internals unless there is no higher seam.
- The highest-value unit seam is the assembly engine: given a build selection and model metadata, it should return deterministic placements, mounts and conflicts.
- The highest-value integration seam is the Builder UI: selecting, replacing and removing parts should update the assembly result and visible scene state.
- Asset schema validation should be tested with representative valid and invalid assets for case, motherboard, GPU, PSU, fans, cooling and storage.
- Case fan mount allocation should be tested with one fan, a three-pack, too many fans, and user-selected mount overrides.
- PSU placement should be tested for ATX, SFX-L, supported form factor mismatch and length mismatch.
- GPU placement should be tested for PCIe anchor alignment, case clearance mismatch and slot width mismatch.
- Cooling placement should be tested for air cooler socket mounting, cooler height mismatch, AIO pump mounting and radiator mount support.
- Removal behavior should be tested for single-instance categories and multi-instance categories.
- Replacement behavior should be tested to ensure a new fan or GPU preserves the mount slot when compatible.
- Debug export behavior should be tested locally with mocked file writes or API-level assertions, including anchor patch generation and rotation patch generation.
- UI tests should cover the visible workflow: pick case, install motherboard, install PSU, install fan, replace fan, remove fan and inspect compatibility output.
- Visual regression can be lightweight: assert that the canvas renders, that model assets load without console errors, and that debug overlays expose anchor names.
- Accessibility validation should cover keyboard-reachable selection, removal and debug controls.
- Reduced-motion behavior should be covered for technical background and scene overlays.

## Out of Scope

- Full cable routing and cable physics.
- Screw-by-screw installation animation.
- Real-time airflow or thermal simulation.
- Automatic generation of GLB models from product photos.
- Full Blender-grade asset editing inside the browser.
- Marketplace checkout or payment integration.
- Live Taobao / JD price crawling during every page load.
- Guaranteeing exact physical accuracy for every third-party Sketchfab model before it passes asset normalization.
- Production write-back of debug model metadata from the deployed site.
- Support for every possible PC accessory category in the first release.
- React Bits Pro component adoption unless the project later satisfies the registry and license prerequisites.

## Further Notes

- The current project already has the right foundation: GLB / glTF assets, model metadata, anchor-based placement, debug overlays, keyboard nudging and local debug export.
- The main missing product concept is installed part instances. Without instance-level state, fan packs, multiple SSDs and per-slot removal/replacement will stay awkward.
- The main missing data concept is case mount inventory. A single `frontFanMount` anchor is not enough for realistic builds; cases need arrays of fan mounts, radiator mounts, storage bays and expansion slots.
- The main missing validation concept is asset schema validation. Every asset category needs required anchors and physical dimensions before it can be trusted in production.
- The initial milestone should focus on fan and PSU realism because they directly exercise case-defined mounts and user-requested removal/replacement behavior.
- The second milestone should extend the same model to GPU, cooling and storage.
- The third milestone should polish the visual layer so the final builder feels like a premium, technical assembly workstation rather than a decorative 3D demo.
