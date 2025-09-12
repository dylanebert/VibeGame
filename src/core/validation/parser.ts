import { z } from 'zod';
import type { ParsedElement, XMLValue } from '../xml/types';
import { XMLParser } from '../xml/parser';
import {
  recipeSchemas,
  type RecipeName,
  type RecipeAttributes,
} from './schemas';
import { formatZodError } from './error-formatter';

interface ValidationOptions {
  filename?: string;
  lineNumber?: number;
  strict?: boolean;
}

interface ValidationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export function validateRecipeAttributes<T extends RecipeName>(
  recipeName: T,
  attributes: Record<string, XMLValue>,
  options: ValidationOptions = {}
): RecipeAttributes<T> {
  const schema = recipeSchemas[recipeName];

  if (!schema) {
    const availableRecipes = Object.keys(recipeSchemas);
    throw new Error(
      `Unknown recipe "${recipeName}". Available recipes: ${availableRecipes.join(', ')}`
    );
  }

  const result = schema.safeParse(attributes);

  if (!result.success) {
    const errorMessage = formatZodError(result.error, {
      recipeName,
      ...options,
    });
    throw new Error(errorMessage);
  }

  return result.data as RecipeAttributes<T>;
}

export function safeValidateRecipeAttributes<T extends RecipeName>(
  recipeName: T,
  attributes: Record<string, XMLValue>,
  options: ValidationOptions = {}
): ValidationResult<RecipeAttributes<T>> {
  try {
    const data = validateRecipeAttributes(recipeName, attributes, options);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

const hierarchyRules: Record<string, string[]> = {
  world: [
    'entity',
    'static-part',
    'dynamic-part',
    'kinematic-part',
    'player',
    'camera',
    'ambient-light',
    'directional-light',
    'light',
  ],
  entity: [
    'tween',
    'entity',
    'static-part',
    'dynamic-part',
    'kinematic-part',
    'player',
    'camera',
    'ambient-light',
    'directional-light',
    'light',
  ],
  'static-part': ['tween'],
  'dynamic-part': ['tween'],
  'kinematic-part': ['tween'],
  player: ['tween'],
  camera: [],
  'ambient-light': [],
  'directional-light': [],
  light: [],
  tween: [],
};

function isAllowedChild(parentTag: string, childTag: string): boolean {
  const allowedChildren = hierarchyRules[parentTag];
  if (!allowedChildren) {
    return false;
  }
  return allowedChildren.includes(childTag);
}

export function validateParsedElement(
  element: ParsedElement,
  options: ValidationOptions = {},
  parentTag?: string
): ValidationResult {
  const recipeName = element.tagName as RecipeName;

  if (!(recipeName in recipeSchemas)) {
    return {
      success: false,
      error: `Unknown element <${element.tagName}>. Available recipes: ${Object.keys(recipeSchemas).join(', ')}`,
    };
  }

  if (parentTag && !isAllowedChild(parentTag, element.tagName)) {
    return {
      success: false,
      error: `Element <${element.tagName}> is not allowed as a child of <${parentTag}>. Allowed children: ${hierarchyRules[parentTag]?.join(', ') || 'none'}`,
    };
  }

  const result = safeValidateRecipeAttributes(
    recipeName,
    element.attributes,
    options
  );

  if (!result.success) {
    return result;
  }

  for (let i = 0; i < element.children.length; i++) {
    const childResult = validateParsedElement(
      element.children[i],
      {
        ...options,
        lineNumber: undefined,
      },
      element.tagName
    );

    if (!childResult.success) {
      return childResult;
    }
  }

  return { success: true, data: result.data };
}

export function validateXMLContent(
  xmlString: string,
  options: ValidationOptions = {}
): ValidationResult {
  try {
    const parseResult = XMLParser.parse(xmlString);

    return validateParsedElement(parseResult.root, options);
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: String(error),
    };
  }
}

export function validateHTMLContent(
  htmlContent: string,
  options: ValidationOptions = {}
): ValidationResult[] {
  const results: ValidationResult[] = [];

  const xmlPattern =
    /<(world|entity|static-part|dynamic-part|kinematic-part|player|camera|ambient-light|directional-light|light|tween)([^>]*?)(?:\/>|>[\s\S]*?<\/\1>)/gi;
  const matches = htmlContent.matchAll(xmlPattern);

  for (const match of matches) {
    const xmlContent = match[0];
    const lineNumber = htmlContent.substring(0, match.index).split('\n').length;

    const result = validateXMLContent(xmlContent, {
      ...options,
      lineNumber,
    });

    results.push(result);
  }

  return results;
}

export function isValidRecipeName(name: string): name is RecipeName {
  return name in recipeSchemas;
}

export function getAvailableRecipeNames(): RecipeName[] {
  return Object.keys(recipeSchemas) as RecipeName[];
}

export function getRecipeSchema<T extends RecipeName>(
  recipeName: T
): z.ZodSchema<RecipeAttributes<T>> | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return recipeSchemas[recipeName] as any;
}
