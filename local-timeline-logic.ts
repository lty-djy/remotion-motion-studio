// 时间轴交互纯逻辑层：吸附对齐、跨轨道/新建轨道目标解析、同轨碰撞边界、
// 视频轨磁性让位、轨道层级归一。只做计算（resolveClipDropLane 仅读取轨道
// DOM 的位置），不持有 React 状态；local-main-v2.tsx 负责指针事件监听与
// state 写回。三类片段（动效 / 视频 / 资源）按结构类型参与，无需互相依赖。

export const TIMELINE_SNAP_THRESHOLD_PX = 8;

/** 三类时间轴片段（动效 / 视频 / 资源）共有的字段 */
export type TimelineClipBase = {
  id: string;
  laneId: string;
  trackOrder: number;
  startFrame: number;
  durationInFrames: number;
};

/** 拖拽组成员在拖拽开始时冻结的时间信息 */
export type TimelineDragMember = {
  laneId: string;
  startFrame: number;
  durationInFrames: number;
};

// ===== 吸附对齐 =====

export type SnapResult = { delta: number; guideFrame: number | null };

/**
 * 剪映式吸附：拖拽/裁剪时把边缘自动对齐到最近的参考边（片段边缘、播放头、
 * 区域出入点、0 帧）。阈值按屏幕像素换算成帧，保证不同缩放下手感一致。
 * 用投影后的边缘（起始边缘 + 原始位移）参与吸附，避免起始位置的贴邻参考边
 * 以 0 偏移锁死结果；距离并列时取拖动方向上的目标，贴近“吸向经过的边”的手感。
 */
export const applyTimelineSnap = (
  rawDelta: number,
  leadStartFrame: number,
  leadEndFrame: number,
  snapEnabled: boolean,
  snapTargets: number[],
  width: number,
  baseDurationInFrames: number,
): SnapResult => {
  if (!snapEnabled || snapTargets.length === 0) {
    return { delta: rawDelta, guideFrame: null };
  }
  const threshold = Math.max(
    1,
    Math.round(
      (TIMELINE_SNAP_THRESHOLD_PX * baseDurationInFrames) / Math.max(1, width),
    ),
  );
  let bestOffset: number | null = null;
  let bestFrame: number | null = null;
  for (const target of snapTargets) {
    for (const edge of [leadStartFrame, leadEndFrame]) {
      const offset = target - (edge + rawDelta);
      if (Math.abs(offset) > threshold) continue;
      if (
        bestOffset === null ||
        Math.abs(offset) < Math.abs(bestOffset) ||
        (Math.abs(offset) === Math.abs(bestOffset) &&
          ((rawDelta > 0 && offset > bestOffset) ||
            (rawDelta < 0 && offset < bestOffset)))
      ) {
        bestOffset = offset;
        bestFrame = target;
      }
    }
  }
  return bestOffset === null
    ? { delta: rawDelta, guideFrame: null }
    : { delta: rawDelta + bestOffset, guideFrame: bestFrame };
};

/** 吸附参考边集合：0 帧、播放头、区域出入点、所有未拖拽片段的首尾边缘 */
export const collectTimelineSnapTargets = ({
  currentFrame,
  regionInFrame,
  regionOutFrame,
  videoTracks,
  instances,
  resourceTracks,
  excludeIds,
}: {
  currentFrame: number;
  regionInFrame: number | null;
  regionOutFrame: number | null;
  videoTracks: TimelineClipBase[];
  instances: TimelineClipBase[];
  resourceTracks: TimelineClipBase[];
  excludeIds: ReadonlySet<string>;
}): number[] => {
  const targets = new Set<number>([0, currentFrame]);
  if (regionInFrame !== null) targets.add(regionInFrame);
  if (regionOutFrame !== null) targets.add(regionOutFrame);
  const addClipEdges = (clips: TimelineClipBase[]) => {
    for (const clip of clips) {
      if (excludeIds.has(clip.id)) continue;
      targets.add(clip.startFrame);
      targets.add(clip.startFrame + clip.durationInFrames);
    }
  };
  addClipEdges(videoTracks);
  addClipEdges(instances);
  addClipEdges(resourceTracks);
  return [...targets].sort((a, b) => a - b);
};

