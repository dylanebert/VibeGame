import type { Component, Recipe, State, XMLValue } from '../../core';

export function expandShorthands(
  attributes: Record<string, XMLValue>,
  recipe: Recipe,
  state: State
): Record<string, XMLValue> {
  const expanded: Record<string, XMLValue> = {};
  const componentProps: Record<string, Record<string, string>> = {};

  const presentComponents = new Set<string>();

  if (recipe.components) {
    for (const componentName of recipe.components) {
      presentComponents.add(componentName);
    }
  }

  for (const attrName of Object.keys(attributes)) {
    if (state.getComponent(attrName)) {
      presentComponents.add(attrName);
    }
  }

  for (const [key, value] of Object.entries(attributes)) {
    const stringValue = valueToString(value);
    let handled = false;

    for (const componentName of presentComponents) {
      const component = state.getComponent(componentName);
      if (!component) continue;

      const explicitShorthands = state.config.getShorthands(componentName);

      if (explicitShorthands[key]) {
        const target = explicitShorthands[key];
        if (typeof target === 'string') {
          if (
            tryExpandProperty(
              componentName,
              target,
              stringValue,
              component,
              componentProps
            )
          ) {
            handled = true;
          }
        }
      } else if (
        tryExpandProperty(
          componentName,
          key,
          stringValue,
          component,
          componentProps
        )
      ) {
        handled = true;
      }
    }

    if (!handled) {
      expanded[key] = value;
    }
  }

  for (const [componentName, props] of Object.entries(componentProps)) {
    const propsString = Object.entries(props)
      .map(([field, val]) => `${field}: ${val}`)
      .join('; ');

    if (componentName in expanded) {
      const existing = expanded[componentName];
      if (typeof existing === 'string' && existing.trim()) {
        expanded[componentName] = `${propsString}; ${existing}`;
      } else {
        expanded[componentName] = propsString;
      }
    } else {
      expanded[componentName] = propsString;
    }
  }

  return expanded;
}

function valueToString(value: XMLValue): string {
  if (typeof value === 'string') {
    return value;
  } else if (typeof value === 'object' && value !== null && 'x' in value) {
    const vec = value as Record<string, number>;
    if ('w' in vec) {
      return `${vec.x} ${vec.y} ${vec.z} ${vec.w}`;
    } else if ('z' in vec) {
      return `${vec.x} ${vec.y} ${vec.z}`;
    } else {
      return `${vec.x} ${vec.y}`;
    }
  } else {
    return String(value);
  }
}

function tryExpandProperty(
  componentName: string,
  propertyName: string,
  value: string,
  component: Component,
  componentProps: Record<string, Record<string, string>>
): boolean {
  const camelName = propertyName.replace(/-([a-z])/g, (_, letter) =>
    letter.toUpperCase()
  );

  const hasX = `${camelName}X` in component;
  const hasY = `${camelName}Y` in component;
  const hasZ = `${camelName}Z` in component;
  const hasW = `${camelName}W` in component;

  if (hasX && hasY && hasZ) {
    if (!componentProps[componentName]) {
      componentProps[componentName] = {};
    }

    const parts = value.trim().split(/\s+/);

    if (hasW && parts.length === 4) {
      componentProps[componentName][`${propertyName}-x`] = parts[0];
      componentProps[componentName][`${propertyName}-y`] = parts[1];
      componentProps[componentName][`${propertyName}-z`] = parts[2];
      componentProps[componentName][`${propertyName}-w`] = parts[3];
      return true;
    } else if (parts.length === 3 || parts.length === 1) {
      const values = parseVector3(value);
      componentProps[componentName][`${propertyName}-x`] = String(values[0]);
      componentProps[componentName][`${propertyName}-y`] = String(values[1]);
      componentProps[componentName][`${propertyName}-z`] = String(values[2]);
      return true;
    }
  } else if (camelName in component) {
    if (!componentProps[componentName]) {
      componentProps[componentName] = {};
    }
    componentProps[componentName][propertyName] = value;
    return true;
  }

  return false;
}

export function parseVector3(value: string): number[] {
  const parts = value
    .trim()
    .split(/\s+/)
    .map((v) => parseFloat(v) || 0);
  if (parts.length === 1) {
    return [parts[0], parts[0], parts[0]];
  } else if (parts.length === 3) {
    return parts;
  }
  throw new Error(
    `Invalid vector3 value: "${value}". Expected 1 or 3 numbers.`
  );
}
