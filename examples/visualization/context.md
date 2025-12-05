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
    ├── content.html     # World definition with breathe-driver entity
    ├── components.css   # Visualization styles
    ├── components.ts    # BreatheDriver component
    ├── systems.ts       # BreatheDriver apply/restore systems
    ├── plugin.ts        # VisualizationPlugin
    ├── main.ts          # Blog entry point with step navigation
    ├── record.ts        # Video recording entry point
    └── sequences/
        ├── index.ts     # Sequence loader + STEP_SEQUENCES map
        ├── step-0-1.xml # Camera intro/reset sequences
        └── step-1-2.xml # Breathe activate/deactivate sequences
```

## Purpose

- Multi-step visualization with arrow key navigation (0 → 1 → 2)
- BreatheDriver: continuous scale oscillation controlled by tweened intensity
- Two entry points: interactive blog and video recording

## Entry Points

- **index.html + main.ts**: Interactive blog mode with lazy initialization
- **record.html + record.ts**: Video recording mode with step controls

## Patterns

- **Step Sequences**: Named `step-X-Y.xml`, paired forward/reverse in same file
- **STEP_SEQUENCES Map**: Maps transitions like `'0-1': 'step-0-1'`
- **Driver Pattern**: BreatheDriver modulates scale via intensity (0-1), tweened by sequences
- **Capture/Apply/Restore**: Systems follow Shaker pattern for presentation-only effects

## Commands

```bash
bun run dev      # Interactive mode
bun run build    # Production build
bun run preview  # Preview build
```
