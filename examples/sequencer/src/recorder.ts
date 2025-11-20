import { chromium, type Page } from 'playwright';
import { createServer, type ViteDevServer } from 'vite';
import * as fs from 'fs';
import * as path from 'path';

export interface Override {
  target: string;
  attr: string;
  value: number;
}

export interface Clip {
  name: string;
  description: string;
  warmup: number;
  frames: number;
  initial: Override[];
  trigger: Override[];
}

export interface RecorderConfig {
  fps?: number;
  width?: number;
  height?: number;
  port?: number;
  outputDir?: string;
}

const DEFAULT_CONFIG: Required<RecorderConfig> = {
  fps: 60,
  width: 1920,
  height: 1080,
  port: 3456,
  outputDir: 'frames',
};

declare global {
  interface HTMLCanvasElement {
    __state__?: import('vibegame').State;
    __stop__?: () => void;
  }
}

function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

async function applyOverrides(page: Page, overrides: Override[]): Promise<void> {
  for (const { target, attr, value } of overrides) {
    const [componentName, fieldName] = attr.split('.');
    const camelComponent = toCamelCase(componentName);
    const camelField = toCamelCase(fieldName);

    await page.evaluate(
      ({ target, camelComponent, camelField, value }) => {
        const state = document.querySelector('canvas')?.__state__;
        if (!state) return;

        const eid = state.getEntityByName(target);
        if (eid === null) return;

        const component = state.getComponent(camelComponent);
        if (!component) return;

        const array = (component as Record<string, ArrayLike<number> & { [index: number]: number }>)[camelField];
        if (ArrayBuffer.isView(array)) {
          array[eid] = value;
        }
      },
      { target, camelComponent, camelField, value }
    );
  }
}

async function startViteServer(port: number): Promise<ViteDevServer> {
  const server = await createServer({
    root: process.cwd(),
    server: { port },
    logLevel: 'silent',
  });
  await server.listen();
  return server;
}

export async function recordClip(
  clip: Clip,
  baseUrl: string,
  outputDir: string,
  config: Required<RecorderConfig>
): Promise<void> {
  console.log(`\n📹 Recording: ${clip.name}`);
  console.log(`   ${clip.description}`);
  console.log(`   Warmup: ${clip.warmup} frames, Record: ${clip.frames} frames @ ${config.fps}fps`);

  const clipDir = path.join(outputDir, clip.name);
  fs.mkdirSync(clipDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: config.width, height: config.height });

  await page.goto(baseUrl);
  await page.waitForFunction(
    () => document.querySelector('canvas')?.__state__ !== undefined,
    { timeout: 10000 }
  );

  await page.evaluate(() => {
    const controls = document.getElementById('controls');
    if (controls) controls.style.display = 'none';
  });

  await page.evaluate(() => {
    document.querySelector('canvas')?.__stop__?.();
  });

  await applyOverrides(page, clip.initial);

  const stepTime = 1 / config.fps;
  for (let i = 0; i < clip.warmup; i++) {
    await page.evaluate((dt) => document.querySelector('canvas')!.__state__!.step(dt), stepTime);
  }

  await applyOverrides(page, clip.trigger);

  console.log(`   Capturing ${clip.frames} frames...`);
  for (let frame = 0; frame < clip.frames; frame++) {
    const framePath = path.join(clipDir, `frame_${String(frame).padStart(5, '0')}.png`);
    await page.screenshot({ path: framePath });

    if (frame % 30 === 0 || frame === clip.frames - 1) {
      console.log(`   Frame ${frame + 1}/${clip.frames}`);
    }

    await page.evaluate((dt) => document.querySelector('canvas')!.__state__!.step(dt), stepTime);
  }

  await browser.close();
  console.log(`   ✅ Saved to ${clipDir}/`);
}

export async function record(
  clips: Record<string, Clip>,
  clipName?: string,
  userConfig: RecorderConfig = {}
): Promise<void> {
  const config = { ...DEFAULT_CONFIG, ...userConfig };

  if (!clipName) {
    console.log('Video Recording Driver\n');
    console.log('Usage: bun run src/record.ts <clip-name>\n');
    console.log('Available clips:');
    for (const [name, clip] of Object.entries(clips)) {
      console.log(`  ${name} - ${clip.description}`);
    }
    console.log(`  all - Record all clips`);
    return;
  }

  const outputDir = path.join(process.cwd(), config.outputDir);
  fs.mkdirSync(outputDir, { recursive: true });

  console.log('🎬 Starting Vite server...');
  const server = await startViteServer(config.port);
  const baseUrl = `http://localhost:${config.port}`;

  try {
    if (clipName === 'all') {
      for (const clip of Object.values(clips)) {
        await recordClip(clip, baseUrl, outputDir, config);
      }
    } else {
      const clip = clips[clipName];
      if (!clip) {
        console.error(`Unknown clip: ${clipName}`);
        console.error(`Available clips: ${Object.keys(clips).join(', ')}`);
        process.exit(1);
      }
      await recordClip(clip, baseUrl, outputDir, config);
    }

    console.log(`\n🎉 Recording complete! Frames saved to ${outputDir}/`);
    console.log('\nTo create video with ffmpeg:');
    const recordedClips = clipName === 'all' ? Object.keys(clips) : [clipName];
    for (const name of recordedClips) {
      console.log(`  ffmpeg -framerate ${config.fps} -i ${config.outputDir}/${name}/frame_%05d.png -c:v libx264 -pix_fmt yuv420p ${name}.mp4`);
    }
  } finally {
    await server.close();
  }
}
