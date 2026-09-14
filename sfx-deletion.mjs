import { readFile, writeFile, mkdir, readdir, unlink, realpath } from 'node:fs/promises';
import { resolve, relative, isAbsolute, join } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { soundReferences, rewriteSoundReferences } from './sfx-references.mjs';

const hash = value => createHash('sha256').update(value).digest('hex');
const json = value => Buffer.from(JSON.stringify(value, null, 2) + '\n');
const optional = async path => { try { return await readFile(path); } catch (error) { if (error.code === 'ENOENT') return null; throw error; } };
const safe = (root, path) => {
  const target = resolve(root, path), rel = relative(root, target);
  if (!rel || rel.startsWith('..') || isAbsolute(rel)) throw new Error('音效路径超出项目范围');
  return target;
};
async function assetPath(root, file) {
  if (typeof file !== 'string' || !/^sfx\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9._-]+\.(wav|mp3|ogg|m4a)$/i.test(file)) throw new Error('音效文件路径无效');
  const base = resolve(root, 'public/input');
  const target = safe(base, file);
  // Reject symlinks/junctions that leave the intended asset directory.
  const realBase = await realpath(base);
  const resolved = await realpath(target).catch(error => { if (error.code === 'ENOENT') return target; throw error; });
  safe(realBase, resolved);
  return target;
}
const manifestFile = 'public/input/resource-manifest.json';
const indexFile = 'public/input/resource-index.json';

async function inspect(root, id) {
  if (!/^[A-Za-z0-9._-]+$/.test(id ?? '')) throw new Error('音效标识无效');
  const files = new Map();
  for (const name of [manifestFile, indexFile, 'local-state.json', 'public/input/arrangement-rules/rule-manifest.json']) {
    const contents = await optional(safe(root, name));
    if (contents) files.set(name, contents);
  }
  const manifest = JSON.parse(files.get(manifestFile)?.toString() ?? '{}');
  const index = JSON.parse(files.get(indexFile)?.toString() ?? '{}');
  const resource = manifest.resources?.find(item => item.library === 'sfx' && item.id === id);
  if (!resource) throw new Error('音效已不存在，请刷新音效库');
  const path = await assetPath(root, resource.file);
  const asset = await optional(path);
  const projects = await readdir(join(root, 'local-projects'), { withFileTypes: true }).catch(error => { if (error.code === 'ENOENT') return []; throw error; });
  for (const entry of projects.sort((a,b) => a.name.localeCompare(b.name))) {
    if (entry.isFile() && entry.name.endsWith('.json')) files.set(`local-projects/${entry.name}`, await readFile(safe(root, `local-projects/${entry.name}`)));
  }
  const references = [];
  for (const [name, contents] of files) {
    if ([manifestFile, indexFile].includes(name)) continue;
    const document = JSON.parse(contents.toString());
    references.push(...soundReferences(document, id, document.name || name));
  }
  const revision = hash([...files].map(([name, contents]) => name + ':' + hash(contents)).join('|') + ':' + (asset ? hash(asset) : 'missing'));
  return { files, manifest, index, resource, path, asset, references, revision };
}

export async function inspectSfxDeletion(root, id) {
  const inspected = await inspect(root, id);
  return { revision: inspected.revision, references: inspected.references, sound: inspected.resource, missingFile: !inspected.asset };
}

async function applyChanges(root, changes, before) {
  const written = [];
  try {
    for (const [name, contents] of changes) {
      const target = safe(root, name);
      written.push(name);
      if (contents === null) await unlink(target).catch(error => { if (error.code !== 'ENOENT') throw error; });
      else { await mkdir(resolve(target, '..'), {recursive:true}); await writeFile(target, contents); }
    }
  } catch (error) {
    for (const name of written.reverse()) {
      const original = before.get(name);
      if (original === null) await unlink(safe(root, name)).catch(() => {});
      else await writeFile(safe(root, name), original);
    }
    throw error;
  }
}

