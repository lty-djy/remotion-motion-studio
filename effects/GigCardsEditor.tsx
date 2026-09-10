import React, { useRef, useState } from "react";
import { createGigCard, readGigCards, resolveGigMediaType, type GigCardConfig } from "./gig-card-model";

/** 通过 video 元素读取视频宽高比;读取失败回退 16:9 */
const readVideoAspectRatio = (file: File): Promise<number> =>
  new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    const done = (ratio: number) => { URL.revokeObjectURL(url); resolve(ratio); };
    video.onloadedmetadata = () => {
      const w = video.videoWidth, h = video.videoHeight;
      done(w > 0 && h > 0 ? w / h : 16 / 9);
    };
    video.onerror = () => done(16 / 9);
    video.src = url;
  });

const isVideoFile = (file: File, hint?: string) =>
  hint === "video" || file.type.startsWith("video/") || /\.(mp4|mov|webm|m4v|ogg)$/i.test(file.name);

type Props = { props: Record<string, unknown>; selectedId?: string; onSelect: (id: string) => void; onChange: (json: string) => void };
type NumericKey = "left" | "top" | "width" | "scale" | "rotateX" | "rotateY" | "rotate" | "perspective" | "radius" | "zIndex";
const TRANSFORM_FIELDS: Array<[NumericKey, string, number, string]> = [
  ["left", "水平位置", 1, "px"], ["top", "垂直位置", 1, "px"], ["width", "图片宽度", 1, "px"], ["scale", "缩放", 0.05, ""],
  ["rotateX", "X 轴倾斜", 1, "°"], ["rotateY", "Y 轴倾斜", 1, "°"], ["rotate", "Z 轴旋转", 1, "°"], ["perspective", "透视距离", 10, "px"], ["radius", "圆角", 1, "px"], ["zIndex", "层级", 1, ""],
];

