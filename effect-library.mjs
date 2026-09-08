// Shared by the editor, local API and AI catalog generators.
export const groupIdForName = (name) => `group:${name}`;
const legacyIds = { '空间与聚焦': 'spatial', '竖屏口播信息层': 'portrait-narrative', '品牌与标识': 'brand', '终端教学 HUD': 'hud', '风险提醒': 'warning', '媒体展示组件': 'media', '图表与比较': 'comparison', '数字与指标': 'metric', '口播HUD常驻卡': 'hud-overlay', '章节进度条': 'chapter', '其他': 'other' };

export function migrateLibrary(catalog, legacy = {}) {
  const palette = ['#4f9dff', '#27c4e8', '#20d7a0', '#f2b93d', '#a776f7', '#ff7c96', '#b5f23d'];
  const groups = catalog.map((g, index) => ({
    id: groupIdForName(g.name),
    name: legacy.names?.[g.id] ?? legacy.names?.[legacyIds[g.name]] ?? g.name,
    color: legacy.colors?.[g.id] ?? legacy.colors?.[legacyIds[g.name]] ?? palette[index % palette.length],
  }));
  for (const g of legacy.custom ?? []) {
    if (!groups.some((item) => item.id === g.id)) groups.push({ ...g, color: legacy.colors?.[g.id] ?? palette[groups.length % palette.length] });
  }
  const aliases = new Map(catalog.map((g) => [g.id, groupIdForName(g.name)]));
  for (const [name, id] of Object.entries(legacyIds)) aliases.set(id, groupIdForName(name));
  // These IDs were derived from semantic categories, not group identity.
  aliases.set('portrait-narrative', groupIdForName('竖屏口播信息层'));
  aliases.set('brand', groupIdForName('品牌与标识'));
  const resolveId = (id) => aliases.get(id) ?? id;
  const assignments = {};
  for (const g of catalog) for (const item of g.items) {
    assignments[item.ids[0]] = groupIdForName(g.name);
  }
  for (const [id, group] of Object.entries(legacy.assignments ?? {})) {
    const target = resolveId(group);
    if (groups.some((g) => g.id === target)) assignments[id] = target;
  }
  const order = (legacy.order ?? []).map(resolveId);
  groups.sort((a, b) => {
    const rank = (id) => order.includes(id) ? order.indexOf(id) : order.length;
    return rank(a.id) - rank(b.id);
  });
  return { version: 1, groups, assignments };
}

export function validateLibrary(value, previous) {
  if (value?.version !== 1 || !Array.isArray(value.groups) || !value.assignments || Array.isArray(value.assignments)) throw new Error('分组配置格式无效');
  const ids = new Set();
  for (const g of value.groups) {
    if (typeof g.id !== 'string' || !g.id || ids.has(g.id) || typeof g.name !== 'string' || !g.name.trim()) throw new Error('分组 ID 重复或名称无效');
    if (g.color !== undefined && !/^#[0-9a-f]{6}$/i.test(g.color)) throw new Error('分组颜色无效');
    ids.add(g.id);
  }
  for (const [id, group] of Object.entries(value.assignments)) {
    if (!id || !ids.has(group)) throw new Error('组件指向不存在的分组');
  }
  for (const [id, group] of Object.entries(previous?.assignments ?? {})) {
    if (!ids.has(group) && !value.assignments[id]) throw new Error('请先移动组内组件，再删除分组');
  }
  return value;
}

export function applyLibraryToRegistry(registry, library) {
  if (!library) return registry;
  const names = new Map(library.groups.map((g) => [g.id, g.name]));
  return registry.map((definition) => ({ ...definition, catalogGroup:
    definition.semantic?.systemRole === 'caption-track' ? '系统字幕' :
    names.get(library.assignments[definition.id]) ?? '未分组',
  }));
}
