import { JSDOM } from 'jsdom';
import { State } from '../core/ecs/state';
import { XMLParser } from '../core/xml';
import { parseXMLToEntities } from '../core/recipes/parser';
import type { Plugin } from '../core/ecs/types';

let domInitialized = false;

function ensureDom(): void {
  if (domInitialized) return;
  if (typeof DOMParser !== 'undefined') {
    domInitialized = true;
    return;
  }

  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  (global as Record<string, unknown>).DOMParser = dom.window.DOMParser;
  (global as Record<string, unknown>).document = dom.window.document;
  domInitialized = true;
}

function normalizeBooleanAttributes(html: string): string {
  return html.replace(
    /<([a-z-]+)([^>]*?)(\s+)([a-z-]+)(?=\s*>|\s+[a-z])/gi,
    (match, tag, before, space, attr) => {
      if (before.includes(`${attr}=`) || before.includes(`${attr} =`)) {
        return match;
      }
      return `<${tag}${before}${space}${attr}=""`;
    }
  );
}

export interface HeadlessOptions {
  plugins?: Plugin[];
}

export function createHeadlessState(options: HeadlessOptions = {}): State {
  ensureDom();
  const state = new State({ headless: true });
  if (options.plugins) {
    for (const plugin of options.plugins) {
      state.registerPlugin(plugin);
    }
  }
  return state;
}

export interface ParseOptions {
  ignoreUnknownAttributes?: string[];
}

export function parseWorldXml(
  state: State,
  xml: string,
  options?: ParseOptions
): void {
  ensureDom();
  const normalized = normalizeBooleanAttributes(xml);
  const wrapped = normalized.includes('<world')
    ? normalized
    : `<world>${normalized}</world>`;
  const result = XMLParser.parse(wrapped);
  parseXMLToEntities(state, result.root, options);
}

export async function loadWorldFromFile(
  state: State,
  filePath: string
): Promise<void> {
  const { readFile } = await import('fs/promises');
  const content = await readFile(filePath, 'utf-8');

  const worldMatch = content.match(/<world[^>]*>([\s\S]*?)<\/world>/);
  if (worldMatch) {
    parseWorldXml(state, worldMatch[0]);
  } else {
    parseWorldXml(state, content);
  }
}
