import type { ParsedElement } from '../../core';

/**
 * Calculate Levenshtein distance between two strings for typo detection
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Find the closest match from available options
 */
export function findSimilar(
  input: string,
  options: string[],
  maxDistance = 3
): string | null {
  let bestMatch: string | null = null;
  let bestDistance = maxDistance + 1;

  for (const option of options) {
    const distance = levenshteinDistance(
      input.toLowerCase(),
      option.toLowerCase()
    );
    if (distance < bestDistance) {
      bestDistance = distance;
      bestMatch = option;
    }
  }

  return bestDistance <= maxDistance ? bestMatch : null;
}

/**
 * Format a list of available options concisely
 */
export function formatOptions(options: string[], maxShow = 5): string {
  if (options.length === 0) return 'none';
  if (options.length <= maxShow) {
    return options.join(', ');
  }
  const shown = options.slice(0, maxShow);
  const remaining = options.length - maxShow;
  return `${shown.join(', ')} (+${remaining} more)`;
}

/**
 * Get element path for context (e.g., "world > player > transform")
 */
export function getElementPath(
  element: ParsedElement & { parent?: ParsedElement }
): string {
  const path: string[] = [];
  let current = element;

  while (current) {
    path.unshift(current.tagName);
    current = current.parent as ParsedElement & { parent?: ParsedElement };
  }

  return path.join(' > ');
}

/**
 * Format an unknown element error with suggestions
 */
export function formatUnknownElement(
  tagName: string,
  availableRecipes: string[]
): string {
  const suggestion = findSimilar(tagName, availableRecipes);

  let message = `Unknown element <${tagName}>`;
  if (suggestion) {
    message += ` - did you mean <${suggestion}>?`;
  }

  if (availableRecipes.length > 0) {
    message += `\n  Available recipes: ${formatOptions(availableRecipes)}`;
  }

  return message;
}

export function formatUnknownAttribute(
  attrName: string,
  recipeName: string,
  availableAttrs: string[],
  availableShorthands?: string[]
): string {
  const suggestion = findSimilar(attrName, availableAttrs);

  let message = `[${recipeName}] Unknown attribute "${attrName}"`;
  if (suggestion) {
    message += ` - did you mean "${suggestion}"?`;
  }

  if (availableShorthands && availableShorthands.length > 0) {
    message += `\n  Shorthands: ${formatOptions(availableShorthands)}`;
  }

  if (availableAttrs.length > 0) {
    message += `\n  Available: ${formatOptions(availableAttrs)}`;
  }

  if (attrName.includes('-') && !suggestion) {
    message += `\n  Note: Custom components must be registered before creating the Game instance`;
  }

  return message;
}

export function formatPropertyError(
  componentName: string,
  propertyName: string,
  issue: string,
  availableProps?: string[]
): string {
  const suggestion = availableProps
    ? findSimilar(propertyName, availableProps)
    : null;

  let message = `[${componentName}.${propertyName}] ${issue}`;
  if (suggestion) {
    message += ` - did you mean "${suggestion}"?`;
  }

  if (availableProps && availableProps.length > 0) {
    message += `\n  Available: ${formatOptions(availableProps)}`;
  }

  return message;
}

/**
 * Format a syntax error with expected format
 */
export function formatSyntaxError(
  componentName: string,
  invalidSyntax: string,
  expected: string,
  reason: string
): string {
  return `[${componentName}] Syntax error in "${invalidSyntax}" - ${reason}\n  Expected: ${expected}`;
}

/**
 * Format an enum value error with valid options
 */
export function formatEnumError(
  componentName: string,
  propertyName: string,
  invalidValue: string,
  validOptions: string[]
): string {
  const suggestion = findSimilar(invalidValue, validOptions);

  let message = `[${componentName}.${propertyName}] Invalid value "${invalidValue}"`;
  if (suggestion) {
    message += ` - did you mean "${suggestion}"?`;
  }

  message += `\n  Valid options: ${formatOptions(validOptions)}`;

  return message;
}

/**
 * Format a type mismatch error
 */
export function formatTypeMismatch(
  componentName: string,
  propertyName: string,
  expected: string,
  got: string
): string {
  return `[${componentName}.${propertyName}] Type mismatch - expected ${expected}, got ${got}`;
}

/**
 * Format value count error
 */
export function formatValueCountError(
  componentName: string,
  propertyName: string,
  expected: string,
  got: number
): string {
  return `[${componentName}.${propertyName}] Wrong number of values - expected ${expected}, got ${got}`;
}

/**
 * Get available component properties for suggestions
 */
export function getComponentProperties(
  component: Record<string, unknown>
): string[] {
  const props: string[] = [];

  for (const key in component) {
    if (typeof component[key] === 'function') continue;
    if (key.startsWith('_')) continue;

    const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    props.push(kebabKey);
  }

  return props;
}

/**
 * Format a component definition warning
 */
export function formatComponentWarning(
  componentName: string,
  issue: string,
  context?: string
): string {
  let message = `[${componentName}] ${issue}`;
  if (context) {
    message += `\n  Context: ${context}`;
  }
  return message;
}
