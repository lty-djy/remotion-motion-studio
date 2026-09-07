// 打包「网页版 GPT 编排提示词」：
//   node overlay-fx-generator/scripts/build-web-prompt.mjs <SRT路径> [--out 输出.txt]
// 产物是一份纯文本：粘贴到 ChatGPT / 其他网页大模型对话里即可按 overlay-fx-generator
// 规范生成编排 JSON；拿回 JSON 后在工作台「导入编排JSON」或本地 lint 体检。
import { readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";

const skillDir = resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const srtArgIndex = args.findIndex((arg) => !arg.startsWith("--"));
const outIndex = args.indexOf("--out");

if (srtArgIndex < 0) {
  console.error("用法：node build-web-prompt.mjs <SRT路径> [--out 输出.txt]");
  process.exit(2);
}

const srtPath = resolve(args[srtArgIndex]);
const srtName = srtPath.split(/[\\/]/).pop()?.replace(/\.srt$/i, "") ?? "视频";
const outPath =
  outIndex >= 0
    ? resolve(args[outIndex + 1])
    : resolve(dirname(srtPath), `${srtName}-网页编排提示词.txt`);

const read = async (relative) => {
  try {
    return await readFile(resolve(skillDir, relative), "utf8");
  } catch {
    return "";
  }
};const [srt, skill, catalog, format, prefs, defaultPrefs, rules] =
  await Promise.all([
    readFile(srtPath, "utf8"),
    read("SKILL.md"),
    read("references/component-catalog.md"),
    read("references/timeline-json.md"),
    read("我的偏好.md"),
    read("我的偏好.default.md"),
    read("经验规则.md"),
  ]);

if (!srt.trim()) {
  console.error(`SRT 是空的：${srtPath}`);
  process.exit(1);
}

const prompt = [
  "你是动效编排大脑（overlay-fx-generator）。下面给你完整的编排规范和一支视频的 SRT 字幕，请严格按规范输出编排 JSON。",
  "",
  "## 运行环境说明（重要，覆盖规范里的流程性要求）",
  "- 你在网页对话里，没有终端和文件系统：规范里所有「跑命令 / lint 体检 / STATUS.md / 开工收工」的流程一律跳过，直接完成核心任务：解析 SRT → 写分段脚本（章→段→元素）→ 按规范配组件 → 输出 JSON。",
  "- 质检由用户本地完成：你要做的是让 JSON 一次成型——componentId 和 props 只能用目录里登记的，startFrame/durationInFrames 由 SRT 真实时间换算，逐条卡点参数按 SRT 推算。",
  "- 输出纪律：先输出一份简短的「分段脚本」表格（方便我检查段落划分），然后另起一行输出 JSON。JSON 必须独占一个 ```json 代码块、以 { 开头以 } 结尾，块内除 JSON 外不能有任何文字。分段脚本和代码块之间不要输出长篇解释。",
  "- 如果 JSON 太长被截断，我回复「继续」时，从截断处接着输出，不要重新开始。",
  "",
  "=== 编排方法论（SKILL） ===",
  skill,
  "=== 组件目录（componentId 与 props 白名单，只能用这里登记的） ===",
  catalog,
  "=== 输出 JSON 格式规范 ===",
  format,
  prefs.trim()
    ? `=== 用户偏好（优先级最高，覆盖默认） ===\n${prefs}`
    : `=== 出厂默认偏好（用户尚未沉淀个人偏好） ===\n${defaultPrefs}`,
  rules.trim() ? `=== 用户经验规则 ===\n${rules}` : "",
  "=== 本期 SRT 字幕 ===",
  `文件名：${srtName}.srt`,
  srt,
  "",
  "现在开始：先给分段脚本表格，再给 ```json 代码块里的完整编排 JSON。",
].join("\n\n");

await writeFile(outPath, `${prompt}\n`, "utf8");
console.log(`提示词已生成：${outPath}`);
console.log("");
console.log("使用步骤：");
console.log("  1. 用记事本打开上面的 .txt，Ctrl+A 全选、Ctrl+C 复制；");
console.log("  2. 粘贴到网页版 GPT（或任何大模型对话）直接发送；");
console.log("     —— 或者把 .txt 作为附件上传，附一句「按里面的规范处理」；");
console.log("  3. 模型先回分段脚本，再回一个 ```json 代码块；只复制代码块里的 JSON；");
console.log("     —— 输出中断就回复「继续」；");
console.log(`  4. 把 JSON 存成 <视频名>-overlay-fx.timeline.json（UTF-8），然后：`);
console.log("     a) 本地体检：node overlay-fx-generator/scripts/lint-arrangement-json.mjs <json路径> --duration 视频秒数");
console.log("     b) 工作台点「导入编排JSON」→ 预览微调 → 确认插入。");
