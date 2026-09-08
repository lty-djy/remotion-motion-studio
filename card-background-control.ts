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

/* 统一入/出场动画包装器保持透明，底色只落在真实组件根节点，避免动画层撑满画布。 */
.studio-card-render-shell > [data-unified-motion-animation] {
  background: transparent !important;
  background-color: transparent !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}
.studio-card-render-shell > [data-unified-motion-animation] > * {
  background: var(--studio-card-background-fill) !important;
  background-color: var(--studio-card-background-fill) !important;
  backdrop-filter: var(--studio-card-backdrop-filter) !important;
  -webkit-backdrop-filter: var(--studio-card-backdrop-filter) !important;
}
.studio-card-render-shell.studio-card-border-override > [data-unified-motion-animation] > * {
  border-color: var(--studio-card-border-color) !important;
}
.studio-card-render-shell.studio-card-background-off > [data-unified-motion-animation] > * {
  background: transparent !important;
  background-color: transparent !important;
  border-color: transparent !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}`;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

// 复用终端教学面板的卡片底色控制；团队归因卡片默认关闭，打开后使用同一套透明度和模糊效果。
export const CARD_BACKGROUND_SUPPORTED_COMPONENT_IDS = new Set([
  "TerminalPanel",
  "ChapterBar",
  "TeamAttributionCard",
]);

export const supportsCardBackground = (componentId: unknown): boolean =>
  typeof componentId === "string" &&
  CARD_BACKGROUND_SUPPORTED_COMPONENT_IDS.has(componentId);

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