// ===== 跨轨道 / 新建轨道 =====

export type ClipDropTarget = {
  /** 目标轨道；为 null 表示需要在 newRefLaneId 旁新建轨道 */
  laneId: string | null;
  /** 新建轨道的参考轨道 */
  newRefLaneId: string | null;
  /** 新建轨道位于参考轨道上方还是下方 */
  newAbove: boolean;
};

/**
 * 剪映式跨轨道拖拽目标解析：
 * - 指针在某条同类型轨道内 → 并入该轨道（laneId）；
 * - 指针落在轨道堆外侧或两条同类轨道之间的空隙 → 新建轨道承接
 *   （laneId 为 null，newRefLaneId + newAbove 描述插入位置）；
 * - 指针压在异类型轨道上或远离轨道区域 → 保持原轨道不变。
 */
export const resolveClipDropLane = (
  clientY: number,
  laneKind: "video" | "motion" | "resource",
  resourceKind: string | null,
  sourceLaneId: string,
): ClipDropTarget => {
  const rows = document.querySelectorAll<HTMLElement>("[data-lane-id]");
  const compatible: Array<{ laneId: string; top: number; bottom: number }> = [];
  let insideIncompatible = false;
  rows.forEach((row) => {
    const rect = row.getBoundingClientRect();
    const sameKind =
      row.dataset.laneKind === laneKind &&
      (laneKind !== "resource" ||
        !resourceKind ||
        row.dataset.resourceKind === resourceKind);
    if (clientY >= rect.top && clientY <= rect.bottom && !sameKind) {
      insideIncompatible = true;
    }
    if (!sameKind) return;
    compatible.push({
      laneId: row.dataset.laneId ?? sourceLaneId,
      top: rect.top,
      bottom: rect.bottom,
    });
  });
  const keep: ClipDropTarget = {
    laneId: sourceLaneId,
    newRefLaneId: null,
    newAbove: false,
  };
  if (compatible.length === 0 || insideIncompatible) return keep;
  const inside = compatible.find(
    (lane) => clientY >= lane.top && clientY <= lane.bottom,
  );
  if (inside) return { laneId: inside.laneId, newRefLaneId: null, newAbove: false };
  // 只有指针仍在轨道区域内（上下各放大一行）才允许凭空新建轨道
  const tracks = document.querySelector(".timeline-tracks");
  if (tracks) {
    const area = tracks.getBoundingClientRect();
    if (clientY < area.top - 46 || clientY > area.bottom + 46) return keep;
  }
  const sorted = [...compatible].sort((a, b) => a.top - b.top);
  const topLane = sorted[0];
  const bottomLane = sorted[sorted.length - 1];
  if (clientY < topLane.top) {
    return { laneId: null, newRefLaneId: topLane.laneId, newAbove: true };
  }
  if (clientY > bottomLane.bottom) {
    return { laneId: null, newRefLaneId: bottomLane.laneId, newAbove: false };
  }
  for (let index = 0; index < sorted.length - 1; index += 1) {
    if (clientY > sorted[index].bottom && clientY < sorted[index + 1].top) {
      return {
        laneId: null,
        newRefLaneId: sorted[index].laneId,
        newAbove: false,
      };
    }
  }
  return keep;
};

/** 轨道内片段的最小 trackOrder（该轨道在轨道堆中的显示层级） */
export const findLaneMinOrder = (
  clips: TimelineClipBase[],
  laneId: string,
): number | null => {
  let minimum: number | null = null;
  for (const clip of clips) {
    if (clip.laneId !== laneId) continue;
    minimum =
      minimum === null ? clip.trackOrder : Math.min(minimum, clip.trackOrder);
  }
  return minimum;
};

/**
 * 拖拽落轨后的片段层级：
 * - 同轨道保持原层级（fallbackOrder = 片段原 trackOrder）；
 * - 并入已有轨道取该轨道现有最小层级；
 * - 新建轨道插在参考轨道上/下方（x.5 临时值，落轨后归一化）。
 */
