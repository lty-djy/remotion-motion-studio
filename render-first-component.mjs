import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { resolve } from "node:path";

const serveUrl = await bundle({
  entryPoint: resolve("preview-first-component.tsx"),
});
const composition = await selectComposition({
  serveUrl,
  id: "FirstComponentApproval",
});
await renderStill({
  composition,
  serveUrl,
  output: resolve(
    "C:/Users/10659/.codex/visualizations/2026/08/29/01a04d52-36af-72e3-9774-6737d825e9a3/first-component-remotion.png",
  ),
  frame: 105,
  imageFormat: "png",
  overwrite: true,
});
