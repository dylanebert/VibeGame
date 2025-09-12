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
  private readonly parsers = new Map<string, Parser>();
  private readonly componentDefaults: ComponentDefaults = {};
  private readonly componentShorthands: ComponentShorthands = {};
  private readonly componentEnums: ComponentEnums = {};
  private readonly validations: ValidationRule[] = [];

  register(config: Config): void {
    if (config.parsers) {
      for (const [name, parser] of Object.entries(config.parsers)) {
        this.parsers.set(name, parser);
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
  }

  getParser(name: string): Parser | undefined {
    return this.parsers.get(name);
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
}
