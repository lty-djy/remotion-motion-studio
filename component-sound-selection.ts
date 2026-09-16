import type { MotionInstance, ResourceTrack } from "./local-protocol";
import { bindComponentSound } from "./component-sound-binding";
import {
  getComponentSoundProfile,
  type ComponentSoundDensity,
} from "./component-sound-profiles";

export type SoundChoice = {
  id: string;
  label: string;
  url: string;
  mimeType: string;
  tags: string[];
  usage: string;
  category: string;
  durationSeconds?: number;
  available?: boolean;
  unavailableReason?: string;
};

export type SoundMode = "none" | "auto" | "manual";

export type ComponentSoundRecommendation = {
  choice: SoundChoice;
  score: number;
  matched: string[];
  reason: string;
  triggerLabel: string;
  offsetSeconds: number;
  density: ComponentSoundDensity;
};

const densityScore = (
  sound: SoundChoice,
  text: string,
  density: ComponentSoundDensity,
) => {
  const duration = sound.durationSeconds ?? 1;
  const subtleTerms = [
    "soft",
    "light",
    "gentle",
    "short",
    "quick",
    "click",
    "tick",
    "pop",
    "dry",
  ];
  const emphaticTerms = [
    "hard",
    "heavy",
    "big",
    "powerful",
    "deep",
    "bass",
    "cinematic",
    "punch",
    "impact",
  ];
  const subtleHits = subtleTerms.filter((term) => text.includes(term)).length;
  const emphaticHits = emphaticTerms.filter((term) => text.includes(term)).length;
  if (density === "subtle") {
    return (
      subtleHits * 8 -
      emphaticHits * 7 +
      (duration <= 1.2 ? 8 : duration > 3 ? -15 : 0)
    );
  }
  if (density === "emphatic") {
    return (
      emphaticHits * 8 -
      subtleHits * 2 +
      (duration >= 0.45 && duration <= 3.5 ? 5 : duration > 5 ? -10 : 0)
    );
  }
  return duration <= 2.8 ? 4 : duration > 5 ? -8 : 0;
};

export function recommendComponentSoundDetails(
  owner: MotionInstance,
  library: SoundChoice[],
  density: ComponentSoundDensity =
    owner.soundDensity ??
    getComponentSoundProfile(owner.componentId).defaultDensity,
): ComponentSoundRecommendation[] {
  const profile = getComponentSoundProfile(owner.componentId);
  if (!profile.autoEnabled) return [];
  return library
    .filter((sound) => sound.available !== false)
    .map((sound) => {
      const tags = sound.tags ?? [];
      const text = [
        sound.id,
        sound.label,
        sound.category,
        sound.usage,
        ...tags,
      ]
        .join(" ")
        .toLowerCase();
      const matchedTags = profile.primaryTags.filter((tag) =>
        tags.some((value) => value.toLowerCase() === tag),
      );
      const matchedKeywords = profile.keywords.filter((term) =>
        text.includes(term),
      );
      const avoided = profile.avoidKeywords.filter((term) =>
        text.includes(term),
      );
      const familyScore = matchedTags.reduce(
        (total, tag) =>
          total + 80 - profile.primaryTags.indexOf(tag) * 8,
        0,
      );
      const keywordScore = matchedKeywords.reduce(
        (total, term) =>
          total + 28 - Math.min(20, profile.keywords.indexOf(term) * 2),
        0,
      );
      const score =
        familyScore +
        keywordScore +
        densityScore(sound, text, density) -
        avoided.length * 35;
      const matched = [...new Set([...matchedTags, ...matchedKeywords])];
      return {
        choice: sound,
        score,
        matched,
        reason: `${profile.reason}${
          matched.length
            ? ` 当前素材命中 ${matched.slice(0, 3).join(" / ")}。`
            : ""
        }`,
        triggerLabel: profile.trigger.label,
        offsetSeconds: profile.trigger.offsetSeconds,
        density,
      };
    })
    .filter(
      (item) =>
        item.matched.length > 0 &&
        item.score > 0 &&
        (!profile.requireKeywordMatch ||
          profile.keywords.some((term) => item.matched.includes(term))),
    )
    .sort(
      (a, b) =>
        b.score - a.score || a.choice.id.localeCompare(b.choice.id),
    );
}

export function recommendComponentSounds(
  owner: MotionInstance,
  library: SoundChoice[],
  density?: ComponentSoundDensity,
) {
  return recommendComponentSoundDetails(owner, library, density).map(
    (item) => item.choice,
  );
}

/** 替换当前入场音，不追加重复片段；资源 ID 是唯一资源引用。 */
export function selectComponentSound(
  owner: MotionInstance,
  tracks: ResourceTrack[],
  choice: SoundChoice,
  fps: number,
  createId: () => string,
  defaults: { offsetFrames?: number; volume?: number } = {},
) {
  const existing = tracks.find(
    (track) =>
      track.kind === "sfx" &&
      track.soundBinding?.instanceId === owner.id,
  );
  const id = existing?.id ?? createId();
  const sourceFrames = Math.max(
    3,
    Math.round((choice.durationSeconds ?? 1) * fps),
  );
  const track: ResourceTrack = bindComponentSound(
    {
      id,
      laneId: existing?.laneId ?? id,
      trackOrder:
        existing?.trackOrder ??
        Math.min(
          0,
          ...tracks.map((item) => item.trackOrder),
          owner.trackOrder,
        ) -
          1,
      kind: "sfx",
      resourceId: choice.id,
      name: choice.label,
      url: choice.url,
      mimeType: choice.mimeType || "audio/mpeg",
      sourceStartFrame: 0,
      sourceDurationInFrames: sourceFrames,
      durationInFrames: sourceFrames,
      startFrame: owner.startFrame,
      visible: true,
      muted: false,
      volume: existing?.volume ?? defaults.volume ?? 0.55,
      voiceDucking: existing?.voiceDucking ?? 0,
      position: {
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        scale: 1,
        zIndex: 0,
      },
      sourceIntentId: owner.sourceIntentId,
      sourceExpressionId: owner.sourceExpressionId,
      arrangementBatchId: owner.arrangementBatchId,
      arrangementBatchName: owner.arrangementBatchName,
    },
    owner,
    existing?.soundBinding?.offsetFrames ??
      defaults.offsetFrames ??
      0,
  );
  return existing
    ? tracks.map((item) => (item.id === existing.id ? track : item))
    : [...tracks, track];
}