export const computeDropLaneOrder = ({
  laneId,
  sourceLaneId,
  fallbackOrder,
  newLaneRefLaneId,
  newLaneAbove,
  refClips,
  laneClips,
}: {
  laneId: string;
  sourceLaneId: string;
  fallbackOrder: number;
  newLaneRefLaneId: string | null;
  newLaneAbove: boolean;
  refClips: TimelineClipBase[];
  laneClips: TimelineClipBase[];
}): number => {
  if (newLaneRefLaneId) {
    const baseOrder =
      findLaneMinOrder(refClips, newLaneRefLaneId) ?? fallbackOrder;
    return newLaneAbove ? baseOrder - 0.5 : baseOrder + 0.5;
  }
  if (laneId === sourceLaneId) return fallbackOrder;
  return findLaneMinOrder(laneClips, laneId) ?? fallbackOrder;
};

// ===== 同轨碰撞边界 =====

/**
 * 移动模式下整组的可移动增量边界。
 * - 同轨道内移动（sharedLaneId 为 null）：邻居与成员天然不重叠，按左右
 *   最近邻夹取；多选组跨轨道成员分别按各自原轨道计算。
 * - 跨轨道移动：目标轨道的片段可能与成员原始区间重叠，不能按左右邻筛除，
 *   改为把整组视为一个块，在目标轨道的空闲窗口内移动——选择包含/最接近
 *   原始位置的窗口（放不下的窗口排最后），左右边界即窗口两端。
 * 左边界至少允许拖到 0 帧；右边界不锁总长，允许拖出以扩展时间轴。
 */
export const computeLaneCollisionBounds = ({
  members,
  staticClips,
  sharedLaneId,
}: {
  members: TimelineDragMember[];
  staticClips: TimelineClipBase[];
  sharedLaneId: string | null;
}): { lowerDelta: number; upperDelta: number } => {
  let lowerDelta = -Math.min(...members.map((member) => member.startFrame));
  let upperDelta = Number.MAX_SAFE_INTEGER;
  if (sharedLaneId === null) {
    for (const member of members) {
      const memberEnd = member.startFrame + member.durationInFrames;
      let previousEnd = 0;
      let nextStart = Number.MAX_SAFE_INTEGER;
      for (const candidate of staticClips) {
        if (candidate.laneId !== member.laneId) continue;
        const candidateEnd = candidate.startFrame + candidate.durationInFrames;
        if (candidateEnd <= member.startFrame) {
          previousEnd = Math.max(previousEnd, candidateEnd);
        } else if (candidate.startFrame >= memberEnd) {
          nextStart = Math.min(nextStart, candidate.startFrame);
        }
      }
      lowerDelta = Math.max(lowerDelta, previousEnd - member.startFrame);
      upperDelta = Math.min(upperDelta, nextStart - memberEnd);
    }
    return { lowerDelta, upperDelta };
  }
  const groupStart = Math.min(...members.map((member) => member.startFrame));
  const groupEnd = Math.max(
    ...members.map((member) => member.startFrame + member.durationInFrames),
  );
  const groupSpan = groupEnd - groupStart;
  const laneClips = staticClips
    .filter((clip) => clip.laneId === sharedLaneId)
    .sort((a, b) => a.startFrame - b.startFrame);
  const windows: Array<{ start: number; end: number }> = [];
  let cursor = 0;
  for (const clip of laneClips) {
    if (clip.startFrame > cursor) {
      windows.push({ start: cursor, end: clip.startFrame });
    }
    cursor = Math.max(cursor, clip.startFrame + clip.durationInFrames);
  }
  windows.push({ start: cursor, end: Number.MAX_SAFE_INTEGER });
  let bestWindow = windows[windows.length - 1];
  let bestScore = Number.POSITIVE_INFINITY;
  for (const window of windows) {
    const fits = window.end - window.start >= groupSpan;
    const distance =
      groupStart >= window.start && groupStart < window.end
        ? 0
        : groupStart < window.start
          ? window.start - groupStart
          : groupStart - window.end;
    const score = fits ? distance : distance + 1e9;
    if (score < bestScore) {
      bestScore = score;
      bestWindow = window;
    }
  }
  lowerDelta = Math.max(lowerDelta, bestWindow.start - groupStart);
  upperDelta = Math.min(
    upperDelta,
    bestWindow.end - groupSpan - groupStart,
  );
  return { lowerDelta, upperDelta };
};

