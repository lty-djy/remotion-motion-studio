import React, {useId} from "react";
import {AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig} from "remotion";

// 来源字幕：C:/Users/10659/Videos/日料(1).srt（原文与时间码未改写）
// 覆盖范围：00:00:00.000 – 00:00:34.250（全片），1920×1080 / 30fps / 1028 帧。
// 布局假设：中心 655–1245 与底部 216px（y>864）留空给人物与剪映字幕，信息集中在左列 x≈92 与右列 x≈1300。
// 素材说明：全部为原创矢量图形与文字，不含实拍截图；食物与小狗图形均标注为示意，不作为门店出品或宠物证据。
export const FPS = 30;
export const DURATION_IN_FRAMES = 1028;

const font = '"Microsoft YaHei", "PingFang SC", sans-serif';
const mono = 'Consolas, "Courier New", monospace';
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const reveal = (t: number, at: number, d = 0.5) => 1 - Math.pow(1 - clamp((t - at) / d), 3);

const base = {
  accent: "#E9A34B",
  warn: "#D9523F",
  jade: "#8FAF7A",
  wood: "#8A6A4F",
  ink: "#F4EFE6",
  muted: "#A99C8C",
  exitSeconds: 0.26,
};
type Base = typeof base;
const useT = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return frame / fps;
};
const eased = (t: number, at: number, dur: number) => clamp((t - at) / dur);
const sheet = "linear-gradient(90deg,rgba(17,12,8,.90),rgba(17,12,8,.34))";
const hairl = (c: string) => `linear-gradient(90deg,${c}99,transparent)`;

/* ---------------------------------------------------------------- 01 开场钩子 */

