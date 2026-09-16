import type { ComponentSoundBinding, MotionInstance, ResourceTrack } from "./local-protocol";
import { getComponentSoundCues } from "./component-sound-cues";

export type ComponentSoundCueBinding = {
  id: string;
  index: number;
  label: string;
  fps: number;
  nudgeFrames?: number;
};

export function normalizeSoundBinding(value: unknown, kind: string): ComponentSoundBinding | undefined {
  if (kind !== "sfx" || !value || typeof value !== "object") return undefined;
  const binding = value as Partial<ComponentSoundBinding>;
  if (typeof binding.instanceId !== "string" || !binding.instanceId.trim() ||
      binding.instanceId.length > 160 || typeof binding.offsetFrames !== "number" ||
      !Number.isSafeInteger(binding.offsetFrames)) return undefined;
  const normalized: ComponentSoundBinding = {
    instanceId: binding.instanceId,
    offsetFrames: binding.offsetFrames,
  };
  if (
    typeof binding.cueId === "string" &&
    binding.cueId.trim() &&
    binding.cueId.length <= 80 &&
    typeof binding.cueIndex === "number" &&
    Number.isSafeInteger(binding.cueIndex) &&
    binding.cueIndex >= 0 &&
    typeof binding.cueLabel === "string" &&
    binding.cueLabel.length <= 160 &&
    typeof binding.cueFps === "number" &&
    Number.isFinite(binding.cueFps) &&
    binding.cueFps > 0 &&
    binding.cueFps <= 240 &&
    typeof binding.nudgeFrames === "number" &&
    Number.isSafeInteger(binding.nudgeFrames)
  ) {
    Object.assign(normalized, {
      cueId: binding.cueId,
      cueIndex: binding.cueIndex,
      cueLabel: binding.cueLabel,
      cueFps: binding.cueFps,
      nudgeFrames: binding.nudgeFrames,
    });
  }
  return normalized;
}

const sameBinding = (
  left: ComponentSoundBinding,
  right: ComponentSoundBinding,
) =>
  left.instanceId === right.instanceId &&
  left.offsetFrames === right.offsetFrames &&
  left.cueId === right.cueId &&
  left.cueIndex === right.cueIndex &&
  left.cueLabel === right.cueLabel &&
  left.cueFps === right.cueFps &&
  left.nudgeFrames === right.nudgeFrames;