export async function commitSfxDeletion(root, { soundId, revision, action, replacementId, fps = 30 }) {
  if (!['remove', 'replace'].includes(action)) throw new Error('请选择移除引用或替换音效');
  const plan = await inspect(root, soundId);
  if (revision !== plan.revision) throw new Error('引用或音效库已变化，请重新查看删除清单');
  let replacement = null;
  if (action === 'replace') {
    replacement = plan.index.libraries?.sfx?.find(item => item.id === replacementId && item.id !== soundId);
    const entry = plan.manifest.resources.find(item => item.library === 'sfx' && item.id === replacementId && item.id !== soundId);
    if (!replacement || !entry || !await optional(await assetPath(root, entry.file))) throw new Error('替换音效不可用，请重新选择');
  }
  const changes = new Map();
  const frameRate = Number.isFinite(fps) && fps >= 1 && fps <= 240 ? fps : 30;
  for (const [name, contents] of plan.files) {
    if ([manifestFile, indexFile].includes(name)) continue;
    const value = JSON.parse(contents.toString());
    const updated = rewriteSoundReferences(value, soundId, replacement, frameRate);
    if (JSON.stringify(updated) !== JSON.stringify(value)) changes.set(name, json(updated));
  }
  const manifest = { ...plan.manifest, resources: plan.manifest.resources.filter(item => !(item.library === 'sfx' && item.id === soundId)) };
  const index = { ...plan.index, resourceCount:plan.index.resourceCount - plan.index.libraries.sfx.filter(item => item.id === soundId).length,
    libraries: { ...plan.index.libraries, sfx: plan.index.libraries.sfx.filter(item => item.id !== soundId) } };
  changes.set(manifestFile, json(manifest)); changes.set(indexFile, json(index));
  // A manifest can legally share a physical asset between entries; don't delete another entry's file.
  const assetName = relative(root, plan.path).replaceAll('\\','/');
  if (!manifest.resources.some(item => item.file === plan.resource.file)) changes.set(assetName, null);
  const before = new Map([...changes.keys()].map(name => [name, name === assetName ? plan.asset : plan.files.get(name)]));
  const token = randomUUID();
  const backup = { version:1, soundId, files:[...changes].map(([name, after]) => ({name, before:before.get(name)?.toString('base64') ?? null, afterHash:after ? hash(after) : null})), undone:false };
  await mkdir(join(root,'local-deletion-backups','sfx'),{recursive:true});
  await writeFile(join(root,'local-deletion-backups','sfx',`${token}.json`),json(backup));
  await applyChanges(root, changes, before);
  return { token, replacement, library:index.libraries.sfx, references:plan.references };
}

export async function undoSfxDeletion(root, token) {
  if (!/^[a-f0-9-]{36}$/.test(token ?? '')) throw new Error('撤销标识无效');
  const backupPath = join(root,'local-deletion-backups','sfx',`${token}.json`);
  const backup = JSON.parse(await readFile(backupPath,'utf8'));
  if (backup.undone) return { library:JSON.parse(await readFile(safe(root,indexFile),'utf8')).libraries.sfx };
  const before = new Map(), changes = new Map();
  for (const file of backup.files) {
    const current = await optional(safe(root,file.name));
    if ((current ? hash(current) : null) !== file.afterHash) throw new Error('删除后相关项目或音效库已修改，无法直接撤销覆盖；删除备份仍保留');
    before.set(file.name,current); changes.set(file.name,file.before === null ? null : Buffer.from(file.before,'base64'));
  }
  await applyChanges(root,changes,before);
  backup.undone = true;
  await writeFile(backupPath,json(backup));
  return { library:JSON.parse(await readFile(safe(root,indexFile),'utf8')).libraries.sfx };
}

export async function assertAvailableSfx(root, snapshot) {
  const index=JSON.parse(await readFile(safe(root,indexFile),'utf8'));
  const ids=new Set(index.libraries?.sfx?.map(item=>item.id)??[]);
  const missing=(snapshot.resourceTracks??[]).filter(track=>track.kind==='sfx'&&!ids.has(track.resourceId));
  if(missing.length) throw new Error('音效已删除或不在音效库中：'+[...new Set(missing.map(track=>track.name||track.resourceId))].join('、')+'。请先替换或移除这些引用，再保存。');
}
