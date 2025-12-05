import type { Parser, ParsedElement, State } from '../../core';
import { ParseContext } from '../../core/recipes';
import { Group, Member } from './components';
import { StrategyNames } from './utils';

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  return 0;
}

function processChildElement(
  child: ParsedElement,
  groupEntity: number,
  index: number,
  state: State,
  context: ParseContext
): number | null {
  if (!state.hasRecipe(child.tagName)) return null;

  const recipe = state.getRecipe(child.tagName);
  const childEntity = state.createEntity();

  if (recipe?.components) {
    for (const componentName of recipe.components) {
      const component = state.getComponent(componentName);
      if (component) {
        state.addComponent(childEntity, component);
        const defaults = state.config.getDefaults(componentName);
        for (const [fieldName, value] of Object.entries(defaults)) {
          if (fieldName in component) {
            (component as Record<string, Float32Array>)[fieldName][
              childEntity
            ] = value as number;
          }
        }
      }
    }
  }

  for (const [attrName, attrValue] of Object.entries(child.attributes)) {
    if (attrName === 'name' && typeof attrValue === 'string') {
      context.setName(attrValue, childEntity);
      continue;
    }

    const component = state.getComponent(attrName);
    if (component) {
      if (!state.hasComponent(childEntity, component)) {
        state.addComponent(childEntity, component);
        const defaults = state.config.getDefaults(attrName);
        for (const [fieldName, value] of Object.entries(defaults)) {
          if (fieldName in component) {
            (component as Record<string, Float32Array>)[fieldName][
              childEntity
            ] = value as number;
          }
        }
      }

      if (typeof attrValue === 'string') {
        const fields = attrValue.split(';').map((s) => s.trim());
        for (const field of fields) {
          if (!field) continue;
          const colonIndex = field.indexOf(':');
          if (colonIndex === -1) continue;

          const key = field.slice(0, colonIndex).trim();
          const val = field.slice(colonIndex + 1).trim();
          const camelKey = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
          const cmp = component as Record<string, Float32Array>;

          const isVector3 =
            `${camelKey}X` in cmp &&
            `${camelKey}Y` in cmp &&
            `${camelKey}Z` in cmp;

          if (isVector3) {
            const values = val.split(/\s+/).map(parseFloat);
            if (values.length === 1) {
              cmp[`${camelKey}X`][childEntity] = values[0];
              cmp[`${camelKey}Y`][childEntity] = values[0];
              cmp[`${camelKey}Z`][childEntity] = values[0];
            } else if (values.length === 3) {
              cmp[`${camelKey}X`][childEntity] = values[0];
              cmp[`${camelKey}Y`][childEntity] = values[1];
              cmp[`${camelKey}Z`][childEntity] = values[2];
            }
          } else if (camelKey in cmp) {
            const values = val.split(/\s+/).map(parseFloat);
            if (values.length === 1) {
              cmp[camelKey][childEntity] = values[0];
            }
          }
        }
      }
    }
  }

  const Transform = state.getComponent('transform');
  if (Transform && !state.hasComponent(childEntity, Transform)) {
    state.addComponent(childEntity, Transform);
    const defaults = state.config.getDefaults('transform');
    for (const [fieldName, value] of Object.entries(defaults)) {
      if (fieldName in Transform) {
        (Transform as Record<string, Float32Array>)[fieldName][childEntity] =
          value as number;
      }
    }
  }

  const Parent = state.getComponent('parent');
  if (Parent) {
    state.addComponent(childEntity, Parent);
    (Parent as Record<string, Float32Array>).entity[childEntity] = groupEntity;
  }

  state.addComponent(childEntity, Member);
  Member.group[childEntity] = groupEntity;
  Member.index[childEntity] = index;

  return childEntity;
}

export const arrangeParser: Parser = ({ entity, element, state, context }) => {
  if (element.tagName !== 'arrange') return;

  state.addComponent(entity, Group);

  const strategy = element.attributes.strategy as string | undefined;
  if (strategy && strategy in StrategyNames) {
    Group.strategy[entity] = StrategyNames[strategy];
  }

  const gap = element.attributes.gap;
  if (gap !== undefined) {
    Group.gap[entity] = toNumber(gap);
  }

  const weight = element.attributes.weight;
  if (weight !== undefined) {
    Group.weight[entity] = toNumber(weight);
  }

  const name = element.attributes.name as string | undefined;
  if (name) {
    context.setName(name, entity);
  }

  let memberCount = 0;
  for (const child of element.children) {
    const childEntity = processChildElement(
      child,
      entity,
      memberCount,
      state,
      context
    );
    if (childEntity !== null) {
      memberCount++;
    }
  }

  Group.count[entity] = memberCount;
};
