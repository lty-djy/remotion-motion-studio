import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inspectSfxDeletion, commitSfxDeletion, undoSfxDeletion, assertAvailableSfx, inspectSfxLibrary, omitUnavailableSfxTracks } from '../sfx-deletion.mjs';
import { rewriteSoundReferences } from '../sfx-references.mjs';

const owner = {id:'owner',componentId:'BrandLogo',soundMode:'manual',startFrame:30};
const track = {id:'sound',kind:'sfx',resourceId:'old',name:'Old',url:'/input/sfx/old.wav',mimeType:'audio/wav',soundBinding:{instanceId:'owner',offsetFrames:3},startFrame:33,sourceStartFrame:4,durationInFrames:60,volume:.3,muted:true};
const snapshot = {name:'历史项目',instances:[owner],resourceTracks:[track,{...track,id:'free',soundBinding:undefined}],selectedKeys:['motion:owner','resource:sound','resource:free']};
const old = {library:'sfx',id:'old',file:'sfx/old.wav',label:'Old',source:'builtin'};
const replacement = {library:'sfx',id:'new',file:'sfx/new.wav',label:'New',url:'/input/sfx/new.wav',mimeType:'audio/wav',media:{durationSeconds:1}};
async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(),'sfx-delete-'));
  t.after(()=>rm(root,{recursive:true,force:true}));
  for (const dir of ['public/input/sfx','local-projects']) await mkdir(join(root,dir),{recursive:true});
  await writeFile(join(root,'public/input/resource-manifest.json'),JSON.stringify({resources:[old,replacement]}));
  await writeFile(join(root,'public/input/resource-index.json'),JSON.stringify({resourceCount:2,libraries:{sfx:[old,replacement],icons:[]}}));
  await writeFile(join(root,'public/input/sfx/old.wav'),'OLD AUDIO');
  await writeFile(join(root,'public/input/sfx/new.wav'),'NEW AUDIO');
  await writeFile(join(root,'local-state.json'),JSON.stringify({workspaceDraft:snapshot,other:'keep'}));
  await writeFile(join(root,'local-projects/project.json'),JSON.stringify(snapshot));
  return root;
}
const read = async (root,file)=>JSON.parse(await readFile(join(root,file),'utf8'));

