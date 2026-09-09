import assert from 'node:assert/strict';
import { build } from 'esbuild';
const compiled = await build({ entryPoints: ['arrangement-lanes.ts'], bundle: true, write: false, format: 'esm', platform: 'node' });
const { assignArrangementLanes } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
let sequence = 0;
const clip = (id, startFrame, durationInFrames, kind = 'motion') => ({ id, laneId: 'imported-shared', startFrame, durationInFrames, kind });
const input = [clip('chapter', 0, 300), clip('later', 60, 30), clip('first', 0, 60), clip('overlap', 30, 60), clip('captions', 0, 300), clip('sound', 0, 60, 'sfx')];
const before = JSON.stringify(input);
const allocate = () => assignArrangementLanes(input, c => c.kind, () => `lane-${++sequence}`, c => ['chapter', 'captions'].includes(c.id));
const output = allocate();
assert.equal(JSON.stringify(input), before);
assert.deepEqual(output.map(({ laneId, ...rest }) => rest), input.map(({ laneId, ...rest }) => rest));
assert.equal(output[1].laneId, output[2].laneId, 'touching intervals reuse a lane');
for (let i = 0; i < output.length; i++) {
  for (const other of output.slice(i + 1)) {
    const current = output[i];
    if (current.laneId === other.laneId) {
      assert.equal(current.kind, other.kind);
      assert.ok(current.startFrame + current.durationInFrames <= other.startFrame || other.startFrame + other.durationInFrames <= current.startFrame);
    }
  }
}
const second = allocate();
assert.ok(second.every(c => !output.some(previous => previous.laneId === c.laneId)), 'batches have separate lanes');
assert.deepEqual(assignArrangementLanes([], () => '', () => ''), []);
console.log('PASS: overlapping clips, adjacent reuse, dedicated tracks, resource types, batch isolation, unchanged timing and input.');