// ===== 视频轨磁性让位 =====

export type MagneticPushPlan = {
  /** 被压住的片段（无重叠时为 null） */
  overlapped: TimelineClipBase | null;
  /** 需要整体右移的片段 id（被压片段及其右侧所有片段） */
  shiftIds: Set<string>;
  /** 右移量（帧） */
  push: number;
};

/**
 * 剪映式磁性轨道：拖入范围与某片段重叠时，该片段及其右侧片段整体右移让位。
 * 每次指针移动重新计算，结果直接映射到新片段数组（被移入片段自身除外）。
 */
export const planMagneticPush = (
  laneClips: TimelineClipBase[],
  draggedStart: number,
  draggedDurationInFrames: number,
): MagneticPushPlan => {
  const draggedEnd = draggedStart + draggedDurationInFrames;
  const overlapped =
    laneClips.find(
      (candidate) =>
        draggedStart < candidate.startFrame + candidate.durationInFrames &&
        draggedEnd > candidate.startFrame,
    ) ?? null;
  if (!overlapped) return { overlapped: null, shiftIds: new Set(), push: 0 };
  const push = Math.max(0, draggedEnd - overlapped.startFrame);
  const shiftIds = new Set(
    laneClips
      .filter((candidate) => candidate.startFrame >= overlapped.startFrame)
      .map((candidate) => candidate.id),
  );
  return { overlapped, shiftIds, push };
};

// ===== 磁性空隙闭合 =====

/**
 * 一键闭合所有轨道内的空隙：每条轨道内按时间排序后，后续片段依次贴上
 * 前一片段的尾边（保留每条轨道首个片段的位置，只关片段之间的洞）。
 * 用于“补位”开关开启时的即时整理，与移出补位（planSourceLaneGapClose）配套。
 */
export const closeTimelineLaneGaps = <
  V extends TimelineClipBase,
  M extends TimelineClipBase,
  R extends TimelineClipBase,
>({
  videoTracks,
  instances,
  resourceTracks,
}: {
  videoTracks: V[];
  instances: M[];
  resourceTracks: R[];
}): { videoTracks: V[]; instances: M[]; resourceTracks: R[] } => {
  const compact = <T extends TimelineClipBase>(clips: T[]): T[] => {
    const byLane = new Map<string, T[]>();
    for (const clip of clips) {
      const list = byLane.get(clip.laneId);
      if (list) list.push(clip);
      else byLane.set(clip.laneId, [clip]);
    }
    const newStartById = new Map<string, number>();
    for (const laneClips of byLane.values()) {
      laneClips.sort((a, b) => a.startFrame - b.startFrame);
      let cursor = laneClips[0].startFrame;
      for (const clip of laneClips) {
        newStartById.set(clip.id, cursor);
        cursor += clip.durationInFrames;
      }
    }
    return clips.map((clip) => {
      const startFrame = newStartById.get(clip.id);
      return startFrame === undefined || startFrame === clip.startFrame
        ? clip
        : { ...clip, startFrame };
    });
  };
  return {
    videoTracks: compact(videoTracks),
    instances: compact(instances),
    resourceTracks: compact(resourceTracks),
  };
};

/**
 * 磁性空隙闭合：片段被移出原轨道后，计算原轨道空隙的闭合方案。
 * 位于空隙右侧（startFrame >= origEnd）的片段整体左移，贴到空隙左侧
 * 邻近片段的尾边（prevEnd，没有则为 0 帧），与剪映主轨的移出补位一致。
 * 返回 shift = 0 表示无需闭合（空隙右侧没有片段）。
 */
