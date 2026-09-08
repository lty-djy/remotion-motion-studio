import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { migrateLibrary, validateLibrary, applyLibraryToRegistry } from '../effect-library.mjs';
import { saveLibrary, readLibrary } from '../effect-library-store.mjs';

const compiled = await build({ entryPoints: ['local-builtins.tsx'], bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false });
const module = { exports: {} };
new Function('module', 'exports', 'require', compiled.outputFiles[0].text)(module, module.exports, createRequire(new URL('../registry.ts', import.meta.url)));
const catalog = module.exports.BUILT_IN_CATALOG;

test('real catalog has unique IDs and no system captions in the effect library', () => {
  assert.equal(new Set(catalog.map(g => g.id)).size, catalog.length);
  assert.ok(!catalog.flatMap(g => g.items).some(i => i.ids.some(id => id === 'SrtCueText' || id === 'SrtSemanticCaptions')));
  const config = migrateLibrary(catalog);
  assert.equal(config.assignments.BrandLogo, 'group:品牌与标识');
  assert.equal(config.assignments.CaseStudySidebar, 'group:品牌与标识');
});
test('migration preserves explicit moves, names, colors and empty custom groups', () => {
  const config = migrateLibrary(catalog, { custom: [{ id: 'custom-test', name: '我的组' }], assignments: { CaseStudySidebar: 'custom-test', BrandLogo: 'brand' }, names: { 'portrait-narrative': '我的口播' }, colors: { brand: '#123456' } });
  assert.equal(config.assignments.CaseStudySidebar, 'custom-test');
  assert.equal(config.groups.find(g => g.id === 'group:品牌与标识').color, '#123456');
  assert.equal(config.groups.find(g => g.id === 'group:竖屏口播信息层').name, '我的口播');
  assert.equal(validateLibrary(config), config);
});
test('reject nonempty deletion; move then delete persists without recreation and AI sees the new group', async () => {
  const root = await mkdtemp(join(tmpdir(), 'effect-library-test-'));
  try {
    const config = migrateLibrary(catalog);
    await saveLibrary(root, config);
    const target = 'group:品牌与标识';
    const invalid = structuredClone(config);
    invalid.groups = invalid.groups.filter(g => g.id !== target);
    for (const [id, g] of Object.entries(invalid.assignments)) if (g === target) delete invalid.assignments[id];
    await assert.rejects(saveLibrary(root, invalid), /先移动/);
    const next = structuredClone(config);
    for (const id of Object.keys(next.assignments)) if (next.assignments[id] === target) next.assignments[id] = 'group:媒体展示组件';
    next.groups = next.groups.filter(g => g.id !== target);
    await saveLibrary(root, next);
    const loaded = await readLibrary(root);
    assert.ok(!loaded.groups.some(g => g.id === target));
    assert.deepEqual(await saveLibrary(root, config, true), loaded);
    const ai = applyLibraryToRegistry(module.exports.BUILT_IN_DEFINITIONS, loaded);
    assert.equal(ai.find(d => d.id === 'BrandLogo').catalogGroup, '媒体展示组件');
    assert.equal(ai.length, module.exports.BUILT_IN_DEFINITIONS.length);
  } finally { await rm(root, { recursive: true }); }
});
