import assert from 'node:assert/strict';
import { build } from 'esbuild';

const compiled = await build({
  entryPoints: ['local-timeline-logic.ts'],
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
});
const { packClipsIntoReusableLanes } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`
);

let sequence = 0;
const createLaneId = () => `lane-new-${++sequence}`;
const incomingClip = (id, startFrame, durationInFrames) => ({
  id,
  laneId: id,
  trackOrder: 0,
  startFrame,
  durationInFrames,
});
const laneClipsOf = (clips) => {
  const lanes = new Map();
  for (const clip of clips) {
    const list = lanes.get(clip.laneId);
    if (list) list.push(clip);
    else lanes.set(clip.laneId, [clip]);
  }
  return lanes;
};
const assertNoLaneOverlap = (clips, message) => {
  for (const laneClips of laneClipsOf(clips).values()) {
    const sorted = [...laneClips].sort((a, b) => a.startFrame - b.startFrame);
    for (let i = 0; i < sorted.length - 1; i += 1) {
      assert.ok(
        sorted[i].startFrame + sorted[i].durationInFrames <= sorted[i + 1].startFrame,
        `${message}: ${sorted[i].id} overlaps ${sorted[i + 1].id}`,
      );
    }
  }
};

// 场景 1：一条 TSX 自带的 9 个预设片段（时间基本串行），应压到少量轨道
const washoku = [
  incomingClip('hook', 0, 69),
  incomingClip('checklist', 69, 45),
  incomingClip('tray', 114, 120),
  incomingClip('ambience', 431, 50),
  incomingClip('petChief', 476, 60),
  incomingClip('anniversary', 620, 90),
  incomingClip('gacha', 738, 60),
  incomingClip('perks', 818, 60),
  incomingClip('cta', 886, 60),
];
const packedWashoku = packClipsIntoReusableLanes({
  incoming: washoku,
  existing: [],
  isReusableLane: () => true,
  createLaneId,
  newLaneBaseOrder: -washoku.length,
});
// 9 个预设里只有 ambience(431-481) 与 petChief(476-536) 时间冲突，
// 其余按空闲区间合并 => 9 条轨道压到 2 条
assert.equal(laneClipsOf(packedWashoku).size, 2, '非重叠预设应共用轨道');
assertNoLaneOverlap(packedWashoku, '场景 1');
assert.deepEqual(
  packedWashoku.map(({ laneId, trackOrder, ...rest }) => rest),
  washoku.map(({ laneId, trackOrder, ...rest }) => rest),
  '合轨不得改动时间与内容',
);

// 场景 2：时间真冲突的片段仍必须各自一条轨道
const overlapping = [
  incomingClip('a', 0, 60),
  incomingClip('b', 30, 60),
  incomingClip('c', 45, 30),
];
const packedOverlapping = packClipsIntoReusableLanes({
  incoming: overlapping,
  existing: [],
  isReusableLane: () => true,
  createLaneId,
  newLaneBaseOrder: -overlapping.length,
});
assert.equal(laneClipsOf(packedOverlapping).size, 3, '重叠片段各自一条轨道');
assertNoLaneOverlap(packedOverlapping, '场景 2');

// 场景 3：追加到已有时间轴，空闲区间够位置就并入既有轨道
const existing = [
  { id: 'old-1', laneId: 'lane-motion-old', trackOrder: 3, startFrame: 0, durationInFrames: 60 },
  { id: 'old-2', laneId: 'lane-motion-old', trackOrder: 3, startFrame: 150, durationInFrames: 60 },
  { id: 'caption', laneId: 'lane-caption', trackOrder: 0, startFrame: 0, durationInFrames: 300 },
];
const appendIncoming = [
  incomingClip('new-1', 60, 60), // 落入 60-150 空窗
  incomingClip('new-2', 120, 30), // 紧接 new-1，仍在同一空窗
  incomingClip('new-3', 60, 30), // 与 new-1 时间冲突，只能新建轨道
];
const packedAppend = packClipsIntoReusableLanes({
  incoming: appendIncoming,
  existing,
  isReusableLane: (laneClips) =>
    laneClips.every((clip) => clip.laneId !== 'lane-caption'),
  createLaneId,
  newLaneBaseOrder: -appendIncoming.length,
});
const byId = new Map(packedAppend.map((clip) => [clip.id, clip]));
assert.equal(byId.get('new-1').laneId, 'lane-motion-old', '60-150 的空窗应并入既有轨道');
assert.equal(byId.get('new-1').trackOrder, 3, '并入既有轨道沿用该轨道层级');
assert.equal(byId.get('new-2').laneId, 'lane-motion-old', '同一空窗内的后续片段继续并入');
assert.notEqual(byId.get('new-3').laneId, 'lane-motion-old', '空窗被占满才新建轨道');
assert.notEqual(byId.get('new-3').laneId, 'lane-caption', '字幕轨不承接导入片段');
assert.ok(byId.get('new-3').laneId.startsWith('lane-new-'), '新建轨道使用本轮 createLaneId');
assert.ok(byId.get('new-3').trackOrder < 3, '新建轨道层级在既有轨道之上');
assertNoLaneOverlap(
  [...existing, ...packedAppend.filter((clip) => clip.laneId !== 'lane-caption')],
  '场景 3',
);

// 场景 4：空输入与不修改传入数组
const before = JSON.stringify(washoku);
assert.deepEqual(
  packClipsIntoReusableLanes({
    incoming: [],
    existing,
    isReusableLane: () => true,
    createLaneId,
    newLaneBaseOrder: 0,
  }),
  [],
);
assert.equal(JSON.stringify(washoku), before, '不得原地修改传入片段');

console.log('PASS: 导入片段按空闲区间合轨，重叠才新建轨道，时间与既有片段均未被改动。');
