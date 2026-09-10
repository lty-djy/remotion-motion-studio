// Run against an isolated copy of tracked sources, never the live effect library.
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, copyFile, symlink, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import assert from 'node:assert/strict';
import { planEffectDeletion, commitEffectDeletion } from '../effect-deletion.mjs';
const source=resolve('.');
const root=await mkdtemp(join(tmpdir(),'effect-deletion-integration-'));
const files=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(file=>/\.(tsx?|mjs|json|css|svg|md)$/.test(file));
for(const file of files) {await mkdir(dirname(join(root,file)),{recursive:true});await copyFile(join(source,file),join(root,file));}
await symlink(join(source,'node_modules'),join(root,'node_modules'),'junction');
const history=JSON.stringify({instances:[{componentId:'FocusCamMove',startFrame:10,props:{text:'history preserved'}}]});
await mkdir(join(root,'local-projects'),{recursive:true});
await writeFile(join(root,'local-projects/retained.json'),history);
for(const id of ['FocusCamMove','SegmentedMeter']) {
  await commitEffectDeletion(root,id,await planEffectDeletion(root,id));
  const semantic=await readFile(join(root,'effect-semantic-capabilities.ts'),'utf8');
  assert(!semantic.includes(id+': capability('));
  const catalog=await readFile(join(root,'overlay-fx-generator/references/component-catalog.md'),'utf8');
  assert(!catalog.includes('`'+id+'`'));
  assert.equal(await readFile(join(root,'local-projects/retained.json'),'utf8'),history);
}
console.log('PASS: real shared-source and legacy deletion, preview/export bundle validation, all catalog generators, preserved history. Isolated copy: '+root);
