import { useCallback, useState, type SetStateAction } from "react";
import type { MotionInstance, ResourceTrack } from "./local-protocol";
import { syncComponentSounds } from "./component-sound-binding";

export type ComponentSoundTracks = { instances: MotionInstance[]; resourceTracks: ResourceTrack[] };
export type SoundTracksAction =
  | { type: "instances"; update: SetStateAction<MotionInstance[]> }
  | { type: "resources"; update: SetStateAction<ResourceTrack[]> };

export function updateComponentSoundTracks(state: ComponentSoundTracks, action: SoundTracksAction): ComponentSoundTracks {
  if (action.type === "instances") {
    const instances = typeof action.update === "function" ? action.update(state.instances) : action.update;
    const resourceTracks = syncComponentSounds(state.resourceTracks, instances, state.instances);
    return instances === state.instances && resourceTracks === state.resourceTracks ? state : { instances, resourceTracks };
  }
  const next = typeof action.update === "function" ? action.update(state.resourceTracks) : action.update;
  const resourceTracks = syncComponentSounds(next, state.instances);
  return resourceTracks === state.resourceTracks ? state : { ...state, resourceTracks };
}

/** 保持原有两个 setter 的调用方式，组件变更与关联音效在同一次状态更新中提交。 */
export function useComponentSoundTracks() {
  const [state, setState] = useState<ComponentSoundTracks>({ instances: [], resourceTracks: [] });
  const setInstances = useCallback((update: SetStateAction<MotionInstance[]>) => {
    setState(current => updateComponentSoundTracks(current, { type: "instances", update }));
  }, []);
  const setResourceTracks = useCallback((update: SetStateAction<ResourceTrack[]>) => {
    setState(current => updateComponentSoundTracks(current, { type: "resources", update }));
  }, []);
  return { ...state, setInstances, setResourceTracks };
}
