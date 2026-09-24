import React from "react";
import {
  camMoveGeom,
  normalizeFocusCamKeyframes,
  sampleFocusCamKeyframes,
  upsertFocusCamKeyframe,
  type FocusCamKeyframe,
} from "./effects/FocusCamMove";

type Props = {
  props: Record<string, unknown>;
  durationInFrames: number;
  currentLocalFrame: number;
  fps: number;
  ratio: "landscape" | "portrait";
  onChange: (keyframes: FocusCamKeyframe[]) => void;
  onSeek: (localFrame: number) => void;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const FocusCamKeyframeEditor: React.FC<Props> = ({
  props,
  durationInFrames,
  currentLocalFrame,
  fps,
  ratio,
  onChange,
  onSeek,
}) => {
  const endFrame = Math.max(0, Math.round(durationInFrames) - 1);
  const playheadInside = currentLocalFrame >= 0 && currentLocalFrame < durationInFrames;
  const frame = clamp(Math.round(currentLocalFrame), 0, endFrame);
  const keyframes = normalizeFocusCamKeyframes(props.camKeyframes, durationInFrames);
  const base = camMoveGeom(
    {
      side: props.side as string | undefined,
      camDX: props.camDX as number | undefined,
      camDY: props.camDY as number | undefined,
      camW: props.camW as number | undefined,
      camH: props.camH as number | undefined,
      camR: props.cornerRadius as number | undefined,
    },
    ratio,
  );
  const active = playheadInside ? keyframes.find((keyframe) => keyframe.frame === frame) : undefined;
  const displayed = active ?? sampleFocusCamKeyframes(keyframes, base, frame);

  const addAtPlayhead = () => {
    const seed = keyframes.length === 0 && frame > 0
      ? [{ frame: 0, ...base }]
      : keyframes;
    onChange(upsertFocusCamKeyframe(seed, { ...displayed, frame }, durationInFrames));
  };

  const updateField = (field: "x" | "y" | "w" | "h" | "r", value: number) => {
    if (!active || !Number.isFinite(value)) return;
    const next = field === "w" || field === "h"
      ? Math.max(1, Math.round(value))
      : field === "r"
        ? clamp(Math.round(value), 0, 1000)
        : Math.round(value);
    onChange(upsertFocusCamKeyframe(
      keyframes,
      { ...active, [field]: next },
      durationInFrames,
    ));
  };

  return (
    <section className="reference-inspector-section focus-cam-keyframe-editor">
      <div className="reference-section-title">
        <strong>画框关键帧</strong><small>FRAME KEYFRAMES</small>
      </div>
      <div className="dynamic-prop-fields">
        <p className="focus-cam-keyframe-hint">
          预览中移动、缩放或调圆角会自动在播放头打关键帧；时间线菱形可拖动改时间、右键单独删除。
        </p>
        <div className="focus-cam-keyframe-actions">
          <button type="button" onClick={addAtPlayhead} disabled={Boolean(active) || !playheadInside}>
            {!playheadInside ? "播放头不在片段内" : active ? `当前帧已有关键帧 · ${frame}` : `在当前帧添加 · ${frame}`}
          </button>
          {keyframes.length > 0 ? (
            <button type="button" onClick={() => onChange([])} title="清除本组件所有画框关键帧，恢复基础画框">
              清除全部
            </button>
          ) : null}
        </div>
        {keyframes.length > 0 ? (
          <div className="focus-cam-keyframe-list" aria-label="画框关键帧列表">
            {keyframes.map((keyframe, index) => (
              <button
                type="button"
                key={keyframe.frame}
                className={playheadInside && keyframe.frame === frame ? "active" : ""}
                onClick={() => onSeek(keyframe.frame)}
                title={`第 ${keyframe.frame} 帧，${(keyframe.frame / fps).toFixed(2)} 秒`}
              >
                ◆ {index + 1} · {(keyframe.frame / fps).toFixed(2)}s
              </button>
            ))}
          </div>
        ) : (
          <p className="focus-cam-keyframe-hint">尚无关键帧，沿用原来的固定画框。</p>
        )}
        {active ? (
          <>
            <label className="focus-cam-keyframe-field">
              <span>时间（相对帧）</span>
              <input
                type="number"
                min={0}
                max={endFrame}
                step={1}
                key={`time-${active.frame}`}
                defaultValue={active.frame}
                onBlur={(event) => {
                  if (event.currentTarget.value.trim() === "") return;
                  const nextFrame = clamp(Math.round(Number(event.currentTarget.value)), 0, endFrame);
                  if (!Number.isFinite(nextFrame) || nextFrame === active.frame) return;
                  onChange(normalizeFocusCamKeyframes(
                    [...keyframes.filter((item) => item.frame !== active.frame), { ...active, frame: nextFrame }],
                    durationInFrames,
                  ));
                  onSeek(nextFrame);
                }}
              />
            </label>
            <div className="focus-cam-keyframe-grid">
              {([
                ["x", "水平位置 X"],
                ["y", "垂直位置 Y"],
                ["w", "画框宽"],
                ["h", "画框高"],
                ["r", "圆角"],
              ] as const).map(([field, label]) => (
                <label className="focus-cam-keyframe-field" key={field}>
                  <span>{label}</span>
                  <input
                    type="number"
                    step={1}
                    min={field === "w" || field === "h" || field === "r" ? 0 : undefined}
                    max={field === "r" ? 1000 : undefined}
                    key={`${field}-${active.frame}-${active[field]}`}
                    defaultValue={Math.round(active[field])}
                    onBlur={(event) => {
                      if (event.currentTarget.value.trim() === "") return;
                      updateField(field, Number(event.currentTarget.value));
                    }}
                  />
                </label>
              ))}
            </div>
            <button
              type="button"
              className="focus-cam-keyframe-delete"
              onClick={() => onChange(keyframes.filter((item) => item.frame !== active.frame))}
            >
              删除当前关键帧
            </button>
          </>
        ) : !playheadInside ? (
          <p className="focus-cam-keyframe-hint">将播放头移入当前效果片段，或点击上方关键帧跳转。</p>
        ) : keyframes.length > 0 ? (
          <p className="focus-cam-keyframe-hint">当前是关键帧之间的插值画面。添加关键帧后可编辑这里的画框。</p>
        ) : null}
      </div>
    </section>
  );
};
