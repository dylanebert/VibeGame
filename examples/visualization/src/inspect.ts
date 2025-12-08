import {
  createHeadlessState,
  createSnapshot,
  getAllSequences,
  getEntityNames,
  getSequenceInfo,
  loadFont,
  parseWorldXml,
  setHeadlessFont,
  toJSON,
} from 'vibegame/cli';
import { TransformsPlugin } from 'vibegame/transforms';
import { RenderingPlugin } from 'vibegame/rendering';
import { OrbitCameraPlugin } from 'vibegame/orbit-camera';
import { TweenPlugin, playSequence, resetSequence } from 'vibegame/tweening';
import { TextPlugin } from 'vibegame/text';
import { VisualizationPlugin } from './plugin';

async function main() {
  const font = await loadFont(
    '../../node_modules/three/examples/fonts/ttf/kenpixel.ttf'
  );

  const state = createHeadlessState({
    plugins: [
      TransformsPlugin,
      RenderingPlugin,
      OrbitCameraPlugin,
      TweenPlugin,
      TextPlugin,
      VisualizationPlugin,
    ],
  });

  setHeadlessFont(state, font);

  const contentHtml = await Bun.file('./src/content.html').text();
  const step01 = await Bun.file('./src/sequences/step-0-1.xml').text();
  const step12 = await Bun.file('./src/sequences/step-1-2.xml').text();

  const worldMatch = contentHtml.match(/<world[^>]*>([\s\S]*?)<\/world>/);
  if (!worldMatch) {
    console.error('No <world> element found');
    process.exit(1);
  }

  const sequences = [step01, step12].join('\n');
  parseWorldXml(state, `<world>${worldMatch[1]}${sequences}</world>`);

  // Discover entities automatically
  const names = getEntityNames(state);
  console.log('Named entities:', names);

  // Discover sequences
  const seqs = getAllSequences(state);
  console.log('Sequences:', seqs.map((s) => s.name));

  state.step(0);
  console.log('=== Initial State ===');
  console.log(
    toJSON(
      createSnapshot(state, {
        entities: names,
        sequences: true,
      })
    )
  );

  const seq = state.getEntityByName('step-0-1');
  if (seq) {
    resetSequence(state, seq);
    playSequence(state, seq);
    console.log('\nPlaying sequence: step-0-1');
  }

  for (let i = 0; i < 60; i++) {
    state.step(1 / 60);
  }

  // Check sequence info after playback
  const seqInfo = getSequenceInfo(state, 'step-0-1');
  if (seqInfo) {
    console.log(`Sequence state: ${seqInfo.state}, progress: ${seqInfo.progress}`);
  }

  console.log('\n=== After 60 frames (sequence step-0-1) ===');
  console.log(
    toJSON(
      createSnapshot(state, {
        entities: names,
        sequences: true,
      })
    )
  );

  state.dispose();
}

main().catch(console.error);
