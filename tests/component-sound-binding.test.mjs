import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';

async function compile(source) {
  const result = await build({ stdin: { contents: source, resolveDir: process.cwd(), loader: 'ts' }, bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false });
  const module = { exports: {} };
  new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, createRequire(import.meta.url));
  return module.exports;
}
const api = await compile(`export * from './component-sound-binding'; export { updateComponentSoundTracks } from './use-component-sound-tracks';`);
const selection = await compile(`export * from './component-sound-selection';`);
const owner = { id: 'card-a', startFrame: 90, durationInFrames: 120, visible: true };
const sound = { id: 'sfx-a', laneId: 'sound-lane', trackOrder: 2, kind: 'sfx', resourceId: 'click', url: '/input/sfx/click.wav', startFrame: 90, durationInFrames: 30, sourceStartFrame: 2, sourceDurationInFrames: 40, volume: .4, voiceDucking: 0, muted: true, visible: true, position: { x: 0, y: 0, width: 1, height: 1, scale: 1, zIndex: 0 } };
const bound = api.bindComponentSound(sound, owner, -6);
const initial = () => ({ instances: [owner], resourceTracks: [bound, { ...sound, id: 'independent' }] });
const move = (state, frame) => api.updateComponentSoundTracks(state, { type: 'instances', update: current => current.map(item => ({ ...item, startFrame: frame })) });

test('component move, trim and magnetic reposition preserve sound offset and audio properties', () => {
  const result = move(initial(), 150);
  assert.equal(result.resourceTracks[0].startFrame, 144);
  assert.deepEqual({ ...result.resourceTracks[0], startFrame: bound.startFrame }, bound);
  assert.equal(result.resourceTracks[1].startFrame, 90);
  assert.equal(move(move(initial(), 0), 90).resourceTracks[0].startFrame, 84);
});
test('resource lane updates cannot double-apply a component movement', () => {
  const result = move(initial(), 150);
  const next = api.updateComponentSoundTracks(result, { type: 'resources', update: initial().resourceTracks });
  assert.equal(next.resourceTracks[0].startFrame, 144);
});
test('copy gets an independent sound ID and owner, using actual clamped copy start', () => {
  const copy = { ...owner, id: 'card-copy', startFrame: 95 };
  const [track] = api.duplicateComponentSounds(initial().resourceTracks, new Map([[owner.id, copy]]), () => 'sfx-copy');
  assert.equal(track.id, 'sfx-copy');
  assert.equal(track.soundBinding.instanceId, copy.id);
  assert.equal(track.startFrame, 89);
  assert.equal(track.resourceId, sound.resourceId);
  assert.notEqual(track.position, bound.position);
  assert.equal(bound.soundBinding.instanceId, owner.id);
});
test('delete removes only owned sounds; undo restores binding and later movement', () => {
  const before = initial();
  const deleted = api.updateComponentSoundTracks(before, { type: 'instances', update: [] });
  assert.deepEqual(deleted.resourceTracks.map(track => track.id), ['independent']);
  // The workbench restores resource state before component state during undo.
  const resources = api.updateComponentSoundTracks(deleted, { type: 'resources', update: before.resourceTracks });
  const restored = api.updateComponentSoundTracks(resources, { type: 'instances', update: before.instances });
  assert.equal(move(restored, 180).resourceTracks[0].startFrame, 174);
});
test('legacy standalone tracks are untouched and unresolved owners can load later', () => {
  const tracks = [sound];
  assert.equal(api.syncComponentSounds(tracks, []), tracks);
  const resources = api.updateComponentSoundTracks({ instances: [], resourceTracks: [] }, { type: 'resources', update: [bound] });
  assert.equal(resources.resourceTracks.length, 1);
  assert.equal(move({ ...resources, instances: [owner] }, 120).resourceTracks[0].startFrame, 114);
});
test('detach preserves timeline time and makes sound independent of later component deletion', () => {
  const detached = api.detachComponentSound(bound);
  assert.equal(detached.startFrame, bound.startFrame);
  assert.equal(detached.soundBinding, undefined);
  assert.equal(api.syncComponentSounds([detached], [], [owner]).length, 1);
});
test('parent mute and visibility combine with sound mute without overwriting sound settings', () => {
  const audible = { ...bound, muted: false };
  assert.equal(api.isComponentSoundMuted(audible, [owner]), false);
  for (const owners of [[], [{ ...owner, muted: true }], [{ ...owner, visible: false }]]) {
    assert.equal(api.isComponentSoundMuted(audible, owners), true);
  }
  assert.equal(api.isComponentSoundMuted(bound, [owner]), true);
});
test('invalid binding data and non-audio resources cannot become component sounds', () => {
  for (const value of [null, {}, { instanceId: '', offsetFrames: 0 }, { instanceId: 'x', offsetFrames: Infinity }, { instanceId: 'x', offsetFrames: .5 }]) {
    assert.equal(api.normalizeSoundBinding(value, 'sfx'), undefined);
  }
  assert.equal(api.normalizeSoundBinding(bound.soundBinding, 'icon'), undefined);
  assert.throws(() => api.bindComponentSound({ ...sound, kind: 'icon' }, owner));
});

