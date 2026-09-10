import ts from 'typescript';
import { readFile, writeFile, mkdir, unlink, readdir } from 'node:fs/promises';
import { resolve, dirname, relative, isAbsolute, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { build } from 'esbuild';

const parse = (text) => ts.createSourceFile('source.tsx', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const visit = (node, fn) => { fn(node); ts.forEachChild(node, child => visit(child, fn)); };
const nameOf = node => node && (ts.isIdentifier(node) || ts.isStringLiteral(node)) ? node.text : undefined;
const removeNodes = (text, nodes) => {
  const ranges = nodes.map(node => {
    let end = node.end;
    if (text[end] === ',') end++;
    return [node.getFullStart(), end];
  }).sort((a, b) => b[0] - a[0]);
  for (const [start, end] of ranges) text = text.slice(0, start) + text.slice(end);
  return text;
};
export function removeSemanticEntry(text, id) {
  const nodes = [];
  visit(parse(text), node => {
    if (ts.isVariableDeclaration(node) && nameOf(node.name) === 'EFFECT_SEMANTIC_CAPABILITIES' && node.initializer) {
      const value = ts.isCallExpression(node.initializer) && node.initializer.expression.getText() === 'Object.freeze' ? node.initializer.arguments[0] : node.initializer;
      if (value && ts.isObjectLiteralExpression(value)) nodes.push(...value.properties.filter(p => nameOf(p.name) === id));
    }
  });
  if (nodes.length !== 1) throw new Error('无法唯一定位组件语义条目，未执行删除');
  return removeNodes(text, nodes);
}

export const catalogFiles = [
  'ai-motion-arranger/scripts/registry-meta.mjs',
  'remotion-motion-studio.component-catalog.md',
  'ai-motion-arranger/references/component-semantic-capabilities.md',
  'ai-motion-arranger/references/card-catalog.md',
  'overlay-fx-generator/references/component-catalog.md',
];
const optionalRead = async path => { try { return await readFile(path); } catch (e) { if (e.code === 'ENOENT') return null; throw e; } };
const safePath = (root, file) => {
  const path = resolve(root, file), rel = relative(root, path);
  if (!rel || rel.startsWith('..') || isAbsolute(rel)) throw new Error('删除目标超出项目范围');
  return path;
};

async function hasOtherSourceConsumers(root, target) {
  const ignored = new Set(['node_modules', '.git', 'local-dist', 'dist', 'outputs', '.codex-qa', 'local-deletion-backups', 'local-components', 'tests']);
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) { if (!ignored.has(entry.name) && await walk(join(dir, entry.name))) return true; }
      else if (/\.(tsx?|mjs|jsx?)$/.test(entry.name)) {
        const file = join(dir, entry.name);
        if (file === join(root, 'registry.ts') || file === target) continue;
        let found = false;
        visit(parse(await readFile(file, 'utf8')), node => {
          const specifier = (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) ? node.moduleSpecifier : ts.isCallExpression(node) ? node.arguments[0] : null;
          if (specifier && ts.isStringLiteral(specifier) && specifier.text.startsWith('.')) {
            const path = resolve(dirname(file), specifier.text);
            if (path === target || path + '.tsx' === target) found = true;
          }
        });
        if (found) return true;
      }
    }
    return false;
  }
  return walk(root);
}

export async function planEffectDeletion(root, id, imported = false) {
  if (typeof id !== 'string' || !/^[A-Za-z0-9_:-]+$/.test(id)) throw new Error('效果标识无效');
  if (['SrtSemanticCaptions', 'SrtCueText'].includes(id)) throw new Error('系统字幕组件不能从效果库删除');
  const changes = new Map();
  if (imported) {
    const path = 'local-imported/active.tsx';
    const source = await readFile(safePath(root, path), 'utf8');
    const nodes = [];
    visit(parse(source), node => {
      if (ts.isVariableDeclaration(node) && nameOf(node.name) === 'MOTION_COMPONENTS' && node.initializer && ts.isArrayLiteralExpression(node.initializer)) {
        nodes.push(...node.initializer.elements.filter(e => ts.isObjectLiteralExpression(e) && e.properties.some(p => ts.isPropertyAssignment(p) && nameOf(p.name) === 'id' && ts.isStringLiteral(p.initializer) && p.initializer.text === id)));
      }
    });
    if (nodes.length === 0 && id === 'LegacyComponent' && !source.includes('MOTION_COMPONENTS')) {
      changes.set(path, 'export const MOTION_COMPONENTS = [];\nexport const MOTION_TIMELINE = [];\n');
    } else {
      if (nodes.length !== 1) throw new Error('该导入文件不支持安全单组件删除，请先拆分组件');
      changes.set(path, removeNodes(source, nodes));
    }
    // Keep the imported history source and every timeline intact.
  } else {
    const registry = await readFile(join(root, 'registry.ts'), 'utf8');
    const ast = parse(registry);
    let found = false;
    for (const node of ast.statements) {
      if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier) || !node.moduleSpecifier.text.startsWith('./effects/')) continue;
      const bindings = node.importClause?.namedBindings;
      if (!bindings || !ts.isNamedImports(bindings) || bindings.elements.length !== 1) continue;
      const path = node.moduleSpecifier.text.replace(/^\.\//, '') + '.tsx';
      const source = await readFile(safePath(root, path), 'utf8');
      const ids = [];
      visit(parse(source), n => { if (ts.isPropertyAssignment(n) && nameOf(n.name) === 'id' && ts.isStringLiteral(n.initializer)) ids.push(n.initializer.text); });
      if (!ids.includes(id)) continue;
      if (ids.length !== 1) throw new Error('共享源码包含多个 ID，无法安全删除整个文件');
      const exportName = bindings.elements[0].name.text;
      const entries = [];
      visit(ast, n => {
        if (ts.isVariableDeclaration(n) && nameOf(n.name) === 'EFFECT_DEFINITIONS' && n.initializer && ts.isArrayLiteralExpression(n.initializer)) entries.push(...n.initializer.elements.filter(e => ts.isIdentifier(e) && e.text === exportName));
      });
      if (entries.length !== 1) throw new Error('无法唯一定位注册项');
      changes.set('registry.ts', removeNodes(registry, [node, ...entries]));
      // Some effect modules also export helpers used by preview/export. Keep
      // that shared module; the removed registry and semantic entries retire it.
      if (!await hasOtherSourceConsumers(root, safePath(root, path))) changes.set(path, null);
      found = true;
      break;
    }
    if (!found) {
      const source = await readFile(join(root, 'legacy-effects.tsx'), 'utf8');
      const nodes = [];
      visit(parse(source), n => { if (ts.isArrayLiteralExpression(n) && n.elements.length === 5 && ts.isStringLiteral(n.elements[0]) && n.elements[0].text === id) nodes.push(n); });
      if (nodes.length !== 1 || !registry.includes('...LEGACY_EFFECT_DEFS')) throw new Error('没有找到可安全删除的注册组件');
      changes.set('legacy-effects.tsx', removeNodes(source, nodes));
    }
    const semantic = await readFile(join(root, 'effect-semantic-capabilities.ts'), 'utf8');
    changes.set('effect-semantic-capabilities.ts', removeSemanticEntry(semantic, id));
  }
  const library = await optionalRead(join(root, 'effect-library.json'));
  if (library) {
    const value = JSON.parse(library.toString());
    delete value.assignments[id];
    changes.set('effect-library.json', JSON.stringify(value, null, 2) + '\n');
  }
  const overlayPath = 'ai-motion-arranger/scripts/arranger-overlay.json';
  const overlay = await optionalRead(join(root, overlayPath));
  if (overlay) {
    const entries = JSON.parse(overlay.toString());
    if (!Array.isArray(entries)) throw new Error('编排关联配置无效');
    if (entries.some(entry => entry.id === id)) changes.set(overlayPath, JSON.stringify(entries.filter(entry => entry.id !== id), null, 2) + '\n');
  }
  return changes;
}

