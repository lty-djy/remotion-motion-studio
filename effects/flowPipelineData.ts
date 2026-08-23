export const MONO =
  '"JetBrains Mono", "SFMono-Regular", Menlo, Consolas, monospace';

export type NodeDef = {
  id: string;
  title: string;
  sub: string;
  bullets: string[];
  status: string;
  statusAlt?: string;
  cx: number;
  cy: number;
  w: number;
  h: number;
  icon: "uav" | "antenna" | "cpu" | "gcs";
};

export const NODES: NodeDef[] = [
  {
    id: "av",
    title: "飞行器（AV）",
    sub: "私有遥测 / 传感器",
    bullets: ["飞控计算机", "传感器数据", "私有数据帧"],
    status: "系统：私有协议激活",
    statusAlt: "系统：机动执行中",
    cx: 155,
    cy: 262,
    w: 220,
    h: 150,
    icon: "uav",
  },
  {
    id: "datalink",
    title: "数据链路系统",
    sub: "视距 / 超视距比特流",
    bullets: ["射频调制解调终端", "原始射频流"],
    status: "射频：10.5 GHz 流",
    cx: 424,
    cy: 262,
    w: 192,
    h: 132,
    icon: "antenna",
  },
  {
    id: "vsm",
    title: "VSM 转换中枢",
    sub: "私有协议 ⇄ DLI 标准转换",
    bullets: ["载具特定模块", "DLI 映射引擎"],
    status: "VSM：私有 ⇄ DLI",
    cx: 702,
    cy: 262,
    w: 240,
    h: 160,
    icon: "cpu",
  },
  {
    id: "gcs",
    title: "地面站 GCS / CUCS",
    sub: "核心无人机控制系统",
    bullets: ["人机交互界面", "标准 DLI 消息 #1000/#2000"],
    status: "CUCS：DLI 兼容",
    statusAlt: "CUCS：消息 #1000 已解析",
    cx: 1012,
    cy: 262,
    w: 252,
    h: 150,
    icon: "gcs",
  },
];

export const ZONES = [
  { x: 25, y: 80, w: 260, h: 360, head: "区域 1：飞行器（AV）", sub: "私有协议环境", color: "#fbbf24" },
  { x: 303, y: 80, w: 240, h: 360, head: "区域 2：数据链路", sub: "原始比特流（射频桥接）", color: "#94a3b8" },
  { x: 558, y: 80, w: 288, h: 360, head: "区域 3：VSM 转换中枢", sub: "专用模块协议转换", color: "#38bdf8", strong: true },
  { x: 862, y: 80, w: 313, h: 360, head: "区域 4：地面站 GCS/CUCS", sub: "标准化 STANAG 4586 接口", color: "#38bdf8" },
];

export const EDGES: Array<[string, string, string]> = [
  ["av", "datalink", "私有射频"],
  ["datalink", "vsm", "原始比特流"],
  ["vsm", "gcs", "标准化 DLI 消息"],
];

const HOP = 1.1;
const MORPH_HOLD = 0.6;
const FLASH = 0.8;
const TAIL = 1.0;

export const DOWN_START = 0.6;
export const DL_HOP1_END = DOWN_START + HOP;
export const DL_HOP2_END = DL_HOP1_END + HOP;
export const DL_MORPH_END = DL_HOP2_END + MORPH_HOLD;
export const DL_FLASH_END = DL_MORPH_END + FLASH;
export const DL_HOP3_END = DL_FLASH_END + HOP;
export const DOWN_END = DL_HOP3_END + TAIL;

export const UP_START = DOWN_END + 1.4;
export const UP_HOP1_END = UP_START + HOP;
export const UP_MORPH_END = UP_HOP1_END + MORPH_HOLD;
export const UP_FLASH_END = UP_MORPH_END + FLASH;
export const UP_HOP2_END = UP_FLASH_END + HOP;
export const UP_HOP3_END = UP_HOP2_END + HOP;
export const UP_END = UP_HOP3_END + TAIL;

export const LOOP_SECONDS = UP_END + 1.6;

export type LogEntry = { t: number; tag: string; msg: string; prop?: boolean };

export const LOG_SCRIPT: LogEntry[] = [
  { t: 0, tag: "SYS", msg: "数据管线初始化完成，四大技术分区拓扑就绪。" },
  { t: DOWN_START, tag: "AV", msg: "① 飞控计算机与传感器生成「私有遥测」数据包", prop: true },
  { t: DL_HOP1_END, tag: "LINK", msg: "② 数据链路系统正在传输原始射频比特流", prop: true },
  { t: DL_HOP2_END, tag: "VSM", msg: "③ VSM 中枢将私有遥测转换为 DLI 标准消息 #1000" },
  { t: DL_HOP3_END, tag: "GCS", msg: "④ 地面站 HMI 解析标准化 STANAG 4586 遥测消息" },
  { t: UP_START, tag: "GCS", msg: "① 地面站操作员下发标准 DLI 指令 #2000（转向控制）" },
  { t: UP_HOP1_END, tag: "VSM", msg: "② VSM 将 DLI 指令 #2000 转换为私有自驾仪指令格式" },
  { t: UP_HOP2_END, tag: "LINK", msg: "③ 私有指令调制上数据链路射频比特流", prop: true },
  { t: UP_HOP3_END, tag: "AV", msg: "④ 飞控计算机接收私有指令并执行机动动作", prop: true },
];

