import * as GAME from 'vibegame';
import { Transform } from 'vibegame/transforms';
import { playSequence, resetSequence, Sequence } from 'vibegame/tweening';

export { Transform };

export const CubeController = GAME.defineComponent({
  targetX: GAME.Types.f32,
  bounceRequested: GAME.Types.ui8,
});

export const TargetPosition = GAME.defineComponent({
  x: GAME.Types.f32,
  y: GAME.Types.f32,
  z: GAME.Types.f32,
});

const TriggerSequence = GAME.defineComponent({});

const controllerQuery = GAME.defineQuery([CubeController]);
const triggerSequenceQuery = GAME.defineQuery([TriggerSequence, Sequence]);
const easeToTargetQuery = GAME.defineQuery([TargetPosition, Transform]);

const ControllerSystem: GAME.System = {
  group: 'simulation',
  update(state) {
    for (const eid of controllerQuery(state.world)) {
      const cube = state.getEntityByName('cube');
      if (cube === null) continue;

      TargetPosition.x[cube] = CubeController.targetX[eid];

      if (CubeController.bounceRequested[eid]) {
        CubeController.bounceRequested[eid] = 0;
        const bounce = state.getEntityByName('bounce');
        if (bounce !== null) state.addComponent(bounce, TriggerSequence);
      }
    }
  },
};

const TriggerSequenceSystem: GAME.System = {
  group: 'simulation',
  after: [ControllerSystem],
  update(state) {
    for (const eid of triggerSequenceQuery(state.world)) {
      resetSequence(state, eid);
      playSequence(state, eid);
      state.removeComponent(eid, TriggerSequence);
    }
  },
};

const EaseToTargetSystem: GAME.System = {
  group: 'simulation',
  after: [ControllerSystem],
  update(state) {
    const k = 15 * state.time.deltaTime;
    for (const eid of easeToTargetQuery(state.world)) {
      Transform.posX[eid] += (TargetPosition.x[eid] - Transform.posX[eid]) * k;
      Transform.posY[eid] += (TargetPosition.y[eid] - Transform.posY[eid]) * k;
      Transform.posZ[eid] += (TargetPosition.z[eid] - Transform.posZ[eid]) * k;
    }
  },
};

export const SequencerDemoPlugin: GAME.Plugin = {
  components: { CubeController, TargetPosition, TriggerSequence },
  systems: [ControllerSystem, TriggerSequenceSystem, EaseToTargetSystem],
  config: {
    defaults: {
      'cube-controller': { targetX: 0, bounceRequested: 0 },
      'target-position': { x: 0, y: 0, z: 0 },
    },
  },
};
