import { Text } from 'troika-three-text';
import type { State } from '../../core';
import { defineQuery, type System } from '../../core';
import { WorldTransform } from '../transforms';
import { getScene } from '../rendering';
import { Text as TextComponent } from './components';
import { getTextContext, getTextContent } from './utils';

const anchorXMap = ['left', 'center', 'right'] as const;
const anchorYMap = ['top', 'middle', 'bottom'] as const;
const textAlignMap = ['left', 'center', 'right', 'justify'] as const;

const textQuery = defineQuery([TextComponent, WorldTransform]);

export const TextSystem: System = {
  group: 'draw',
  update(state: State) {
    const scene = getScene(state);
    if (!scene) return;

    const context = getTextContext(state);
    const entities = textQuery(state.world);

    for (const entity of entities) {
      let textMesh = context.textMeshes.get(entity);

      if (!textMesh) {
        textMesh = new Text();
        scene.add(textMesh);
        context.textMeshes.set(entity, textMesh);
        TextComponent.dirty[entity] = 1;
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

      if (TextComponent.dirty[entity] === 1) {
        textMesh.text = getTextContent(state, entity);
        textMesh.fontSize = TextComponent.fontSize[entity];
        textMesh.color = TextComponent.color[entity];
        textMesh.anchorX = anchorXMap[TextComponent.anchorX[entity]] || 'center';
        textMesh.anchorY = anchorYMap[TextComponent.anchorY[entity]] || 'middle';
        textMesh.textAlign = textAlignMap[TextComponent.textAlign[entity]] || 'left';
        textMesh.maxWidth = TextComponent.maxWidth[entity] || undefined;
        textMesh.lineHeight = TextComponent.lineHeight[entity] || 1.2;
        textMesh.sync();
        TextComponent.dirty[entity] = 0;
      }
    }

    for (const [entity, textMesh] of context.textMeshes) {
      if (!state.exists(entity) || !state.hasComponent(entity, TextComponent)) {
        scene.remove(textMesh);
        textMesh.dispose();
        context.textMeshes.delete(entity);
        context.textContent.delete(entity);
      }
    }
  },
};
