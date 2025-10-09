import { MapSchema, Schema, type } from '@colyseus/schema';

export class BodyState extends Schema {
  @type('number') tick = 0;
  @type('number') posX = 0;
  @type('number') posY = 0;
  @type('number') posZ = 0;
  @type('number') rotX = 0;
  @type('number') rotY = 0;
  @type('number') rotZ = 0;
  @type('number') rotW = 1;
  @type('number') grounded = 0;
}

export class StructuralState extends Schema {
  @type('string') data = '';
}

export class GameState extends Schema {
  @type({ map: BodyState }) bodies = new MapSchema<BodyState>();
  @type({ map: StructuralState }) structures = new MapSchema<StructuralState>();
}
