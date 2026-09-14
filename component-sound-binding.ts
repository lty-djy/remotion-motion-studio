import type { ComponentSoundBinding, MotionInstance, ResourceTrack } from "./local-protocol";

export function normalizeSoundBinding(value: unknown, kind: string): ComponentSoundBinding | undefined {
  if (kind !== "sfx" || !value || typeof value !== "object") return undefined;
  const binding = value as Partial<ComponentSoundBinding>;
  if (typeof binding.instanceId !== "string" || !binding.instanceId.trim() ||
      binding.instanceId.length > 160 || typeof binding.offsetFrames !== "number" ||
      !Number.isSafeInteger(binding.offsetFrames)) return undefined;
  return { instanceId: binding.instanceId, offsetFrames: binding.offsetFrames };
}

/** 只改变绑定音效的时间；不改变轨道顺序、音量、原音频裁剪或长度。 */
export function syncComponentSounds(
  tracks: ResourceTrack[], instances: MotionInstance[], previousInstances: MotionInstance[] = [],
): ResourceTrack[] {
  const owners = new Map(instances.map(instance => [instance.id, instance]));
  const previousIds = new Set(previousInstances.map(instance => instance.id));
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
    const startFrame = Math.max(0, owner.startFrame + binding.offsetFrames);
    if (startFrame === track.startFrame) return [track];
    changed = true;
    return [{ ...track, startFrame }];
  });
  return changed ? result : tracks;
}

/** 第一阶段的绑定入口，供后续右侧选择器调用；不猜测已有独立音效的归属。 */
export function bindComponentSound(track: ResourceTrack, owner: MotionInstance, offsetFrames = 0): ResourceTrack {
  const soundBinding = normalizeSoundBinding({ instanceId: owner.id, offsetFrames }, track.kind);
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
    return [bindComponentSound({ ...track, id: createId(), position: { ...track.position } }, owner, binding.offsetFrames)];
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
