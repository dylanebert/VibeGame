export const BODY_PARTS = {
  head: {
    size: { x: 0.35, y: 0.35, z: 0.35 },
    offset: { x: 0, y: 0.575, z: 0 },
    color: 0xfdbcb4,
  },
  torso: {
    size: { x: 0.45, y: 0.55, z: 0.3 },
    offset: { x: 0, y: 0.05, z: 0 },
    color: 0x4169e1,
  },
  leftArm: {
    size: { x: 0.175, y: 0.45, z: 0.175 },
    offset: { x: -0.3125, y: 0.15, z: 0 },
    color: 0xfdbcb4,
  },
  rightArm: {
    size: { x: 0.175, y: 0.45, z: 0.175 },
    offset: { x: 0.3125, y: 0.15, z: 0 },
    color: 0xfdbcb4,
  },
  leftLeg: {
    size: { x: 0.2, y: 0.475, z: 0.2 },
    offset: { x: -0.125, y: -0.5, z: 0 },
    color: 0x483d8b,
  },
  rightLeg: {
    size: { x: 0.2, y: 0.475, z: 0.2 },
    offset: { x: 0.125, y: -0.5, z: 0 },
    color: 0x483d8b,
  },
};

export const ANIMATION_CONFIG = {
  armSwingAngle: 30,
  legSwingAngle: 25,
  frequency: 0.5,
  jump: {
    armRaiseAngle: 45,
    bodyStretch: 0.12,
    legTuckAngle: 35,
    anticipationSquash: 0.08,
    anticipationDuration: 0.1,
  },
  fall: {
    armFlailAngle: 20,
    legDangleAngle: 15,
    bodyTiltAngle: 10,
    windSwayAmount: 0.05,
  },
  landing: {
    duration: 0.15,
    bounceHeight: 0.04,
    squashAmount: 0.15,
  },
};

export const ANIMATION_STATES = {
  IDLE: 0,
  WALKING: 1,
  JUMPING: 2,
  FALLING: 3,
  LANDING: 4,
} as const;
