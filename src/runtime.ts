import type { BuilderOptions } from './builder';
import type { State } from './core';
import { TIME_CONSTANTS, XMLParser, XMLValueParser } from './core';
import { parseXMLToEntities } from './core/recipes/parser';
import { RenderContext, setCanvasElement } from './plugins/rendering';
import { setTargetCanvas } from './plugins/input';
import { registerRuntime, unregisterRuntime } from './core/runtime-manager';

export class GameRuntime {
  private state: State;
  private options: BuilderOptions;
  private isRunning = false;
  private isDestroyed = false;
  private mutationObserver?: MutationObserver;
  private canvasElements = new Set<HTMLCanvasElement>();

  constructor(state: State, options: BuilderOptions = {}) {
    this.state = state;
    this.options = options;
    registerRuntime(this);
  }

  async start(): Promise<void> {
    if (this.isRunning) return;

    if (typeof document !== 'undefined' && this.options.dom !== false) {
      await this.initializeBrowser();
    }

    this.isRunning = true;

    if (
      typeof requestAnimationFrame !== 'undefined' &&
      this.options.autoStart !== false
    ) {
      this.startAnimationLoop();
    }
  }

  stop(): void {
    this.isRunning = false;
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
  }

  destroy(): void {
    if (this.isDestroyed) {
      throw new Error('[VibeGame] Runtime already destroyed');
    }
    this.stop();
    this.state.dispose();
    this.canvasElements.clear();
    unregisterRuntime(this);
    this.isDestroyed = true;
  }

  step(deltaTime: number = TIME_CONSTANTS.DEFAULT_DELTA): void {
    this.state.step(deltaTime);
  }

  getState(): State {
    return this.state;
  }

  private startAnimationLoop(): void {
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      if (!this.isRunning) return;
      requestAnimationFrame(animate);

      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      this.state.step(deltaTime);
    };

