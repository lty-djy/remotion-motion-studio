import { build } from "esbuild";
import { createRequire } from "node:module";
import { resolve } from "node:path";

export const loadRuntimeRegistry = async () => {
  const root = resolve(import.meta.dirname, "..", "..");
  const registryPath = resolve(root, "registry.ts");
  const result = await build({
    entryPoints: [registryPath],
    bundle: true,
    platform: "node",
    format: "cjs",
    packages: "external",
    write: false,
    logLevel: "silent",
  });
  const code = result.outputFiles[0]?.text;
  if (!code) throw new Error("无法编译运行时效果库。");

  const module = { exports: {} };
  const require = createRequire(registryPath);
  new Function(
    "module",
    "exports",
    "require",
    "__filename",
    "__dirname",
    code,
  )(module, module.exports, require, registryPath, root);

  const registry = module.exports.EFFECT_REGISTRY;
  if (!Array.isArray(registry) || registry.length === 0) {
    throw new Error("运行时效果库为空。");
  }
  return registry;
};
