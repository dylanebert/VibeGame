export const INPUT_CONFIG = {
  mappings: {
    moveForward: ['KeyW', 'ArrowUp'],
    moveBackward: ['KeyS', 'ArrowDown'],
    moveLeft: ['KeyA', 'ArrowLeft'],
    moveRight: ['KeyD', 'ArrowRight'],
    moveUp: ['KeyE'],
    moveDown: ['KeyQ'],
    jump: ['Space'],
    primaryAction: ['MouseLeft'],
    secondaryAction: ['MouseRight'],
  },

  bufferWindow: 100,

  gracePeriods: {
    coyoteTime: 100,
    landingBuffer: 50,
  },

  mouseSensitivity: {
    look: 0.5,
    scroll: 0.01,
  },
} as const;

export type InputAction = keyof typeof INPUT_CONFIG.mappings;
