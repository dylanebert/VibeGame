# Visualization Example

<!-- LLM:OVERVIEW -->
Demonstrates multiple independent VibeGame instances on a single page, each with isolated State and canvas, styled as an interactive blog post.
<!-- /LLM:OVERVIEW -->

## Purpose

- Test multiple canvas support for interactive blog posts
- Demonstrate manual State instantiation without runtime
- Show CSS-based canvas sizing with proper aspect handling
- Multiple independent animation loops

## Layout

```
visualization/
├── context.md
├── src/
│   └── main.ts  # Manual State creation per canvas
├── index.html  # Blog-style layout with multiple worlds
├── package.json
└── vite.config.ts
```

## Key Features

- **Multiple instances**: Three separate State instances, one per canvas
- **No runtime**: Direct State API usage following e2e test pattern
- **CSS sizing**: Canvas dimensions controlled by CSS, respected by renderer
- **Blog layout**: Prose-style content with embedded visualizations
- **Minimal plugins**: Only TransformsPlugin and RenderingPlugin

## Running

```bash
cd examples/visualization
bun dev
```