const nextCueTrackId = (
  templateId: string,
  cueId: string,
  usedIds: Set<string>,
) => {
  const base = `${templateId}--cue-${cueId}`;
  let candidate = base;
  let suffix = 2;
  while (usedIds.has(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  usedIds.add(candidate);
  return candidate;
};

/** 同步绑定时间；多步骤 cue 会随步骤数量自动增删，但保留音量、裁剪和资源。 */
export function syncComponentSounds(
  tracks: ResourceTrack[], instances: MotionInstance[], previousInstances: MotionInstance[] = [],
): ResourceTrack[] {
  const owners = new Map(instances.map(instance => [instance.id, instance]));
  const previousIds = new Set(previousInstances.map(instance => instance.id));
  const cueTemplates = new Map<string, ResourceTrack>();
  let changed = false;
  const result = tracks.flatMap(track => {
    const binding = normalizeSoundBinding(track.soundBinding, track.kind);
    if (!binding) return [track];
    const owner = owners.get(binding.instanceId);
    // 恢复项目时资源可能先于组件加载，不能把尚未加载的组件当成已删除。
    if (!owner) {
      if (previousIds.has(binding.instanceId)) { changed = true; return []; }
      return [track];
    }
    let nextBinding = binding;
    if (binding.cueId && binding.cueFps) {
      const cues = getComponentSoundCues(owner, binding.cueFps);
      const cue = cues.find(item => item.id === binding.cueId);
      if (cues.length && !cue) {
        changed = true;
        return [];
      }
      if (cue) {
        nextBinding = {
          ...binding,
          cueIndex: cue.index,
          cueLabel: cue.label,
          offsetFrames: cue.offsetFrames + (binding.nudgeFrames ?? 0),
        };
      }
    }
    const startFrame = Math.max(0, owner.startFrame + nextBinding.offsetFrames);
    const bindingChanged = !sameBinding(binding, nextBinding);
    const nextTrack =
      startFrame === track.startFrame && !bindingChanged
        ? track
        : { ...track, soundBinding: nextBinding, startFrame };
    if (nextBinding.cueId && nextBinding.cueFps && !cueTemplates.has(owner.id)) {
      cueTemplates.set(owner.id, nextTrack);
    }
    if (nextTrack === track) return [track];
    changed = true;
    return [nextTrack];
  });

  const usedIds = new Set(result.map(track => track.id));
  for (const [ownerId, template] of cueTemplates) {
    const owner = owners.get(ownerId);
    const binding = normalizeSoundBinding(template.soundBinding, template.kind);
    if (!owner || !binding?.cueFps) continue;
    const cues = getComponentSoundCues(owner, binding.cueFps);
    const existingCueIds = new Set(
      result
        .filter(track => track.soundBinding?.instanceId === ownerId)
        .map(track => track.soundBinding?.cueId)
        .filter((cueId): cueId is string => Boolean(cueId)),
    );
    for (const cue of cues) {
      if (existingCueIds.has(cue.id)) continue;
      const id = nextCueTrackId(template.id, cue.id, usedIds);
      const nudgeFrames = binding.nudgeFrames ?? 0;
      result.push(
        bindComponentSound(
          {
            ...template,
            id,
            laneId: id,
            trackOrder: template.trackOrder - cue.index,
            position: { ...template.position },
          },
          owner,
          cue.offsetFrames + nudgeFrames,
          {
            id: cue.id,
            index: cue.index,
            label: cue.label,
            fps: binding.cueFps,
            nudgeFrames,
          },
        ),
      );
      changed = true;
    }
  }
  return changed ? result : tracks;
}

/** 第一阶段的绑定入口，供后续右侧选择器调用；不猜测已有独立音效的归属。 */
export function bindComponentSound(
  track: ResourceTrack,
  owner: MotionInstance,
  offsetFrames = 0,
  cue?: ComponentSoundCueBinding,
): ResourceTrack {
  const soundBinding = normalizeSoundBinding({
    instanceId: owner.id,
    offsetFrames,
    ...(cue
      ? {
          cueId: cue.id,
          cueIndex: cue.index,
          cueLabel: cue.label,
          cueFps: cue.fps,
          nudgeFrames: cue.nudgeFrames ?? 0,
        }
      : {}),
  }, track.kind);
  if (!soundBinding) throw new Error("仅可将音效绑定到有效组件，时间偏移必须为整数帧");
  return { ...track, soundBinding, startFrame: Math.max(0, owner.startFrame + offsetFrames) };
}

export function detachComponentSound(track: ResourceTrack): ResourceTrack {
  const { soundBinding: _binding, ...independent } = track;
  return independent;
}

export function duplicateComponentSounds(
  tracks: ResourceTrack[], copies: Map<string, MotionInstance>, createId: () => string,
): ResourceTrack[] {
  return tracks.flatMap(track => {
    const binding = normalizeSoundBinding(track.soundBinding, track.kind);
    const owner = binding && copies.get(binding.instanceId);
    if (!binding || !owner) return [];
    return [bindComponentSound(
      { ...track, id: createId(), position: { ...track.position } },
      owner,
      binding.offsetFrames,
      binding.cueId && binding.cueIndex !== undefined && binding.cueLabel && binding.cueFps
        ? {
            id: binding.cueId,
            index: binding.cueIndex,
            label: binding.cueLabel,
            fps: binding.cueFps,
            nudgeFrames: binding.nudgeFrames ?? 0,
          }
        : undefined,
    )];
  });
}

/** 组件静音/隐藏不覆盖音效自身的开关，恢复组件后保留原来的音效设置。 */
export function isComponentSoundMuted(track: ResourceTrack, instances: MotionInstance[]): boolean {
  if (track.muted === true) return true;
  const binding = normalizeSoundBinding(track.soundBinding, track.kind);
  if (!binding) return false;
  const owner = instances.find(instance => instance.id === binding.instanceId);
  return !owner || owner.muted === true || owner.visible === false;
}
