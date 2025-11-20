# Sequencer Example

<!-- LLM:OVERVIEW -->
Minimal test demonstrating SequencedTransform with PositionModifier creating combined animation effects.
<!-- /LLM:OVERVIEW -->

## Purpose

- Minimal sequencer functionality test
- Programmatic entity creation (no XML)
- Demonstrates base transform + additive modifier
- Animated cube with sine wave motion on X (base) and Y (modifier) axes

## Layout

```
sequencer/
├── context.md
├── src/
│   └── main.ts  # Entry point
├── index.html  # HTML entry point
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Implementation

**SetupSystem**: Creates camera and cube entity programmatically with SequencedTransform, Transform, Renderer, and PositionModifier components.

**AnimationSystem**: Updates SequencedTransform.posX and PositionModifier.y each frame using sine waves at different frequencies.

## Running

```bash
cd examples/sequencer
bun dev
```
