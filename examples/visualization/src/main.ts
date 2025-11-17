import * as GAME from 'vibegame';
import { Transform } from 'vibegame/transforms';
import { Renderer } from 'vibegame/rendering';
import { TransformsPlugin } from 'vibegame/transforms';
import { RenderingPlugin } from 'vibegame/rendering';

const query = GAME.defineQuery([Transform, Renderer]);

const AnimationSystem: GAME.System = {
  group: 'draw',
  update: (state) => {
    const entities = query(state.world);
    const time = state.time.elapsed;

    let index = 0;
    for (const eid of entities) {
      const offset = (index * Math.PI * 2) / 10;

      const radius = 5;
      Transform.posX[eid] = Math.cos(time + offset) * radius;
      Transform.posZ[eid] = Math.sin(time + offset) * radius;
      Transform.posY[eid] = Math.sin(time * 2 + offset) * 2 + 3;

      Transform.eulerY[eid] = (time * 50 + index * 36) % 360;
      Transform.eulerX[eid] = Math.sin(time + offset) * 30;

      index++;
    }
  },
};

GAME.withoutDefaultPlugins()
  .withPlugins(TransformsPlugin, RenderingPlugin)
  .withSystem(AnimationSystem)
  .run();
