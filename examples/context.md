# Examples

<!-- LLM:OVERVIEW -->
Collection of example applications demonstrating VibeGame engine features and usage patterns.
<!-- /LLM:OVERVIEW -->

## Purpose

- Demonstrate engine capabilities
- Provide integration reference
- Test plugin functionality
- Development playground

## Layout

```
examples/
├── context.md  # This file
├── hello-world/  # Basic example
│   ├── context.md
│   ├── src/
│   │   └── main.ts
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── lorenz/  # Lorenz attractor particle system
│   ├── context.md
│   ├── src/
│   │   ├── main.ts
│   │   ├── plugin.ts
│   │   ├── components.ts
│   │   ├── systems.ts
│   │   └── utils.ts
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
└── multiplayer/  # Multiplayer networking with Colyseus
    ├── context.md
    ├── src/
    │   ├── main.ts
    │   └── server.ts
    ├── test-connection.ts
    ├── index.html
    ├── package.json
    └── vite.config.ts
```

## Running Examples

```bash
# From repository root
bun run example
```

## Adding New Examples

1. Create new directory in `examples/`
2. Copy structure from `hello-world/`
3. Update `package.json` scripts if needed
4. Add `context.md` following template
