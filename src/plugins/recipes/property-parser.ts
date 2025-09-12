import type { State } from '../../core';
import { eulerToQuaternion, quaternionToEuler } from '../transforms';
import {
  formatEnumError,
  formatPropertyError,
  formatSyntaxError,
  formatTypeMismatch,
  formatValueCountError,
  getComponentProperties,
} from './diagnostics';

export interface PropertyParseResult {
  [fieldName: string]: number;
}

type ComponentWithFields = Record<
  string,
  Float32Array | Int32Array | Uint8Array | Uint16Array | Uint32Array
>;

function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function parseValue(value: string): number | string {
  value = value.trim();

  // Hex color with 0x prefix
  if (value.startsWith('0x')) {
    return parseInt(value, 16);
  }

  // Hex color with # prefix
  if (value.startsWith('#')) {
    return parseInt(value.slice(1), 16);
  }

  // Boolean
  if (value === 'true') return 1;
  if (value === 'false') return 0;

  // Number
  const num = parseFloat(value);
  if (!isNaN(num)) return num;

  // String (for enum lookups)
  return value;
}

function parseValues(valueStr: string): (number | string)[] {
  return valueStr.trim().split(/\s+/).map(parseValue);
}

function detectVector3Pattern(
  component: ComponentWithFields,
  baseName: string
): boolean {
  const baseX = `${baseName}X`;
  const baseY = `${baseName}Y`;
  const baseZ = `${baseName}Z`;

  return baseX in component && baseY in component && baseZ in component;
}

function detectQuaternionPattern(
  component: ComponentWithFields,
  baseName: string
): boolean {
  const baseX = `${baseName}X`;
  const baseY = `${baseName}Y`;
  const baseZ = `${baseName}Z`;
  const baseW = `${baseName}W`;

  return (
    baseX in component &&
    baseY in component &&
    baseZ in component &&
    baseW in component
  );
}

function getEnumValue(
  componentName: string,
  propertyName: string,
  value: string,
  state: State
): number | null {
  const enums = state.config.getEnums(componentName);
  if (enums && enums[propertyName]) {
    const enumMapping = enums[propertyName];
    const normalizedValue = value.toLowerCase();

    if (normalizedValue in enumMapping) {
      return enumMapping[normalizedValue];
    }

    const validOptions = Object.keys(enumMapping);
    const error = formatEnumError(
      componentName,
      propertyName,
      value,
      validOptions
    );
    throw new Error(error);
  }
  return null;
}

