import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from 'esbuild';
import { planEffectDeletion, commitEffectDeletion, effectDeletionImpact, catalogFiles, removeSemanticEntry } from '../effect-deletion.mjs';

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'effect-deletion-test-'));
  const files = {
    'registry.ts': 'import { A } from "./effects/A";\nimport { B } from "./effects/B";\nexport const EFFECT_DEFINITIONS = [A, B];',
    'effects/A.tsx': 'export const A = {id: "A", name: "A"};',
    'effects/B.tsx': 'export const B = {id: "B", name: "B"};',
    'effect-semantic-capabilities.ts': 'export const EFFECT_SEMANTIC_CAPABILITIES = Object.freeze({ A: {keywords: ["a", "}"]}, B: {keywords: ["b"]} });',
    'effect-library.json': JSON.stringify({version: 1, groups: [{id:'g',name:'G'}],assignments:{A:'g',B:'g'}}),
    'local-state.json': JSON.stringify({workspaceDraft: {instances: [{componentId:'A',props:{text:'keep'}}]},projectHistory:[{storedFile:'history.json'}]}),
    'local-projects/history.json': JSON.stringify({projectName:'保留项目',instances:[{componentId:'A',startFrame:20,props:{text:'keep'}}]}),
    'local-imported/active.tsx': 'export const MOTION_COMPONENTS = [{ id: "X", component: () => null }, { id: "Y", component: () => null }];',
  };
  for (const file of catalogFiles) files[file] = 'original catalog';
  for (const [file, content] of Object.entries(files)) { await mkdir(join(root,file,'..'),{recursive:true}); await writeFile(join(root,file),content); }
  return {root,files};
}
test('registered deletion removes exactly one ID and preserves project history and draft', async () => {
  const {root,files}=await fixture();
  const impact=await effectDeletionImpact(root,'A');
  assert.equal(impact.draftInstances,1); assert.equal(impact.projects[0].instances,1);
  const plan=await planEffectDeletion(root,'A');
  const result=await commitEffectDeletion(root,'A',plan,async root => {
    const compiled=await build({entryPoints:[join(root,'registry.ts')],bundle:true,write:false,platform:'node',format:'cjs'});
    const m={exports:{}}; new Function('module','exports',compiled.outputFiles[0].text)(m,m.exports);
    assert.deepEqual(m.exports.EFFECT_DEFINITIONS.map(d=>d.id),['B']);
    for (const file of catalogFiles) await writeFile(join(root,file),'B');
  });
  await assert.rejects(access(join(root,'effects/A.tsx')));
  assert.equal(await readFile(join(root,'effects/B.tsx'),'utf8'),files['effects/B.tsx']);
  assert(!JSON.parse(await readFile(join(root,'effect-library.json'),'utf8')).assignments.A);
  assert(!(await readFile(join(root,'effect-semantic-capabilities.ts'),'utf8')).includes('A:'));
  for (const file of ['local-state.json','local-projects/history.json']) assert.equal(await readFile(join(root,file),'utf8'),files[file]);
  assert.equal(await readFile(join(root,'local-deletion-backups',result.backupId,'effects/A.tsx'),'utf8'),files['effects/A.tsx']);
});
test('catalog failure restores every modified file byte for byte', async () => {
  const {root,files}=await fixture();
  await assert.rejects(commitEffectDeletion(root,'A',await planEffectDeletion(root,'A'),async root=>{
    await writeFile(join(root,catalogFiles[0]),'partial'); throw Error('injected failure');
  }),/已恢复全部文件/);
  for (const [file, content] of Object.entries(files)) assert.equal(await readFile(join(root,file),'utf8'),content,file);
});
test('imported deletion keeps sibling components and history untouched', async () => {
  const {root,files}=await fixture();
  const plan=await planEffectDeletion(root,'X',true);
  assert(!plan.get('local-imported/active.tsx').includes('id: "X"'));
  assert(plan.get('local-imported/active.tsx').includes('id: "Y"'));
  await commitEffectDeletion(root,'X',plan,async()=>{});
  assert.equal(await readFile(join(root,'local-state.json'),'utf8'),files['local-state.json']);
});
test('ambiguous and system deletions fail before mutation', async () => {
  const {root}=await fixture();
  await assert.rejects(planEffectDeletion(root,'../A'),/标识无效/);
  await assert.rejects(planEffectDeletion(root,'SrtSemanticCaptions'),/系统字幕/);
  assert.throws(()=>removeSemanticEntry('const x = {A: 1};','A'),/唯一定位/);
});
test('shared preview helpers are preserved when unregistering an effect', async () => {
  const {root}=await fixture();
  await writeFile(join(root,'preview.ts'),'import { A } from "./effects/A"; export const shared = A;');
  const plan=await planEffectDeletion(root,'A');
  assert.equal(plan.has('effects/A.tsx'),false);
  assert(plan.has('registry.ts'));
});