const hookDefaults = {
  ...base,
  kicker: "01 / DISCOVERY",
  eyebrow: "喜欢吃日料的朋友",
  headline: "这家真的可以冲！",
  headlineAt: 1.05,
  endSeconds: 2.316,
};
type HookProps = Partial<typeof hookDefaults>;
export const WashokuHookPill = (p: HookProps) => {
  const d = {...hookDefaults, ...p};
  const t = useT();
  const exit = 1 - clamp((t - d.endSeconds + d.exitSeconds) / d.exitSeconds);
  const a = reveal(t, -0.10);
  const b = reveal(t, d.headlineAt, 0.42);
  return (
    <AbsoluteFill style={{fontFamily: font, color: d.ink, pointerEvents: "none"}}>
      <div style={{position: "absolute", left: 92, top: 156, width: 600, opacity: exit}}>
        <div style={{...{fontSize: 20, letterSpacing: 3, fontFamily: mono}, color: d.accent, borderLeft: `3px solid ${d.accent}`, paddingLeft: 14, opacity: a}}>
          {d.kicker}
        </div>
        <div style={{marginTop: 26, fontSize: 30, color: "#DCD2C3", opacity: a, transform: `translateX(${(1 - a) * -18}px)`}}>{d.eyebrow}</div>
        <div style={{marginTop: 16, opacity: b, transform: `translateY(${(1 - b) * 22}px)`}}>
          <span style={{fontSize: 66, fontWeight: 800, letterSpacing: 2, color: d.accent, textShadow: "0 8px 34px #000a"}}>{d.headline}</span>
        </div>
        <div style={{marginTop: 20, height: 3, width: 380, background: hairl(d.warn), transformOrigin: "left", transform: `scaleX(${reveal(t, d.headlineAt + 0.2)})`}} />
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------- 02 双人餐清单（左列逐条推进） */

const listDefaults = {
  ...base,
  kicker: "02 / COURSE SET",
  title: "双人餐阵容",
  subtitle: "内容很丰富",
  item1: "蟹子沙拉", qty1: "×2",
  item2: "招牌刺身", qty2: "5选3",
  item3: "特色丼饭", qty3: "4选1",
  item4: "必吃小吃", qty4: "4选1",
  item5: "特调饮品", qty5: "10选2",
  item6: "厚烧鳗鱼手卷", qty6: "×2",
  firstItemAt: 1.484,
  itemGapSeconds: 1.5432,
  footer: "选择真的不少",
  footerAt: 11.034,
  endSeconds: 12.066,
};
type ListProps = Partial<typeof listDefaults>;
export const WashokuCourseChecklist = (p: ListProps) => {
  const d = {...listDefaults, ...p};
  const t = useT();
  const exit = 1 - clamp((t - d.endSeconds + d.exitSeconds) / d.exitSeconds);
  const rows = [
    {n: "01", name: d.item1, qty: d.qty1},
    {n: "02", name: d.item2, qty: d.qty2},
    {n: "03", name: d.item3, qty: d.qty3},
    {n: "04", name: d.item4, qty: d.qty4},
    {n: "05", name: d.item5, qty: d.qty5},
    {n: "06", name: d.item6, qty: d.qty6},
  ];
  const head = reveal(t, -0.10);
  return (
    <AbsoluteFill style={{fontFamily: font, color: d.ink, pointerEvents: "none"}}>
      <div style={{position: "absolute", left: 92, top: 150, width: 560, opacity: exit}}>
        <div style={{display: "flex", alignItems: "flex-end", justifyContent: "space-between", opacity: head, transform: `translateX(${(1 - head) * -20}px)`}}>
          <div>
            <div style={{fontSize: 19, letterSpacing: 3, fontFamily: mono, color: d.accent, borderLeft: `3px solid ${d.accent}`, paddingLeft: 13}}>{d.kicker}</div>
            <div style={{marginTop: 20, fontSize: 40, fontWeight: 700}}>{d.title}</div>
          </div>
          <div style={{fontSize: 22, color: d.muted, paddingBottom: 6}}>{d.subtitle}</div>
        </div>
        <div style={{marginTop: 22, height: 1, background: hairl(d.accent), transformOrigin: "left", transform: `scaleX(${head})`}} />
        <div style={{marginTop: 22, display: "grid", gap: 10}}>
          {rows.map((row, i) => {
            const at = d.firstItemAt + i * d.itemGapSeconds;
            const r = reveal(t, at, 0.34);
            return (
              <div key={row.n} style={{display: "flex", alignItems: "center", gap: 16, height: 62, padding: "0 18px", boxSizing: "border-box", borderLeft: `2px solid ${d.accent}`, background: sheet, opacity: r, transform: `translateX(${(1 - r) * -22}px)`}}>
                <span style={{fontSize: 19, fontFamily: mono, color: d.accent}}>{row.n}</span>
                <span style={{fontSize: 30, fontWeight: 600, color: "#EFE6D8"}}>{row.name}</span>
                <span style={{marginLeft: "auto", fontSize: 28, fontWeight: 800, color: d.accent, fontFamily: mono}}>{row.qty}</span>
              </div>
            );
          })}
        </div>
        <div style={{marginTop: 22, display: "flex", alignItems: "center", gap: 14, opacity: reveal(t, d.footerAt, 0.36)}}>
          <span style={{width: 34, height: 2, background: d.jade, display: "inline-block"}} />
          <span style={{fontSize: 30, fontWeight: 700, color: d.jade}}>{d.footer}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------- 03 右侧双人餐托盘示意 */

const trayDefaults = {
  ...base,
  kicker: "SET / FOR TWO",
  badge: "2人份",
  note: "原创图形示意 · 不代表实际出品",
  firstItemAt: -0.10,
  itemGapSeconds: 1.5432,
  endSeconds: 10.566,
};
type TrayProps = Partial<typeof trayDefaults>;
export const WashokuSetTray = (p: TrayProps) => {
  const d = {...trayDefaults, ...p};
  const uid = useId().replace(/:/g, "");
  const t = useT();
  const exit = 1 - clamp((t - d.endSeconds + d.exitSeconds) / d.exitSeconds);
  const head = reveal(t, 0.1);
  const cells = [
    {x: 28, y: 34},
    {x: 189, y: 34},
    {x: 350, y: 34},
    {x: 28, y: 240},
    {x: 189, y: 240},
    {x: 350, y: 240},
  ];
  const lit = (i: number) => reveal(t, d.firstItemAt + i * d.itemGapSeconds, 0.3);
  const icon = (i: number, cx: number, cy: number, l: number) => {
    const c = l > 0.5 ? d.accent : "#6E5B4A";
    const g = `translate(0,${(1 - l) * 6})`;
    const op = 0.34 + 0.66 * l;
    if (i === 0) return (
      <g transform={g} opacity={op}>
        <path d={`M${cx - 58} ${cy - 4} Q${cx} ${cy + 78} ${cx + 58} ${cy - 4} Z`} fill={l > 0.5 ? "#6B5238" : "#4A3D33"} stroke={c} strokeWidth="4" />
        <ellipse cx={cx} cy={cy - 4} rx="58" ry="13" fill={l > 0.5 ? "#F2E3CB" : "#6E5B4A"} opacity=".5" />
        {[[-34, -12], [-16, -22], [2, -26], [20, -20], [36, -10], [-6, -8], [26, -4]].map(([dx, dy], k) => (
          <circle key={k} cx={cx + dx} cy={cy + dy} r="7" fill={l > 0.5 ? d.warn : "#6E5B4A"} />
        ))}
      </g>
    );
    if (i === 1) return (
      <g transform={g} opacity={op}>
        {[0, 1, 2].map((k) => (
          <rect key={k} x={cx - 48 + k * 32} y={cy - 30} width="26" height="68" rx="13" transform={`rotate(${-16 + k * 5} ${cx - 35 + k * 32} ${cy + 4})`} fill={l > 0.5 ? "#EFB79F" : "#6E5B4A"} stroke="#F6DCCB" strokeWidth="2" />
        ))}
        <circle cx={cx + 40} cy={cy + 34} r="9" fill={l > 0.5 ? d.jade : "#6E5B4A"} />
      </g>
    );
    if (i === 2) return (
      <g transform={g} opacity={op}>
        <path d={`M${cx - 56} ${cy - 8} Q${cx} ${cy + 76} ${cx + 56} ${cy - 8} Z`} fill={l > 0.5 ? "#7C5236" : "#4A3D33"} stroke={c} strokeWidth="4" />
        <rect x={cx - 58} y={cy - 16} width="116" height="10" rx="5" fill={c} />
        <ellipse cx={cx - 24} cy={cy - 26} rx="20" ry="10" fill={l > 0.5 ? "#EFB79F" : "#6E5B4A"} />
        <ellipse cx={cx + 22} cy={cy - 28} rx="18" ry="9" fill={l > 0.5 ? "#E7C777" : "#6E5B4A"} />
      </g>
    );
    if (i === 3) return (
      <g transform={g} opacity={op}>
        <circle cx={cx} cy={cy + 12} r="50" fill="none" stroke={c} strokeWidth="4" />
        {[0, 1].map((k) => (
          <g key={k} transform={`rotate(${-22 + k * 30} ${cx} ${cy})`}>
            <rect x={cx - 6} y={cy - 58} width="12" height="54" rx="6" fill={l > 0.5 ? "#E8B06A" : "#6E5B4A"} />
            <circle cx={cx} cy={cy - 62} r="8" fill={l > 0.5 ? d.warn : "#6E5B4A"} />
          </g>
        ))}
      </g>
    );
    if (i === 4) return (
      <g transform={g} opacity={op}>
        <path d={`M${cx - 34} ${cy - 44} H${cx + 34} L${cx + 23} ${cy + 52} H${cx - 23} Z`} fill={l > 0.5 ? "#B9773F" : "#4A3D33"} stroke={c} strokeWidth="4" />
        <rect x={cx + 4} y={cy - 76} width="9" height="54" rx="4" fill={c} transform={`rotate(13 ${cx + 8} ${cy - 46})`} />
        <rect x={cx - 30} y={cy + 4} width="60" height="12" rx="4" fill={c} />
      </g>
    );
    return (
      <g transform={g} opacity={op}>
        <path d={`M${cx - 42} ${cy + 54} L${cx + 6} ${cy - 54} L${cx + 46} ${cy + 34} Z`} fill="#3E4A33" stroke={c} strokeWidth="4" />
        <rect x={cx - 8} y={cy - 46} width="30" height="18" rx="9" fill={l > 0.5 ? "#F2E3CB" : "#6E5B4A"} />
        <path d={`M${cx - 42} ${cy + 54} L${cx + 46} ${cy + 34}`} stroke={l > 0.5 ? "#26301F" : "#5A4A3E"} strokeWidth="16" opacity=".7" />
      </g>
    );
  };
  return (
    <AbsoluteFill style={{fontFamily: font, color: d.ink, pointerEvents: "none"}}>
      <div style={{position: "absolute", left: 1298, top: 140, width: 530, height: 660, opacity: exit, transform: `translateY(${(1 - head) * 16}px)`}}>
        <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", ...{fontSize: 19, letterSpacing: 3, fontFamily: mono}, color: d.accent, opacity: head}}>
          <span>{d.kicker}</span>
          <span style={{fontSize: 17, letterSpacing: 1, color: d.muted}}>双人餐构成</span>
        </div>
        <svg width="530" height="470" viewBox="0 0 530 470" style={{marginTop: 10, overflow: "visible"}}>
          <defs>
            <linearGradient id={`${uid}wood`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#6B4F38" />
              <stop offset="0.45" stopColor="#4E392A" />
              <stop offset="1" stopColor="#33251C" />
            </linearGradient>
            <radialGradient id={`${uid}glow`}>
              <stop stopColor={d.accent} stopOpacity="0.20" />
              <stop offset="1" stopColor={d.accent} stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect x="14" y="18" width="504" height="424" rx="20" fill={`url(#${uid}wood)`} stroke="#8A6A4F" strokeWidth="2" />
          <rect x="26" y="30" width="480" height="400" rx="14" fill="none" stroke="#00000040" strokeWidth="1" />
          {cells.map((cell, i) => {
            const l = lit(i);
            return (
              <g key={i}>
                <rect x={cell.x} y={cell.y} width="152" height="186" rx="12" fill={l > 0.5 ? `url(#${uid}glow)` : "#00000033"} stroke={l > 0.5 ? d.accent : "#6E5B4A"} strokeWidth={l > 0.5 ? 2 : 1} opacity={0.4 + 0.6 * l} />
                {icon(i, cell.x + 76, cell.y + 94, l)}
              </g>
            );
          })}
        </svg>
        <div style={{marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between"}}>
          <span style={{padding: "7px 16px", borderRadius: 4, background: `${d.accent}22`, border: `1px solid ${d.accent}`, color: d.accent, fontSize: 22, fontWeight: 700, fontFamily: mono, opacity: reveal(t, 0.6)}}>{d.badge}</span>
          <span style={{fontSize: 18, color: d.muted, opacity: reveal(t, 1.0)}}>{d.note}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* --------------------------------------------------------- 04 氛围与萌宠（左列） */

const ambienceDefaults = {
  ...base,
  kicker: "03 / ATMOSPHERE",
  title: "氛围 × 萌宠",
  tag1: "满店日式氛围",
  tag2: "萌宠主题加成",
  tag3: "拍照打卡超出片",
  tag1At: -0.05,
  tag2At: 1.517,
  tag3At: 4.784,
  source: "依据本期口播整理 · 未使用实拍素材",
  endSeconds: 6.3,
};
type AmbienceProps = Partial<typeof ambienceDefaults>;
export const WashokuAmbienceRail = (p: AmbienceProps) => {
  const d = {...ambienceDefaults, ...p};
  const t = useT();
  const exit = 1 - clamp((t - d.endSeconds + d.exitSeconds) / d.exitSeconds);
  const head = reveal(t, -0.08);
  const rows = [
    {text: d.tag1, at: d.tag1At, color: d.accent},
    {text: d.tag2, at: d.tag2At, color: d.jade},
    {text: d.tag3, at: d.tag3At, color: d.accent},
  ];
  return (
    <AbsoluteFill style={{fontFamily: font, color: d.ink, pointerEvents: "none"}}>
      <div style={{position: "absolute", left: 92, top: 158, width: 560, opacity: exit}}>
        <div style={{fontSize: 19, letterSpacing: 3, fontFamily: mono, color: d.accent, borderLeft: `3px solid ${d.accent}`, paddingLeft: 13, opacity: head}}>{d.kicker}</div>
        <div style={{marginTop: 22, fontSize: 42, fontWeight: 700, opacity: head, transform: `translateX(${(1 - head) * -20}px)`}}>{d.title}</div>
        <div style={{marginTop: 18, height: 1, background: hairl(d.accent), transformOrigin: "left", transform: `scaleX(${head})`}} />
        <div style={{marginTop: 26, display: "grid", gap: 16}}>
          {rows.map((row, i) => {
            const r = reveal(t, row.at, 0.4);
            return (
              <div key={i} style={{display: "flex", alignItems: "center", gap: 18, height: 74, padding: "0 20px", boxSizing: "border-box", background: sheet, borderLeft: `2px solid ${row.color}`, opacity: r, transform: `translateX(${(1 - r) * -24}px)`}}>
                <span style={{width: 12, height: 12, borderRadius: 6, background: row.color, boxShadow: `0 0 14px ${row.color}`}} />
                <span style={{fontSize: 32, fontWeight: 600}}>{row.text}</span>
              </div>
            );
          })}
        </div>
        <div style={{marginTop: 22, fontSize: 20, color: d.muted, opacity: reveal(t, 1.2)}}>{d.source}</div>
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------- 05 店长是一只小狗（右列） */

const petDefaults = {
  ...base,
  chipEn: "PET-FRIENDLY",
  chipZh: "萌宠主题日料店",
  chief: "店长",
  chiefDesc: "超可爱的小狗",
  photo: "拍照打卡特别出片",
  photoAt: 3.267,
  note: "原创图形示意 · 非门店实拍",
  endSeconds: 4.8,
};
type PetProps = Partial<typeof petDefaults>;
export const WashokuPetChief = (p: PetProps) => {
  const d = {...petDefaults, ...p};
  const uid = useId().replace(/:/g, "");
  const t = useT();
  const exit = 1 - clamp((t - d.endSeconds + d.exitSeconds) / d.exitSeconds);
  const dog = reveal(t, -0.12, 0.6);
  const chip = reveal(t, -0.05);
  const name = reveal(t, 2.467);
  return (
    <AbsoluteFill style={{fontFamily: font, color: d.ink, pointerEvents: "none"}}>
      <div style={{position: "absolute", left: 1300, top: 152, width: 520, height: 620, opacity: exit}}>
        <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", opacity: chip}}>
          <span style={{padding: "7px 15px", borderRadius: 4, border: `1px solid ${d.accent}`, color: d.accent, fontSize: 18, letterSpacing: 2, fontFamily: mono}}>{d.chipEn}</span>
          <span style={{fontSize: 22, color: "#DCD2C3"}}>{d.chipZh}</span>
        </div>
        <svg width="520" height="380" viewBox="0 0 520 380" style={{marginTop: 6, overflow: "visible"}}>
          <defs>
            <radialGradient id={`${uid}glow`}>
              <stop stopColor={d.accent} stopOpacity="0.18" />
              <stop offset="1" stopColor={d.accent} stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="262" cy="196" r="176" fill={`url(#${uid}glow)`} />
          <g opacity={dog} transform={`translate(0,${(1 - dog) * 26})`}>
            <path d="M146 108 L112 34 L206 78 Z" fill="#C4784A" stroke="#E8A868" strokeWidth="2" />
            <path d="M378 108 L412 34 L318 78 Z" fill="#C4784A" stroke="#E8A868" strokeWidth="2" />
            <ellipse cx="262" cy="204" rx="136" ry="124" fill="#E2A165" />
            <ellipse cx="262" cy="150" rx="96" ry="62" fill="#EDB377" opacity=".8" />
            <ellipse cx="262" cy="256" rx="74" ry="58" fill="#F6E6CE" />
            <ellipse cx="216" cy="182" rx="17" ry="21" fill="#2A1D16" />
            <ellipse cx="308" cy="182" rx="17" ry="21" fill="#2A1D16" />
            <circle cx="222" cy="174" r="5" fill="#FFF8EE" />
            <circle cx="314" cy="174" r="5" fill="#FFF8EE" />
            <ellipse cx="262" cy="234" rx="21" ry="15" fill="#3A2A20" />
            <path d="M262 249 Q262 272 228 274" fill="none" stroke="#3A2A20" strokeWidth="4" strokeLinecap="round" />
            <path d="M262 249 Q262 272 296 274" fill="none" stroke="#3A2A20" strokeWidth="4" strokeLinecap="round" />
            <path d="M178 302 Q262 340 346 302" fill="none" stroke={d.accent} strokeWidth="16" strokeLinecap="round" opacity={reveal(t, 0.5)} />
            <circle cx="262" cy="352" r="14" fill={d.accent} opacity={reveal(t, 0.62)} />
            <circle cx="262" cy="352" r="5" fill="#3A2A20" opacity={reveal(t, 0.7)} />
          </g>
        </svg>
        <div style={{display: "flex", alignItems: "center", gap: 14, marginTop: 4, opacity: name, transform: `translateY(${(1 - name) * 14}px)`}}>
          <span style={{fontSize: 22, color: d.muted, fontFamily: mono}}>{d.chief}</span>
          <span style={{fontSize: 34, fontWeight: 700, color: d.accent}}>{d.chiefDesc}</span>
        </div>
        <div style={{marginTop: 20, display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: sheet, borderLeft: `2px solid ${d.jade}`, opacity: reveal(t, d.photoAt), transform: `translateX(${(1 - reveal(t, d.photoAt)) * 18}px)`}}>
          <svg width="30" height="24" viewBox="0 0 30 24"><rect x="1" y="5" width="28" height="18" rx="4" fill="none" stroke={d.jade} strokeWidth="2" /><circle cx="15" cy="14" r="6" fill="none" stroke={d.jade} strokeWidth="2" /><rect x="10" y="1" width="10" height="5" rx="2" fill={d.jade} /></svg>
          <span style={{fontSize: 28, fontWeight: 600, color: "#EFE6D8"}}>{d.photo}</span>
        </div>
        <div style={{marginTop: 16, fontSize: 18, color: d.muted, opacity: reveal(t, d.photoAt + 0.3)}}>{d.note}</div>
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------- 06 四周年活动（左列） */

const annivDefaults = {
  ...base,
  kicker: "04 / ANNIVERSARY",
  lead: "每晚来吃的顾客都不少",
  headline: "最近刚好是4周年活动",
  value: 4,
  suffix: "周年",
  valueAt: 1.684,
  countSeconds: 0.8,
  source: "依据本期口播表述",
  endSeconds: 6.6,
};
type AnnivProps = Partial<typeof annivDefaults>;
export const WashokuAnniversaryCount = (p: AnnivProps) => {
  const d = {...annivDefaults, ...p};
  const t = useT();
  const exit = 1 - clamp((t - d.endSeconds + d.exitSeconds) / d.exitSeconds);
  const lead = reveal(t, -0.08);
  const head = reveal(t, d.valueAt, 0.45);
  const prog = eased(t, d.valueAt, d.countSeconds);
  const shown = Math.round(clamp(prog) * d.value);
  const pulse = reveal(t, d.valueAt + d.countSeconds, 0.5);
  return (
    <AbsoluteFill style={{fontFamily: font, color: d.ink, pointerEvents: "none"}}>
      <div style={{position: "absolute", left: 92, top: 150, width: 560, opacity: exit}}>
        <div style={{fontSize: 19, letterSpacing: 3, fontFamily: mono, color: d.accent, borderLeft: `3px solid ${d.accent}`, paddingLeft: 13, opacity: lead}}>{d.kicker}</div>
        <div style={{marginTop: 24, fontSize: 26, color: "#DCD2C3", opacity: lead, transform: `translateX(${(1 - lead) * -18}px)`}}>{d.lead}</div>
        <div style={{marginTop: 26, display: "flex", alignItems: "center", gap: 14, opacity: head}}>
          <span style={{fontFamily: "Arial, sans-serif", fontSize: 168, fontWeight: 800, lineHeight: 1, letterSpacing: -6, color: d.accent, textShadow: `0 10px 40px ${d.accent}44`}}>{shown}</span>
          <div style={{paddingBottom: 26}}>
            <div style={{fontSize: 38, fontWeight: 800, color: "#EFE6D8"}}>{d.suffix}</div>
            <div style={{marginTop: 14, width: 60 + pulse * 40, height: 4, background: d.warn}} />
          </div>
        </div>
        <div style={{marginTop: 20, fontSize: 40, fontWeight: 700, opacity: head, transform: `translateY(${(1 - head) * 16}px)`}}>{d.headline}</div>
        <div style={{marginTop: 30, fontSize: 20, color: d.muted, opacity: reveal(t, d.valueAt + 0.6)}}>{d.source}</div>
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------- 07 打卡/积分/充值 → 扭蛋（右列） */

const gachaDefaults = {
  ...base,
  kicker: "HOW TO PLAY",
  node1: "打卡", node2: "积分", node3: "充值",
  node1At: -0.05, node2At: 0.40, node3At: 0.83,
  outcome: "扭蛋",
  outcomeAt: 1.216,
  footer: "都有机会参与扭蛋",
  note: "口播表述 · 以门店规则为准",
  endSeconds: 2.666,
};
type GachaProps = Partial<typeof gachaDefaults>;
export const WashokuGachaFlow = (p: GachaProps) => {
  const d = {...gachaDefaults, ...p};
  const uid = useId().replace(/:/g, "");
  const t = useT();
  const exit = 1 - clamp((t - d.endSeconds + d.exitSeconds) / d.exitSeconds);
  const head = reveal(t, -0.06);
  const nodes = [
    {text: d.node1, at: d.node1At, y: 96},
    {text: d.node2, at: d.node2At, y: 196},
    {text: d.node3, at: d.node3At, y: 296},
  ];
  const out = reveal(t, d.outcomeAt, 0.35);
  return (
    <AbsoluteFill style={{fontFamily: font, color: d.ink, pointerEvents: "none"}}>
      <div style={{position: "absolute", left: 1290, top: 150, width: 540, height: 660, opacity: exit}}>
        <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", ...{fontSize: 19, letterSpacing: 3, fontFamily: mono}, color: d.accent, opacity: head}}>
          <span>{d.kicker}</span>
          <span style={{fontSize: 17, letterSpacing: 1, color: d.muted}}>参与方式</span>
        </div>
        <svg width="540" height="400" viewBox="0 0 540 400" style={{marginTop: 14, overflow: "visible"}}>
          <defs>
            <radialGradient id={`${uid}cap`}>
              <stop offset="0" stopColor="#FFF3DC" />
              <stop offset="0.55" stopColor={d.accent} />
              <stop offset="1" stopColor="#B8722C" />
            </radialGradient>
          </defs>
          {nodes.map((node, i) => {
            const r = reveal(t, node.at, 0.3);
            const line = reveal(t, node.at + 0.12, 0.3);
            return (
              <g key={i}>
                <rect x="0" y={node.y - 34} width="184" height="68" rx="6" fill="#110C08DD" stroke={r > 0.5 ? d.accent : "#6E5B4A"} strokeWidth="2" opacity={0.35 + 0.65 * r} />
                <text x="26" y={node.y + 9} fontSize="30" fontWeight="700" fill="#EFE6D8" opacity={r} fontFamily={font}>{node.text}</text>
                <circle cx="158" cy={node.y} r="7" fill={d.accent} opacity={r} />
                <path d={`M184 ${node.y} C260 ${node.y}, 276 196, 336 196`} fill="none" stroke={d.accent} strokeWidth="2" opacity={line * 0.85} />
              </g>
            );
          })}
          <g opacity={out} transform={`translate(0,${(1 - out) * 18})`}>
            <circle cx="410" cy="196" r="88" fill={`url(#${uid}cap)`} opacity=".16" />
            <ellipse cx="410" cy="196" rx="60" ry="80" fill={`url(#${uid}cap)`} />
            <path d="M352 178 H468" stroke="#6E4A22" strokeWidth="12" opacity=".55" />
            <circle cx="386" cy="152" r="14" fill="#FFFBF2" opacity=".8" />
            <text x="410" y="316" textAnchor="middle" fontSize="32" fontWeight="800" fill={d.accent} fontFamily={font}>{d.outcome}</text>
          </g>
        </svg>
        <div style={{marginTop: 6, display: "flex", alignItems: "center", gap: 14, opacity: reveal(t, d.outcomeAt + 0.2)}}>
          <span style={{width: 34, height: 2, background: d.jade, display: "inline-block"}} />
          <span style={{fontSize: 28, fontWeight: 600, color: "#EFE6D8"}}>{d.footer}</span>
        </div>
        <div style={{marginTop: 14, fontSize: 18, color: d.muted, opacity: reveal(t, d.outcomeAt + 0.45)}}>{d.note}</div>
      </div>
    </AbsoluteFill>
  );
};

/* -------------------------------------------------------------- 08 会员福利（左列） */

const perkDefaults = {
  ...base,
  kicker: "05 / MEMBERSHIP",
  title: "会员专属",
  perk1: "专属福利",
  perk2: "储值优惠",
  perk2At: 1.617,
  endSeconds: 2.217,
};
type PerkProps = Partial<typeof perkDefaults>;
export const WashokuMemberPerks = (p: PerkProps) => {
  const d = {...perkDefaults, ...p};
  const t = useT();
  const exit = 1 - clamp((t - d.endSeconds + d.exitSeconds) / d.exitSeconds);
  const head = reveal(t, -0.06);
  const rows = [
    {text: d.perk1, at: -0.05, color: d.accent},
    {text: d.perk2, at: d.perk2At, color: d.jade},
  ];
  return (
    <AbsoluteFill style={{fontFamily: font, color: d.ink, pointerEvents: "none"}}>
      <div style={{position: "absolute", left: 92, top: 196, width: 560, opacity: exit}}>
        <div style={{fontSize: 19, letterSpacing: 3, fontFamily: mono, color: d.accent, borderLeft: `3px solid ${d.accent}`, paddingLeft: 13, opacity: head}}>{d.kicker}</div>
        <div style={{marginTop: 22, fontSize: 40, fontWeight: 700, opacity: head, transform: `translateX(${(1 - head) * -20}px)`}}>{d.title}</div>
        <div style={{marginTop: 22, display: "flex", gap: 16}}>
          {rows.map((row, i) => {
            const r = reveal(t, row.at, 0.32);
            return (
              <div key={i} style={{display: "flex", alignItems: "center", gap: 14, height: 76, padding: "0 24px", background: sheet, borderLeft: `3px solid ${row.color}`, opacity: r, transform: `translateX(${(1 - r) * -20}px)`}}>
                <span style={{fontSize: 30, fontWeight: 700, color: row.color}}>{row.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* --------------------------------------------------------- 09 行动引导（左列 + 左下角箭头） */

const ctaDefaults = {
  ...base,
  kicker: "06 / VISIT US",
  line1: "想约朋友吃日料",
  line2: "顺便撸萌宠",
  note: "地址链接给你们放左下角啦",
  line2At: 1.283,
  noteAt: 2.767,
  endSeconds: 4.72,
};
type CtaProps = Partial<typeof ctaDefaults>;
export const WashokuCallToAction = (p: CtaProps) => {
  const d = {...ctaDefaults, ...p};
  const t = useT();
  const exit = 1 - clamp((t - d.endSeconds + d.exitSeconds) / d.exitSeconds);
  const head = reveal(t, -0.08);
  const l2 = reveal(t, d.line2At, 0.42);
  const note = reveal(t, d.noteAt, 0.4);
  const arrow = reveal(t, d.noteAt + 0.18, 0.55);
  return (
    <AbsoluteFill style={{fontFamily: font, color: d.ink, pointerEvents: "none"}}>
      <div style={{position: "absolute", left: 92, top: 432, width: 660, height: 426, opacity: exit}}>
        <div style={{fontSize: 19, letterSpacing: 3, fontFamily: mono, color: d.accent, borderLeft: `3px solid ${d.accent}`, paddingLeft: 13, opacity: head}}>{d.kicker}</div>
        <div style={{marginTop: 24, fontSize: 52, fontWeight: 800, letterSpacing: 1, opacity: head, transform: `translateX(${(1 - head) * -22}px)`}}>{d.line1}</div>
        <div style={{marginTop: 6, fontSize: 52, fontWeight: 800, letterSpacing: 1, color: d.accent, opacity: l2, transform: `translateX(${(1 - l2) * -22}px)`}}>{d.line2}</div>
        <div style={{marginTop: 26, display: "flex", alignItems: "center", gap: 14, opacity: note}}>
          <span style={{padding: "10px 18px", borderRadius: 4, background: `${d.warn}22`, border: `1px solid ${d.warn}`, color: "#F6D9D2", fontSize: 26, fontWeight: 600}}>{d.note}</span>
        </div>
        <svg width="220" height="112" viewBox="0 0 220 112" style={{position: "absolute", left: -6, top: 306, opacity: arrow, overflow: "visible"}}>
          <path d="M198 6 C126 6, 44 40, 16 96" fill="none" stroke={d.accent} strokeWidth="3" strokeDasharray="10 8" strokeDashoffset={(1 - arrow) * 60} />
          <path d="M16 96 L14 70 L40 84 Z" fill={d.accent} />
          <text x="66" y="26" fontSize="18" fill={d.muted} fontFamily={mono}>左下角</text>
        </svg>
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ 协议导出 */

const listSchema = {
  accent: {type: "color", label: "主强调色", default: listDefaults.accent},
  warn: {type: "color", label: "次强调色", default: listDefaults.warn},
  jade: {type: "color", label: "清新色", default: listDefaults.jade},
  kicker: {type: "text", label: "英文小标", default: listDefaults.kicker},
  title: {type: "text", label: "标题", default: listDefaults.title},
  subtitle: {type: "text", label: "副标题", default: listDefaults.subtitle},
  item1: {type: "text", label: "第1项", default: listDefaults.item1},
  qty1: {type: "text", label: "第1项数量", default: listDefaults.qty1},
  item2: {type: "text", label: "第2项", default: listDefaults.item2},
  qty2: {type: "text", label: "第2项数量", default: listDefaults.qty2},
  item3: {type: "text", label: "第3项", default: listDefaults.item3},
  qty3: {type: "text", label: "第3项数量", default: listDefaults.qty3},
  item4: {type: "text", label: "第4项", default: listDefaults.item4},
  qty4: {type: "text", label: "第4项数量", default: listDefaults.qty4},
  item5: {type: "text", label: "第5项", default: listDefaults.item5},
  qty5: {type: "text", label: "第5项数量", default: listDefaults.qty5},
  item6: {type: "text", label: "第6项", default: listDefaults.item6},
  qty6: {type: "text", label: "第6项数量", default: listDefaults.qty6},
  firstItemAt: {type: "number", label: "第1项出现（秒·相对组件）", min: 0, max: 20, step: 0.01, default: listDefaults.firstItemAt},
  itemGapSeconds: {type: "number", label: "逐项间隔（秒）", min: 0.1, max: 5, step: 0.01, default: listDefaults.itemGapSeconds},
  footer: {type: "text", label: "收束文案", default: listDefaults.footer},
  footerAt: {type: "number", label: "收束出现（秒）", min: 0, max: 20, step: 0.01, default: listDefaults.footerAt},
  endSeconds: {type: "number", label: "退场（秒）", min: 1, max: 60, step: 0.01, default: listDefaults.endSeconds},
};

export const MOTION_COMPONENTS = [
];

const timelineAt = (id: string, startFrame: number, props: Record<string, unknown>) => ({
  componentId: id,
  startFrame,
  durationInFrames: MOTION_COMPONENTS.find((c) => c.id === id)?.durationInFrames ?? 0,
  cardBackgroundEnabled: false,
  backgroundDimEnabled: false,
  props,
});

export const MOTION_TIMELINE = [
  timelineAt("WashokuHookPill", 0, hookDefaults),
  timelineAt("WashokuCourseChecklist", 69, listDefaults),
  timelineAt("WashokuSetTray", 114, trayDefaults),
  timelineAt("WashokuAmbienceRail", 431, ambienceDefaults),
  timelineAt("WashokuPetChief", 476, petDefaults),
  timelineAt("WashokuAnniversaryCount", 620, annivDefaults),
  timelineAt("WashokuGachaFlow", 738, gachaDefaults),
  timelineAt("WashokuMemberPerks", 818, perkDefaults),
  timelineAt("WashokuCallToAction", 886, ctaDefaults),
];

const componentById: Record<string, React.ComponentType<Record<string, unknown>>> = {
  WashokuHookPill,
  WashokuCourseChecklist,
  WashokuSetTray,
  WashokuAmbienceRail,
  WashokuPetChief,
  WashokuAnniversaryCount,
  WashokuGachaFlow,
  WashokuMemberPerks,
  WashokuCallToAction,
};

export default function WashokuSet() {
  return (
    <AbsoluteFill>
      {MOTION_TIMELINE.map((preset) => {
        const C = componentById[preset.componentId];
        return (
          <Sequence key={preset.componentId} from={preset.startFrame} durationInFrames={preset.durationInFrames}>
            <C {...preset.props} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}