export type CalloutWindow = { t0: number; t1: number };

export const CALLOUT_AV: CalloutWindow[] = [
  { t0: DOWN_START, t1: DL_HOP1_END },
  { t0: UP_HOP2_END, t1: UP_END },
];
export const CALLOUT_VSM: CalloutWindow[] = [
  { t0: DL_HOP2_END, t1: DL_FLASH_END },
  { t0: UP_HOP1_END, t1: UP_FLASH_END },
];
export const CALLOUT_GCS: CalloutWindow[] = [
  { t0: DL_HOP3_END, t1: DOWN_END },
  { t0: UP_START, t1: UP_HOP1_END },
];

export const calloutOpacity = (wins: CalloutWindow[], t: number) => {
  for (const w of wins) {
    if (t >= w.t0 && t < w.t1) {
      return Math.min(
        clamp01((t - w.t0) / 0.35),
        clamp01((w.t1 - t) / 0.3),
      );
    }
  }
  return 0;
};

export function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

const easeInOutCubic = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const nodeById = (id: string) => NODES.find((n) => n.id === id)!;

export type PacketState = {
  x: number;
  y: number;
  label: string;
  kind: "prop" | "dli";
} | null;

export type FlowState = {
  phase: "idle" | "down" | "up";
  packet: PacketState;
  edgeMode: "none" | "down" | "up";
  nodeMode: Record<string, "none" | "prop" | "dli">;
  vsmFlash: boolean;
};

const emptyModes = () => ({
  av: "none" as const,
  datalink: "none" as const,
  vsm: "none" as const,
  gcs: "none" as const,
});

const packetTravel = (
  fromId: string,
  toId: string,
  t0: number,
  t1: number,
  t: number,
): PacketState => {
  const p = easeInOutCubic(clamp01((t - t0) / (t1 - t0)));
  const a = nodeById(fromId);
  const b = nodeById(toId);
  return { x: lerp(a.cx, b.cx, p), y: lerp(a.cy, b.cy, p), label: "", kind: "prop" };
};

const holdPacket = (label: string, kind: "prop" | "dli"): PacketState => {
  const v = nodeById("vsm");
  return { x: v.cx, y: v.cy, label, kind };
};

export function evaluateFlow(t: number): FlowState {
  const base: FlowState = {
    phase: "idle",
    packet: null,
    edgeMode: "none",
    nodeMode: emptyModes(),
    vsmFlash: false,
  };
  if (t >= DOWN_START && t < DOWN_END) {
    base.phase = "down";
    base.edgeMode = "down";
    if (t < DL_HOP1_END) {
      base.nodeMode.av = "prop";
      base.packet = packetTravel("av", "datalink", DOWN_START, DL_HOP1_END, t);
      base.packet.label = "私有遥测";
    } else if (t < DL_HOP2_END) {
      base.nodeMode.datalink = "prop";
      base.packet = packetTravel("datalink", "vsm", DL_HOP1_END, DL_HOP2_END, t);
      base.packet.label = "私有遥测";
    } else if (t < DL_MORPH_END) {
      base.nodeMode.vsm = "prop";
      base.packet = holdPacket("私有遥测", "prop");
    } else if (t < DL_FLASH_END) {
      base.nodeMode.vsm = "dli";
      base.vsmFlash = true;
      base.packet = holdPacket("DLI 消息 #1000", "dli");
    } else if (t < DL_HOP3_END) {
      base.nodeMode.vsm = "dli";
      base.packet = packetTravel("vsm", "gcs", DL_FLASH_END, DL_HOP3_END, t);
      base.packet.label = "DLI 消息 #1000";
      base.packet.kind = "dli";
    } else {
      base.nodeMode.gcs = "dli";
      base.edgeMode = "none";
    }
    return base;
  }
  if (t >= UP_START && t < UP_END) {
    base.phase = "up";
    base.edgeMode = "up";
    if (t < UP_HOP1_END) {
      base.nodeMode.gcs = "dli";
      base.packet = packetTravel("gcs", "vsm", UP_START, UP_HOP1_END, t);
      base.packet.label = "DLI 指令 #2000";
      base.packet.kind = "dli";
    } else if (t < UP_MORPH_END) {
      base.nodeMode.vsm = "dli";
      base.packet = holdPacket("DLI 指令 #2000", "dli");
    } else if (t < UP_FLASH_END) {
      base.nodeMode.vsm = "prop";
      base.vsmFlash = true;
      base.packet = holdPacket("私有指令", "prop");
    } else if (t < UP_HOP2_END) {
      base.packet = packetTravel("vsm", "datalink", UP_FLASH_END, UP_HOP2_END, t);
      base.packet.label = "私有指令";
    } else if (t < UP_HOP3_END) {
      base.nodeMode.datalink = "prop";
      base.packet = packetTravel("datalink", "av", UP_HOP2_END, UP_HOP3_END, t);
      base.packet.label = "私有指令";
    } else {
      base.nodeMode.av = "prop";
      base.edgeMode = "none";
    }
    return base;
  }
  return base;
}

export const fmtClock = (sec: number) => {
  const s = Math.max(0, Math.floor(sec));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};
