#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as Phosphor from "@phosphor-icons/react";
import { BUILT_IN_ICONS } from "../built-in-icon-catalog.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const resourceRoot = resolve(here, "..", "..", "public", "input");
const iconRoot = join(resourceRoot, "icons");
const manifestPath = join(resourceRoot, "resource-manifest.json");

await mkdir(iconRoot, { recursive: true });

for (const icon of BUILT_IN_ICONS) {
  const Component = Phosphor[icon.component];
  if (typeof Component !== "object" && typeof Component !== "function") {
    throw new Error(`Phosphor 图标不存在：${icon.component}`);
  }
  const markup = renderToStaticMarkup(
    React.createElement(Component, {
      color: icon.accent,
      size: 64,
      weight: "regular",
      "aria-hidden": "true",
    }),
  );
  const svgMarkup = markup.includes('xmlns="http://www.w3.org/2000/svg"')
    ? markup
    : markup.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ');
  await writeFile(
    join(iconRoot, `${icon.id}.svg`),
    `${svgMarkup}\n`,
    "utf8",
  );
}

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const nonIconResources = manifest.resources.filter(
  (resource) => resource.library !== "icons",
);
manifest.resources = [
  ...BUILT_IN_ICONS.map((icon) => ({
    id: icon.id,
    library: "icons",
    file: `icons/${icon.id}.svg`,
    label: icon.label,
    category: icon.category,
    accent: icon.accent,
    tags: [icon.category, ...icon.tags],
    usage: icon.usage,
  })),
  ...nonIconResources,
];
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
process.stdout.write(`✓ built-in icons=${BUILT_IN_ICONS.length}\n`);
