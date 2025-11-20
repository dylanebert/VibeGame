import { defineQuery } from '../../core';
import type { State, System } from '../../core';
import { Transform } from '../transforms/components';
import {
  PositionModifier,
  RotationModifier,
  ScaleModifier,
  SequencedTransform,
} from './components';
import { ModifierAggregator } from './utils';

const positionModifierQuery = defineQuery([PositionModifier]);
const rotationModifierQuery = defineQuery([RotationModifier]);
const scaleModifierQuery = defineQuery([ScaleModifier]);
const sequencedQuery = defineQuery([Transform, SequencedTransform]);

const aggregator = new ModifierAggregator();

export const ApplySequencedTransformsSystem: System = {
  group: 'simulation',

  update: (state: State) => {
    const positionModifiers = positionModifierQuery(state.world);
    const rotationModifiers = rotationModifierQuery(state.world);
    const scaleModifiers = scaleModifierQuery(state.world);

    const modifierMap = aggregator.aggregate(
      positionModifiers,
      rotationModifiers,
      scaleModifiers
    );

    const entities = sequencedQuery(state.world);

    for (const entity of entities) {
      const offsets = modifierMap.get(entity);

      if (offsets) {
        Transform.posX[entity] =
          SequencedTransform.posX[entity] + offsets.position.x;
        Transform.posY[entity] =
          SequencedTransform.posY[entity] + offsets.position.y;
        Transform.posZ[entity] =
          SequencedTransform.posZ[entity] + offsets.position.z;

        Transform.eulerX[entity] =
          SequencedTransform.eulerX[entity] + offsets.rotation.x;
        Transform.eulerY[entity] =
          SequencedTransform.eulerY[entity] + offsets.rotation.y;
        Transform.eulerZ[entity] =
          SequencedTransform.eulerZ[entity] + offsets.rotation.z;

        Transform.scaleX[entity] =
          SequencedTransform.scaleX[entity] + offsets.scale.x;
        Transform.scaleY[entity] =
          SequencedTransform.scaleY[entity] + offsets.scale.y;
        Transform.scaleZ[entity] =
          SequencedTransform.scaleZ[entity] + offsets.scale.z;
      } else {
        Transform.posX[entity] = SequencedTransform.posX[entity];
        Transform.posY[entity] = SequencedTransform.posY[entity];
        Transform.posZ[entity] = SequencedTransform.posZ[entity];

        Transform.eulerX[entity] = SequencedTransform.eulerX[entity];
        Transform.eulerY[entity] = SequencedTransform.eulerY[entity];
        Transform.eulerZ[entity] = SequencedTransform.eulerZ[entity];

        Transform.scaleX[entity] = SequencedTransform.scaleX[entity];
        Transform.scaleY[entity] = SequencedTransform.scaleY[entity];
        Transform.scaleZ[entity] = SequencedTransform.scaleZ[entity];
      }
    }
  },
};
