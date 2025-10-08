import { InputState, InputButtons } from './components';

export interface InputCommand {
  tick: number;
  buttons: number;
  moveX: number;
  moveY: number;
  lookDeltaX: number;
  lookDeltaY: number;
  scrollDelta: number;
}

export class InputBuffer {
  private static readonly BUFFER_SIZE = 256;
  private commands: Array<InputCommand | null>;

  constructor() {
    this.commands = new Array(InputBuffer.BUFFER_SIZE).fill(null);
  }

  set(tick: number, command: InputCommand): void {
    const index = tick % InputBuffer.BUFFER_SIZE;
    this.commands[index] = { ...command };
  }

  get(tick: number): InputCommand | null {
    const index = tick % InputBuffer.BUFFER_SIZE;
    const command = this.commands[index];
    return command?.tick === tick ? command : null;
  }

  has(tick: number): boolean {
    return this.get(tick) !== null;
  }

  getRange(startTick: number, endTick: number): InputCommand[] {
    const commands: InputCommand[] = [];
    for (let tick = startTick; tick <= endTick; tick++) {
      const command = this.get(tick);
      if (command) commands.push(command);
    }
    return commands;
  }

  clear(): void {
    this.commands.fill(null);
  }

  getLatestTick(): number {
    let maxTick = -1;
    for (const command of this.commands) {
      if (command && command.tick > maxTick) {
        maxTick = command.tick;
      }
    }
    return maxTick;
  }
}

interface RawInput {
  keys: Set<string>;
  mouseButtons: Set<number>;
  mouseDeltaX: number;
  mouseDeltaY: number;
  scrollDelta: number;
}

const rawInput: RawInput = {
  keys: new Set(),
  mouseButtons: new Set(),
  mouseDeltaX: 0,
  mouseDeltaY: 0,
  scrollDelta: 0,
};

let targetCanvas: HTMLCanvasElement | null = null;
let canvasHasFocus = false;

function handleKeyDown(event: KeyboardEvent): void {
  if (!canvasHasFocus) return;
  rawInput.keys.add(event.code);
  if (event.code === 'Space') event.preventDefault();
}

function handleKeyUp(event: KeyboardEvent): void {
  if (!canvasHasFocus) return;
  rawInput.keys.delete(event.code);
}

function handleMouseDown(event: MouseEvent): void {
  rawInput.mouseButtons.add(event.button);
  if (event.button === 2) event.preventDefault();
}

function handleMouseUp(event: MouseEvent): void {
  rawInput.mouseButtons.delete(event.button);
}

function handleMouseMove(event: MouseEvent): void {
  rawInput.mouseDeltaX += event.movementX;
  rawInput.mouseDeltaY += event.movementY;
}

function handleWheel(event: WheelEvent): void {
  rawInput.scrollDelta += event.deltaY * 0.01;
  event.preventDefault();
}

function handleContextMenu(event: Event): void {
  event.preventDefault();
}

function handleMouseDownDelegated(event: MouseEvent): void {
  if (event.target === targetCanvas) {
    handleMouseDown(event);
    if (document.activeElement !== targetCanvas) {
      targetCanvas?.focus();
    }
  }
}

function handleMouseUpDelegated(event: MouseEvent): void {
  if (event.target === targetCanvas) handleMouseUp(event);
}

function handleMouseMoveDelegated(event: MouseEvent): void {
  if (event.target === targetCanvas) handleMouseMove(event);
}

function handleWheelDelegated(event: WheelEvent): void {
  if (event.target === targetCanvas) handleWheel(event);
}

function handleContextMenuDelegated(event: Event): void {
  if (event.target === targetCanvas) handleContextMenu(event);
}

function handleFocus(): void {
  canvasHasFocus = true;
}

function handleBlur(): void {
  canvasHasFocus = false;
  clearRawInput();
}

export function setTargetCanvas(canvas: HTMLCanvasElement | null): void {
  if (targetCanvas) {
    targetCanvas.removeEventListener('focus', handleFocus);
    targetCanvas.removeEventListener('blur', handleBlur);
  }

  targetCanvas = canvas;

  if (targetCanvas) {
    targetCanvas.tabIndex =
      targetCanvas.tabIndex === -1 ? 0 : targetCanvas.tabIndex;
    targetCanvas.addEventListener('focus', handleFocus);
    targetCanvas.addEventListener('blur', handleBlur);
    if (document.activeElement === targetCanvas) {
      canvasHasFocus = true;
    }
  } else {
    canvasHasFocus = false;
  }
}

