import React, { useEffect, useRef, useState } from 'react';
import type { SoundChoice } from './component-sound-selection';
import './sfx-delete-dialog.css';
export type SfxReference = { scope:string; name:string; trackId:string; componentId?:string; bound:boolean; startFrame:number };
export function SfxDeleteDialog({sound,library,references,loading,busy,error,onCancel,onConfirm,onRefresh}: {
  sound:SoundChoice; library:SoundChoice[]; references:SfxReference[]; loading:boolean; busy:boolean; error:string;
  onCancel:()=>void; onConfirm:(action:'remove'|'replace',replacementId:string)=>void; onRefresh:()=>void;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => previous?.focus();
  }, []);
  const containFocus = (event: React.KeyboardEvent) => {
    if (event.key !== 'Tab') return;
    const controls = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), audio[controls]') ?? []) as HTMLElement[];
    const first = controls[0], last = controls[controls.length - 1];
    if (!first) { event.preventDefault(); return; }
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current)) { event.preventDefault(); first.focus(); }
  };
  const [action,setAction] = useState<'remove'|'replace'>('remove');
  const [search,setSearch] = useState('');
  const [replacementId,setReplacementId] = useState('');
  const options = library.filter(item => item.id !== sound.id && [item.label,item.id,...(item.tags ?? [])].join(' ').toLowerCase().includes(search.toLowerCase()));
  const replacement = library.find(item => item.id === replacementId && item.id !== sound.id);
  return <div className="sfx-delete-backdrop"><section ref={dialogRef} tabIndex={-1} onKeyDown={containFocus} role="dialog" aria-modal="true" aria-label="删除音效引用检查" className="sfx-delete-dialog">
    <h2>删除音效「{sound.label}」</h2>
    <p>将检查当前时间线、编排预览和已保存项目。音效文件保留本地删除备份，可撤销本次删除。</p>
    {loading ? <p role="status">正在检查引用…</p> : <>
      <strong>受影响的引用：{references.length} 处</strong>
      <ul className="sfx-delete-references">{references.map((item,index) => <li key={`${item.scope}:${item.trackId}:${index}`}>
        <b>{item.name}</b><span>{item.scope} · {item.bound ? '组件绑定音效' : '独立音效'} · 第 {item.startFrame} 帧</span>
      </li>)}</ul>
      {!references.length && <p>没有找到引用，可以直接删除。</p>}
      <label><input type="radio" name="sfx-delete-action" checked={action==='remove'} onChange={()=>setAction('remove')} disabled={busy}/>移除音效引用后删除（保留组件）</label>
      <label><input type="radio" name="sfx-delete-action" checked={action==='replace'} onChange={()=>setAction('replace')} disabled={busy}/>替换所有引用后删除</label>
      {action==='replace' && <>
        <input aria-label="搜索替换音效" placeholder="搜索替换音效" value={search} onChange={event=>setSearch(event.target.value)} disabled={busy}/>
        <select aria-label="替换音效" value={replacementId} onChange={event=>setReplacementId(event.target.value)} disabled={busy}>
          <option value="">选择替换音效</option>
          {replacement && !options.includes(replacement) && <option value={replacement.id}>{replacement.label}（当前选择）</option>}
          {options.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
        {replacement && <audio key={replacement.id} aria-label="试听替换音效" controls src={replacement.url}/>}
        <p>保留片段位置、音量和绑定；替换文件较短时，会相应缩短音效片段。</p>
      </>}
    </>}
    {error && <p role="alert">{error} <button onClick={onRefresh} disabled={busy}>重新检查</button></p>}
    <footer><button onClick={onCancel} disabled={busy}>取消</button><button className="sfx-delete-confirm" onClick={()=>onConfirm(action,replacementId)} disabled={loading || busy || Boolean(error) || (action==='replace'&&!replacement)}>{busy?'正在处理…':action==='replace'?'替换并删除':'移除引用并删除'}</button></footer>
  </section></div>;
}
