/** Pack non-overlapping clips without changing their timing or render order. */
export const assignArrangementLanes = <T extends {
  laneId: string;
  startFrame: number;
  durationInFrames: number;
}>(
  clips: T[],
  groupFor: (clip: T) => string,
  createLane: () => string,
  isDedicated: (clip: T) => boolean = () => false,
): T[] => {
  const groups = new Map<string, { id: string; end: number }[]>();
  const assignments = new Map<T, string>();
  for (const clip of [...clips].sort((a, b) => a.startFrame - b.startFrame)) {
    if (isDedicated(clip)) {
      assignments.set(clip, createLane());
      continue;
    }
    const group = groupFor(clip);
    const lanes = groups.get(group) ?? [];
    let lane = lanes.find((candidate) => candidate.end <= clip.startFrame);
    if (!lane) {
      lane = { id: createLane(), end: 0 };
      lanes.push(lane);
      groups.set(group, lanes);
    }
    lane.end = clip.startFrame + clip.durationInFrames;
    assignments.set(clip, lane.id);
  }
  return clips.map((clip) => ({ ...clip, laneId: assignments.get(clip)! }));
};