export const GigCardsEditor: React.FC<Props> = ({ props, onChange, selectedId, onSelect }) => {
  const cards = readGigCards(props);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [openSection, setOpenSection] = useState<"content" | "transform" | "style">("content");
  const [numericDrafts, setNumericDrafts] = useState<Record<string, string>>({});
  const uploadRef = useRef<HTMLInputElement>(null);
  const selected = selectedId ?? cards[0]?.id;
  const card = cards.find((item) => item.id === selected) ?? cards[0];
  const save = (next: GigCardConfig[]) => onChange(JSON.stringify(next));
  const patch = (values: Partial<GigCardConfig>) => { if (card) save(cards.map((item) => item.id === card.id ? { ...item, ...values } : item)); };
  const numericDraftKey = (key: NumericKey) => `${card?.id ?? "none"}:${key}`;
  const numericValue = (key: NumericKey) => numericDrafts[numericDraftKey(key)] ?? String(card?.[key] ?? "");
  const numericMinimum = (key: NumericKey) => key === "width" ? 20 : key === "scale" ? 0.05 : key === "perspective" ? 100 : Number.NEGATIVE_INFINITY;
  const setNumericDraft = (key: NumericKey, raw: string) => {
    const draftKey = numericDraftKey(key);
    setNumericDrafts((current) => ({ ...current, [draftKey]: raw }));
    // 保留输入中的空值、负号和小数点，避免受控输入在编辑中途跳回。
    if (raw === "" || raw === "-" || raw === "." || raw === "-.") return;
    const value = Number(raw);
    if (Number.isFinite(value)) patch({ [key]: value });
  };
  const commitNumeric = (key: NumericKey) => {
    if (!card) return;
    const draftKey = numericDraftKey(key);
    const raw = numericDrafts[draftKey];
    if (raw === undefined) return;
    const parsed = Number(raw);
    const next = Number.isFinite(parsed) ? Math.max(numericMinimum(key), parsed) : Number(card[key]);
    patch({ [key]: next });
    setNumericDrafts((current) => { const nextDrafts = { ...current }; delete nextDrafts[draftKey]; return nextDrafts; });
  };
  const stepNumeric = (key: NumericKey, step: number, direction: number) => {
    const next = Math.max(numericMinimum(key), Number(card?.[key] ?? 0) + step * direction);
    patch({ [key]: next });
    setNumericDrafts((current) => { const nextDrafts = { ...current }; delete nextDrafts[numericDraftKey(key)]; return nextDrafts; });
  };
  const add = () => { const next = createGigCard(crypto.randomUUID()); next.left += cards.length * 24; next.top += cards.length * 24; save([...cards, next]); onSelect(next.id); };
  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []); event.target.value = ""; if (!files.length) return; setBusy(true); setError("");
    try { const added: GigCardConfig[] = []; for (const file of files) { const response = await fetch("/api/upload-media", { method: "POST", headers: { "x-file-name": encodeURIComponent(file.name) }, body: file }); const data = await response.json(); if (!response.ok || !data.ok) throw new Error("上传失败"); const next = createGigCard(crypto.randomUUID()); next.mediaType = isVideoFile(file, data.mediaType) ? "video" : "image"; if (next.mediaType === "video") { next.aspectRatio = await readVideoAspectRatio(file); } else { const bitmap = await createImageBitmap(file); next.aspectRatio = bitmap.width / bitmap.height; bitmap.close(); } next.imageUrl = data.mediaUrl; next.left += (cards.length + added.length) * 24; next.top += (cards.length + added.length) * 24; added.push(next); } save([...cards, ...added]); if (added[0]) onSelect(added[0].id); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "上传失败"); } finally { setBusy(false); }
  };
  const replaceImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file || !card) return; setBusy(true); setError("");
    try { const response = await fetch("/api/upload-media", { method: "POST", headers: { "x-file-name": encodeURIComponent(file.name) }, body: file }); const data = await response.json(); if (!response.ok || !data.ok) throw new Error("替换失败"); const mediaType = isVideoFile(file, data.mediaType) ? "video" : "image"; if (mediaType === "video") { const aspectRatio = await readVideoAspectRatio(file); patch({ imageUrl: data.mediaUrl, mediaType, aspectRatio }); } else { const bitmap = await createImageBitmap(file); patch({ imageUrl: data.mediaUrl, mediaType, aspectRatio: bitmap.width / bitmap.height }); bitmap.close(); } }
    catch (cause) { setError(cause instanceof Error ? cause.message : "替换失败"); } finally { setBusy(false); }
  };
  if (!card) return <div className="gig-cards-editor"><div className="gig-empty-state">还没有素材</div><button className="gig-button gig-button-primary" onClick={add}>＋ 添加第一张</button></div>;
  return <div className="gig-cards-editor">
    <div className="gig-editor-heading"><div><strong>素材卡片</strong><span>{cards.length} 张</span></div><small>拖动素材可直接调整位置</small></div>
    <div className="gig-toolbar"><button className="gig-button gig-button-primary" onClick={add} disabled={busy}>＋ 添加</button><button className="gig-button" onClick={() => uploadRef.current?.click()} disabled={busy}>批量上传</button><input ref={uploadRef} className="gig-hidden-input" type="file" accept="image/*,video/*" multiple onChange={upload} /></div>
    {error ? <div className="gig-error" role="alert">{error}</div> : null}
    <div className="gig-card-list" role="listbox" aria-label="素材列表">{cards.map((item, index) => <button className={`gig-card-tab${item.id === card.id ? " is-active" : ""}`} key={item.id} onClick={() => onSelect(item.id)} aria-selected={item.id === card.id}><span className="gig-card-tab-index">{index + 1}</span><span>{item.imageUrl ? (item.mediaType === "video" ? "已添加视频" : "已添加图片") : "未添加"}</span>{!item.visible ? <em>隐藏</em> : null}</button>)}</div>
    <div className="gig-card-actions"><button className="gig-button" onClick={() => { const copy = { ...card, id: crypto.randomUUID(), left: card.left + 24, top: card.top + 24 }; save([...cards, copy]); onSelect(copy.id); }}>复制</button><button className="gig-button" onClick={() => { save(cards.filter((item) => item.id !== card.id)); onSelect(cards.find((item) => item.id !== card.id)?.id ?? ""); }}>删除</button><button className="gig-button" onClick={() => patch({ visible: !card.visible })}>{card.visible ? "隐藏" : "显示"}</button></div>
    <div className="gig-section-tabs" role="tablist">{(["content", "transform", "style"] as const).map((section) => <button key={section} className={openSection === section ? "is-active" : ""} onClick={() => setOpenSection(section)}>{section === "content" ? "内容" : section === "transform" ? "位置与 3D" : "外观"}</button>)}</div>
    {openSection === "content" ? <div className="gig-editor-section"><label className="gig-field"><span>显示模式</span><select value={card.mode} onChange={(event) => patch({ mode: event.target.value as "image" | "card" })}><option value="image">纯素材</option><option value="card">招聘卡片</option></select></label><div className="gig-field"><span>当前媒体</span><div className="gig-upload-line"><button className="gig-button" onClick={(event) => (event.currentTarget.nextElementSibling as HTMLInputElement | null)?.click()} disabled={busy}>替换媒体</button><input className="gig-hidden-input" type="file" accept="image/*,video/*" onChange={replaceImage} /><span className="gig-file-state">{card.imageUrl ? (card.mediaType === "video" ? "视频" : "图片") : "未添加"}</span></div></div><label className="gig-field"><span>媒体地址</span><input value={card.imageUrl} onChange={(event) => patch({ imageUrl: event.target.value, mediaType: resolveGigMediaType(card.mediaType, event.target.value) })} placeholder="可粘贴图片或视频地址" /></label><label className="gig-field"><span>媒体类型</span><select value={card.mediaType} onChange={(event) => patch({ mediaType: event.target.value as "image" | "video" })}><option value="image">图片</option><option value="video">视频</option></select></label>{card.mode === "card" ? (["title", "desc", "salary"] as const).map((key) => <label className="gig-field" key={key}><span>{key === "title" ? "标题" : key === "desc" ? "描述" : "时薪"}</span><input value={card[key]} onChange={(event) => patch({ [key]: event.target.value })} /></label>) : null}</div> : null}
    {openSection === "transform" ? <div className="gig-editor-section"><div className="gig-field-grid">{TRANSFORM_FIELDS.map(([key, label, step, unit]) => <label className="gig-field gig-number-field" key={key}><span>{label}{unit ? <i>{unit}</i> : null}</span><div><button type="button" onClick={() => stepNumeric(key, step, -1)}>−</button><input type="number" inputMode="decimal" min={Number.isFinite(numericMinimum(key)) ? numericMinimum(key) : undefined} value={numericValue(key)} step={step} onChange={(event) => setNumericDraft(key, event.target.value)} onBlur={() => commitNumeric(key)} /><button type="button" onClick={() => stepNumeric(key, step, 1)}>＋</button></div>{["rotateX", "rotateY", "rotate"].includes(key) ? <input className="gig-range" type="range" min="-180" max="180" value={card[key]} onChange={(event) => patch({ [key]: Number(event.target.value) })} /> : null}</label>)}</div><div className="gig-action-row"><button className="gig-button" onClick={() => patch({ rotateX: 0, rotateY: 0, rotate: 0 })}>恢复正面</button><button className="gig-button" onClick={() => save(cards.map((item) => ({ ...item, rotateX: card.rotateX, rotateY: card.rotateY, rotate: card.rotate, perspective: card.perspective })))}>角度应用到全部</button><button className="gig-button" onClick={() => patch({ left: 785, top: 406, scale: 1 })}>重置位置</button></div></div> : null}
    {openSection === "style" ? <div className="gig-editor-section"><label className="gig-checkbox"><input type="checkbox" checked={card.shadow} onChange={(event) => patch({ shadow: event.target.checked })} />素材阴影</label><p className="gig-help">圆角、透视和层级都可以在“位置与 3D”中调整。悬浮幅度和摇摆幅度位于组件通用参数。</p></div> : null}
  </div>;
};
