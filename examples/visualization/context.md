# Visualization Example

<!-- LLM:OVERVIEW -->
Demonstrates lazy-loaded, viewport-aware VibeGame instances for interactive blog posts with optimized performance.
<!-- /LLM:OVERVIEW -->

## Purpose

- Lazy loading for multiple canvas elements
- Viewport-aware rendering (pause off-screen)
- CSS-based canvas sizing
- Manual State instantiation

## Layout

```
visualization/
├── context.md
├── src/
│   └── main.ts  # Lazy State creation with IntersectionObserver
├── index.html  # Blog-style layout with multiple worlds
├── package.json
└── vite.config.ts
```

## Key Features

- **Lazy initialization**: State created when canvas enters viewport
- **Viewport awareness**: Off-screen canvases skip rendering
- **Multiple instances**: Separate State per canvas (1-to-1-to-1)
- **CSS sizing**: Canvas dimensions controlled by CSS, respected by renderer
- **3D Text**: Demonstrates TextPlugin for labeled objects moving in tandem
- **Vector Lines**: Demonstrates LinePlugin for animated vector arrows

## Running

```bash
cd examples/visualization
bun dev
```
