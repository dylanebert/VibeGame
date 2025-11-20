import {
  PositionModifier,
  RotationModifier,
  ScaleModifier,
} from './components';

export interface ModifierOffsets {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
}

export class ModifierAggregator {
  private map = new Map<number, ModifierOffsets>();

  aggregate(
    positionModifiers: number[],
    rotationModifiers: number[],
    scaleModifiers: number[]
  ): Map<number, ModifierOffsets> {
    for (const offsets of this.map.values()) {
      offsets.position.x = 0;
      offsets.position.y = 0;
      offsets.position.z = 0;
      offsets.rotation.x = 0;
      offsets.rotation.y = 0;
      offsets.rotation.z = 0;
      offsets.scale.x = 0;
      offsets.scale.y = 0;
      offsets.scale.z = 0;
    }

    for (const entity of positionModifiers) {
      const target = PositionModifier.target[entity];
      let offsets = this.map.get(target);
      if (!offsets) {
        offsets = {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 0, y: 0, z: 0 },
        };
        this.map.set(target, offsets);
      }
      offsets.position.x += PositionModifier.x[entity];
      offsets.position.y += PositionModifier.y[entity];
      offsets.position.z += PositionModifier.z[entity];
    }

    for (const entity of rotationModifiers) {
      const target = RotationModifier.target[entity];
      let offsets = this.map.get(target);
      if (!offsets) {
        offsets = {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 0, y: 0, z: 0 },
        };
        this.map.set(target, offsets);
      }
      offsets.rotation.x += RotationModifier.x[entity];
      offsets.rotation.y += RotationModifier.y[entity];
      offsets.rotation.z += RotationModifier.z[entity];
    }

    for (const entity of scaleModifiers) {
      const target = ScaleModifier.target[entity];
      let offsets = this.map.get(target);
      if (!offsets) {
        offsets = {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 0, y: 0, z: 0 },
        };
        this.map.set(target, offsets);
      }
      offsets.scale.x += ScaleModifier.x[entity];
      offsets.scale.y += ScaleModifier.y[entity];
      offsets.scale.z += ScaleModifier.z[entity];
    }

    return this.map;
  }
}
