#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const RESOURCE_ROOT = resolve(here, "..", "..", "public", "input");
export const RESOURCE_MANIFEST_PATH = join(RESOURCE_ROOT, "resource-manifest.json");
export const RESOURCE_INDEX_PATH = join(RESOURCE_ROOT, "resource-index.json");

const LIBRARIES = ["icons", "materials", "sfx"];
const PREFIX_BY_LIBRARY = {
  icons: "icons/",
  materials: "materials/",
  sfx: "sfx/",
};
const EXTENSIONS_BY_LIBRARY = {
  icons: new Set([".svg"]),
  materials: new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".mp4", ".mov", ".webm"]),
  sfx: new Set([".wav", ".mp3", ".ogg", ".m4a"]),
};
const MIME_BY_EXTENSION = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
};
const ID_RE = /^[a-z0-9][a-z0-9._-]*$/;

const toPosix = (value) => value.split(sep).join("/");
const isInside = (root, target) => target === root || target.startsWith(`${root}${sep}`);

const readWavMetadata = (buffer) => {
  if (
    buffer.length < 44 ||
    buffer.toString("ascii", 0, 4) !== "RIFF" ||
    buffer.toString("ascii", 8, 12) !== "WAVE"
  ) {
    throw new Error("WAV 文件头无效");
  }
  const channels = buffer.readUInt16LE(22);
  const sampleRate = buffer.readUInt32LE(24);
  const bitsPerSample = buffer.readUInt16LE(34);
  let offset = 12;
  let dataBytes = 0;
  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    if (chunkId === "data") {
      dataBytes = chunkSize;
      break;
    }
    offset += 8 + chunkSize + (chunkSize % 2);
  }
  const bytesPerSecond = sampleRate * channels * (bitsPerSample / 8);
  if (!dataBytes || !bytesPerSecond) throw new Error("WAV 数据块无效");
  return {
    durationSeconds: Number((dataBytes / bytesPerSecond).toFixed(3)),
    sampleRate,
    channels,
  };
};

const readSvgMetadata = (buffer) => {
  const source = buffer.toString("utf8");
  const viewBox = source.match(/viewBox=["']([^"']+)["']/i)?.[1]?.trim();
  if (!viewBox) throw new Error("SVG 缺少 viewBox");
  return { viewBox };
};

const inspectMedia = (extension, buffer) => {
  if (extension === ".wav") return readWavMetadata(buffer);
  if (extension === ".svg") return readSvgMetadata(buffer);
  return undefined;
};

const listAssetFiles = async (directory) => {
  const results = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = join(directory, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await listAssetFiles(target)));
    } else if (entry.isFile() && entry.name.toLowerCase() !== "readme.md") {
      results.push(target);
    }
  }
  return results;
};

const validateManifestEntry = (entry, index, seenIds, seenFiles) => {
  const tag = `resources[${index}]`;
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    throw new Error(`${tag} 必须是对象`);
  }
  if (!ID_RE.test(entry.id ?? "")) throw new Error(`${tag}.id 非法：${entry.id}`);
  if (!LIBRARIES.includes(entry.library)) {
    throw new Error(`${tag}.library 非法：${entry.library}`);
  }
  const compositeId = `${entry.library}:${entry.id}`;
  if (seenIds.has(compositeId)) throw new Error(`${tag} 重复资源 ID：${compositeId}`);
  seenIds.add(compositeId);
  if (typeof entry.file !== "string" || !entry.file.startsWith(PREFIX_BY_LIBRARY[entry.library])) {
    throw new Error(`${tag}.file 必须位于 ${PREFIX_BY_LIBRARY[entry.library]} 下`);
  }
  if (entry.file.includes("\\") || entry.file.split("/").includes("..")) {
    throw new Error(`${tag}.file 必须是安全的 POSIX 相对路径`);
  }
  if (seenFiles.has(entry.file)) throw new Error(`${tag}.file 重复：${entry.file}`);
  seenFiles.add(entry.file);
  const extension = extname(entry.file).toLowerCase();
  if (!EXTENSIONS_BY_LIBRARY[entry.library].has(extension)) {
    throw new Error(`${tag}.file 扩展名 ${extension || "缺失"} 不适用于 ${entry.library}`);
  }
  if (typeof entry.label !== "string" || !entry.label.trim()) {
    throw new Error(`${tag}.label 不能为空`);
  }
  if (!Array.isArray(entry.tags) || entry.tags.length === 0) {
    throw new Error(`${tag}.tags 必须是非空数组`);
  }
  if (typeof entry.usage !== "string" || !entry.usage.trim()) {
    throw new Error(`${tag}.usage 不能为空`);
  }
  if (entry.library === "icons") {
    if (typeof entry.category !== "string" || !entry.category.trim()) {
      throw new Error(`${tag}.category 不能为空`);
    }
    if (typeof entry.accent !== "string" || !/^#[0-9a-f]{6}$/i.test(entry.accent)) {
      throw new Error(`${tag}.accent 必须是 6 位十六进制颜色`);
    }
  }
};

