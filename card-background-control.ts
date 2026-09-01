export const CARD_BACKGROUND_CONTROL_CSS = `
.studio-card-render-shell > * {
  background: var(--studio-card-background-fill) !important;
  background-color: var(--studio-card-background-fill) !important;
  backdrop-filter: var(--studio-card-backdrop-filter) !important;
  -webkit-backdrop-filter: var(--studio-card-backdrop-filter) !important;
}

.studio-card-render-shell > *:has([data-card-surface]) {
  background: transparent !important;
  background-color: transparent !important;
  border-color: transparent !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

.studio-card-render-shell [data-card-surface] {
  background: var(--studio-card-background-fill) !important;
  background-color: var(--studio-card-background-fill) !important;
  backdrop-filter: var(--studio-card-backdrop-filter) !important;
  -webkit-backdrop-filter: var(--studio-card-backdrop-filter) !important;
}

.studio-card-render-shell.studio-card-border-override > *,
.studio-card-render-shell.studio-card-border-override [data-card-surface] {
  border-color: var(--studio-card-border-color) !important;
}

.studio-card-render-shell.studio-card-background-off > *,
.studio-card-render-shell.studio-card-background-off [data-card-surface] {
  background: transparent !important;
  background-color: transparent !important;
  border-color: transparent !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}
`;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export const getCardBackgroundControlVariables = ({
  enabled,
  opacity,
  panelColor,
  borderColor,
}: {
  enabled: boolean;
  opacity: number;
  panelColor: unknown;
  borderColor: unknown;
}) => {
  const factor = enabled ? clamp01(Number(opacity) || 0) : 0;
  const safePanelColor =
    typeof panelColor === "string" && panelColor.trim()
      ? panelColor.trim()
      : "#111318";
  const safeBorderColor =
    typeof borderColor === "string" && borderColor.trim()
      ? borderColor.trim()
      : "";

  return {
    "--studio-card-background-fill": `color-mix(in srgb, ${safePanelColor} ${(factor * 100).toFixed(2)}%, transparent)`,
    "--studio-card-backdrop-filter":
      factor > 0 ? `blur(${(factor * 8).toFixed(2)}px)` : "none",
    ...(safeBorderColor
      ? {
          "--studio-card-border-color": enabled
            ? safeBorderColor
            : "transparent",
        }
      : {}),
  };
};
