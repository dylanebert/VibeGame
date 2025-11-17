import { beforeEach, describe, expect, it } from 'bun:test';
import { State } from 'vibegame';
import { Player } from 'vibegame/player';

describe('Player Components', () => {
  let state: State;
  let entity: number;

  beforeEach(() => {
    state = new State();
    entity = state.createEntity();
  });

  describe('Player', () => {
    it('should initialize with default values', () => {
      state.addComponent(entity, Player);

      expect(Player.speed[entity]).toBe(0);
      expect(Player.jumpHeight[entity]).toBe(0);
      expect(Player.rotationSpeed[entity]).toBe(0);
      expect(Player.canJump[entity]).toBe(0);
      expect(Player.isJumping[entity]).toBe(0);
      expect(Player.jumpCooldown[entity]).toBe(0);
      expect(Player.lastGroundedTime[entity]).toBe(0);
      expect(Player.jumpBufferTime[entity]).toBe(0);
    });

    it('should store movement configuration', () => {
      state.addComponent(entity, Player);

      Player.speed[entity] = 5;
      Player.jumpHeight[entity] = 4;
      Player.rotationSpeed[entity] = 10;

      expect(Player.speed[entity]).toBe(5);
      expect(Player.jumpHeight[entity]).toBe(4);
      expect(Player.rotationSpeed[entity]).toBe(10);
    });

    it('should track jump state', () => {
      state.addComponent(entity, Player);

      Player.canJump[entity] = 1;
      Player.isJumping[entity] = 0;

      expect(Player.canJump[entity]).toBe(1);
      expect(Player.isJumping[entity]).toBe(0);

      Player.isJumping[entity] = 1;
      Player.canJump[entity] = 0;

      expect(Player.isJumping[entity]).toBe(1);
      expect(Player.canJump[entity]).toBe(0);
    });

    it('should track jump cooldown', () => {
      state.addComponent(entity, Player);

      Player.jumpCooldown[entity] = 0.2;
      expect(Player.jumpCooldown[entity]).toBeCloseTo(0.2);

      Player.jumpCooldown[entity] = 0;
      expect(Player.jumpCooldown[entity]).toBe(0);
    });

    it('should track last grounded time', () => {
      state.addComponent(entity, Player);

      Player.lastGroundedTime[entity] = 1.5;
      expect(Player.lastGroundedTime[entity]).toBe(1.5);
    });

    it('should track jump buffer time', () => {
      state.addComponent(entity, Player);

      Player.jumpBufferTime[entity] = 0.1;
      expect(Player.jumpBufferTime[entity]).toBeCloseTo(0.1);

      Player.jumpBufferTime[entity] = -10000;
      expect(Player.jumpBufferTime[entity]).toBe(-10000);
    });
  });
});
