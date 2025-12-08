# Visualization Example

Demonstrates blog-style visualization with multi-step animation sequencing and a driver pattern.

## Layout

```
visualization/
├── context.md
├── index.html           # Blog harness (includes content.html)
├── record.html          # Video recording page
├── vite.config.ts       # Build config with html-include plugin
├── package.json
├── tsconfig.json
└── src/
    ├── content.html     # World definition with step navigator UI
    ├── components.css   # Blog-style visualization and step styling
    ├── components.ts    # BreatheDriver and Breathe components
    ├── systems.ts       # BreatheSystem
    ├── plugin.ts        # VisualizationPlugin
    ├── main.ts          # Step navigation with STEP_CONTENT descriptions
    ├── record.ts        # Video recording entry point
    ├── inspect.ts       # Headless CLI for world inspection
    ├── vite-env.d.ts    # Vite module type declarations
    └── sequences/
        ├── index.ts     # Sequence loader + STEP_SEQUENCES map
        ├── step-0-1.xml # Camera reveal sequences
        ├── step-1-2.xml # Breathe effect sequences
        ├── step-2-3.xml # Scale shaker sequences
        └── step-3-4.xml # Layout transition sequences
```

## Purpose

- Blog-style multi-step visualization with professional step navigator UI
- Five steps: initial state, camera reveal, breathe effect, scale shaker, layout transition
- Driver pattern: BreatheDriver component holds tweened value; BreatheSystem applies breathing to all entities with Breathe tag
- Shaker pattern: Multiplicative scale shaker demonstrates layered presentation modifiers
- Three entry points: interactive blog, video recording, and headless inspection

## Entry Points

- **index.html + main.ts**: Interactive blog mode with lazy initialization
- **record.html + record.ts**: Video recording mode with step controls
- **inspect.ts**: Headless CLI for world state inspection with screen-space projection

## Patterns

- **Step Navigator**: Three-level text hierarchy (counter, title, description) with circular navigation buttons
- **STEP_CONTENT Array**: Descriptive content explaining technical details of each step
- **Step Sequences**: Named `step-X-Y.xml`, paired forward/reverse in same file
- **STEP_SEQUENCES Map**: Maps transitions like `'0-1': 'step-0-1'`
- **Driver Pattern**: BreatheDriver holds single value field (0-1); BreatheSystem reads driver value and applies breathing to entities with Breathe tag; demonstrates decoupled control signal from effect behavior

## Commands

```bash
bun run dev      # Interactive mode
bun run build    # Production build
bun run preview  # Preview build
bun run inspect  # Headless inspection with screen coordinates
```