export function setupEventListeners(): void {
  if (typeof window === 'undefined') return;

  document.addEventListener('mousedown', handleMouseDownDelegated, true);
  document.addEventListener('mouseup', handleMouseUpDelegated, true);
  document.addEventListener('mousemove', handleMouseMoveDelegated, true);
  document.addEventListener('wheel', handleWheelDelegated, {
    passive: false,
    capture: true,
  });
  document.addEventListener('contextmenu', handleContextMenuDelegated, true);

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
}

export function cleanupEventListeners(): void {
  if (typeof window === 'undefined') return;

  document.removeEventListener('mousedown', handleMouseDownDelegated, true);
  document.removeEventListener('mouseup', handleMouseUpDelegated, true);
  document.removeEventListener('mousemove', handleMouseMoveDelegated, true);
  document.removeEventListener('wheel', handleWheelDelegated, true);
  document.removeEventListener('contextmenu', handleContextMenuDelegated, true);

  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);

  setTargetCanvas(null);
}

function isKeyPressed(keys: readonly string[]): boolean {
  return keys.some((key) => rawInput.keys.has(key));
}

function getAxisValue(
  positiveKeys: readonly string[],
  negativeKeys: readonly string[]
): number {
  let value = 0;
  if (isKeyPressed(positiveKeys)) value += 1;
  if (isKeyPressed(negativeKeys)) value -= 1;
  return value;
}

export function sampleInput(
  tick: number,
  keyMappings: {
    moveForward: readonly string[];
    moveBackward: readonly string[];
    moveLeft: readonly string[];
    moveRight: readonly string[];
    moveUp: readonly string[];
    moveDown: readonly string[];
    jump: readonly string[];
  },
  lookSensitivity: number
): InputCommand {
  let buttons = 0;

  if (isKeyPressed(keyMappings.jump)) buttons |= InputButtons.JUMP;
  if (isKeyPressed(keyMappings.moveForward))
    buttons |= InputButtons.MOVE_FORWARD;
  if (isKeyPressed(keyMappings.moveBackward))
    buttons |= InputButtons.MOVE_BACKWARD;
  if (isKeyPressed(keyMappings.moveLeft)) buttons |= InputButtons.MOVE_LEFT;
  if (isKeyPressed(keyMappings.moveRight)) buttons |= InputButtons.MOVE_RIGHT;
  if (isKeyPressed(keyMappings.moveUp)) buttons |= InputButtons.MOVE_UP;
  if (isKeyPressed(keyMappings.moveDown)) buttons |= InputButtons.MOVE_DOWN;

  if (rawInput.mouseButtons.has(0)) {
    buttons |= InputButtons.LEFT_MOUSE | InputButtons.PRIMARY;
  }
  if (rawInput.mouseButtons.has(2)) {
    buttons |= InputButtons.RIGHT_MOUSE | InputButtons.SECONDARY;
  }
  if (rawInput.mouseButtons.has(1)) buttons |= InputButtons.MIDDLE_MOUSE;

  return {
    tick,
    buttons,
    moveX: getAxisValue(keyMappings.moveRight, keyMappings.moveLeft),
    moveY: getAxisValue(keyMappings.moveForward, keyMappings.moveBackward),
    lookDeltaX: rawInput.mouseDeltaX * lookSensitivity,
    lookDeltaY: rawInput.mouseDeltaY * lookSensitivity,
    scrollDelta: rawInput.scrollDelta,
  };
}

export function resetFrameDeltas(): void {
  rawInput.mouseDeltaX = 0;
  rawInput.mouseDeltaY = 0;
  rawInput.scrollDelta = 0;
}

export function clearRawInput(): void {
  rawInput.keys.clear();
  rawInput.mouseButtons.clear();
  resetFrameDeltas();
}

export function setButton(eid: number, button: number, value: boolean): void {
  if (value) {
    InputState.buttons[eid] |= button;
  } else {
    InputState.buttons[eid] &= ~button;
  }
}

export function getButton(eid: number, button: number): boolean {
  return (InputState.buttons[eid] & button) !== 0;
}
