import { beforeEach, describe, expect, it } from 'bun:test';
import { JSDOM } from 'jsdom';
import {
  State,
  TIME_CONSTANTS,
  XMLParser,
  defineQuery,
  parseXMLToEntities,
} from 'vibegame';
import { DefaultPlugins } from 'vibegame/defaults';
import { InputState } from 'vibegame/input';
import {
  Body,
  CharacterController,
  CharacterMovement,
} from 'vibegame/physics';
import { Player } from 'vibegame/player';

describe('E2E: Player Jump Mechanics', () => {
  let state: State;

  beforeEach(async () => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.DOMParser = dom.window.DOMParser;

    state = new State();

    for (const plugin of DefaultPlugins) {
      state.registerPlugin(plugin);
    }

    await state.initializePlugins();
  });

  it('should not jump automatically on startup', () => {
    const xml = `
      <world>
        <!-- Ground platform -->
        <static-part 
          body="pos: 0 0 0"
          renderer="shape: box; size: 20 1 20; color: 0x90ee90"
          collider="shape: box; size: 20 1 20" />
      </world>
    `;

    const parsed = XMLParser.parse(xml);
    parseXMLToEntities(state, parsed.root);

    // Step once to trigger startup systems (creates player automatically)
    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    // Get auto-created player
    const players = defineQuery([Player])(state.world);
    expect(players.length).toBe(1);
    const playerEntity = players[0];

    // Player should not be jumping initially
    expect(Player.isJumping[playerEntity]).toBe(0);
    expect(Player.canJump[playerEntity]).toBe(1);
    expect(Player.jumpCooldown[playerEntity]).toBe(0);

    // Input should be zero
    expect(InputState.jump[playerEntity]).toBe(0);

    // Simulate a few steps without any input
    for (let i = 0; i < 10; i++) {
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

      // Jump input should remain 0
      expect(InputState.jump[playerEntity]).toBe(0);

      // Player should not start jumping
      if (i > 5) {
        // After settling
        expect(Player.isJumping[playerEntity]).toBe(0);
        expect(CharacterMovement.velocityY[playerEntity]).toBeLessThan(1);
      }
    }

    // Player should be grounded and stable
    expect(CharacterController.grounded[playerEntity]).toBe(1);
    expect(Player.canJump[playerEntity]).toBe(1);
  });

  it('should jump once and land properly', () => {
    const xml = `
      <world>
        <static-part 
          body="pos: 0 0 0"
          renderer="shape: box; size: 20 1 20; color: 0x90ee90"
          collider="shape: box; size: 20 1 20" />
      </world>
    `;

    const parsed = XMLParser.parse(xml);
    parseXMLToEntities(state, parsed.root);

    // Step to create player and let it settle
    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    const players = defineQuery([Player])(state.world);
    const playerEntity = players[0];

    // Wait for player to be grounded
    for (let i = 0; i < 20; i++) {
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
      if (CharacterController.grounded[playerEntity] === 1) break;
    }

    expect(CharacterController.grounded[playerEntity]).toBe(1);
    expect(Player.canJump[playerEntity]).toBe(1);

    const groundedY = Body.posY[playerEntity];

    // Trigger jump
    InputState.jump[playerEntity] = 1;
    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
    InputState.jump[playerEntity] = 0;

    // Should be jumping now
    expect(Player.isJumping[playerEntity]).toBe(1);
    expect(Player.canJump[playerEntity]).toBe(0);
    expect(CharacterMovement.velocityY[playerEntity]).toBeGreaterThan(5);

    let maxHeight = groundedY;

    // Simulate jump arc
    for (let i = 0; i < 80; i++) {
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
      maxHeight = Math.max(maxHeight, Body.posY[playerEntity]);

      // If landed, break (but ensure we don't break too early)
      if (
        CharacterController.grounded[playerEntity] === 1 &&
        Player.isJumping[playerEntity] === 0 &&
        i > 10
      ) {
        break;
      }
    }

    // Should have jumped significantly (jump height is 2.3)
    expect(maxHeight).toBeGreaterThan(groundedY + 2);

    // Should be landed and ready to jump again
    expect(CharacterController.grounded[playerEntity]).toBe(1);
    expect(Player.isJumping[playerEntity]).toBe(0);
    expect(Player.canJump[playerEntity]).toBe(1);
    expect(Player.jumpCooldown[playerEntity]).toBeLessThanOrEqual(0);
  });

  it('should allow multiple consecutive jumps with proper timing', () => {
    const xml = `
      <world>
        <static-part 
          body="pos: 0 0 0"
          renderer="shape: box; size: 50 1 50; color: 0x90ee90"
          collider="shape: box; size: 50 1 50" />
      </world>
    `;

    const parsed = XMLParser.parse(xml);
    parseXMLToEntities(state, parsed.root);

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    const players = defineQuery([Player])(state.world);
    const playerEntity = players[0];

    // Wait for grounded and stable
    for (let i = 0; i < 30; i++) {
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
      if (
        CharacterController.grounded[playerEntity] === 1 &&
        Player.canJump[playerEntity] === 1
      )
        break;
    }

    console.log(
      `Starting multiple jump test - grounded: ${CharacterController.grounded[playerEntity]}, canJump: ${Player.canJump[playerEntity]}`
    );

    // Perform multiple jumps with detailed tracking
    for (let jumpNum = 0; jumpNum < 3; jumpNum++) {
      console.log(`\n=== Jump ${jumpNum + 1} ===`);

      // Verify ready state
      expect(CharacterController.grounded[playerEntity]).toBe(1);
      expect(Player.canJump[playerEntity]).toBe(1);
      expect(Player.isJumping[playerEntity]).toBe(0);
      expect(Player.jumpCooldown[playerEntity]).toBeLessThanOrEqual(0);

      const beforeJumpY = Body.posY[playerEntity];
      console.log(`Before jump Y: ${beforeJumpY}`);

      // Trigger jump
      InputState.jump[playerEntity] = 1;
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
      InputState.jump[playerEntity] = 0;

      console.log(
        `After jump trigger - isJumping: ${Player.isJumping[playerEntity]}, canJump: ${Player.canJump[playerEntity]}, velocityY: ${CharacterMovement.velocityY[playerEntity]}`
      );

      expect(Player.isJumping[playerEntity]).toBe(1);
      expect(Player.canJump[playerEntity]).toBe(0);
      expect(CharacterMovement.velocityY[playerEntity]).toBeGreaterThan(5);

      let maxHeight = beforeJumpY;
      let stepCount = 0;

      // Wait for complete jump cycle (up and down)
      while (stepCount < 120) {
        state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
        stepCount++;

        const currentY = Body.posY[playerEntity];
        maxHeight = Math.max(maxHeight, currentY);

        // Log key moments
        if (stepCount % 20 === 0) {
          console.log(
            `Step ${stepCount}: Y=${currentY.toFixed(2)}, grounded=${CharacterController.grounded[playerEntity]}, isJumping=${Player.isJumping[playerEntity]}, canJump=${Player.canJump[playerEntity]}, cooldown=${Player.jumpCooldown[playerEntity].toFixed(3)}`
          );
        }

        // Break when fully landed and ready
        if (
          CharacterController.grounded[playerEntity] === 1 &&
          Player.isJumping[playerEntity] === 0 &&
          Player.canJump[playerEntity] === 1 &&
          Player.jumpCooldown[playerEntity] <= 0
        ) {
          console.log(
            `Landed after ${stepCount} steps at Y=${currentY.toFixed(2)}`
          );
          break;
        }
      }

      const finalY = Body.posY[playerEntity];
      console.log(
        `Jump ${jumpNum + 1} complete - Max height: ${maxHeight.toFixed(2)}, Final Y: ${finalY.toFixed(2)}, Height gained: ${(maxHeight - beforeJumpY).toFixed(2)}`
      );

      // Verify jump actually happened
      expect(maxHeight).toBeGreaterThan(beforeJumpY + 1.5);

      // Verify proper landing state
      expect(CharacterController.grounded[playerEntity]).toBe(1);
      expect(Player.isJumping[playerEntity]).toBe(0);
      expect(Player.canJump[playerEntity]).toBe(1);
      expect(Player.jumpCooldown[playerEntity]).toBeLessThanOrEqual(0);

      // Add extra settling time between jumps
      for (let i = 0; i < 10; i++) {
        state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
      }
    }

    console.log(`All ${3} jumps completed successfully!`);
  });

  it('should respect jump cooldown timing', () => {
    const xml = `
      <world>
        <static-part 
          body="pos: 0 0 0"
          renderer="shape: box; size: 20 1 20; color: 0x90ee90"
          collider="shape: box; size: 20 1 20" />
      </world>
    `;

    const parsed = XMLParser.parse(xml);
    parseXMLToEntities(state, parsed.root);

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    const players = defineQuery([Player])(state.world);
    const playerEntity = players[0];

    // Wait for grounded
    for (let i = 0; i < 20; i++) {
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
      if (CharacterController.grounded[playerEntity] === 1) break;
    }

    // Jump
    InputState.jump[playerEntity] = 1;
    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    // Should have cooldown set
    expect(Player.jumpCooldown[playerEntity]).toBeGreaterThan(0);
    expect(Player.canJump[playerEntity]).toBe(0);

    // Track cooldown progression
    let cooldownValues: number[] = [];

    for (let i = 0; i < 20; i++) {
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
      cooldownValues.push(Player.jumpCooldown[playerEntity]);
    }

    // Cooldown should decrease over time
    for (let i = 1; i < cooldownValues.length; i++) {
      if (cooldownValues[i - 1] > 0) {
        expect(cooldownValues[i]).toBeLessThanOrEqual(cooldownValues[i - 1]);
      }
    }

    // Should eventually reach 0 or negative, and canJump should be restored
    const finalCooldown = cooldownValues[cooldownValues.length - 1];
    expect(finalCooldown).toBeLessThanOrEqual(0);
    expect(Player.canJump[playerEntity]).toBe(1);
  });
});
