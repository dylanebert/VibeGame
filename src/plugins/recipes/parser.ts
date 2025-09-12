import type { ParsedElement, Recipe, State, XMLValue } from '../../core';
import { toCamelCase } from '../../core';
import { formatUnknownAttribute, formatUnknownElement } from './diagnostics';
import { parseComponentProperties } from './property-parser';
import { expandShorthands } from './shorthand-expander';
import type { EntityCreationResult } from './types';

type ComponentWithFields = Record<
  string,
  Float32Array | Int32Array | Uint8Array
>;

function toNumber(value: XMLValue): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  if (typeof value === 'boolean') return value ? 1 : 0;
  return 0;
}

export function createEntityFromRecipe(
  state: State,
  recipeName: string,
  attributes: Record<string, XMLValue> = {}
): number {
  const recipe = state.getRecipe(recipeName);
  if (!recipe) {
    const availableRecipes = Array.from(state.getRecipeNames());
    const message = formatUnknownElement(recipeName, availableRecipes);
    throw new Error(message);
  }

  const entity = state.createEntity();

  if (recipe.components) {
    for (const componentName of recipe.components) {
      const component = state.getComponent(componentName);
      if (component) {
        state.addComponent(entity, component);
      }
    }
  }

  if (recipe.components) {
    for (const componentName of recipe.components) {
      const component = state.getComponent(componentName);
      if (component) {
        const componentDefaults = state.config.getDefaults(componentName);
        for (const [fieldName, value] of Object.entries(componentDefaults)) {
          if (fieldName in component) {
            (component as ComponentWithFields)[fieldName][entity] = value;
          }
        }
      }
    }
  }

  if (recipe.overrides) {
    for (const [path, value] of Object.entries(recipe.overrides)) {
      const [componentName, fieldName] = path.split('.');
      const component = state.getComponent(componentName);
      if (component) {
        if (!state.hasComponent(entity, component)) {
          state.addComponent(entity, component);
        }
        const camelField = toCamelCase(fieldName);
        if (camelField in component) {
          (component as ComponentWithFields)[camelField][entity] = value;
        }
      }
    }
  }

  applyAttributesFromRecipe(entity, recipe, attributes, state);

  return entity;
}

function setComponentField(
  entity: number,
  component: ComponentWithFields,
  fieldName: string,
  value: XMLValue
): boolean {
  const camelField = toCamelCase(fieldName);
  if (camelField in component) {
    component[camelField][entity] = toNumber(value);
    return true;
  }
  return false;
}

function applyAttribute(
  entity: number,
  recipe: Recipe,
  attrName: string,
  attrValue: XMLValue,
  state: State
): boolean {
  if (attrName.includes('.')) {
    const [componentName, fieldName] = attrName.split('.');
    const component = state.getComponent(componentName);
    return component
      ? setComponentField(
          entity,
          component as ComponentWithFields,
          fieldName,
          attrValue
        )
      : false;
  }

  if (recipe.components) {
    for (const componentName of recipe.components) {
      const component = state.getComponent(componentName);
      if (
        component &&
        setComponentField(
          entity,
          component as ComponentWithFields,
          attrName,
          attrValue
        )
      ) {
        return true;
      }
    }
  }

  return false;
}

function getAvailableAttributes(recipe: Recipe, state: State): string[] {
  const attrs: Set<string> = new Set();

  if (recipe.components) {
    for (const componentName of recipe.components) {
      const shorthands = state.config.getShorthands(componentName);
      for (const shorthand of Object.keys(shorthands)) {
        attrs.add(shorthand);
      }
    }
  }

  for (const componentName of state.getComponentNames()) {
    attrs.add(componentName);
  }

  if (recipe.components) {
    for (const componentName of recipe.components) {
      const component = state.getComponent(componentName);
      if (component) {
        attrs.add(componentName);

        for (const field in component as ComponentWithFields) {
          if (
            typeof (component as ComponentWithFields)[field] !== 'function' &&
            !field.startsWith('_')
          ) {
            const kebabField = field.replace(/([A-Z])/g, '-$1').toLowerCase();
            attrs.add(`${componentName}.${kebabField}`);

            attrs.add(kebabField);
          }
        }
      }
    }
  }

  attrs.add('id');

  return Array.from(attrs).sort();
}