export const planSourceLaneGapClose = (
  remainingClips: TimelineClipBase[],
  origStart: number,
  origEnd: number,
): { shift: number; shiftIds: Set<string> } => {
  let prevEnd = 0;
  let hasPrev = false;
  for (const clip of remainingClips) {
    const end = clip.startFrame + clip.durationInFrames;
    if (end <= origStart && (!hasPrev || end > prevEnd)) {
      prevEnd = end;
      hasPrev = true;
    }
  }
  const shift = Math.max(0, origEnd - prevEnd);
  const shiftIds = new Set(
    remainingClips
      .filter((clip) => clip.startFrame >= origEnd)
      .map((clip) => clip.id),
  );
  return { shift, shiftIds };
};

// ===== 轨道层级归一 =====

/**
 * 跨轨道拖拽（含拖入空白新建轨道，期间 trackOrder 可能是 x.5 的临时值）
 * 结束后，把所有轨道的层级重排成连续整数，保持轨道堆顺序稳定。
 */
export const normalizeTimelineLaneOrders = <
  V extends TimelineClipBase,
  M extends TimelineClipBase,
  R extends TimelineClipBase,
>({
  videoTracks,
  instances,
  resourceTracks,
}: {
  videoTracks: V[];
  instances: M[];
  resourceTracks: R[];
}): { videoTracks: V[]; instances: M[]; resourceTracks: R[] } => {
  const orderByLane = new Map<string, number>();
  const collect = (laneId: string, trackOrder: number) => {
    const existing = orderByLane.get(laneId);
    orderByLane.set(laneId, Math.min(existing ?? trackOrder, trackOrder));
  };
  videoTracks.forEach((clip) => collect(clip.laneId, clip.trackOrder));
  instances.forEach((clip) => collect(clip.laneId, clip.trackOrder));
  resourceTracks.forEach((clip) => collect(clip.laneId, clip.trackOrder));
  const orderedLaneIds = [...orderByLane.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([laneId]) => laneId);
  const normalized = new Map(
    orderedLaneIds.map((laneId, index) => [laneId, index]),
  );
  const reindex = <T extends TimelineClipBase>(clips: T[]): T[] =>
    clips
      .map((clip) => ({
        ...clip,
        trackOrder: normalized.get(clip.laneId) ?? clip.trackOrder,
      }))
      .sort((a, b) => a.trackOrder - b.trackOrder);
  return {
    videoTracks: reindex(videoTracks),
    instances: reindex(instances),
    resourceTracks: reindex(resourceTracks),
  };
};

// ===== 导入追加的合轨（够位置就复用轨道） =====

/**
 * 导入新片段时的「够位置就并轨」分配：按开始帧逐个处理待插入片段，优先并入
 * 既有同类轨道的空闲区间，只有当所有同类轨道在该时间区间都被占用时才新建轨道；
 * 本轮新建的轨道也会被后续片段复用，因此互不重叠的一串片段最终只占少量轨道。
 * 空闲区间按“最贴合”（紧贴前一片段尾边）优先，同样贴合时取层级靠上的轨道，
 * 让导入结果沿既有轨道串成一排，而不是散到多条空轨上。
 * 与 assignArrangementLanes 的区别：既有片段参与判重且一律不移动，只决定新片段
 * 落在哪条轨道；轨道序号沿用既有轨道的层级，新建轨道从 newLaneBaseOrder 起顺序取号。
 * 只改 laneId / trackOrder，片段时间一律不动。
 */
