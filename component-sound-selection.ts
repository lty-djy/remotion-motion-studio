import type { MotionInstance, ResourceTrack } from "./local-protocol";
import { bindComponentSound } from "./component-sound-binding";

export type SoundChoice = {
  id: string; label: string; url: string; mimeType: string;
  tags: string[]; usage: string; category: string; durationSeconds?: number;
};
export type SoundMode = "none" | "auto" | "manual";

export function recommendComponentSounds(owner: MotionInstance, library: SoundChoice[]) {
  const type = owner.componentId;
  if (/Srt|Caption|Background|Ambient/.test(type)) return [];
  const terms = /Terminal|Code|BrowserRepair/.test(type) ? ['type', 'typing', 'keyboard', '打字', '按键']
    : /Stamp|Elimination|Warning|Risk/.test(type) ? ['impact', 'hit', 'alert', '撞击', '警示', '重击']
    : /Metric|Progress|Meter|Hourly|Milestone|Heat/.test(type) ? ['counter', 'rise', 'tick', '计数', '上升']
    : /Focus|CamMove|Expedition/.test(type) ? ['whoosh', 'woosh', 'transition', '转场', '掠过']
    : /Material|Poster|Media|Recording/.test(type) ? ['shutter', 'paper', 'camera', '快门', '纸张']
    : /Step|List|Checklist|Workflow/.test(type) ? ['click', 'tick', 'pop', '点击', '提示']
    : /Chapter|Title/.test(type) ? ['chime', 'whoosh-soft', '翻页', '轻转场']
    : ['pop', 'click', 'soft', '弹出', '轻点'];
  return library.map(sound => {
    const text = [sound.id, sound.label, sound.category, sound.usage, ...sound.tags].join(' ').toLowerCase();
    const score = terms.reduce((total, term, index) => total + (text.includes(term) ? terms.length - index : 0), 0);
    return { sound, score };
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score || a.sound.id.localeCompare(b.sound.id))
    .map(item => item.sound);
}

/** 替换当前入场音，不追加重复片段；资源 ID 是唯一资源引用。 */
export function selectComponentSound(owner: MotionInstance, tracks: ResourceTrack[], choice: SoundChoice, fps: number, createId: () => string) {
  const existing = tracks.find(track => track.kind === 'sfx' && track.soundBinding?.instanceId === owner.id);
  const id = existing?.id ?? createId();
  const sourceFrames = Math.max(3, Math.round((choice.durationSeconds ?? 1) * fps));
  const track: ResourceTrack = bindComponentSound({
    id, laneId: existing?.laneId ?? id,
    trackOrder: existing?.trackOrder ?? Math.min(0, ...tracks.map(item => item.trackOrder), owner.trackOrder) - 1,
    kind: 'sfx', resourceId: choice.id, name: choice.label, url: choice.url,
    mimeType: choice.mimeType || 'audio/mpeg', sourceStartFrame: 0,
    sourceDurationInFrames: sourceFrames, durationInFrames: sourceFrames, startFrame: owner.startFrame,
    visible: true, muted: false, volume: existing?.volume ?? .55, voiceDucking: existing?.voiceDucking ?? 0,
    position: { x: 0, y: 0, width: 1, height: 1, scale: 1, zIndex: 0 },
    sourceIntentId: owner.sourceIntentId, sourceExpressionId: owner.sourceExpressionId,
    arrangementBatchId: owner.arrangementBatchId, arrangementBatchName: owner.arrangementBatchName,
  }, owner, existing?.soundBinding?.offsetFrames ?? 0);
  return existing ? tracks.map(item => item.id === existing.id ? track : item) : [...tracks, track];
}
