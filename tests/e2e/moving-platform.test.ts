import { beforeAll, beforeEach, describe, expect, it } from 'bun:test';
import { JSDOM } from 'jsdom';
import { State, TIME_CONSTANTS, XMLParser, defineQuery } from 'vibegame';
import { DefaultPlugins } from 'vibegame/defaults';
import {
  Body,
  BodyType,
  CharacterController,
  initializePhysics,
} from 'vibegame';
import { Player } from 'vibegame';
import { parseXMLToEntities } from 'vibegame';
import { Transform } from 'vibegame';

describe('E2E: Moving Platform Character Controller', () => {
  let state: State;

  beforeAll(async () => {
    await initializePhysics();
  });

  beforeEach(() => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.DOMParser = dom.window.DOMParser;

    state = new State();

    for (const plugin of DefaultPlugins) {
      state.registerPlugin(plugin);
    }
  });

  it('should keep player at rest on stationary kinematic platform (base case)', () => {
    const xml = `
      <world>
        <static-part 
          body="pos: 0 -10 0"
          renderer="shape: box; size: 20 1 20; color: 0x90ee90"
          collider="shape: box; size: 20 1 20" />
        
        <kinematic-part 
          body="pos: 0 2 0"
          renderer="shape: box; size: 4 1 4; color: 0xff6600"
          collider="shape: box; size: 4 1 4" />
      </world>
    `;

    const parsed = XMLParser.parse(xml);
    parseXMLToEntities(state, parsed.root);

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    const players = defineQuery([Player])(state.world);
    expect(players.length).toBe(1);
    const playerEntity = players[0];

    Body.posX[playerEntity] = 0;
    Body.posY[playerEntity] = 4;
    Body.posZ[playerEntity] = 0;

    for (let i = 0; i < 30; i++) {
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
      if (CharacterController.grounded[playerEntity] === 1) break;
    }

    expect(CharacterController.grounded[playerEntity]).toBe(1);
    const settledY = Body.posY[playerEntity];

    console.log(`Player settled at Y: ${settledY}`);

    expect(settledY).toBeGreaterThan(2);
    expect(settledY).toBeLessThan(4);

    const positions: number[] = [];
    for (let i = 0; i < 60; i++) {
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
      positions.push(Body.posY[playerEntity]);
    }

    const minY = Math.min(...positions);
    const maxY = Math.max(...positions);
    const variance = maxY - minY;

    console.log(`Position variance over 1 second: ${variance}`);

    expect(variance).toBeLessThan(0.1);
    expect(CharacterController.grounded[playerEntity]).toBe(1);
  });

  // TODO: Implement moving platform support - player should stay grounded when platform moves
  it.skip('should move player downward with kinematic platform using tween', () => {
    const xml = `
      <world>
        <static-part 
          body="pos: 0 -10 0"
          renderer="shape: box; size: 20 1 20; color: 0x90ee90"
          collider="shape: box; size: 20 1 20" />
        
        <kinematic-part 
          body="pos: 0 5 0"
          renderer="shape: box; size: 4 1 4; color: 0xff6600"
          collider="shape: box; size: 4 1 4">
          <tween target="body.pos-y" from="5" to="0" duration="2"></tween>
        </kinematic-part>
      </world>
    `;

    const parsed = XMLParser.parse(xml);
    parseXMLToEntities(state, parsed.root);

    const platforms = defineQuery([Transform, Body])(state.world).filter(
      (ent) => Body.type[ent] === BodyType.KinematicVelocityBased
    );
    expect(platforms.length).toBeGreaterThan(0);
    const platform = platforms[0];
    expect(Body.posY[platform]).toBe(5);

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    const players = defineQuery([Player])(state.world);
    expect(players.length).toBe(1);
    const playerEntity = players[0];

    Body.posX[playerEntity] = 0;
    Body.posY[playerEntity] = 7;
    Body.posZ[playerEntity] = 0;

    for (let i = 0; i < 20; i++) {
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
      if (CharacterController.grounded[playerEntity] === 1) break;
    }

    expect(CharacterController.grounded[playerEntity]).toBe(1);
    const initialPlayerY = Body.posY[playerEntity];
    const initialPlatformY = Body.posY[platform];

    console.log(
      `Initial player Y: ${initialPlayerY}, Initial platform Y: ${initialPlatformY}`
    );

    const stepsForFullDuration = Math.ceil(2 / TIME_CONSTANTS.FIXED_TIMESTEP);
    let ungroundedFrames = 0;
    const groundedStates: boolean[] = [];

    for (let i = 0; i < stepsForFullDuration; i++) {
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

      const isGrounded = CharacterController.grounded[playerEntity] === 1;
      groundedStates.push(isGrounded);

      if (!isGrounded) {
        ungroundedFrames++;
      }

      if (i % 20 === 0 || i === stepsForFullDuration - 1) {
        const currentPlayerY = Body.posY[playerEntity];
        const currentPlatformY = Body.posY[platform];
        console.log(
          `Step ${i}: Player Y: ${currentPlayerY.toFixed(2)}, Platform Y: ${currentPlatformY.toFixed(2)}, Grounded: ${isGrounded}`
        );
      }
    }

    console.log(
      `Ungrounded frames: ${ungroundedFrames} / ${stepsForFullDuration}`
    );
    console.log(
      `Grounded percentage: ${(((stepsForFullDuration - ungroundedFrames) / stepsForFullDuration) * 100).toFixed(1)}%`
    );

    const finalPlatformY = Body.posY[platform];
    expect(finalPlatformY).toBeCloseTo(0, 1);

    const finalPlayerY = Body.posY[playerEntity];
    console.log(
      `Final player Y: ${finalPlayerY}, Final platform Y: ${finalPlatformY}`
    );

    expect(finalPlayerY).toBeLessThanOrEqual(initialPlayerY);

    // Frame-by-frame grounding check - player should remain grounded throughout
    expect(ungroundedFrames).toBe(0);
    expect(groundedStates.every((grounded) => grounded)).toBe(true);
  });

  // TODO: Fix platform movement tests - platform entity detection failing
  it.skip('should move player upward with kinematic platform using tween', () => {
    const xml = `
      <world>
        <static-part 
          body="pos: 0 -5 0"
          renderer="shape: box; size: 20 1 20; color: 0x90ee90"
          collider="shape: box; size: 20 1 20" />
        
        <kinematic-part 
          body="pos: 0 0 0"
          renderer="shape: box; size: 4 1 4; color: 0xff6600"
          collider="shape: box; size: 4 1 4">
          <tween target="body.pos-y" from="0" to="5" duration="2"></tween>
        </kinematic-part>
      </world>
    `;

    const parsed = XMLParser.parse(xml);
    parseXMLToEntities(state, parsed.root);

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    const players = defineQuery([Player])(state.world);
    expect(players.length).toBe(1);
    const playerEntity = players[0];

    const platforms = defineQuery([Transform, Body])(state.world).filter(
      (ent) =>
        Body.posY[ent] === 0 &&
        Body.type[ent] === BodyType.KinematicVelocityBased
    );
    expect(platforms.length).toBeGreaterThan(0);
    const platform = platforms[0];

    for (let i = 0; i < 20; i++) {
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
      if (CharacterController.grounded[playerEntity] === 1) break;
    }

    expect(CharacterController.grounded[playerEntity]).toBe(1);
    const initialPlayerY = Body.posY[playerEntity];
    const initialPlatformY = Transform.posY[platform];

    console.log(
      `Initial player Y: ${initialPlayerY}, Initial platform Y: ${initialPlatformY}`
    );

    const stepsForFullDuration = Math.ceil(2 / TIME_CONSTANTS.FIXED_TIMESTEP);

    for (let i = 0; i < stepsForFullDuration; i++) {
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

      if (i % 20 === 0 || i === stepsForFullDuration - 1) {
        const currentPlayerY = Body.posY[playerEntity];
        const currentPlatformY = Transform.posY[platform];
        console.log(
          `Step ${i}: Player Y: ${currentPlayerY.toFixed(2)}, Platform Y: ${currentPlatformY.toFixed(2)}, Grounded: ${CharacterController.grounded[playerEntity]}`
        );
      }
    }

    const finalPlatformY = Transform.posY[platform];
    expect(finalPlatformY).toBeCloseTo(5, 1);

    const finalPlayerY = Body.posY[playerEntity];
    console.log(
      `Final player Y: ${finalPlayerY}, Final platform Y: ${finalPlatformY}`
    );

    expect(finalPlayerY).toBeGreaterThanOrEqual(5);
    expect(CharacterController.grounded[playerEntity]).toBe(1);
  });

  // TODO: Fix platform movement tests - platform entity detection failing
  it.skip('should handle player on multiple moving platforms', () => {
    const xml = `
      <world>
        <static-part 
          body="pos: 0 -10 0"
          renderer="shape: box; size: 50 1 50; color: 0x90ee90"
          collider="shape: box; size: 50 1 50" />
        
        <kinematic-part 
          body="pos: -3 0 0"
          renderer="shape: box; size: 4 1 4; color: 0xff6600"
          collider="shape: box; size: 4 1 4">
          <tween target="body.pos-y" from="0" to="3" duration="1.5"></tween>
        </kinematic-part>
        
        <kinematic-part 
          body="pos: 3 2 0"
          renderer="shape: box; size: 4 1 4; color: 0x00ff66"
          collider="shape: box; size: 4 1 4">
          <tween target="body.pos-y" from="2" to="6" duration="2"></tween>
        </kinematic-part>
      </world>
    `;

    const parsed = XMLParser.parse(xml);
    parseXMLToEntities(state, parsed.root);

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    const players = defineQuery([Player])(state.world);
    const playerEntity = players[0];

    Body.posX[playerEntity] = -3;
    Body.posY[playerEntity] = 1;

    for (let i = 0; i < 20; i++) {
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
      if (CharacterController.grounded[playerEntity] === 1) break;
    }

    const startY = Body.posY[playerEntity];
    console.log(`Starting on first platform at Y: ${startY}`);

    const stepsForOneSecond = Math.ceil(1 / TIME_CONSTANTS.FIXED_TIMESTEP);
    for (let i = 0; i < stepsForOneSecond; i++) {
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
    }

    const midY = Body.posY[playerEntity];
    console.log(`After 1 second, player Y: ${midY}`);
    expect(midY).toBeGreaterThan(startY);
  });

  // TODO: Fix platform movement tests - platform entity detection failing
  it.skip('should handle platform moving with ping-pong loop', () => {
    const xml = `
      <world>
        <static-part 
          body="pos: 0 -5 0"
          renderer="shape: box; size: 30 1 30; color: 0x90ee90"
          collider="shape: box; size: 30 1 30" />
        
        <kinematic-part 
          body="pos: 0 0 0"
          renderer="shape: box; size: 6 1 6; color: 0xffff00"
          collider="shape: box; size: 6 1 6">
          <tween target="body.pos-y" from="0" to="4" duration="1" loop="ping-pong"></tween>
        </kinematic-part>
      </world>
    `;

    const parsed = XMLParser.parse(xml);
    parseXMLToEntities(state, parsed.root);

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    const players = defineQuery([Player])(state.world);
    const playerEntity = players[0];

    for (let i = 0; i < 30; i++) {
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
      if (CharacterController.grounded[playerEntity] === 1) break;
    }

    const positions: number[] = [];

    const totalSteps = Math.ceil(3 / TIME_CONSTANTS.FIXED_TIMESTEP);
    for (let i = 0; i < totalSteps; i++) {
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

      if (i % 15 === 0) {
        positions.push(Body.posY[playerEntity]);
        console.log(
          `Time ${(i * TIME_CONSTANTS.FIXED_TIMESTEP).toFixed(2)}s: Player Y = ${Body.posY[playerEntity].toFixed(2)}`
        );
      }
    }

    const maxPosition = Math.max(...positions);
    const minPosition = Math.min(...positions);

    expect(maxPosition).toBeGreaterThan(3);
    expect(minPosition).toBeLessThan(2);
    expect(positions.length).toBeGreaterThan(5);
  });
});
