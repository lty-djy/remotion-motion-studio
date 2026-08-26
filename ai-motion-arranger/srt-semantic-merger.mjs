const DEFAULT_OPTIONS = Object.freeze({
  maxGapMs: 350,
  minTextLength: 14,
  maxTextLength: 40,
  maxDurationMs: 5200,
});

const TERMINAL_PUNCTUATION = /[。！？!?；;]$/u;
const INCOMPLETE_ENDING =
  /(?:只有这种|只会|才是|就是|包括|通过|需要|能够|可以|为了|因为|所以|以及|并且|同时|然后|接着|比如|例如)$/u;
const CONTINUATION_START =
  /^(?:才是|才能|才会|就会|因此|所以|以及|并且|同时|然后|接着|最后|从而|进而|也就是)/u;
const OUTCOME_PHRASE =
  /(?:稳定|更高|更低|增长|提升|突破|实现|达成|成交|转化|获客|赚钱|盈利|回本|降本|增效)/u;

const normalizeText = (value) =>
  String(value ?? "")
    .replace(/<[^>]+>/gu, "")
    .replace(/\s+/gu, " ")
    .trim();

const visibleLength = (text) =>
  normalizeText(text).replace(/[\s，,。！？!?；;：:、…]/gu, "").length;

const withoutTerminalPunctuation = (text) =>
  text.replace(/[，,。！？!?；;：:、…]+$/u, "");

const joinTexts = (left, right) => {
  if (!left) return right;
  if (!right) return left;
  return TERMINAL_PUNCTUATION.test(left) || /^[，,。！？!?；;：:、]/u.test(right)
    ? `${left}${right}`
    : `${left}，${right}`;
};

const looksParallel = (left, right) => {
  const bothUseActionPattern = /做/u.test(left) && /做/u.test(right);
  const bothDescribeOutcomes =
    !/做/u.test(left) && OUTCOME_PHRASE.test(left) && OUTCOME_PHRASE.test(right);
  const shortParallelPair =
    !/做/u.test(left) &&
    visibleLength(left) <= 8 &&
    visibleLength(right) <= 10 &&
    /^(?:客流|客单|利润|业绩|成本|效率|速度|销量|转化|复购|轻松|快速|持续)/u.test(
      right,
    );
  return bothUseActionPattern || bothDescribeOutcomes || shortParallelPair;
};

const mergeReasonFor = (group, next, options) => {
  const previous = group.sourceEntries.at(-1);
  const gapMs = Math.max(0, next.startMs - previous.endMs);
  if (gapMs > options.maxGapMs) return null;

  const nextText = normalizeText(next.text);
  const joinedText = joinTexts(group.text, nextText);
  if (
    next.endMs - group.startMs > options.maxDurationMs ||
    visibleLength(joinedText) > options.maxTextLength
  ) {
    return null;
  }
  if (TERMINAL_PUNCTUATION.test(group.text)) return null;

  const previousText = withoutTerminalPunctuation(normalizeText(previous.text));
  if (INCOMPLETE_ENDING.test(previousText)) return "unfinished-phrase";
  if (CONTINUATION_START.test(nextText)) return "continuation";
  if (looksParallel(previousText, nextText)) return "parallel-phrases";
  if (visibleLength(group.text) < options.minTextLength) return "short-context";
  return null;
};

const createGroup = (entry) => ({
  index: entry.index,
  startMs: entry.startMs,
  endMs: entry.endMs,
  text: normalizeText(entry.text),
  sourceCueIndices: [entry.index],
  sourceEntries: [{ ...entry, text: normalizeText(entry.text) }],
  mergeReasons: [],
});

export const mergeSrtEntriesForSemanticAnalysis = (
  entries,
  optionsOverride = {},
) => {
  const options = { ...DEFAULT_OPTIONS, ...optionsOverride };
  const normalized = entries
    .map((entry, position) => ({
      ...entry,
      index: Number.isFinite(entry.index) ? entry.index : position + 1,
      startMs: Number(entry.startMs),
      endMs: Number(entry.endMs),
      text: normalizeText(entry.text),
    }))
    .filter(
      (entry) =>
        entry.text &&
        Number.isFinite(entry.startMs) &&
        Number.isFinite(entry.endMs) &&
        entry.endMs > entry.startMs,
    )
    .sort((left, right) => left.startMs - right.startMs || left.index - right.index);

  const groups = [];
  for (const entry of normalized) {
    const current = groups.at(-1);
    if (!current) {
      groups.push(createGroup(entry));
      continue;
    }
    const reason = mergeReasonFor(current, entry, options);
    if (!reason) {
      groups.push(createGroup(entry));
      continue;
    }
    current.text = joinTexts(current.text, entry.text);
    current.endMs = entry.endMs;
    current.sourceCueIndices.push(entry.index);
    current.sourceEntries.push(entry);
    current.mergeReasons.push(reason);
  }

  return groups;
};

export const summarizeSrtSemanticMerge = (sourceEntries, semanticEntries) => ({
  sourceCueCount: sourceEntries.length,
  semanticSegmentCount: semanticEntries.length,
  mergedCueCount: semanticEntries.reduce(
    (count, entry) => count + Math.max(0, entry.sourceCueIndices.length - 1),
    0,
  ),
});
