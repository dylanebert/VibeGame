# Lorenz Attractor Example

<!-- LLM:OVERVIEW -->
Lorenz attractor particle system demo showcasing custom plugin architecture and mathematical visualization. Demonstrates creating custom components, systems, and physics-free particle effects.
<!-- /LLM:OVERVIEW -->

## Purpose

- Demonstrate custom plugin creation
- Showcase particle system implementation
- Mathematical visualization example
- Performance testing with many entities

## Layout

```
lorenz/
├── context.md  # This file
├── src/
│   ├── main.ts  # Entry point
│   ├── plugin.ts  # Lorenz plugin definition
│   ├── components.ts  # Particle component
│   ├── systems.ts  # Attractor simulation
│   └── utils.ts  # Math utilities
├── index.html  # HTML entry point
├── package.json  # Dependencies
└── vite.config.ts  # Vite configuration
```

## Scope

- **In-scope**: Mathematical simulation, particle rendering, custom plugin pattern
- **Out-of-scope**: Physics integration, user interaction

## Entry Points

- **src/main.ts**: Application entry with plugin setup
- **index.html**: Browser entry point

## Dependencies

- **Internal**: Core engine, rendering, transforms
- **External**: Vite, Three.js

<!-- LLM:EXAMPLES -->
## Examples

### Running

```bash
cd examples/lorenz
bun dev
```

### Custom Plugin Pattern

```typescript
import * as GAME from 'vibegame';
import { LorenzPlugin } from './plugin';

GAME.withPlugin(LorenzPlugin).run();
```
<!-- /LLM:EXAMPLES -->
