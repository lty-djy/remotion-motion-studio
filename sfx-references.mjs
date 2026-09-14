/** Browser/server shared: only known sound references are rewritten. */
export function soundReferences(snapshot, soundId, scope = '') {
  const result = [];
  const walk = (value, label) => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value.resourceTracks)) {
      const owners = value.instances ?? value.motionInstances ?? [];
      for (const track of value.resourceTracks) {
        if (track.kind !== 'sfx' || track.resourceId !== soundId) continue;
        const owner = owners.find(item => item.id === track.soundBinding?.instanceId);
        result.push({ scope: label, trackId: track.id, instanceId: owner?.id,
          componentId: owner?.componentId, name: owner?.semanticLabel || owner?.componentId || track.name || '独立音效',
          startFrame: track.startFrame, bound: Boolean(track.soundBinding) });
      }
    }
    for (const [key, child] of Object.entries(value)) {
      if (['resourceTracks', 'instances', 'motionInstances'].includes(key)) continue;
      if (child && typeof child === 'object') walk(child, key === 'workspaceDraft' ? '已保存工作区' : label);
    }
  };
  walk(snapshot, scope);
  return result;
}

export function rewriteSoundReferences(snapshot, soundId, replacement = null, fps = 30) {
  if (!snapshot || typeof snapshot !== 'object') return snapshot;
  if (Array.isArray(snapshot)) return snapshot.map(item => rewriteSoundReferences(item, soundId, replacement, fps));
  const output = { ...snapshot };
  const removedIds = new Set();
  const ownerIds = new Set();
  if (Array.isArray(snapshot.resourceTracks)) {
    output.resourceTracks = snapshot.resourceTracks.flatMap(track => {
      if (track.kind !== 'sfx' || track.resourceId !== soundId) return [track];
      if (!replacement) {
        removedIds.add(track.id);
        if (track.soundBinding?.instanceId) ownerIds.add(track.soundBinding.instanceId);
        return [];
      }
      const sourceDurationInFrames = Math.max(3, Math.round((replacement.durationSeconds ?? replacement.media?.durationSeconds ?? 1) * fps));
      const sourceStartFrame = Math.min(track.sourceStartFrame ?? 0, Math.max(0, sourceDurationInFrames - 3));
      return [{ ...track, resourceId: replacement.id, name: replacement.label, url: replacement.url,
        mimeType: replacement.mimeType, sourceDurationInFrames, sourceStartFrame,
        durationInFrames: Math.max(3, Math.min(track.durationInFrames, sourceDurationInFrames - sourceStartFrame)) }];
    });
    for (const field of ['instances', 'motionInstances']) {
      if (Array.isArray(snapshot[field])) output[field] = snapshot[field].map(owner =>
        ownerIds.has(owner.id) && !output.resourceTracks.some(track => track.soundBinding?.instanceId === owner.id)
          ? { ...owner, soundMode: 'none' } : owner);
    }
    if (Array.isArray(snapshot.selectedKeys)) output.selectedKeys = snapshot.selectedKeys.filter(key => !removedIds.has(String(key).replace(/^resource:/, '')));
  }
  for (const [key, child] of Object.entries(snapshot)) {
    if (['resourceTracks', 'instances', 'motionInstances', 'selectedKeys'].includes(key)) continue;
    if (key === 'sfxIds' && Array.isArray(child)) {
      output[key] = [...new Set(child.flatMap(id => id === soundId ? replacement ? [replacement.id] : [] : [id]))];
    } else if (child && typeof child === 'object') output[key] = rewriteSoundReferences(child, soundId, replacement, fps);
  }
  return output;
}
