import React, { useEffect, useMemo, useRef, useState } from "react";
import type { MotionInstance, ResourceTrack } from "./local-protocol";
import {
  recommendComponentSoundDetails,
  type SoundChoice,
  type SoundMode,
} from "./component-sound-selection";
import {
  COMPONENT_SOUND_DENSITY_LABELS,
  getComponentSoundProfile,
  type ComponentSoundDensity,
} from "./component-sound-profiles";
import {
  getComponentSoundCues,
  type ComponentSoundCue,
} from "./component-sound-cues";
import "./component-sound-panel.css";

export type SoundPanelChange = {
  mode?: SoundMode;
  density?: ComponentSoundDensity;
  choice?: SoundChoice;
  volume?: number;
  offsetFrames?: number;
  cues?: ComponentSoundCue[];
  cueNudgeFrames?: number;
};

export function ComponentSoundPanel({
  owner,
  tracks,
  library,
  fps,
  soundEnabled,
  onChange,
  onRefreshLibrary,
}: {
  owner: MotionInstance;
  tracks: ResourceTrack[];
  library: SoundChoice[];
  fps: number;
  soundEnabled: boolean;
  onChange: (change: SoundPanelChange) => void;
  onRefreshLibrary: () => Promise<SoundChoice[]>;
}) {
  const [search, setSearch] = useState("");
  const [playing, setPlaying] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(true);
  const audio = useRef<HTMLAudioElement>(null);
  const soundTracks = tracks
    .filter(
      (item) =>
        item.kind === "sfx" &&
        item.soundBinding?.instanceId === owner.id,
    )
    .sort(
      (left, right) =>
        (left.soundBinding?.cueIndex ?? 0) -
        (right.soundBinding?.cueIndex ?? 0),
    );
  const track = soundTracks[0];
  const soundCues = useMemo(
    () => getComponentSoundCues(owner, fps),
    [owner.componentId, owner.props, fps],
  );
  const cueNudgeFrames = track?.soundBinding?.nudgeFrames ?? 0;
  const usesStepCues = soundCues.length > 0;
  const mode = owner.soundMode ?? (track ? "manual" : "none");
  const profile = getComponentSoundProfile(owner.componentId);
  const density = owner.soundDensity ?? profile.defaultDensity;
  const selected = library.find((item) => item.id === track?.resourceId);
  const recommendationDetails = useMemo(
    () => recommendComponentSoundDetails(owner, library, density),
    [owner.componentId, density, library],
  );
  const selectedRecommendation = recommendationDetails.find(
    (item) => item.choice.id === track?.resourceId,
  );
  const selectedUnavailable = Boolean(
    track && (!selected || selected.available === false),
  );
  const choices = library.filter(
    (item) =>
      item.available !== false &&
      [
        item.label,
        item.id,
        item.category,
        item.usage,
        ...(item.tags ?? []),
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase().trim()),
  );

  useEffect(() => {
    const element = audio.current;
    return () => {
      element?.pause();
    };
  }, []);
  useEffect(() => {
    audio.current?.pause();
    setPlaying(false);
    setError("");
  }, [track?.resourceId, mode]);

  const applyRecommendation = (
    details: ReturnType<typeof recommendComponentSoundDetails>,
    nextDensity: ComponentSoundDensity,
  ) => {
    const index = details.findIndex(
      (item) => item.choice.id === track?.resourceId,
    );
    const recommended =
      details[index < 0 ? 0 : (index + 1) % details.length];
    onChange(
      recommended
        ? {
            mode: "auto",
            density: nextDensity,
            choice: recommended.choice,
            ...(usesStepCues
              ? {
                  cues: soundCues,
                  cueNudgeFrames: Math.round(
                    recommended.offsetSeconds * fps,
                  ),
                }
              : {
                  offsetFrames: Math.round(
                    recommended.offsetSeconds * fps,
                  ),
                }),
          }
        : { mode: "auto", density: nextDensity },
    );
    return recommended;
  };

  const recommend = async () => {
    setRefreshing(true);
    setError("");
    try {
      const latestLibrary = await onRefreshLibrary();
      const latestDetails = recommendComponentSoundDetails(
        owner,
        latestLibrary,
        density,
      );
      const recommended = applyRecommendation(latestDetails, density);
      if (!recommended) {
        setError(
          profile.autoEnabled
            ? "当前音效库没有符合该组件动作配置的音效，可切换手动选择。"
            : profile.reason,
        );
      }
    } catch {
      setError("刷新音效库失败，请稍后重试。");
    } finally {
      setRefreshing(false);
    }
  };

  const changeDensity = (nextDensity: ComponentSoundDensity) => {
    setError("");
    const nextDetails = recommendComponentSoundDetails(
      owner,
      library,
      nextDensity,
    );
    const recommended = applyRecommendation(nextDetails, nextDensity);
    if (!recommended) {
      setError("当前音效库没有符合此密度的推荐，已保留现有音效。");
    }
  };

  const refreshStatus = async () => {
    setRefreshing(true);
    setError("");
    try {
      await onRefreshLibrary();
    } catch {
      setError("刷新音效库失败，请稍后重试。");
    } finally {
      setRefreshing(false);
    }
  };

  const triggerOffset =
    usesStepCues && track
      ? cueNudgeFrames / fps
      : selectedRecommendation?.offsetSeconds ?? profile.trigger.offsetSeconds;
  const triggerOffsetText =
    triggerOffset === 0
      ? "0 秒"
      : triggerOffset < 0
        ? "-" + Math.abs(triggerOffset).toFixed(2) + " 秒"
        : "+" + triggerOffset.toFixed(2) + " 秒";
  const triggerText = usesStepCues
    ? soundCues.length + " 个步骤逐项触发 · 整体微调 " + triggerOffsetText
    : (selectedRecommendation?.triggerLabel ?? profile.trigger.label) +
      " · " +
      (triggerOffset === 0
        ? "与入场同步"
        : triggerOffset < 0
          ? "提前 " + Math.abs(triggerOffset).toFixed(2) + " 秒"
          : "入场后 " + triggerOffset.toFixed(2) + " 秒");

  return (
    <section
      className={"reference-inspector-section component-sound-panel" + (expanded ? "" : " collapsed")}
      aria-label="组件音效"
    >
      <div
        className="reference-section-title"
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={() => setExpanded((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setExpanded((current) => !current);
          }
        }}
      >
        <strong>组件音效</strong>
        <small>SOUND</small>
      </div>
      <div
        className="component-sound-modes"
        role="group"
        aria-label="音效模式"
      >
        {(
          [
            ["none", "无音效"],
            ["auto", "自动推荐"],
            ["manual", "手动选择"],
          ] as const
        ).map(([value, label]) => (
          <button
            type="button"
            key={value}
            aria-pressed={mode === value}
            disabled={refreshing}
            onClick={() =>
              value === "auto"
                ? void recommend()
                : onChange({ mode: value })
            }
          >
            {label}
          </button>
        ))}
      </div>
      {mode !== "none" && (
        <>
          {mode === "auto" && (
            <>
              <div
                className="component-sound-density"
                role="group"
                aria-label="自动推荐密度"
              >
                {(Object.entries(COMPONENT_SOUND_DENSITY_LABELS) as Array<
                  [ComponentSoundDensity, string]
                >).map(([value, label]) => (
                  <button
                    type="button"
                    key={value}
                    aria-pressed={density === value}
                    disabled={refreshing || !profile.autoEnabled}
                    onClick={() => changeDensity(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="component-sound-explanation">
                <dl>
                  <div>
                    <dt>声音角色</dt>
                    <dd>{profile.roleLabel}</dd>
                  </div>
                  <div>
                    <dt>推荐理由</dt>
                    <dd>
                      {selectedRecommendation?.reason ?? profile.reason}
                    </dd>
                  </div>
                  <div>
                    <dt>触发点</dt>
                    <dd>{triggerText}</dd>
                  </div>
                </dl>
                <button
                  type="button"
                  onClick={() => void recommend()}
                  disabled={refreshing}
                >
                  {refreshing ? "正在刷新…" : "换一个推荐"}
                </button>
              </div>
              {!recommendationDetails.length &&
                !selectedUnavailable && (
                  <p role="status">
                    {profile.autoEnabled
                      ? "当前音效库暂无符合动作配置的推荐，可切换手动选择。"
                      : "此组件默认不自动配音，可切换手动选择。"}
                  </p>
                )}
            </>
          )}
          {mode === "manual" && (
            <>
              <input
                aria-label="搜索组件音效"
                placeholder="搜索音效、标签或用途"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <select
                aria-label="选择组件音效"
                value={track?.resourceId ?? ""}
                onChange={(event) => {
                  const choice = library.find(
                    (item) => item.id === event.target.value,
                  );
                  if (choice) {
                    onChange({
                      mode: "manual",
                      choice,
                      ...(usesStepCues
                        ? {
                            cues: soundCues,
                            cueNudgeFrames,
                          }
                        : {}),
                    });
                  }
                }}
              >
                <option value="" disabled>
                  请选择音效
                </option>
                {track &&
                  !choices.some(
                    (item) => item.id === track.resourceId,
                  ) && (
                    <option value={track.resourceId}>
                      {selected?.label ?? track.name}
                      {selectedUnavailable
                        ? "（资源失效）"
                        : "（当前选择）"}
                    </option>
                  )}
                {choices.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
              {!choices.length && (
                <p role="status">
                  没有匹配音效，可换个关键词或到音效库导入。
                </p>
              )}
            </>
          )}
          {track && (
            <>
              <div className="component-sound-selected">
                <span title={selected?.label ?? track.name}>
                  {selected?.label ?? track.name}
                  {usesStepCues ? " × " + soundCues.length : ""}
                </span>
                <button
                  type="button"
                  disabled={selectedUnavailable}
                  onClick={async () => {
                    const element = audio.current;
                    if (
                      !element ||
                      !selected ||
                      selected.available === false
                    ) {
                      return;
                    }
                    if (playing) {
                      element.pause();
                      return;
                    }
                    element.src = selected.url;
                    element.volume =
                      track.volume * (1 - track.voiceDucking);
                    element.currentTime = 0;
                    setError("");
                    try {
                      await element.play();
                    } catch {
                      setPlaying(false);
                      setError("无法试听，请检查音效文件。");
                    }
                  }}
                >
                  {playing ? "停止试听" : "试听音效"}
                </button>
              </div>
              {usesStepCues && (
                <div className="component-sound-cues">
                  <div className="component-sound-cues-head">
                    <strong>逐步骤同步</strong>
                    <span>
                      {soundTracks.length}/{soundCues.length} 个音效片段
                    </span>
                  </div>
                  <ol>
                    {soundCues.map((cue) => (
                      <li key={cue.id}>
                        <span>{cue.label}</span>
                        <small>
                          {(
                            (cue.offsetFrames + cueNudgeFrames) /
                            fps
                          ).toFixed(2)}
                          秒
                        </small>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {selectedUnavailable && (
                <p
                  className="component-sound-unavailable"
                  role="alert"
                >
                  {selected?.unavailableReason ??
                    "音效已从音效库移除"}
                  。预览和导出会跳过它，请重新推荐、手动替换或选择无音效。
                  <button
                    type="button"
                    onClick={() => void refreshStatus()}
                    disabled={refreshing}
                  >
                    {refreshing
                      ? "正在刷新…"
                      : "刷新资源状态"}
                  </button>
                </p>
              )}
              <label>
                音量 <b>{Math.round(track.volume * 100)}%</b>
                <input
                  aria-label="组件音效音量"
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(track.volume * 100)}
                  onChange={(event) => {
                    const volume =
                      Number(event.target.value) / 100;
                    if (audio.current) {
                      audio.current.volume =
                        volume * (1 - track.voiceDucking);
                    }
                    onChange({ volume });
                  }}
                />
              </label>
              <label>
                {usesStepCues
                  ? "全部步骤时间微调（秒）"
                  : "相对入场时间（秒）"}
                <input
                  aria-label={
                    usesStepCues
                      ? "全部步骤音效时间微调"
                      : "组件音效时间偏移"
                  }
                  type="number"
                  step={1 / fps}
                  value={Number(
                    (
                      (usesStepCues
                        ? cueNudgeFrames
                        : track.soundBinding?.offsetFrames ?? 0) /
                      fps
                    ).toFixed(3),
                  )}
                  onChange={(event) => {
                    if (
                      event.target.value !== "" &&
                      Number.isFinite(event.target.valueAsNumber)
                    ) {
                      const nextFrames = Math.round(
                        event.target.valueAsNumber * fps,
                      );
                      onChange(
                        usesStepCues
                          ? {
                              cues: soundCues,
                              cueNudgeFrames: nextFrames,
                            }
                          : { offsetFrames: nextFrames },
                      );
                    }
                  }}
                />
              </label>
              <small className="component-sound-hint">
                {usesStepCues
                  ? "每个音效跟随对应步骤；负数整体提前，正数整体延后。"
                  : "负数提前，正数延后；音效跟随当前组件。"}
              </small>
              {soundTracks.some((item) => item.muted) && (
                <p role="status">一个或多个音效轨道已静音。</p>
              )}
            </>
          )}
          {!soundEnabled && (
            <p className="component-sound-hint">
              全局声音已关闭，时间线播放及导出将静音；仍可单独试听。
            </p>
          )}
        </>
      )}
      <audio
        ref={audio}
        aria-label="组件音效试听播放器"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onError={() => {
          setPlaying(false);
          setError("无法试听，请检查音效文件。");
        }}
      />
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
