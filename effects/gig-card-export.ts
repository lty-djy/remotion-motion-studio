/** Export browsers use a separate origin; local media must stay on the workbench API. */
export function resolveGigCardExportProps(
  props: Record<string, unknown>,
  mediaOrigin = "http://127.0.0.1:41735",
): Record<string, unknown> {
  const resolveImage = (value: unknown) => {
    if (typeof value !== "string") return value;
    if (value.startsWith("/api/media/")) return `${mediaOrigin}${value}`;
    return value.replace(
      /^http:\/\/(?:localhost|127\.0\.0\.1):300[01](?=\/api\/media\/)/i,
      mediaOrigin,
    );
  };
  const resolved = { ...props };
  for (let index = 1; index <= 4; index++) {
    const key = `card${index}ImageUrl`;
    if (key in resolved) resolved[key] = resolveImage(resolved[key]);
  }
  if (typeof props.cardsJson === "string") {
    try {
      const cards: unknown = JSON.parse(props.cardsJson);
      if (Array.isArray(cards)) {
        resolved.cardsJson = JSON.stringify(cards.map(card =>
          card && typeof card === "object"
            ? { ...card, imageUrl: resolveImage(card.imageUrl) }
            : card,
        ));
      }
    } catch {
      // Preserve malformed legacy input for the component's existing fallback.
    }
  }
  return resolved;
}