export async function effectDeletionImpact(root, id) {
  const raw = await optionalRead(join(root, 'local-state.json'));
  const state = raw ? JSON.parse(raw.toString()) : {};
  const count = snapshot => (snapshot?.instances ?? []).filter(i => i.componentId === id).length;
  const projects = [];
  for (const item of state.projectHistory ?? []) {
    const raw = await readFile(safePath(root, join('local-projects', item.storedFile)), 'utf8');
    const snapshot = JSON.parse(raw), instances = count(snapshot);
    if (instances) projects.push({ name: snapshot.projectName ?? item.name ?? item.storedFile, instances });
  }
  return { draftInstances: count(state.workspaceDraft), projects };
}

export async function syncDeletionCatalogs(root) {
  await build({ absWorkingDir: root, entryPoints: ['local-main-v2.tsx', 'local-render-entry-v2.tsx'], bundle: true, write: false, outdir: 'unused', packages: 'external', loader: { '.css': 'empty', '.svg': 'dataurl', '.png': 'dataurl' }, logLevel: 'silent' });
  for (const script of ['ai-motion-arranger/scripts/sync-runtime-registry.mjs', 'ai-motion-arranger/scripts/generate-card-catalog.mjs', 'overlay-fx-generator/scripts/generate-component-catalog.mjs']) {
    await new Promise((done, fail) => execFile(process.execPath, [join(root, script)], { cwd: root, maxBuffer: 8 * 1024 * 1024 }, (error, stdout, stderr) => error ? fail(new Error(stderr || error.message)) : done()));
  }
}

let pending = Promise.resolve();
export function withEffectMutation(operation) {
  const task = pending.then(operation);
  pending = task.catch(() => {});
  return task;
}

// Caller holds withEffectMutation across planning and commit to avoid stale plans.
export async function commitEffectDeletion(root, id, changes, sync = syncDeletionCatalogs) {
  const originals = new Map();
  for (const file of new Set([...changes.keys(), ...catalogFiles])) originals.set(file, await optionalRead(safePath(root, file)));
  const backupId = `${Date.now()}-${randomUUID()}`;
  const backup = join(root, 'local-deletion-backups', backupId);
  await mkdir(backup, { recursive: true });
  for (const [file, bytes] of originals) if (bytes !== null) {
    const target = join(backup, file);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, bytes);
  }
  const manifest = { componentId: id, files: [...originals].map(([path, bytes]) => ({ path, existed: bytes !== null })), status: 'pending' };
  const saveManifest = () => writeFile(join(backup, 'manifest.json'), JSON.stringify(manifest, null, 2));
  await saveManifest();
  try {
    for (const [file, value] of changes) {
      const target = safePath(root, file);
      if (value === null) await unlink(target); else await writeFile(target, value);
    }
    await sync(root);
    manifest.status = 'complete';
    await saveManifest();
    return { backupId };
  } catch (error) {
    const failures = [];
    for (const [file, bytes] of originals) {
      try {
        const target = safePath(root, file);
        if (bytes === null) { if (await optionalRead(target)) await unlink(target); }
        else await writeFile(target, bytes);
      } catch (restoreError) { failures.push(`${file}: ${restoreError.message}`); }
    }
    manifest.status = failures.length ? 'recovery-required' : 'rolled-back';
    await saveManifest();
    throw new Error(failures.length ? `删除失败，部分恢复失败，请使用备份 ${backupId}：${failures.join('；')}` : `删除失败，已恢复全部文件：${error.message}`);
  }
}
