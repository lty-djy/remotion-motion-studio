import type { MotionComponentDefinition, MotionInstance } from './local-protocol';

const primary = ['title', 'headline', 'mainTitle', 'mainText', 'content', 'text', 'message', 'topic', 'question', 'emphasis', 'conclusion', 'lead'];
export const isReplacementContentField = (key: string) => !/json|url|path|font|icon|logo|image|video|audio|family|asset|src|class|css|code|language/i.test(key);
const defaults = (definition: MotionComponentDefinition) => ({...Object.fromEntries(Object.entries(definition.propsSchema).map(([key, schema]) => [key, schema.default])), ...definition.defaultProps});

export function buildComponentReplacement(instance: MotionInstance, old: MotionComponentDefinition | undefined, next: MotionComponentDefinition, text: string) {
  const previousDefaults = old ? defaults(old) : {};
  const props = defaults(next);
  const clauses = text.split(/[，,。.！!？?；;、：:\n]+/u).map(s => s.trim()).filter(Boolean);
  const retained = new Set<string>();
  for (const [key, schema] of Object.entries(next.propsSchema)) {
    const value = instance.props[key];
    if (old?.propsSchema[key]?.type === schema.type && value !== undefined && value !== previousDefaults[key]) {
      props[key] = value;
      retained.add(key);
    } else if (schema.type === 'text' && isReplacementContentField(key)) props[key] = '';
  }
  const main = primary.find(key => next.propsSchema[key]?.type === 'text') ?? Object.keys(next.propsSchema).find(key => next.propsSchema[key].type === 'text' && isReplacementContentField(key) && !/^(value|unit|number|index|eyebrow|label|tag|caption)$/.test(key));
  if (main && !retained.has(main)) props[main] = text;
  const numbers = [...text.matchAll(/(?:\d+(?:\.\d+)?\s*(?:倍|个|%|％|元|万|亿|人|次|天)?|[一二三四五六七八九十两]+\s*(?:倍|个|元|人|次|天))/g)];
  if (numbers.length === 1 && next.propsSchema.value?.type === 'text' && !retained.has('value')) {
    const raw = numbers[0][0].replace(/\s/g, '').replace(/(倍|个|%|％|元|万|亿|人|次|天)$/, '');
    const chinese: Record<string, string> = {一:'1',二:'2',两:'2',三:'3',四:'4',五:'5',六:'6',七:'7',八:'8',九:'9',十:'10'};
    if (/^\d+(?:\.\d+)?$/.test(raw) || chinese[raw]) {
      props.value = chinese[raw] ?? raw;
      if (next.propsSchema.unit?.type === 'text' && !retained.has('unit')) props.unit = numbers[0][0].match(/(倍|个|%|％|元|万|亿|人|次|天)$/)?.[1] ?? '';
    }
  }
  for (const [key, schema] of Object.entries(next.propsSchema)) {
    if (schema.type !== 'text' || retained.has(key)) continue;
    const sequence = /^(?:item|step|risk|point|line|feature|advantage|reason|bullet|card|row|entry)(\d+)$/.exec(key);
    if (sequence) props[key] = clauses[Number(sequence[1]) - 1] ?? '';
  }
  // Keep provenance with the instance, including projects saved without a caption track.
  if (text) props.__sourceSubtitleText = text;
  return {...instance, componentId: next.id, props};
}

export function subtitleTextForInstance(instance: MotionInstance, captions: MotionInstance[], fps: number) {
  if (typeof instance.props.__sourceSubtitleText === 'string') return instance.props.__sourceSubtitleText;
  const matching = captions.filter(c => c.componentId === 'SrtSemanticCaptions' && (!instance.arrangementBatchId || c.arrangementBatchId === instance.arrangementBatchId));
  for (const caption of matching) {
    try {
      const cues = JSON.parse(String(caption.props.cuesJson || '[]'));
      if (!Array.isArray(cues)) continue;
      const start = (instance.startFrame - caption.startFrame + caption.sourceStartFrame) / fps;
      const end = start + instance.durationInFrames / fps;
      const text = cues.filter(c => typeof c.text === 'string' && Number(c.end) > start && Number(c.start) < end).map(c => c.text).join('，');
      if (text) return text;
    } catch { /* A malformed caption source must not block replacement. */ }
  }
  return '';
}
