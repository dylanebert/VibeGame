import { record, type Clip } from './recorder';

const CLIPS: Record<string, Clip> = {
  'left-to-center': {
    name: 'left-to-center',
    description: 'Cube moves from left (-5) to center (0)',
    warmup: 1,
    frames: 30,
    initial: [
      { target: 'cube', attr: 'transform.pos-x', value: -5 },
      { target: 'cube', attr: 'target-position.x', value: -5 },
      { target: 'controller', attr: 'cube-controller.target-x', value: -5 },
    ],
    trigger: [
      { target: 'controller', attr: 'cube-controller.target-x', value: 0 },
    ],
  },

  'center-to-right': {
    name: 'center-to-right',
    description: 'Cube moves from center (0) to right (5)',
    warmup: 1,
    frames: 30,
    initial: [
      { target: 'cube', attr: 'transform.pos-x', value: 0 },
      { target: 'cube', attr: 'target-position.x', value: 0 },
      { target: 'controller', attr: 'cube-controller.target-x', value: 0 },
    ],
    trigger: [
      { target: 'controller', attr: 'cube-controller.target-x', value: 5 },
    ],
  },

  bounce: {
    name: 'bounce',
    description: 'Cube performs bounce animation',
    warmup: 1,
    frames: 30,
    initial: [
      { target: 'cube', attr: 'transform.pos-x', value: 0 },
      { target: 'cube', attr: 'target-position.x', value: 0 },
      { target: 'controller', attr: 'cube-controller.target-x', value: 0 },
    ],
    trigger: [
      { target: 'controller', attr: 'cube-controller.bounce-requested', value: 1 },
    ],
  },
};

record(CLIPS, process.argv[2]).catch(console.error);
