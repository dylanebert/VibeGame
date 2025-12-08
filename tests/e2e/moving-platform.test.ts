import { beforeEach, describe, expect, it } from 'bun:test';
import { State, TIME_CONSTANTS } from 'vibegame';
import {
  createHeadlessState,
  parseWorldXml,
  queryEntities,
} from 'vibegame/cli';
import { DefaultPlugins } from 'vibegame/defaults';
import { Body, BodyType, CharacterController } from 'vibegame/physics';

describe('E2E: Moving Platform Character Controller', () => {
  let state: State;

  beforeEach(async () => {
    state = createHeadlessState({ plugins: DefaultPlugins });
    await state.initializePlugins();
  });

  it('should keep player at rest on stationary kinematic platform (base case)', () => {
    parseWorldXml(
      state,
      `
      <static-part
        body="pos: 0 -10 0"
        renderer="shape: box; size: 20 1 20; color: 0x90ee90"
        collider="shape: box; size: 20 1 20" />

      <kinematic-part
        body="pos: 0 2 0"
        renderer="shape: box; size: 4 1 4; color: 0xff6600"
        collider="shape: box; size: 4 1 4" />
    `
    );

    let kinematicPlatform: number | undefined;
    const entities = queryEntities(state, 'body');

    for (const entity of entities) {
      // kinematic-part recipe uses KinematicVelocityBased
      if (
        Body.type[entity] === BodyType.KinematicVelocityBased &&
        Body.posY[entity] === 2
      ) {
        kinematicPlatform = entity;
        break;
      }
    }
    expect(kinematicPlatform).toBeDefined();

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    const players = queryEntities(state, 'player');
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
    expect(settledY).toBeGreaterThan(2);
    expect(settledY).toBeLessThan(4);

    expect(CharacterController.platform[playerEntity]).toBe(kinematicPlatform!);

    const positions: number[] = [];
    for (let i = 0; i < 60; i++) {
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
      positions.push(Body.posY[playerEntity]);
    }

    const minY = Math.min(...positions);
    const maxY = Math.max(...positions);
    const variance = maxY - minY;

    expect(variance).toBeLessThan(0.1);
    expect(CharacterController.grounded[playerEntity]).toBe(1);
    expect(CharacterController.platform[playerEntity]).toBe(kinematicPlatform!);
  });

  it('should move player downward with kinematic platform using tween', () => {
    parseWorldXml(
      state,
      `
      <static-part
        body="pos: 0 -10 0"
        renderer="shape: box; size: 20 1 20; color: 0x90ee90"
        collider="shape: box; size: 20 1 20" />

      <kinematic-part name="platform"
        body="pos: 0 5 0"
        renderer="shape: box; size: 4 1 4; color: 0xff6600"
        collider="shape: box; size: 4 1 4">
      </kinematic-part>
      <tween target="platform" attr="body.pos-y" from="5" to="0" duration="2"></tween>
    `
    );

    const platforms = queryEntities(state, 'body').filter(
      (ent) => Body.type[ent] === BodyType.KinematicVelocityBased
    );
    expect(platforms.length).toBeGreaterThan(0);
    const platform = platforms[0];
    expect(Body.posY[platform]).toBe(5);

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    const players = queryEntities(state, 'player');
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

      if (i % 10 === 0 || i === stepsForFullDuration - 1) {
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

    const ungroundedPercentage =
      (ungroundedFrames / stepsForFullDuration) * 100;
    expect(ungroundedPercentage).toBeLessThanOrEqual(2);
    console.log(
      `Grounding stability: ${(100 - ungroundedPercentage).toFixed(1)}% grounded`
    );
  });

  it('should move player upward with kinematic platform using tween', () => {
    parseWorldXml(
      state,
      `
      <static-part
        body="pos: 0 -5 0"
        renderer="shape: box; size: 20 1 20; color: 0x90ee90"
        collider="shape: box; size: 20 1 20" />

      <kinematic-part name="platform"
        body="pos: 0 0 0"
        renderer="shape: box; size: 4 1 4; color: 0xff6600"
        collider="shape: box; size: 4 1 4">
      </kinematic-part>
      <tween target="platform" attr="body.pos-y" from="0" to="5" duration="2"></tween>
    `
    );

    const platforms = queryEntities(state, 'body').filter(
      (ent) => Body.type[ent] === BodyType.KinematicVelocityBased
    );
    expect(platforms.length).toBeGreaterThan(0);
    const platform = platforms[0];
    expect(Body.posY[platform]).toBeCloseTo(0, 1);

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    const players = queryEntities(state, 'player');
    expect(players.length).toBe(1);
    const playerEntity = players[0];

    Body.posX[playerEntity] = 0;
    Body.posY[playerEntity] = 1;
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

    for (let i = 0; i < stepsForFullDuration; i++) {
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

      if (i % 10 === 0 || i === stepsForFullDuration - 1) {
        const currentPlayerY = Body.posY[playerEntity];
        const currentPlatformY = Body.posY[platform];
        console.log(
          `Step ${i}: Player Y: ${currentPlayerY.toFixed(2)}, Platform Y: ${currentPlatformY.toFixed(2)}, Grounded: ${CharacterController.grounded[playerEntity]}`
        );
      }
    }

    const finalPlatformY = Body.posY[platform];
    expect(finalPlatformY).toBeCloseTo(5, 1);

    const finalPlayerY = Body.posY[playerEntity];
    console.log(
      `Final player Y: ${finalPlayerY}, Final platform Y: ${finalPlatformY}`
    );

    expect(finalPlayerY).toBeGreaterThanOrEqual(5);
    expect(CharacterController.grounded[playerEntity]).toBe(1);
  });

  it('should handle player on multiple moving platforms', () => {
    parseWorldXml(
      state,
      `
      <static-part
        body="pos: 0 -10 0"
        renderer="shape: box; size: 50 1 50; color: 0x90ee90"
        collider="shape: box; size: 50 1 50" />

      <kinematic-part name="platform1"
        body="pos: -3 0 0"
        renderer="shape: box; size: 4 1 4; color: 0xff6600"
        collider="shape: box; size: 4 1 4">
      </kinematic-part>
      <tween target="platform1" attr="body.pos-y" from="0" to="3" duration="1.5"></tween>

      <kinematic-part name="platform2"
        body="pos: 3 2 0"
        renderer="shape: box; size: 4 1 4; color: 0x00ff66"
        collider="shape: box; size: 4 1 4">
      </kinematic-part>
      <tween target="platform2" attr="body.pos-y" from="2" to="6" duration="2"></tween>
    `
    );

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    const players = queryEntities(state, 'player');
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

  it('should move player horizontally with kinematic platform using tween', () => {
    parseWorldXml(
      state,
      `
      <static-part
        body="pos: 0 -10 0"
        renderer="shape: box; size: 20 1 20; color: 0x90ee90"
        collider="shape: box; size: 20 1 20" />

      <kinematic-part name="platform"
        body="pos: 0 2 0"
        renderer="shape: box; size: 4 1 4; color: 0xff6600"
        collider="shape: box; size: 4 1 4">
      </kinematic-part>
      <tween target="platform" attr="body.pos-x" from="0" to="5" duration="2"></tween>
    `
    );

    const platforms = queryEntities(state, 'body').filter(
      (ent) => Body.type[ent] === BodyType.KinematicVelocityBased
    );
    expect(platforms.length).toBeGreaterThan(0);
    const platform = platforms[0];
    expect(Body.posX[platform]).toBe(0);

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    const players = queryEntities(state, 'player');
    expect(players.length).toBe(1);
    const playerEntity = players[0];

    Body.posX[playerEntity] = 0;
    Body.posY[playerEntity] = 4;
    Body.posZ[playerEntity] = 0;

    for (let i = 0; i < 20; i++) {
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
      if (CharacterController.grounded[playerEntity] === 1) break;
    }

    expect(CharacterController.grounded[playerEntity]).toBe(1);
    const initialPlayerX = Body.posX[playerEntity];
    const initialPlatformX = Body.posX[platform];

    console.log(
      `Initial player X: ${initialPlayerX}, Initial platform X: ${initialPlatformX}`
    );

    const stepsForFullDuration = Math.ceil(2 / TIME_CONSTANTS.FIXED_TIMESTEP);

    for (let i = 0; i < stepsForFullDuration; i++) {
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

      if (i % 10 === 0 || i === stepsForFullDuration - 1) {
        const currentPlayerX = Body.posX[playerEntity];
        const currentPlatformX = Body.posX[platform];
        console.log(
          `Step ${i}: Player X: ${currentPlayerX.toFixed(2)}, Platform X: ${currentPlatformX.toFixed(2)}, Grounded: ${CharacterController.grounded[playerEntity]}`
        );
      }
    }

    const finalPlatformX = Body.posX[platform];
    expect(finalPlatformX).toBeCloseTo(5, 1);

    const finalPlayerX = Body.posX[playerEntity];
    console.log(
      `Final player X: ${finalPlayerX}, Final platform X: ${finalPlatformX}`
    );

    expect(finalPlayerX).toBeGreaterThanOrEqual(4);
    expect(CharacterController.grounded[playerEntity]).toBe(1);
  });

  it('should move player diagonally upward with kinematic platform', () => {
    parseWorldXml(
      state,
      `
      <static-part
        body="pos: 0 -5 0"
        renderer="shape: box; size: 20 1 20; color: 0x90ee90"
        collider="shape: box; size: 20 1 20" />

      <kinematic-part name="platform"
        body="pos: 0 0 0"
        renderer="shape: box; size: 4 1 4; color: 0xff6600"
        collider="shape: box; size: 4 1 4">
      </kinematic-part>
      <tween target="platform" attr="body.pos-y" from="0" to="5" duration="2"></tween>
      <tween target="platform" attr="body.pos-x" from="0" to="5" duration="2"></tween>
    `
    );

    const platforms = queryEntities(state, 'body').filter(
      (ent) => Body.type[ent] === BodyType.KinematicVelocityBased
    );
    expect(platforms.length).toBeGreaterThan(0);
    const platform = platforms[0];
    expect(Body.posY[platform]).toBeCloseTo(0, 1);

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    const players = queryEntities(state, 'player');
    expect(players.length).toBe(1);
    const playerEntity = players[0];

    Body.posX[playerEntity] = 0;
    Body.posY[playerEntity] = 1;
    Body.posZ[playerEntity] = 0;

    for (let i = 0; i < 20; i++) {
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
      if (CharacterController.grounded[playerEntity] === 1) break;
    }

    expect(CharacterController.grounded[playerEntity]).toBe(1);
    const initialPlayerX = Body.posX[playerEntity];
    const initialPlayerY = Body.posY[playerEntity];
    const initialPlatformX = Body.posX[platform];
    const initialPlatformY = Body.posY[platform];

    console.log(
      `Initial player X: ${initialPlayerX.toFixed(2)}, Y: ${initialPlayerY.toFixed(2)}`
    );
    console.log(
      `Initial platform X: ${initialPlatformX.toFixed(2)}, Y: ${initialPlatformY.toFixed(2)}`
    );

    const stepsForFullDuration = Math.ceil(2 / TIME_CONSTANTS.FIXED_TIMESTEP);
    let firstUngroundedStep = -1;
    let fellThroughStep = -1;

    for (let i = 0; i < stepsForFullDuration; i++) {
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

      const isGrounded = CharacterController.grounded[playerEntity] === 1;
      const playerY = Body.posY[playerEntity];

      if (!isGrounded && firstUngroundedStep === -1) {
        firstUngroundedStep = i;
      }

      if (playerY < -5 && fellThroughStep === -1) {
        fellThroughStep = i;
      }

      if (i % 10 === 0 || i === stepsForFullDuration - 1) {
        const currentPlayerX = Body.posX[playerEntity];
        const currentPlayerY = Body.posY[playerEntity];
        const currentPlatformX = Body.posX[platform];
        const currentPlatformY = Body.posY[platform];
        console.log(
          `Step ${i}: Player X=${currentPlayerX.toFixed(2)}, Y=${currentPlayerY.toFixed(2)}, Platform X=${currentPlatformX.toFixed(2)}, Y=${currentPlatformY.toFixed(2)}, Grounded: ${isGrounded ? 1 : 0}`
        );
      }
    }

    const finalPlatformX = Body.posX[platform];
    const finalPlatformY = Body.posY[platform];
    const finalPlayerX = Body.posX[playerEntity];
    const finalPlayerY = Body.posY[playerEntity];

    console.log(
      `Final player X: ${finalPlayerX.toFixed(2)}, Y: ${finalPlayerY.toFixed(2)}`
    );
    console.log(
      `Final platform X: ${finalPlatformX.toFixed(2)}, Y: ${finalPlatformY.toFixed(2)}`
    );

    const playerXMovement = finalPlayerX - initialPlayerX;
    const playerYMovement = finalPlayerY - initialPlayerY;
    const platformXMovement = finalPlatformX - initialPlatformX;
    const platformYMovement = finalPlatformY - initialPlatformY;

    console.log(
      `Player moved X: ${playerXMovement.toFixed(2)}, Y: ${playerYMovement.toFixed(2)}`
    );
    console.log(
      `Platform moved X: ${platformXMovement.toFixed(2)}, Y: ${platformYMovement.toFixed(2)}`
    );

    if (firstUngroundedStep >= 0) {
      console.log(`Player became ungrounded at step ${firstUngroundedStep}`);
    }
    if (fellThroughStep >= 0) {
      console.log(`Player fell through at step ${fellThroughStep}`);
    }

    expect(finalPlatformX).toBeCloseTo(5, 1);
    expect(finalPlatformY).toBeCloseTo(5, 1);

    expect(playerXMovement).toBeGreaterThan(platformXMovement * 0.8);
    expect(playerYMovement).toBeGreaterThan(platformYMovement * 0.8);
    expect(CharacterController.grounded[playerEntity]).toBe(1);
  });

  it('should move player diagonally downward with kinematic platform', () => {
    parseWorldXml(
      state,
      `
      <static-part
        body="pos: 0 -10 0"
        renderer="shape: box; size: 20 1 20; color: 0x90ee90"
        collider="shape: box; size: 20 1 20" />

      <kinematic-part name="platform"
        body="pos: 0 5 0"
        renderer="shape: box; size: 4 1 4; color: 0x00ff66"
        collider="shape: box; size: 4 1 4">
      </kinematic-part>
      <tween target="platform" attr="body.pos-x" from="0" to="5" duration="2"></tween>
      <tween target="platform" attr="body.pos-y" from="5" to="2" duration="2"></tween>
    `
    );

    const platforms = queryEntities(state, 'body').filter(
      (ent) => Body.type[ent] === BodyType.KinematicVelocityBased
    );
    expect(platforms.length).toBeGreaterThan(0);
    const platform = platforms[0];
    expect(Body.posX[platform]).toBe(0);
    expect(Body.posY[platform]).toBe(5);

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    const players = queryEntities(state, 'player');
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
    const initialPlayerX = Body.posX[playerEntity];
    const initialPlayerY = Body.posY[playerEntity];
    const initialPlatformX = Body.posX[platform];
    const initialPlatformY = Body.posY[platform];

    console.log(
      `Initial - Player: (${initialPlayerX.toFixed(2)}, ${initialPlayerY.toFixed(2)}), Platform: (${initialPlatformX.toFixed(2)}, ${initialPlatformY.toFixed(2)})`
    );

    const stepsForFullDuration = Math.ceil(2 / TIME_CONSTANTS.FIXED_TIMESTEP);
    let ungroundedFrames = 0;

    for (let i = 0; i < stepsForFullDuration; i++) {
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

      if (CharacterController.grounded[playerEntity] === 0) {
        ungroundedFrames++;
      }

      if (i % 10 === 0 || i === stepsForFullDuration - 1) {
        const currentPlayerX = Body.posX[playerEntity];
        const currentPlayerY = Body.posY[playerEntity];
        const currentPlatformX = Body.posX[platform];
        const currentPlatformY = Body.posY[platform];
        console.log(
          `Step ${i}: Player: (${currentPlayerX.toFixed(2)}, ${currentPlayerY.toFixed(2)}), Platform: (${currentPlatformX.toFixed(2)}, ${currentPlatformY.toFixed(2)}), Grounded: ${CharacterController.grounded[playerEntity]}`
        );
      }
    }

    const finalPlayerX = Body.posX[playerEntity];
    const finalPlayerY = Body.posY[playerEntity];
    const finalPlatformX = Body.posX[platform];
    const finalPlatformY = Body.posY[platform];

    console.log(
      `Final - Player: (${finalPlayerX.toFixed(2)}, ${finalPlayerY.toFixed(2)}), Platform: (${finalPlatformX.toFixed(2)}, ${finalPlatformY.toFixed(2)})`
    );

    expect(finalPlatformX).toBeCloseTo(5, 1);
    expect(finalPlatformY).toBeCloseTo(2, 1);

    const playerXMovement = finalPlayerX - initialPlayerX;
    const playerYMovement = finalPlayerY - initialPlayerY;
    const platformXMovement = finalPlatformX - initialPlatformX;
    const platformYMovement = finalPlatformY - initialPlatformY;

    console.log(
      `Player moved: X=${playerXMovement.toFixed(2)}, Y=${playerYMovement.toFixed(2)}`
    );
    console.log(
      `Platform moved: X=${platformXMovement.toFixed(2)}, Y=${platformYMovement.toFixed(2)}`
    );

    expect(playerXMovement).toBeGreaterThan(platformXMovement * 0.8);
    expect(finalPlayerY).toBeLessThan(initialPlayerY);
    expect(finalPlayerY).toBeGreaterThan(0);
    const ungroundedPercentage =
      (ungroundedFrames / stepsForFullDuration) * 100;
    console.log(`Ungrounded: ${ungroundedPercentage.toFixed(1)}%`);
    expect(ungroundedPercentage).toBeLessThan(10);
  });

  it('should handle platform moving with ping-pong loop', () => {
    parseWorldXml(
      state,
      `
      <static-part
        body="pos: 0 -5 0"
        renderer="shape: box; size: 30 1 30; color: 0x90ee90"
        collider="shape: box; size: 30 1 30" />

      <kinematic-part name="platform"
        body="pos: 0 0 0"
        renderer="shape: box; size: 6 1 6; color: 0xffff00"
        collider="shape: box; size: 6 1 6">
      </kinematic-part>
      <tween target="platform" attr="body.pos-y" from="0" to="4" duration="1"></tween>
    `
    );

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    const players = queryEntities(state, 'player');
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
