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
const cues = await compile(`export * from './component-sound-cues';`);
const profiles = await compile(`export * from './component-sound-profiles'; export { BUILT_IN_DEFINITIONS } from './local-builtins';`);
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
  const saved = persistence.normalizeProjectSnapshot({ name: 'test', ...initial(), instances: [{...owner,soundMode:'auto',soundDensity:'emphatic'}] });
  const reopened = JSON.parse(JSON.stringify(saved));
  assert.deepEqual(reopened.resourceTracks[0].soundBinding, bound.soundBinding);
  assert.equal(reopened.resourceTracks[0].resourceId, 'click');
  assert.equal(reopened.resourceTracks[0].muted, true);
  assert.equal(reopened.instances[0].soundMode, 'auto');
  assert.equal(reopened.instances[0].soundDensity, 'emphatic');
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
test('multi-step components create one bound sound per visual cue and keep them synchronized', () => {
  const cueOwner = {
    ...owner,
    componentId: 'PortraitToolBadgeList',
    props: {
      stepCount: 3,
      animationSeconds: 2.8,
      badge1: 'C 位',
      badge2: '26K',
      badge3: '80K',
    },
  };
  const choice = {id:'pop',label:'Pop',url:'/input/sfx/pop.wav',mimeType:'audio/wav',tags:['ui','pop'],category:'custom',usage:'',durationSeconds:.3};
  let nextId = 0;
  const visualCues = cues.getComponentSoundCues(cueOwner, 30);
  const tracks = selection.selectComponentSoundCues(
    cueOwner,
    initial().resourceTracks,
    choice,
    30,
    () => `cue-${++nextId}`,
    visualCues,
    { nudgeFrames: 2, volume: .42 },
  );
  const boundTracks = tracks.filter(track => track.soundBinding?.instanceId === cueOwner.id);
  assert.equal(boundTracks.length, 3);
  assert.deepEqual(boundTracks.map(track => track.soundBinding.cueId), ['step-1', 'step-2', 'step-3']);
  assert.deepEqual(boundTracks.map(track => track.startFrame), [104, 124, 144]);
  assert.ok(boundTracks.every(track => track.volume === .42));

  const expandedOwner = {
    ...cueOwner,
    props: { ...cueOwner.props, stepCount: 5, animationSeconds: 4 },
  };
  const expanded = api.updateComponentSoundTracks(
    { instances: [cueOwner], resourceTracks: tracks },
    { type: 'instances', update: [expandedOwner] },
  );
  const expandedSounds = expanded.resourceTracks
    .filter(track => track.soundBinding?.instanceId === cueOwner.id)
    .sort((left, right) => left.soundBinding.cueIndex - right.soundBinding.cueIndex);
  assert.equal(expandedSounds.length, 5);
  assert.deepEqual(expandedSounds.map(track => track.soundBinding.cueId), ['step-1', 'step-2', 'step-3', 'step-4', 'step-5']);
  assert.deepEqual(expandedSounds.map(track => track.startFrame), [109, 138, 167, 196, 225]);

  const reducedOwner = {
    ...expandedOwner,
    props: { ...expandedOwner.props, stepCount: 2 },
  };
  const reduced = api.updateComponentSoundTracks(
    expanded,
    { type: 'instances', update: [reducedOwner] },
  );
  assert.equal(
    reduced.resourceTracks.filter(track => track.soundBinding?.instanceId === cueOwner.id).length,
    2,
  );
  assert.ok(reduced.resourceTracks.some(track => track.id === 'independent'));
});
test('cue metadata survives JSON normalization and duplication', () => {
  const cueOwner = {
    ...owner,
    componentId: 'PortraitStepNumberList',
    props: { stepCount: 2, stepEnterIntervalSeconds: .2, step1: '准备', step2: '完成' },
  };
  const [firstCue] = cues.getComponentSoundCues(cueOwner, 30);
  const cueTrack = api.bindComponentSound(sound, cueOwner, firstCue.offsetFrames - 1, {
    id: firstCue.id,
    index: firstCue.index,
    label: firstCue.label,
    fps: 30,
    nudgeFrames: -1,
  });
  const saved = persistence.normalizeProjectSnapshot({
    name: 'cue-test',
    instances: [cueOwner],
    resourceTracks: [cueTrack],
  });
  assert.deepEqual(saved.resourceTracks[0].soundBinding, cueTrack.soundBinding);
  const copy = { ...cueOwner, id: 'cue-copy', startFrame: 120 };
  const [copied] = api.duplicateComponentSounds(
    [cueTrack],
    new Map([[cueOwner.id, copy]]),
    () => 'copied-cue',
  );
  assert.equal(copied.soundBinding.cueId, firstCue.id);
  assert.equal(copied.soundBinding.nudgeFrames, -1);
  assert.equal(copied.startFrame, 119);
});
test('all staged built-ins with explicit item timing expose one cue per configured item', () => {
  const cases = [
    ['PortraitToolBadgeList', { stepCount: 3, animationSeconds: 2.8 }],
    ['PortraitStaggeredToolList', { stepCount: 4, animationSeconds: 2.8 }],
    ['PortraitStepNumberList', { stepCount: 5, stepEnterIntervalSeconds: .2 }],
    ['TerminalPanel', { stepCount: 3, itemIntervalSeconds: .55 }],
    ['PortraitWorkflowPrerequisite', { stepCount: 4, animationSeconds: 3.5 }],
    ['PortraitDesignRuleChecklist', { ruleCount: 4, animationSeconds: 8.1, ruleIntervalSeconds: 1.8 }],
    ['PortraitSkillStepGrid', { stepCount: 4, headerEnterSeconds: .45, cardEnterIntervalSeconds: .16 }],
    ['PortraitBrowserRepairLoop', { stepCount: 6, firstNodeHighlightSeconds: .5, nextNodeHighlightIntervalSeconds: 1.2 }],
    ['PortraitRiskWarning', { riskCount: 3, animationSeconds: .95, riskIntervalSeconds: .45 }],
    ['PortraitCodeDecisionChecklist', { questionCount: 6, firstHighlightSeconds: .6, questionIntervalSeconds: .9 }],
    ['PortraitSkillSourceFusion', { sourceCount: 3, animationSeconds: 8.7 }],
    ['PortraitSkillResultComparison', { materialCount: 3, firstSwitchSeconds: 3.1, materialIntervalSeconds: 3.5 }],
    ['PortraitPromptIterationShowcase', { iterationCount: 3, firstResultSeconds: 3.1, iterationIntervalSeconds: 5.2 }],
  ];
  for (const [componentId, props] of cases) {
    const count = Number(props.stepCount ?? props.ruleCount ?? props.riskCount ?? props.questionCount ?? props.sourceCount ?? props.materialCount ?? props.iterationCount);
    const plan = cues.getComponentSoundCues({ ...owner, componentId, props }, 30);
    assert.equal(plan.length, count, componentId);
    assert.ok(plan.every((cue, index) => cue.index === index), componentId);
    assert.ok(plan.every((cue, index) => index === 0 || cue.offsetFrames >= plan[index - 1].offsetFrames), componentId);
  }
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

test('recommendation ignores unavailable sounds until the user refreshes or replaces them', () => {
  const missing = {id:'missing-typing',label:'打字',url:'/input/sfx/missing.wav',tags:['typing'],category:'custom',usage:'',available:false};
  const available = {...missing,id:'available-typing',url:'/input/sfx/available.wav',available:true};
  const terminal = {...owner,componentId:'Terminal3D'};
  assert.deepEqual(selection.recommendComponentSounds(terminal,[missing]), []);
  assert.equal(selection.recommendComponentSounds(terminal,[missing,available])[0].id, 'available-typing');
});

test('every built-in component has an explicit sound profile and unknown components do not guess', () => {
  const ids = profiles.BUILT_IN_DEFINITIONS.map(item => item.id).sort();
  assert.deepEqual(Object.keys(profiles.COMPONENT_SOUND_PROFILES).sort(), ids);
  const custom = {...owner,componentId:'ImportedCustomEffect'};
  const pop = {id:'pop',label:'Pop',url:'/input/sfx/pop.wav',mimeType:'audio/wav',tags:['ui','pop'],category:'custom',usage:''};
  assert.equal(profiles.getComponentSoundProfile(custom.componentId).autoEnabled, false);
  assert.deepEqual(selection.recommendComponentSounds(custom,[pop]), []);
});

test('recommendations expose component reason and trigger point instead of guessing from component names', () => {
  const typingSoft = {id:'typewriter-hit-soft',label:'Soft type',url:'/input/sfx/soft.wav',mimeType:'audio/wav',tags:['text','typewriter-hit-soft'],category:'custom',usage:'',durationSeconds:.4};
  const typingHard = {...typingSoft,id:'typewriter-hit-hard',label:'Hard type',tags:['text','typewriter-hit-hard'],durationSeconds:.8};
  const terminal = {...owner,componentId:'Terminal3D'};
  const subtle = selection.recommendComponentSoundDetails(terminal,[typingHard,typingSoft],'subtle');
  const emphatic = selection.recommendComponentSoundDetails(terminal,[typingSoft,typingHard],'emphatic');
  assert.equal(subtle[0].choice.id,'typewriter-hit-soft');
  assert.equal(emphatic[0].choice.id,'typewriter-hit-hard');
  assert.match(subtle[0].reason,/终端|输入/);
  assert.equal(subtle[0].triggerLabel,'首行内容开始输入');
  assert.equal(subtle[0].offsetSeconds,.08);
});

test('caption profiles deliberately disable automatic sound while keeping manual selection possible', () => {
  const sound = {id:'caption-pop',label:'Pop',url:'/input/sfx/pop.wav',mimeType:'audio/wav',tags:['ui','pop'],category:'custom',usage:''};
  for (const componentId of ['SrtSemanticCaptions','SrtCueText']) {
    assert.equal(profiles.getComponentSoundProfile(componentId).autoEnabled,false);
    assert.deepEqual(selection.recommendComponentSounds({...owner,componentId},[sound]),[]);
  }
});