    requestAnimationFrame(animate);
  }

  private async initializeBrowser(): Promise<void> {
    if (document.readyState === 'loading') {
      await new Promise<void>((resolve) => {
        document.addEventListener('DOMContentLoaded', () => resolve());
      });
    }

    await this.state.initializePlugins();
    this.processWorldElements();
    this.setupMutationObserver();
    this.state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
  }

  private processWorldElements(): void {
    const worldElements = document.querySelectorAll('world');
    worldElements.forEach((element) => {
      this.processWorldElement(element as HTMLElement);
    });
  }

  private processWorldElement(element: HTMLElement): void {
    if (element.tagName.toLowerCase() !== 'world') return;

    element.style.display = 'none';

    const canvasSelector = element.getAttribute('canvas');
    if (canvasSelector) {
      const canvas = document.querySelector(
        canvasSelector
      ) as HTMLCanvasElement;
      if (canvas) {
        this.canvasElements.add(canvas);
        const rendererEntity = this.state.createEntity();
        this.state.addComponent(rendererEntity, RenderContext);
        RenderContext.hasCanvas[rendererEntity] = 1;

        const skyColor = element.getAttribute('sky');
        if (skyColor) {
          const parsedColor = XMLValueParser.parse(skyColor);
          if (typeof parsedColor === 'number') {
            RenderContext.clearColor[rendererEntity] = parsedColor;
          }
        }

        setCanvasElement(rendererEntity, canvas);
        setTargetCanvas(canvas);
      }
    }

    this.processWorldContent(element);
  }

  private processWorldContent(worldElement: HTMLElement): void {
    try {
      const originalHTML = worldElement.innerHTML;

      this.validateNoSelfClosingTags(originalHTML);

      if (
        typeof process !== 'undefined' &&
        process.env?.NODE_ENV !== 'production'
      ) {
        this.validateXMLStructure(originalHTML);
      }

      const xmlContent = `<world>${originalHTML}</world>`;
      const parseResult = XMLParser.parse(xmlContent);

      if (parseResult.root.tagName === 'parsererror') {
        const errorText = originalHTML.substring(0, 200);
        throw new Error(
          `[XML Parsing] Invalid XML syntax detected.\n` +
            `  Check your HTML for malformed tags or attributes.\n` +
            `  Content preview: ${errorText}...`
        );
      }

      parseXMLToEntities(this.state, parseResult.root);
    } catch (error) {
      console.error('❌ World content parsing failed:', error);
      if (
        typeof process !== 'undefined' &&
        process.env?.NODE_ENV !== 'production'
      ) {
        throw error;
      }
    }
  }

  private validateNoSelfClosingTags(htmlContent: string): void {
    const selfClosingPattern =
      /<(tween|player|entity|static-part|dynamic-part|kinematic-part)[^>]*\/>/g;
    const matches = htmlContent.match(selfClosingPattern);

    if (matches) {
      const tag = matches[0].match(/<(\w+)/)?.[1];
      throw new Error(
        `[VibeGame] Self-closing <${tag} /> tags are not supported.\n` +
          `  HTML5 doesn't recognize self-closing custom elements.\n` +
          `  Use explicit closing tags: <${tag}></${tag}>`
      );
    }
  }

  private validateXMLStructure(xmlContent: string): void {
    const voidElements = new Set([
      'area',
      'base',
      'br',
      'col',
      'embed',
      'hr',
      'img',
      'input',
      'link',
      'meta',
      'param',
      'source',
      'track',
      'wbr',
    ]);

    const tagStack: Array<{ name: string; line: number }> = [];
    const lines = xmlContent.split('\n');
    let lineNum = 0;

    for (const line of lines) {
      lineNum++;
      const openTags = line.matchAll(/<(\w+)([^>]*?)>/g);
      const closeTags = line.matchAll(/<\/(\w+)>/g);

      for (const match of openTags) {
        const tagName = match[1].toLowerCase();
        const attrs = match[2];

        if (!voidElements.has(tagName) && !attrs.endsWith('/')) {
          tagStack.push({ name: tagName, line: lineNum });
        }
      }

      for (const match of closeTags) {
        const tagName = match[1].toLowerCase();
        const lastTag = tagStack.pop();

        if (!lastTag) {
          throw new Error(
            `[XML Validation] Unexpected closing tag </${tagName}> at line ${lineNum}.\n` +
              `  No matching opening tag found.`
          );
        }

        if (lastTag.name !== tagName) {
          throw new Error(
            `[XML Validation] Mismatched tags at line ${lineNum}.\n` +
              `  Expected </${lastTag.name}> (opened at line ${lastTag.line})\n` +
              `  Found </${tagName}>`
          );
        }
      }
    }

    if (tagStack.length > 0) {
      const unclosed = tagStack
        .map((t) => `<${t.name}> at line ${t.line}`)
        .join(', ');
      throw new Error(
        `[XML Validation] Unclosed tags detected:\n  ${unclosed}\n` +
          `  Hint: Browser may have misinterpreted self-closing custom elements.`
      );
    }
  }

  private setupMutationObserver(): void {
    if (typeof MutationObserver === 'undefined') return;

    this.mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;

            if (element.tagName.toLowerCase() === 'world') {
              this.processWorldElement(element);
            }

            element.querySelectorAll?.('world').forEach((worldEl) => {
              this.processWorldElement(worldEl as HTMLElement);
            });
          }
        });

        mutation.removedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;

            if (
              element.tagName.toLowerCase() === 'canvas' &&
              this.canvasElements.has(element as HTMLCanvasElement)
            ) {
              console.warn(
                '[VibeGame] Canvas removed from DOM, disposing runtime'
              );
              this.destroy();
              return;
            }

            element.querySelectorAll?.('canvas').forEach((canvasEl) => {
              if (this.canvasElements.has(canvasEl as HTMLCanvasElement)) {
                console.warn(
                  '[VibeGame] Canvas removed from DOM, disposing runtime'
                );
                this.destroy();
                return;
              }
            });
          }
        });
      });
    });

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    this.mutationObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }
}
