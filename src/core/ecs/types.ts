import type { Component } from 'bitecs';
import type { ParsedElement, XMLValue } from '../xml';
import type { State } from './state';

export interface System {
  readonly update?: (state: State) => void;
  readonly setup?: (state: State) => void;
  readonly dispose?: (state: State) => void;
  readonly group?: 'setup' | 'simulation' | 'fixed' | 'draw';
  readonly first?: boolean;
  readonly last?: boolean;
  readonly before?: readonly System[];
  readonly after?: readonly System[];
}

export type Parser = (
  entity: number,
  element: ParsedElement,
  state: State
) => void;

export type ShorthandMapping = string | string[];

export interface Recipe {
  readonly name: string;
  readonly components?: string[];
  readonly overrides?: Record<string, number>;
}

export interface ComponentDefaults {
  [componentName: string]: Record<string, number>;
}

export interface ComponentShorthands {
  [componentName: string]: Record<string, ShorthandMapping>;
}

export interface EnumMapping {
  readonly [value: string]: number;
}

export interface ComponentEnums {
  [componentName: string]: Record<string, EnumMapping>;
}

export interface ValidationRule {
  readonly condition: (
    recipeName: string,
    attributes: Record<string, XMLValue>
  ) => boolean;
  readonly warning: string;
}

export interface Config {
  readonly parsers?: Record<string, Parser>;
  readonly defaults?: Record<string, Record<string, number>>;
  readonly shorthands?: Record<string, Record<string, ShorthandMapping>>;
  readonly enums?: Record<string, Record<string, EnumMapping>>;
  readonly validations?: ValidationRule[];
}

export interface Plugin {
  readonly systems?: readonly System[];
  readonly recipes?: readonly Recipe[];
  readonly components?: Record<string, Component>;
  readonly config?: Config;
}

export interface GameTime {
  deltaTime: number;
  fixedDeltaTime: number;
  elapsed: number;
}
