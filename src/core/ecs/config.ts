import { toKebabCase } from '../utils/naming';
import type {
  ComponentDefaults,
  ComponentEnums,
  ComponentShorthands,
  Config,
  EnumMapping,
  Parser,
  ShorthandMapping,
  ValidationRule,
} from './types';

export class ConfigRegistry {
  private readonly parsers = new Map<string, Parser[]>();
  private readonly componentDefaults: ComponentDefaults = {};
  private readonly componentShorthands: ComponentShorthands = {};
  private readonly componentEnums: ComponentEnums = {};
  private readonly validations: ValidationRule[] = [];
  private readonly skipProperties: Record<string, Set<string>> = {};

  register(config: Config): void {
    if (config.parsers) {
      for (const [name, parser] of Object.entries(config.parsers)) {
        const existing = this.parsers.get(name) || [];
        existing.push(parser);
        this.parsers.set(name, existing);
      }
    }

    if (config.defaults) {
      for (const [componentName, defaults] of Object.entries(config.defaults)) {
        const kebabName = toKebabCase(componentName);
        if (!this.componentDefaults[kebabName]) {
          this.componentDefaults[kebabName] = {};
        }
        Object.assign(this.componentDefaults[kebabName], defaults);
      }
    }

    if (config.shorthands) {
      for (const [componentName, shorthands] of Object.entries(
        config.shorthands
      )) {
        const kebabName = toKebabCase(componentName);
        if (!this.componentShorthands[kebabName]) {
          this.componentShorthands[kebabName] = {};
        }
        Object.assign(this.componentShorthands[kebabName], shorthands);
      }
    }

    if (config.enums) {
      for (const [componentName, enums] of Object.entries(config.enums)) {
        const kebabName = toKebabCase(componentName);
        if (!this.componentEnums[kebabName]) {
          this.componentEnums[kebabName] = {};
        }
        Object.assign(this.componentEnums[kebabName], enums);
      }
    }

    if (config.validations) {
      this.validations.push(...config.validations);
    }

    if (config.skip) {
      for (const [componentName, props] of Object.entries(config.skip)) {
        const kebabName = toKebabCase(componentName);
        if (!this.skipProperties[kebabName]) {
          this.skipProperties[kebabName] = new Set();
        }
        for (const prop of props) {
          this.skipProperties[kebabName].add(prop);
        }
      }
    }
  }

  getParser(name: string): Parser | undefined {
    const parsers = this.parsers.get(name);
    if (!parsers || parsers.length === 0) return undefined;
    if (parsers.length === 1) return parsers[0];
    return (args) => {
      for (const parser of parsers) {
        parser(args);
      }
    };
  }

  getDefaults(componentName: string): Record<string, number> {
    return this.componentDefaults[componentName] || {};
  }

  getShorthands(componentName: string): Record<string, ShorthandMapping> {
    return this.componentShorthands[componentName] || {};
  }

  getAllShorthands(): ComponentShorthands {
    return this.componentShorthands;
  }

  getEnums(componentName: string): Record<string, EnumMapping> {
    return this.componentEnums[componentName] || {};
  }

  getValidations(): ValidationRule[] {
    return this.validations;
  }

  shouldSkip(componentName: string, propertyName: string): boolean {
    const skip = this.skipProperties[componentName];
    return skip ? skip.has(propertyName) : false;
  }
}
