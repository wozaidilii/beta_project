# Lessons

## Trellis context entries must reference existing files

- 问题：`check.jsonl` 引用了不存在的 `.trellis/spec/lessons.md`，导致 `task.py validate` 失败。
- 根因：Kuno/Trellis reset 后长期 lessons 文件并不一定存在，不能假设可选 spec 文件已经保留。
- 修复：创建 `.trellis/spec/lessons.md` 并记录本次失败原因。
- 预防：以后更新 `implement.jsonl` / `check.jsonl` 后立即运行 `task.py validate`，并先确认每个引用路径存在。

## ESLint flat config must ignore local tool indexes explicitly

- 问题：`npm run lint` 扫描了 `.gitnexus/run.cjs`，并因本地工具脚本中的 `require()` 报错。
- 根因：ESLint flat config 不会自动使用 `.gitignore`，即使 `.gitnexus/` 已被 git 忽略，`eslint .` 仍会扫描它。
- 修复：在 `eslint.config.mjs` 的 `ignores` 中显式加入 `.gitnexus/**` 和 Trellis backup 目录。
- 预防：新增本地工具索引、缓存或备份目录时，同步检查 ESLint flat config 的 ignore 列表，而不只检查 `.gitignore`。

## Debug calibration must not depend on mesh picking alone

- 问题：3D 调试模式里部分 GLB 模型很难点中，导致无法可靠选择需要移动或检查的部件。
- 根因：不同来源的模型层级、透明面、包围盒和缩放不一致，单靠 Canvas mesh picking 会把资产校准流程绑死在不可控的模型结构上。
- 修复：调试模式提供稳定的部件实例列表和安装位列表，部件实例用于位移/翻转/导出，安装位用于检查，不再要求维护者先点中具体 mesh。
- 预防：后续做完整校准流程时，资产维护 UI 必须保留列表/表格式选择入口；mesh 点击只能作为快捷方式，不能作为唯一入口。

## Debug overlays must be viewport-bound

- 问题：调试菜单覆盖 3D 主体，且在较小视口里菜单内容向 Canvas 容器外溢出，导致选项不全或无法滚动。
- 根因：调试菜单放在 Three.js `Html fullscreen` 容器内用 absolute 定位，实际定位会受 Canvas/布局高度影响；普通 builder 周边 UI 也继续占用空间。
- 修复：进入调试模式时切换为专注布局，隐藏普通导航、配件列表和清单，只保留全屏 scene、退出按钮和 fixed 定位的可滚动调试菜单。
- 预防：凡是覆盖 3D Canvas 的维护工具面板，都应优先使用 viewport-bound fixed 定位和明确的 max-height/overflow 策略，避免依赖 Canvas 内部布局高度。

## TSX tests need sandbox-aware execution

- 问题：直接在沙箱内执行 `tsx` 测试时，`tsx` 创建本地 IPC pipe 会触发 `listen EPERM`，导致测试命令失败但代码本身未失败。
- 根因：当前 Codex 沙箱限制了 `/var/folders/.../tsx-*/...pipe` 这类本地监听行为。
- 修复：遇到该错误时，用相同测试命令请求沙箱外执行，不要改测试代码或绕过测试。
- 预防：后续新增 `tsx` 测试后，先按正常命令运行；如果失败信息是 IPC `listen EPERM`，明确记录为环境权限问题并用提升权限重跑。

## Model anchors must match rendered bounds, not just assembly coordinates

- 问题：风扇语义上挂到了 `fan.front.120.*` slot，但 builder 画面里仍在机箱外。
- 根因：现有测试只校验 assembly graph 的 slot/anchor 对齐，没有校验 GLB 经 `autoCenter + fitSize + fitMode` 后的真实渲染包围盒；机箱默认 `fitMode: contain` 让视觉机箱小于写入 anchor 的坐标空间。
- 修复：新增 `test:render-bounds`，用 Three.js 加载资产并断言三枚风扇的渲染 bbox 落在机箱 bbox 内；后续校准必须以实际渲染 bounds 为准。
- 预防：修改模型 `fitSize`、`fitMode`、机箱 anchor/mount slot、风扇 anchor/rotation 时，必须运行 `npm run test:render-bounds`；不要只依赖 assembly 语义测试判断视觉安装正确。

## Do not stretch complex case GLBs to fit anchor coordinates

- 问题：为让风扇 bbox 进入机箱 bbox，把机箱设为 `fitMode: "stretch"` 后，机箱在 builder 里变成斜掉的平行四边形。
- 根因：复杂 GLB 机箱通常有子 mesh 旋转、局部变换或非轴对齐面；在父级 group 上做非等比 scale 会产生明显视觉变形。
- 修复：移除机箱 `fitMode: "stretch"`，保持默认等比 `contain`；把前风扇 mount anchors 从旧坐标 `x=1.18` 重新校准到等比机箱 bounds 内的 `x=0.84`，并让 render-bounds 测试禁止复杂 case 使用 stretch。
- 预防：机箱/机壳类复杂模型优先保持等比缩放；如果风扇或其他部件跑出机箱，先重标父级 anchors/slots 到实际 render bounds，而不是拉伸机箱。
