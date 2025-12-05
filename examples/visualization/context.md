# Visualization Example

Demonstrates blog-style visualization with animation sequencing.

## Layout

```
visualization/
├── context.md           # This file
├── index.html           # Blog harness (includes content.html)
├── record.html          # Video recording page
├── vite.config.ts       # Build config with html-include plugin
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript config
└── src/
    ├── content.html     # Single source of content
    ├── components.css   # Visualization styles
    ├── main.ts          # Blog entry point
    ├── record.ts        # Video recording entry point
    └── sequences/
        ├── index.ts     # Sequence loader + STEP_SEQUENCES map
        └── intro.xml    # Camera tween sequences
```

## Purpose

- Blog-style visualization with lazy canvas loading
- Animation sequences for camera reveals
- Two entry points: interactive blog and video recording

## Entry Points

- **index.html + main.ts**: Interactive blog mode with lazy initialization
- **record.html + record.ts**: Video recording mode with step controls

## Patterns

- **HTML Include**: `<include src="...">` directive for content reuse
- **Sequence Injection**: XML sequences loaded as raw strings and injected into world
- **STEP_SEQUENCES Map**: Maps step transitions to sequence names

## Commands

```bash
bun run dev      # Interactive mode
bun run build    # Production build
bun run preview  # Preview build
```
