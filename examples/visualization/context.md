# Visualization Example

<!-- LLM:OVERVIEW -->
Minimal example demonstrating tree-shaking and plugin selection for lightweight 3D visualizations with modern scientific aesthetics.
<!-- /LLM:OVERVIEW -->

## Purpose

- Demonstrate minimal plugin setup without defaults
- Show shorthand XML syntax for clean entity definitions
- Exhibit modern visualization lighting and color schemes

## Layout

```
visualization/
├── context.md
├── src/
│   └── main.ts  # Animation system with circular motion
├── index.html  # Declarative scene with modern color palette
├── package.json
└── vite.config.ts
```

## Key Features

- **Minimal plugins**: Only TransformsPlugin and RenderingPlugin
- **Shorthand syntax**: `pos`, `size`, `color` attributes expand automatically
- **Scientific colors**: 3Blue1Brown-inspired palette for clarity
- **Soft lighting**: Balanced ambient and directional for visualization
- **No physics**: Pure transform-based animation

## Running

```bash
cd examples/visualization
bun dev
```