export function parseComponentProperties(
  componentName: string,
  propertyString: string,
  component: ComponentWithFields,
  state: State
): PropertyParseResult {
  const result: PropertyParseResult = {};

  const properties = propertyString
    .split(';')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  for (const property of properties) {
    const colonIndex = property.indexOf(':');
    if (colonIndex === -1) {
      const error = formatSyntaxError(
        componentName,
        property,
        '"property: value"',
        'missing colon after property name'
      );
      throw new Error(error);
    }

    const propName = property.slice(0, colonIndex).trim();
    const valueStr = property.slice(colonIndex + 1).trim();

    if (!propName || !valueStr) {
      const error = formatSyntaxError(
        componentName,
        property,
        '"property: value"',
        !propName ? 'property name is empty' : 'value is empty'
      );
      throw new Error(error);
    }

    const camelProp = toCamelCase(propName);

    if (
      (camelProp === 'euler' || camelProp === 'rotation') &&
      'eulerX' in component
    ) {
      const values = parseValues(valueStr);

      if (values.length === 1) {
        const val = Number(values[0]) || 0;
        result.eulerX = val;
        result.eulerY = val;
        result.eulerZ = val;
      } else if (values.length === 3) {
        result.eulerX = Number(values[0]) || 0;
        result.eulerY = Number(values[1]) || 0;
        result.eulerZ = Number(values[2]) || 0;
      } else {
        const error = formatValueCountError(
          componentName,
          propName,
          '1 (broadcast) or 3 (x, y, z degrees)',
          values.length
        );
        throw new Error(error);
      }

      const quat = eulerToQuaternion(
        result.eulerX || 0,
        result.eulerY || 0,
        result.eulerZ || 0
      );
      result.rotX = quat.x;
      result.rotY = quat.y;
      result.rotZ = quat.z;
      result.rotW = quat.w;
      continue;
    }

    if (camelProp === 'rot' && detectQuaternionPattern(component, 'rot')) {
      console.warn(
        `[${componentName}.rot] Direct quaternion values are deprecated. ` +
          `Use 'euler' or 'rotation' for Euler angles in degrees instead.`
      );

      const values = parseValues(valueStr);

      if (values.length === 3) {
        const quat = eulerToQuaternion(
          Number(values[0]) || 0,
          Number(values[1]) || 0,
          Number(values[2]) || 0
        );
        result.rotX = quat.x;
        result.rotY = quat.y;
        result.rotZ = quat.z;
        result.rotW = quat.w;
        result.eulerX = Number(values[0]) || 0;
        result.eulerY = Number(values[1]) || 0;
        result.eulerZ = Number(values[2]) || 0;
      } else if (values.length === 4) {
        result.rotX = Number(values[0]) || 0;
        result.rotY = Number(values[1]) || 0;
        result.rotZ = Number(values[2]) || 0;
        result.rotW = Number(values[3]) || 1;
        const euler = quaternionToEuler(
          result.rotX,
          result.rotY,
          result.rotZ,
          result.rotW
        );
        result.eulerX = euler.x;
        result.eulerY = euler.y;
        result.eulerZ = euler.z;
      } else {
        const error = formatValueCountError(
          componentName,
          propName,
          '3 (Euler angles) or 4 (quaternion)',
          values.length
        );
        throw new Error(error);
      }
      continue;
    }

    if (detectVector3Pattern(component, camelProp)) {
      const values = parseValues(valueStr);

      if (values.length === 1) {
        const val = Number(values[0]) || 0;
        result[`${camelProp}X`] = val;
        result[`${camelProp}Y`] = val;
        result[`${camelProp}Z`] = val;
      } else if (values.length === 3) {
        result[`${camelProp}X`] = Number(values[0]) || 0;
        result[`${camelProp}Y`] = Number(values[1]) || 0;
        result[`${camelProp}Z`] = Number(values[2]) || 0;
      } else {
        const error = formatValueCountError(
          componentName,
          propName,
          '1 (broadcast) or 3 (x, y, z)',
          values.length
        );
        throw new Error(error);
      }
      continue;
    }

    if (camelProp in component) {
      const values = parseValues(valueStr);

      if (values.length !== 1) {
        const error = formatValueCountError(
          componentName,
          propName,
          '1',
          values.length
        );
        throw new Error(error);
      }

      const value = values[0];

      if (typeof value === 'string') {
        const enumValue = getEnumValue(componentName, camelProp, value, state);
        if (enumValue !== null) {
          result[camelProp] = enumValue;
        } else {
          const error = formatTypeMismatch(
            componentName,
            propName,
            'number',
            `string "${value}"`
          );
          throw new Error(error);
        }
      } else {
        result[camelProp] = value;
      }
      continue;
    }

    const fullCamelProp = toCamelCase(propName);
    if (fullCamelProp in component) {
      const values = parseValues(valueStr);

      if (values.length !== 1) {
        const error = formatValueCountError(
          componentName,
          propName,
          '1',
          values.length
        );
        throw new Error(error);
      }

      const value = values[0];

      if (typeof value === 'string') {
        const enumValue = getEnumValue(
          componentName,
          fullCamelProp,
          value,
          state
        );
        if (enumValue !== null) {
          result[fullCamelProp] = enumValue;
        } else {
          const error = formatTypeMismatch(
            componentName,
            propName,
            'number',
            `string "${value}"`
          );
          throw new Error(error);
        }
      } else {
        result[fullCamelProp] = value;
      }
      continue;
    }

    const availableProps = getComponentProperties(component);
    const error = formatPropertyError(
      componentName,
      propName,
      'Property not found',
      availableProps
    );
    throw new Error(error);
  }

  return result;
}