export const packClipsIntoReusableLanes = <T extends TimelineClipBase>({
  incoming,
  existing,
  isReusableLane,
  createLaneId,
  newLaneBaseOrder,
}: {
  incoming: T[];
  /** 时间线上已有的片段（含不可复用轨道的片段，由 isReusableLane 过滤） */
  existing: TimelineClipBase[];
  /** 该轨道整体能否承接新片段（字幕语义动画轨、视频轨等返回 false） */
  isReusableLane: (laneClips: TimelineClipBase[]) => boolean;
  createLaneId: () => string;
  /** 本轮第一个新建轨道的层级序号，之后依次 +1 */
  newLaneBaseOrder: number;
}): T[] => {
  const clipsByLane = new Map<string, TimelineClipBase[]>();
  for (const clip of existing) {
    const list = clipsByLane.get(clip.laneId);
    if (list) list.push(clip);
    else clipsByLane.set(clip.laneId, [clip]);
  }
  type Lane = {
    id: string;
    order: number;
    spans: Array<{ start: number; end: number }>;
  };
  const lanes: Lane[] = [];
  for (const [laneId, laneClips] of clipsByLane) {
    if (!isReusableLane(laneClips)) continue;
    lanes.push({
      id: laneId,
      order: Math.min(...laneClips.map((clip) => clip.trackOrder)),
      spans: laneClips.map((clip) => ({
        start: clip.startFrame,
        end: clip.startFrame + clip.durationInFrames,
      })),
    });
  }
  const sortLanes = () => lanes.sort((a, b) => a.order - b.order);
  sortLanes();
  const packed = new Array<T>(incoming.length);
  let createdLaneCount = 0;
  [...incoming.keys()]
    .sort((a, b) => incoming[a].startFrame - incoming[b].startFrame || a - b)
    .forEach((index) => {
      const clip = incoming[index];
      const startFrame = clip.startFrame;
      const endFrame = startFrame + clip.durationInFrames;
      let bestLane: Lane | null = null;
      let bestGap = Number.POSITIVE_INFINITY;
      for (const lane of lanes) {
        const occupied = lane.spans.some(
          (span) => span.start < endFrame && span.end > startFrame,
        );
        if (occupied) continue;
        // 与该轨道里“最后一个已经结束的片段”之间的间隔，越小越贴合
        let gap = Number.MAX_SAFE_INTEGER;
        for (const span of lane.spans) {
          if (span.end <= startFrame) gap = Math.min(gap, startFrame - span.end);
        }
        if (gap < bestGap || (gap === bestGap && bestLane && lane.order < bestLane.order)) {
          bestLane = lane;
          bestGap = gap;
        }
      }
      if (bestLane) {
        bestLane.spans.push({ start: startFrame, end: endFrame });
        packed[index] = {
          ...clip,
          laneId: bestLane.id,
          trackOrder: bestLane.order,
        };
        return;
      }
      const laneId = createLaneId();
      const trackOrder = newLaneBaseOrder + createdLaneCount;
      createdLaneCount += 1;
      lanes.push({
        id: laneId,
        order: trackOrder,
        spans: [{ start: startFrame, end: endFrame }],
      });
      sortLanes();
      packed[index] = { ...clip, laneId, trackOrder };
    });
  return packed;
};

// ===== 同类轨道合并 =====

/**
 * 在既有片段里找“最靠上的同类型纯轨道”（轨道内全部片段都满足 matches）。
 * 返回 null 表示时间线上还没有可复用的该类型轨道。
 * 用于手动添加效果/图标/音效时并入对应共享轨道，而不是每次新建一条。
 */
export const findTopLaneOfKind = <T extends TimelineClipBase>(
  clips: T[],
  matches: (clip: T) => boolean,
): string | null => {
  const laneInfo = new Map<string, { order: number; pure: boolean }>();
  for (const clip of clips) {
    const info = laneInfo.get(clip.laneId);
    if (info) {
      info.order = Math.min(info.order, clip.trackOrder);
      info.pure = info.pure && matches(clip);
    } else {
      laneInfo.set(clip.laneId, { order: clip.trackOrder, pure: matches(clip) });
    }
  }
  let best: { laneId: string; order: number } | null = null;
  for (const [laneId, info] of laneInfo) {
    if (!info.pure) continue;
    if (!best || info.order < best.order) best = { laneId, order: info.order };
  }
  return best?.laneId ?? null;
};

/**
 * 同类片段合并到一条轨道：效果、音效、图标、素材各共用一条，不再每个
 * 片段各占一条轨道；字幕语义动画轨（isCaptionClip 命中）与视频轨保持
 * 各自轨道不动。每类目标轨道优先复用时间线上已有的同类型纯轨道（取最
 * 靠上的一条），没有则使用 newLaneIdByKind 提供的新 laneId。
 * 只调整 laneId 与轨道层级；行序固定为 字幕 → 效果 → 图标 → 素材 →
 * 音效 → 视频（遗留混合轨道垫底），同类别内部保持原有相对次序。
 * 片段时间一概不动：合并后同一条轨道内允许时间重叠的片段（保留预览
 * 确认的时间），交给补位或手动拖拽整理。
 */
