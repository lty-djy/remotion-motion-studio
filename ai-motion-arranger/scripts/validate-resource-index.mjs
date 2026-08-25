#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  RESOURCE_INDEX_PATH,
  createResourceIndex,
} from "./build-resource-index.mjs";

const main = async () => {
  const expected = await createResourceIndex();
  let actual;
  try {
    actual = JSON.parse(await readFile(RESOURCE_INDEX_PATH, "utf8"));
  } catch (error) {
    throw new Error(`无法读取 resource-index.json：${error?.message ?? error}`);
  }
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error("resource-index.json 与真实文件不一致，请运行 npm.cmd run sync:resources");
  }
  const counts = Object.fromEntries(
    Object.entries(actual.libraries).map(([library, entries]) => [library, entries.length]),
  );
  process.stdout.write(
    `✓ 资源索引通过：total=${actual.resourceCount} icons=${counts.icons} materials=${counts.materials} sfx=${counts.sfx} bgm=${counts.bgm}\n`,
  );
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`资源索引校验失败：${error?.message ?? error}\n`);
    process.exit(1);
  });
}
