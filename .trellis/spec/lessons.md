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