// Exercise the actual server save normalizer without opening a project or changing the workspace.
const serverSource = await readFile('local-vite.config.ts', 'utf8');
const start = serverSource.indexOf('const normalizeProjectSnapshot =');
const end = serverSource.indexOf('\n};', start) + 3;
assert.ok(start > 0 && end > start);
const persistence = await compile(`import { normalizeSoundBinding } from './component-sound-binding'; ${serverSource.slice(start, end)}; export { normalizeProjectSnapshot };`);
test('real save normalizer and JSON round-trip retain stable owner/resource IDs, offset and mute', () => {
  const saved = persistence.normalizeProjectSnapshot({ name: 'test', ...initial(), instances: [{...owner,soundMode:'auto'}] });
  const reopened = JSON.parse(JSON.stringify(saved));
  assert.deepEqual(reopened.resourceTracks[0].soundBinding, bound.soundBinding);
  assert.equal(reopened.resourceTracks[0].resourceId, 'click');
  assert.equal(reopened.resourceTracks[0].muted, true);
  assert.equal(reopened.instances[0].soundMode, 'auto');
  assert.equal(move(reopened, 210).resourceTracks[0].startFrame, 204);
});

test('manual replacement preserves binding, offset and volume and never duplicates an entry', () => {
  const choice = {id:'new',label:'New sound',url:'/input/sfx/new.wav',mimeType:'audio/wav',tags:[],category:'custom',usage:'',durationSeconds:2};
  const tracks = selection.selectComponentSound(owner, initial().resourceTracks, choice, 30, () => 'unused');
  assert.equal(tracks.length, 2);
  assert.equal(tracks[0].id, bound.id);
  assert.equal(tracks[0].resourceId, 'new');
  assert.equal(tracks[0].durationInFrames, 60);
  assert.equal(tracks[0].volume, bound.volume);
  assert.deepEqual(tracks[0].soundBinding, bound.soundBinding);
  assert.equal(tracks[1].id, 'independent');
});
test('recommendation uses current library metadata and never rewrites existing tracks', () => {
  const pop = {id:'custom-pop',label:'弹出',url:'/input/sfx/p.wav',tags:['pop'],category:'custom',usage:''};
  const typing = {...pop,id:'custom-typing',label:'打字',tags:['typing']};
  const terminal = {...owner,componentId:'Terminal3D'};
  assert.equal(selection.recommendComponentSounds(terminal,[pop,typing])[0].id, typing.id);
  assert.deepEqual(selection.recommendComponentSounds(terminal,[pop]), []);
  assert.deepEqual(selection.recommendComponentSounds({...terminal,componentId:'SrtSemanticCaptions'},[pop,typing]), []);
  assert.equal(initial().resourceTracks[0].resourceId, 'click');
});
