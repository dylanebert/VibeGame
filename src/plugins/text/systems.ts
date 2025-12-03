import { Text } from 'troika-three-text';
import type { State } from '../../core';
import { defineQuery, Parent, type System } from '../../core';
import { Transform, WorldTransform } from '../transforms';
import { getScene } from '../rendering';
import { Word, Paragraph } from './components';
import {
  getTextContext,
  getTextContent,
  measureWordWidth,
  wordPosition,
} from './utils';

const anchorXMap = ['left', 'center', 'right'] as const;
const anchorYMap = ['top', 'middle', 'bottom'] as const;

const wordRenderQuery = defineQuery([Word, WorldTransform]);

export const WordRenderSystem: System = {
  group: 'draw',
  update(state: State) {
    if (state.headless) return;

    const scene = getScene(state);
    if (!scene) return;

    const context = getTextContext(state);
    const entities = wordRenderQuery(state.world);

    for (const entity of entities) {
      let textMesh = context.textMeshes.get(entity);

      if (!textMesh) {
        textMesh = new Text();
        if (context.defaultFont) {
          textMesh.font = context.defaultFont;
        }
        scene.add(textMesh);
        context.textMeshes.set(entity, textMesh);
        Word.dirty[entity] = 1;
      }

      textMesh.position.set(
        WorldTransform.posX[entity],
        WorldTransform.posY[entity],
        WorldTransform.posZ[entity]
      );

      textMesh.quaternion.set(
        WorldTransform.rotX[entity],
        WorldTransform.rotY[entity],
        WorldTransform.rotZ[entity],
        WorldTransform.rotW[entity]
      );

      textMesh.scale.set(
        WorldTransform.scaleX[entity],
        WorldTransform.scaleY[entity],
        WorldTransform.scaleZ[entity]
      );

      if (Word.dirty[entity] === 1) {
        textMesh.text = getTextContent(state, entity);
        textMesh.fontSize = Word.fontSize[entity];
        textMesh.color = Word.color[entity];
        textMesh.letterSpacing = Word.letterSpacing[entity];
        textMesh.lineHeight = Word.lineHeight[entity] || 1.2;

        const parentEid = state.hasComponent(entity, Parent)
          ? Parent.entity[entity]
          : 0;
        const hasParagraph =
          parentEid && state.hasComponent(parentEid, Paragraph);
        textMesh.anchorX = hasParagraph
          ? anchorXMap[Paragraph.anchorX[parentEid]] || 'center'
          : 'center';
        textMesh.anchorY = hasParagraph
          ? anchorYMap[Paragraph.anchorY[parentEid]] || 'middle'
          : 'middle';

        textMesh.outlineWidth = Word.outlineWidth[entity];
        textMesh.outlineColor = Word.outlineColor[entity];
        textMesh.outlineBlur = Word.outlineBlur[entity];
        textMesh.outlineOffsetX = Word.outlineOffsetX[entity];
        textMesh.outlineOffsetY = Word.outlineOffsetY[entity];
        textMesh.outlineOpacity = Word.outlineOpacity[entity];

        textMesh.strokeWidth = Word.strokeWidth[entity];
        textMesh.strokeColor = Word.strokeColor[entity];
        textMesh.strokeOpacity = Word.strokeOpacity[entity];

        textMesh.fillOpacity = Word.fillOpacity[entity];

        textMesh.curveRadius = Word.curveRadius[entity];

        textMesh.sync();
        Word.dirty[entity] = 0;
      }
    }

    for (const [entity, textMesh] of context.textMeshes) {
      if (!state.exists(entity) || !state.hasComponent(entity, Word)) {
        scene.remove(textMesh);
        textMesh.dispose();
        context.textMeshes.delete(entity);
        context.textContent.delete(entity);
      }
    }
  },
};

const wordMeasureQuery = defineQuery([Word]);

export const WordMeasureSystem: System = {
  group: 'draw',
  update(state: State) {
    const entities = wordMeasureQuery(state.world);

    for (const eid of entities) {
      if (Word.dirty[eid] === 0 && Word.width[eid] > 0) continue;

      const width = measureWordWidth(state, eid);
      if (width > 0) {
        Word.width[eid] = width;
        Word.dirty[eid] = 0;
      }
    }
  },
};

const wordArrangeQuery = defineQuery([Word, Parent, Transform]);

export const ParagraphArrangeSystem: System = {
  group: 'simulation',
  update(state: State) {
    const words = wordArrangeQuery(state.world);
    const dt = state.time.deltaTime;

    const paragraphData = new Map<
      number,
      { widths: number[]; entities: number[] }
    >();

    for (const eid of words) {
      const parentEid = Parent.entity[eid];
      if (!state.hasComponent(parentEid, Paragraph)) continue;

      if (!paragraphData.has(parentEid)) {
        paragraphData.set(parentEid, { widths: [], entities: [] });
      }

      const data = paragraphData.get(parentEid)!;
      data.widths.push(Word.width[eid]);
      data.entities.push(eid);
    }

    for (const [parentEid, data] of paragraphData) {
      if (data.widths.some((w) => w === 0 || w === undefined)) continue;

      const gap = Paragraph.gap[parentEid];
      const align = Paragraph.align[parentEid];
      const damping = Paragraph.damping[parentEid];

      const t = damping <= 0 ? 1 : 1 - Math.exp(-damping * dt);

      for (let i = 0; i < data.entities.length; i++) {
        const eid = data.entities[i];
        const targetX = wordPosition(data.widths, gap, align, i);

        Transform.posX[eid] += (targetX - Transform.posX[eid]) * t;
      }
    }
  },
};