test('impact includes saved workspace, historical project, bound and independent sounds',async t=>{
  const root=await fixture(t); const impact=await inspectSfxDeletion(root,'old');
  assert.equal(impact.references.length,4);
  assert.equal(impact.references.filter(item=>item.bound).length,2);
  assert.equal(impact.references[0].componentId,'BrandLogo');
});
test('replace migrates saved projects, preserves timing/volume/binding, clips short source and undo restores exact files',async t=>{
  const root=await fixture(t);
  const original=await readFile(join(root,'local-state.json'));
  const impact=await inspectSfxDeletion(root,'old');
  const result=await commitSfxDeletion(root,{soundId:'old',revision:impact.revision,action:'replace',replacementId:'new',fps:30});
  const project=await read(root,'local-projects/project.json');
  assert.equal(project.resourceTracks[0].resourceId,'new');
  assert.equal(project.resourceTracks[0].startFrame,33);
  assert.equal(project.resourceTracks[0].volume,.3);
  assert.equal(project.resourceTracks[0].muted,true);
  assert.deepEqual(project.resourceTracks[0].soundBinding,track.soundBinding);
  assert.equal(project.resourceTracks[0].durationInFrames,26);
  await assert.rejects(access(join(root,'public/input/sfx/old.wav')));
  assert.equal((await read(root,'public/input/resource-index.json')).resourceCount,1);
  await undoSfxDeletion(root,result.token);
  assert.deepEqual(await readFile(join(root,'local-state.json')),original);
  assert.equal(await readFile(join(root,'public/input/sfx/old.wav'),'utf8'),'OLD AUDIO');
  await undoSfxDeletion(root,result.token); // Safe idempotent retry.
});
test('remove keeps components, changes their mode, clears selected sound keys and handles pending preview',async t=>{
  const root=await fixture(t);const impact=await inspectSfxDeletion(root,'old');
  await commitSfxDeletion(root,{soundId:'old',revision:impact.revision,action:'remove'});
  const project=await read(root,'local-projects/project.json');
  assert.equal(project.instances.length,1);assert.equal(project.instances[0].soundMode,'none');assert.equal(project.resourceTracks.length,0);
  assert.deepEqual(project.selectedKeys,['motion:owner']);
  const pending=rewriteSoundReferences({motionInstances:[owner],resourceTracks:[track],selectedKeys:['resource:sound']},'old');
  assert.equal(pending.motionInstances[0].soundMode,'none');assert.deepEqual(pending.selectedKeys,[]);
});
test('reject stale impact after another save without changing audio or manifest',async t=>{
  const root=await fixture(t);const impact=await inspectSfxDeletion(root,'old');
  await writeFile(join(root,'local-projects/new-project.json'),JSON.stringify(snapshot));
  await assert.rejects(commitSfxDeletion(root,{soundId:'old',revision:impact.revision,action:'remove'}),/变化/);
  await access(join(root,'public/input/sfx/old.wav'));
});
test('reject missing replacement and prevent undo from overwriting subsequent project changes',async t=>{
  const root=await fixture(t);let impact=await inspectSfxDeletion(root,'old');
  await assert.rejects(commitSfxDeletion(root,{soundId:'old',revision:impact.revision,action:'replace',replacementId:'missing'}),/不可用/);
  const result=await commitSfxDeletion(root,{soundId:'old',revision:impact.revision,action:'remove'});
  await writeFile(join(root,'local-projects/project.json'),'{}');
  await assert.rejects(undoSfxDeletion(root,result.token),/无法直接撤销/);
  assert.equal(await readFile(join(root,'local-projects/project.json'),'utf8'),'{}');
});
test('path traversal rejected and missing source can still be removed from the library',async t=>{
  const root=await fixture(t);
  await assert.rejects(inspectSfxDeletion(root,'../old'),/标识无效/);
  await rm(join(root,'public/input/sfx/old.wav'));
  const impact=await inspectSfxDeletion(root,'old');assert.equal(impact.missingFile,true);
  await commitSfxDeletion(root,{soundId:'old',revision:impact.revision,action:'remove'});
  assert.equal((await read(root,'public/input/resource-manifest.json')).resources.length,1);
});

test('a stale browser cannot save deleted sound references, but restored assets can be saved again',async t=>{
  const root=await fixture(t); await assertAvailableSfx(root,snapshot);
  const impact=await inspectSfxDeletion(root,'old');
  const result=await commitSfxDeletion(root,{soundId:'old',revision:impact.revision,action:'remove'});
  await assert.rejects(assertAvailableSfx(root,snapshot),/已删除/);
  await assertAvailableSfx(root,rewriteSoundReferences(snapshot,'old'));
  await undoSfxDeletion(root,result.token); await assertAvailableSfx(root,snapshot);
});

test('live library marks missing or empty audio and playback filtering keeps visuals and valid sounds',async t=>{
  const root=await fixture(t);
  let status=await inspectSfxLibrary(root);
  assert.equal(status.unavailable.length,0);
  await writeFile(join(root,'public/input/sfx/old.wav'),'');
  status=await inspectSfxLibrary(root);
  assert.deepEqual(status.unavailable.map(item=>item.id),['old']);
  assert.equal(status.index.libraries.sfx.find(item=>item.id==='old').available,false);
  const availableIds=new Set(status.index.libraries.sfx.filter(item=>item.available).map(item=>item.id));
  const tracks=[track,{...track,id:'valid',resourceId:'new'},{id:'icon',kind:'icon',resourceId:'visual'}];
  assert.deepEqual(omitUnavailableSfxTracks(tracks,availableIds).map(item=>item.id),['valid','icon']);
});