export const createResourceIndex = async () => {
  const manifest = JSON.parse(await readFile(RESOURCE_MANIFEST_PATH, "utf8"));
  if (manifest.manifestVersion !== "1") {
    throw new Error(`manifestVersion 必须为 "1"，当前为 ${manifest.manifestVersion}`);
  }
  if (manifest.root !== "public/input") {
    throw new Error(`root 必须为 "public/input"，当前为 ${manifest.root}`);
  }
  if (!Array.isArray(manifest.resources)) throw new Error("resources 必须是数组");

  const seenIds = new Set();
  const seenFiles = new Set();
  const libraries = Object.fromEntries(LIBRARIES.map((library) => [library, []]));

  for (const [index, entry] of manifest.resources.entries()) {
    validateManifestEntry(entry, index, seenIds, seenFiles);
    const target = resolve(RESOURCE_ROOT, ...entry.file.split("/"));
    if (!isInside(RESOURCE_ROOT, target)) throw new Error(`${entry.file} 越出资源根目录`);
    const fileStat = await stat(target).catch(() => null);
    if (!fileStat?.isFile()) throw new Error(`${entry.library}:${entry.id} 缺少文件 ${entry.file}`);
    const buffer = await readFile(target);
    const extension = extname(entry.file).toLowerCase();
    const media = inspectMedia(extension, buffer);
    libraries[entry.library].push({
      id: entry.id,
      label: entry.label.trim(),
      file: entry.file,
      url: `/input/${entry.file}`,
      mimeType: MIME_BY_EXTENSION[extension],
      bytes: buffer.length,
      sha256: createHash("sha256").update(buffer).digest("hex"),
      tags: [...new Set(entry.tags.map((tag) => String(tag).trim()).filter(Boolean))],
      usage: entry.usage.trim(),
      ...(entry.category ? { category: entry.category.trim() } : {}),
      ...(entry.accent ? { accent: entry.accent } : {}),
      ...(media ? { media } : {}),
    });
  }

  const actualAssetFiles = [];
  for (const library of LIBRARIES) {
    actualAssetFiles.push(...(await listAssetFiles(join(RESOURCE_ROOT, library))));
  }
  const actualRelativeFiles = actualAssetFiles.map((file) =>
    toPosix(relative(RESOURCE_ROOT, file)),
  );
  const unindexed = actualRelativeFiles.filter((file) => !seenFiles.has(file));
  if (unindexed.length > 0) {
    throw new Error(`存在未登记资源：${unindexed.join(", ")}`);
  }

  for (const library of LIBRARIES) {
    libraries[library].sort((left, right) => left.id.localeCompare(right.id));
  }
  return {
    indexVersion: manifest.manifestVersion,
    root: manifest.root,
    resourceCount: manifest.resources.length,
    libraries,
  };
};

const main = async () => {
  const index = await createResourceIndex();
  const output = `${JSON.stringify(index, null, 2)}\n`;
  let previous = "";
  try {
    previous = await readFile(RESOURCE_INDEX_PATH, "utf8");
  } catch {
    // 首次生成。
  }
  if (previous !== output) await writeFile(RESOURCE_INDEX_PATH, output, "utf8");
  process.stdout.write(
    `✓ resources=${index.resourceCount} index=${previous === output ? "unchanged" : "updated"}\n`,
  );
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`生成资源索引失败：${error?.message ?? error}\n`);
    process.exit(1);
  });
}
