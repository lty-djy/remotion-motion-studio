import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { MotionInstance, ResourceTrack } from './local-protocol';
import { recommendComponentSounds, type SoundChoice, type SoundMode } from './component-sound-selection';
import './component-sound-panel.css';

export type SoundPanelChange = { mode?: SoundMode; choice?: SoundChoice; volume?: number; offsetFrames?: number };
export function ComponentSoundPanel({ owner, tracks, library, fps, soundEnabled, onChange }: {
  owner: MotionInstance; tracks: ResourceTrack[]; library: SoundChoice[]; fps: number; soundEnabled: boolean;
  onChange: (change: SoundPanelChange) => void;
}) {
  const [search, setSearch] = useState('');
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState('');
  const audio = useRef<HTMLAudioElement>(null);
  const track = tracks.find(item => item.kind === 'sfx' && item.soundBinding?.instanceId === owner.id);
  const mode = owner.soundMode ?? (track ? 'manual' : 'none');
  const selected = library.find(item => item.id === track?.resourceId);
  const recommended = useMemo(() => recommendComponentSounds(owner, library), [owner.componentId, library]);
  const choices = library.filter(item => [item.label, item.id, item.category, item.usage, ...item.tags].join(' ').toLowerCase().includes(search.toLowerCase().trim()));
  useEffect(() => { const element = audio.current; return () => { element?.pause(); }; }, []);
  useEffect(() => { audio.current?.pause(); setPlaying(false); setError(''); }, [track?.resourceId, mode]);
  const recommend = () => {
    const index = recommended.findIndex(item => item.id === track?.resourceId);
    onChange({ mode: 'auto', choice: recommended[(index + 1) % recommended.length] });
  };
  return <section className="reference-inspector-section component-sound-panel" aria-label="组件音效">
    <div className="reference-section-title"><strong>组件音效</strong><small>SOUND</small></div>
    <div className="component-sound-modes" role="group" aria-label="音效模式">
      {([['none','无音效'],['auto','自动推荐'],['manual','手动选择']] as const).map(([value,label]) =>
        <button type="button" key={value} aria-pressed={mode === value} onClick={() => value === 'auto' ? recommend() : onChange({mode:value})}>{label}</button>)}
    </div>
    {mode !== 'none' && <>
      {mode === 'auto' && <div className="component-sound-hint">按组件动作匹配，已选结果会保存。<button type="button" onClick={recommend} disabled={!recommended.length}>换一个推荐</button></div>}
      {mode === 'auto' && !recommended.length && <p role="status">暂无适配推荐，可切换手动选择。</p>}
      {mode === 'manual' && <>
        <input aria-label="搜索组件音效" placeholder="搜索音效、标签或用途" value={search} onChange={event => setSearch(event.target.value)} />
        <select aria-label="选择组件音效" value={track?.resourceId ?? ''} onChange={event => {
          const choice = library.find(item => item.id === event.target.value);
          if (choice) onChange({mode:'manual',choice});
        }}>
          <option value="" disabled>请选择音效</option>
          {track && !choices.some(item => item.id === track.resourceId) && <option value={track.resourceId}>{selected?.label ?? track.name}{selected ? '（当前选择）' : '（资源缺失）'}</option>}
          {choices.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
        {!choices.length && <p role="status">没有匹配音效，可换个关键词或到音效库导入。</p>}
      </>}
      {track && <>
        <div className="component-sound-selected"><span title={selected?.label ?? track.name}>{selected?.label ?? track.name}</span>
          <button type="button" disabled={!selected} onClick={async () => {
            const element = audio.current;
            if (!element || !selected) return;
            if (playing) { element.pause(); return; }
            element.src = selected.url;
            element.volume = track.volume * (1 - track.voiceDucking);
            element.currentTime = 0;
            setError('');
            try { await element.play(); } catch { setPlaying(false); setError('无法试听，请检查音效文件。'); }
          }}>{playing ? '停止试听' : '试听音效'}</button>
        </div>
        {!selected && <p role="status">音效资源缺失，请重新选择。</p>}
        <label>音量 <b>{Math.round(track.volume * 100)}%</b><input aria-label="组件音效音量" type="range" min="0" max="100" value={Math.round(track.volume * 100)} onChange={event => {
          const volume = Number(event.target.value) / 100;
          if (audio.current) audio.current.volume = volume * (1 - track.voiceDucking);
          onChange({volume});
        }}/></label>
        <label>相对入场时间（秒）<input aria-label="组件音效时间偏移" type="number" step={1/fps} value={Number(((track.soundBinding?.offsetFrames ?? 0)/fps).toFixed(3))} onChange={event => {
          if (event.target.value !== '' && Number.isFinite(event.target.valueAsNumber)) onChange({offsetFrames:Math.round(event.target.valueAsNumber*fps)});
        }}/></label>
        <small className="component-sound-hint">负数提前，正数延后；音效跟随当前组件。</small>
        {track.muted && <p role="status">该音效轨道已静音。</p>}
      </>}
      {!soundEnabled && <p className="component-sound-hint">全局声音已关闭，时间线播放及导出将静音；仍可单独试听。</p>}
    </>}
    <audio ref={audio} aria-label="组件音效试听播放器" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onError={() => {setPlaying(false);setError('无法试听，请检查音效文件。');}} />
    {error && <p role="alert">{error}</p>}
  </section>;
}