function applyAttributesFromRecipe(
  entity: number,
  recipe: Recipe,
  attributes: Record<string, XMLValue>,
  state: State
): void {
  const expandedAttributes = expandShorthands(attributes, recipe, state);

  for (const rule of state.config.getValidations()) {
    if (rule.condition(recipe.name, expandedAttributes)) {
      console.warn(`[${recipe.name}] Warning: ${rule.warning}`);
    }
  }

  for (const [attrName, attrValue] of Object.entries(expandedAttributes)) {
    if (attrName === 'id') continue;

    const component = state.getComponent(attrName);
    if (component && typeof attrValue === 'string') {
      if (!state.hasComponent(entity, component)) {
        state.addComponent(entity, component);

        const componentDefaults = state.config.getDefaults(attrName);
        for (const [fieldName, value] of Object.entries(componentDefaults)) {
          if (fieldName in component) {
            (component as ComponentWithFields)[fieldName][entity] = value;
          }
        }
      }

      const parsed = parseComponentProperties(
        attrName,
        attrValue,
        component as ComponentWithFields,
        state
      );

      for (const [fieldName, value] of Object.entries(parsed)) {
        if (fieldName in component) {
          (component as ComponentWithFields)[fieldName][entity] = value;
        }
      }
    } else {
      const handled = applyAttribute(
        entity,
        recipe,
        attrName,
        attrValue,
        state
      );

      if (!handled) {
        const availableAttrs = getAvailableAttributes(recipe, state);
        const availableShorthands: string[] = [];

        if (recipe.components) {
          for (const componentName of recipe.components) {
            const shorthands = state.config.getShorthands(componentName);
            availableShorthands.push(...Object.keys(shorthands));
          }
        }

        for (const [key] of Object.entries(expandedAttributes)) {
          if (state.getComponent(key)) {
            const shorthands = state.config.getShorthands(key);
            for (const shorthand of Object.keys(shorthands)) {
              if (!availableShorthands.includes(shorthand)) {
                availableShorthands.push(shorthand);
              }
            }
          }
        }

        const warning = formatUnknownAttribute(
          attrName,
          recipe.name,
          availableAttrs,
          availableShorthands
        );
        console.warn(warning);
      }
    }
  }
}

export function parseXMLToEntities(
  state: State,
  xmlContent: ParsedElement
): EntityCreationResult[] {
  const results: EntityCreationResult[] = [];

  function processElement(element: ParsedElement): EntityCreationResult | null {
    if (state.hasRecipe(element.tagName)) {
      const entity = createEntityFromRecipe(
        state,
        element.tagName,
        element.attributes
      );

      const childResults: EntityCreationResult[] = [];
      for (const childElement of element.children) {
        const parser = state.getParser(childElement.tagName);
        if (parser) {
          parser(entity, childElement, state);
        } else if (state.hasRecipe(childElement.tagName)) {
          const childResult = processElement(childElement);
          if (childResult) {
            childResults.push(childResult);

            const childEntity = childResult.entity;
            const Parent = state.getComponent('parent');
            const Transform = state.getComponent('transform');

            if (Parent && Transform) {
              if (!state.hasComponent(entity, Transform)) {
                console.warn(
                  `[${element.tagName}] Parent entity is missing Transform component. Adding automatically.\n` +
                    `  Consider adding transform="pos: 0 0 0" to the parent element.`
                );
                state.addComponent(entity, Transform);
                const defaults = state.config.getDefaults('transform');
                for (const [fieldName, value] of Object.entries(defaults)) {
                  if (fieldName in Transform) {
                    (Transform as ComponentWithFields)[fieldName][entity] =
                      value;
                  }
                }
              }

              if (!state.hasComponent(childEntity, Transform)) {
                console.warn(
                  `[${childElement.tagName}] Child entity is missing Transform component. Adding automatically.\n` +
                    `  Consider adding transform="pos: 0 0 0" to the child element.`
                );
                state.addComponent(childEntity, Transform);
                const defaults = state.config.getDefaults('transform');
                for (const [fieldName, value] of Object.entries(defaults)) {
                  if (fieldName in Transform) {
                    (Transform as ComponentWithFields)[fieldName][childEntity] =
                      value;
                  }
                }
              }

              state.addComponent(childEntity, Parent);
              (Parent as ComponentWithFields).entity[childEntity] = entity;

              const Body = state.getComponent('body');
              if (Body) {
                if (
                  state.hasComponent(entity, Body) &&
                  state.hasComponent(childEntity, Body)
                ) {
                  console.warn(
                    `[Physics Warning] "${childElement.tagName}" has a Body component and is nested inside "${element.tagName}" which also has a Body component.\n` +
                      `This configuration is not supported - a physics body should not be a child of another physics body.\n` +
                      `Consider one of these solutions:\n` +
                      `  1. Remove the Body component from the child (keep only Collider if needed)\n` +
                      `  2. Make "${childElement.tagName}" a sibling of "${element.tagName}" instead of a child\n` +
                      `  3. Use physics constraints or joints to connect separate bodies`
                  );
                }
              }
            }
          }
        } else {
          const availableRecipes = Array.from(state.getRecipeNames());
          const message = formatUnknownElement(
            childElement.tagName,
            availableRecipes
          );
          throw new Error(
            message +
              '\n  Note: Components must be specified as attributes, not child elements.' +
              '\n  Example: <entity transform="pos: 0 5 0" renderer="shape: box"></entity>'
          );
        }
      }

      return {
        entity,
        tagName: element.tagName,
        children: childResults,
      };
    }

    return null;
  }

  if (xmlContent.children.length > 0) {
    for (const child of xmlContent.children) {
      const result = processElement(child);
      if (result) {
        results.push(result);
      } else {
        const availableRecipes = Array.from(state.getRecipeNames());
        const message = formatUnknownElement(child.tagName, availableRecipes);
        throw new Error(message);
      }
    }
  } else {
    const result = processElement(xmlContent);
    if (result) {
      results.push(result);
    } else {
      const availableRecipes = Array.from(state.getRecipeNames());
      const message = formatUnknownElement(
        xmlContent.tagName,
        availableRecipes
      );
      throw new Error(message);
    }
  }

  return results;
}
