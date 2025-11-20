# Sequencer Example

<!-- LLM:OVERVIEW -->
Interactive visualization and video recording using controller entity pattern. A controller entity holds animation state; systems read it to drive scene objects. Uses explicit State control (not builder pattern) for recording compatibility. Recording uses generic component overrides with tween-like `target`/`attr` syntax.
<!-- /LLM:OVERVIEW -->

## Layout

```
sequencer/
├── src/
│   ├── plugin.ts    # CubeController, TargetPosition, systems
│   ├── main.ts      # Explicit State control with manual animation loop
│   ├── recorder.ts  # Generic Playwright recorder utility
│   └── record.ts    # Clip definitions for this demo
├── render.sh        # Record + encode to MP4
├── index.html       # Scene with controller entity
└── .gitignore       # frames/
```

## Running

```bash
bun dev                # Interactive mode
./render.sh bounce     # Record and encode to frames/bounce.mp4
```

## Recording

Demos expose `canvas.__state__` and `canvas.__stop__()` for recorder access. Clips are declarative overrides:

```typescript
{ target: 'controller', attr: 'cube-controller.target-x', value: 5 }
```

Flow: stop loop → apply initial → warmup → apply trigger → capture frames
