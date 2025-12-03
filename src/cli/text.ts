import { Font } from '@fredli74/typr';
import { readFile } from 'fs/promises';
import type { State } from '../core';
import { setMeasureFn, type MeasureFn } from '../plugins/text';

export type { Font };

export async function loadFont(path: string): Promise<Font> {
  const buffer = await readFile(path);
  return new Font(buffer.buffer as ArrayBuffer);
}

export function measureTextWidth(
  font: Font,
  text: string,
  fontSize: number
): number {
  if (!text || !font.hmtx || !font.head) return 0;

  const glyphs = font.stringToGlyphs(text);
  let totalAdvance = 0;

  for (let i = 0; i < glyphs.length; i++) {
    const gid = glyphs[i];
    const advance = font.hmtx.aWidth[gid] ?? 0;
    totalAdvance += advance;

    if (i < glyphs.length - 1) {
      const nextGid = glyphs[i + 1];
      const kern = font.getPairAdjustment(gid, nextGid);
      totalAdvance += kern;
    }
  }

  const scale = fontSize / font.head.unitsPerEm;
  return totalAdvance * scale;
}

export function createMeasureFn(font: Font): MeasureFn {
  return (text: string, fontSize: number) =>
    measureTextWidth(font, text, fontSize);
}

export function setHeadlessFont(state: State, font: Font): void {
  setMeasureFn(state, createMeasureFn(font));
}
