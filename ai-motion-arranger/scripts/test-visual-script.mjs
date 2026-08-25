#!/usr/bin/env node

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { validateVisualScript } from "./validate-visual-script.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const examples = join(here, "..", "examples");

const load = async (name) =>
  JSON.parse(await readFile(join(examples, name), "utf8"));

const validResult = validateVisualScript(
  await load("sample-visual-script-v2.json"),
);
if (!validResult.valid) {
  throw new Error(`有效样例未通过：\n${validResult.errors.join("\n")}`);
}

const invalidResult = validateVisualScript(
  await load("invalid-visual-script-v2.json"),
);
if (invalidResult.valid) {
  throw new Error("无效样例被错误接受");
}

const expectedFragments = [
  "evidenceText",
  "MadeUpEffect",
  "missing-icon",
  "超出项目总帧数",
  "timeline-bounds",
];
for (const fragment of expectedFragments) {
  if (!invalidResult.errors.some((error) => error.includes(fragment))) {
    throw new Error(`无效样例缺少预期诊断：${fragment}`);
  }
}

process.stdout.write(
  `✓ Visual Script 2.0 正反样例通过（valid errors=${validResult.errors.length}; invalid errors=${invalidResult.errors.length}）\n`,
);
