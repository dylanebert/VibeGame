import type { XMLValue } from './types';

const COLOR_MAP: Record<string, number> = {
  red: 0xff0000,
  green: 0x00ff00,
  blue: 0x0000ff,
  yellow: 0xffff00,
  purple: 0xff00ff,
  cyan: 0x00ffff,
  white: 0xffffff,
  black: 0x000000,
  gray: 0x808080,
  orange: 0xffa500,
  pink: 0xffc0cb,
  lime: 0x00ff00,
  gold: 0xffd700,
};

const VECTOR_PATTERN = /^-?\d+(\.\d+)?(\s+-?\d+(\.\d+)?)+$/;

export const XMLValueParser = {
  parse(value: string): XMLValue {
    if (this.isVector(value)) return this.parseVector(value);
    if (this.isHexColor(value)) return this.parseHexColor(value);
    if (this.isNamedColor(value)) return this.parseNamedColor(value);
    if (this.isBoolean(value)) return this.parseBoolean(value);
    if (this.isNumber(value)) return this.parseNumber(value);
    return value;
  },

  isVector(value: string): boolean {
    return VECTOR_PATTERN.test(value);
  },

  parseVector(value: string): Record<string, number> | number[] {
    const parts = value.split(/\s+/).map(Number);
    if (parts.length === 2) return { x: parts[0], y: parts[1] };
    if (parts.length === 3) return { x: parts[0], y: parts[1], z: parts[2] };
    if (parts.length === 4)
      return { x: parts[0], y: parts[1], z: parts[2], w: parts[3] };
    return parts;
  },

  isHexColor(value: string): boolean {
    if (value.startsWith('0x')) {
      return /^0x[0-9a-fA-F]+$/.test(value);
    }
    if (value.startsWith('#')) {
      return /^#[0-9a-fA-F]+$/.test(value);
    }
    return false;
  },

  parseHexColor(value: string): number {
    if (value.startsWith('0x')) {
      return parseInt(value, 16);
    }
    return parseInt(value.slice(1), 16);
  },

  isNamedColor(value: string): boolean {
    return Object.prototype.hasOwnProperty.call(COLOR_MAP, value.toLowerCase());
  },

  parseNamedColor(value: string): number {
    return COLOR_MAP[value.toLowerCase()];
  },

  isBoolean(value: string): boolean {
    return value === 'true' || value === 'false';
  },

  parseBoolean(value: string): boolean {
    return value === 'true';
  },

  isNumber(value: string): boolean {
    return !isNaN(parseFloat(value));
  },

  parseNumber(value: string): number {
    return parseFloat(value);
  },
};
