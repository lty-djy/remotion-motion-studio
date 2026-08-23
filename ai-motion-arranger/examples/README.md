# 示例

这份示例覆盖"AI 数字人"风格的视频编排，最小可工作流。

## 文件

- `sample-srt.srt` — 6 段口播字幕，覆盖 19.4 秒。
- `sample-manifest.json` — 对应编排输出，已通过 `manifest-to-tsx.mjs` 校验。包含 4 个 Board：
  1. 开场：SpeedGauge，cyan 主调
  2. 数据：DeltaBadge + DualMetricBar，amber 主调
  3. 实时：WaveformMetric，violet 主调
  4. 收尾：ProgressRing + MetricBar，lime 主调

## 走一遍工作流

```bash
# 1. 把示例 manifest 编译为 TSX
node ai-motion-arranger/scripts/manifest-to-tsx.mjs \
  ai-motion-arranger/examples/sample-manifest.json \
  > /tmp/package.tsx

# 2. 验证 TSX 的语法（用 esbuild 或 node --check，不需要安装额外依赖）
node --check /tmp/package.tsx && echo "✓ package.tsx 语法 OK"

# 3. 把 TSX 交给工作台激活（在工作台根目录执行）
powershell -ExecutionPolicy Bypass -File scripts/import-to-studio.ps1 -FilePath /tmp/package.tsx
```

激活后，工作台里就能看到 4 个 Board、8 张 metric 卡按 voice 时间轴排列。下一步用户可以：
- 手动拖动同一 Board 内的卡片位置，让它们并排；
- 调整每张卡的 bounds/scale；
- 渲染 MP4。

## 把 SRT 变成 manifest

新会话只丢 SRT 即可。SKILL 文档（`../SKILL.md`）写死了所有编排规则，AI 读完会直接出 manifest JSON。

```bash
# 期望的端到端工作流
node ai-motion-arranger/scripts/manifest-to-tsx.mjs manifest.json > package.tsx
powershell -ExecutionPolicy Bypass -File scripts/import-to-studio.ps1 -FilePath package.tsx
```

## 验证清单

校验一份 manifest 是否可被编译，跑：

```bash
node ai-motion-arranger/scripts/manifest-to-tsx.mjs my-manifest.json > /tmp/dryrun.tsx 2>&1 && echo "OK"
```

错误信息精确到字段路径（参见 SKILL §12 自检清单）。