export const consolidateTimelineLanesByKind = <
  V extends TimelineClipBase,
  M extends TimelineClipBase,
  R extends TimelineClipBase & { kind: "icon" | "material" | "sfx" },
>({
  videoTracks,
  instances,
  resourceTracks,
  isCaptionClip,
  newLaneIdByKind,
}: {
  videoTracks: V[];
  instances: M[];
  resourceTracks: R[];
  isCaptionClip: (clip: M) => boolean;
  newLaneIdByKind: Record<"motion" | "icon" | "material" | "sfx", string>;
}): { videoTracks: V[]; instances: M[]; resourceTracks: R[] } => {
  type LaneKind = "caption" | "motion" | "icon" | "material" | "sfx" | "video";
  const laneInfo = new Map<string, { kinds: Set<LaneKind>; order: number }>();
  const collect = (laneId: string, kind: LaneKind, trackOrder: number) => {
    const info = laneInfo.get(laneId);
    if (info) {
      info.kinds.add(kind);
      info.order = Math.min(info.order, trackOrder);
    } else {
      laneInfo.set(laneId, { kinds: new Set([kind]), order: trackOrder });
    }
  };
  instances.forEach((clip) =>
    collect(
      clip.laneId,
      isCaptionClip(clip) ? "caption" : "motion",
      clip.trackOrder,
    ),
  );
  resourceTracks.forEach((clip) => collect(clip.laneId, clip.kind, clip.trackOrder));
  videoTracks.forEach((clip) => collect(clip.laneId, "video", clip.trackOrder));

  const pureLanesOfKind = (kind: LaneKind) =>
    [...laneInfo.entries()]
      .filter(([, info]) => info.kinds.size === 1 && info.kinds.has(kind))
      .sort((a, b) => a[1].order - b[1].order)
      .map(([laneId]) => laneId);

  const targetLaneByKind = { ...newLaneIdByKind };
  for (const kind of ["motion", "icon", "material", "sfx"] as const) {
    const [topLaneId] = pureLanesOfKind(kind);
    if (topLaneId) targetLaneByKind[kind] = topLaneId;
  }

  const orderedLaneIds = [
    ...pureLanesOfKind("caption"),
    targetLaneByKind.motion,
    targetLaneByKind.icon,
    targetLaneByKind.material,
    targetLaneByKind.sfx,
    ...pureLanesOfKind("video"),
  ];
  const laneOrder = new Map<string, number>();
  for (const laneId of orderedLaneIds) {
    if (!laneOrder.has(laneId)) laneOrder.set(laneId, laneOrder.size);
  }
  // 兜底：未被显式排序的轨道（遗留混合轨道等）按原相对次序垫底
  const leftoverLaneIds = [...laneInfo.keys()]
    .filter((laneId) => !laneOrder.has(laneId))
    .sort((a, b) => (laneInfo.get(a)?.order ?? 0) - (laneInfo.get(b)?.order ?? 0));
  for (const laneId of leftoverLaneIds) {
    laneOrder.set(laneId, laneOrder.size);
  }
  const orderOf = (laneId: string) => laneOrder.get(laneId) ?? laneOrder.size;

  const nextInstances = instances.map((clip) => {
    if (isCaptionClip(clip)) {
      return { ...clip, trackOrder: orderOf(clip.laneId) };
    }
    const laneId = targetLaneByKind.motion;
    return { ...clip, laneId, trackOrder: orderOf(laneId) };
  });
  const nextResourceTracks = resourceTracks.map((clip) => {
    const laneId = targetLaneByKind[clip.kind];
    return { ...clip, laneId, trackOrder: orderOf(laneId) };
  });
  const nextVideoTracks = videoTracks.map((clip) => ({
    ...clip,
    trackOrder: orderOf(clip.laneId),
  }));
  return {
    videoTracks: nextVideoTracks,
    instances: nextInstances,
    resourceTracks: nextResourceTracks,
  };
};
