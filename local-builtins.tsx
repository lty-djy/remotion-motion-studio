import type { MotionComponentDefinition } from "./local-protocol";
import { EFFECT_REGISTRY, EFFECT_REGISTRY_BY_ID } from "./registry";

export type BuiltInCatalogItem = {
  ids: string[];
  name: string;
};

export type BuiltInCatalogCategory = {
  id: string;
  name: string;
  items: BuiltInCatalogItem[];
};

const categoryIds = new Map<string, string>();

export const BUILT_IN_CATALOG: BuiltInCatalogCategory[] = Array.from(
  EFFECT_REGISTRY.reduce((groups, definition) => {
    const current = groups.get(definition.catalogGroup) ?? [];
    current.push({ ids: [definition.id], name: definition.name });
    groups.set(definition.catalogGroup, current);
    if (!categoryIds.has(definition.catalogGroup)) {
      categoryIds.set(definition.catalogGroup, definition.category);
    }
    return groups;
  }, new Map<string, BuiltInCatalogItem[]>()),
).map(([name, items]) => ({
  id: categoryIds.get(name) ?? name,
  name,
  items,
}));

export const BUILT_IN_COMPONENT_COUNT = EFFECT_REGISTRY.length;
export const BUILT_IN_COMPONENT_IDS = new Set(EFFECT_REGISTRY_BY_ID.keys());
export const BUILT_IN_DEFINITIONS: MotionComponentDefinition[] = EFFECT_REGISTRY;

export const isBuiltInDefinition = (
  definition: MotionComponentDefinition,
) => EFFECT_REGISTRY_BY_ID.get(definition.id)?.component === definition.component;

export const mergeWithBuiltInDefinitions = (
  importedDefinitions: MotionComponentDefinition[],
) => {
  const importedIds = new Set(importedDefinitions.map((definition) => definition.id));
  return [
    ...importedDefinitions,
    ...EFFECT_REGISTRY.filter((definition) => !importedIds.has(definition.id)),
  ];
};
