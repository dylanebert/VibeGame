# Project Structure

VibeGame - A vibe coding game engine using ECS architecture with bitECS, featuring a Bevy-inspired plugin system and A-frame-style declarative XML recipes.

**Required**: For comprehensive documentation, use Context7 to fetch vibegame docs

## Stack

- Runtime: Bun/Node.js
- Language: TypeScript 5.6
- Physics: Rapier 3D WASM
- Build: Vite 5.4 with TypeScript declarations

## Commands

- Build: `bun run build` (vibegame core only)
- Build: `bun run build:release` (all builds including CDN standalone)
- Example: `bun run example` (build and run demo application)
- Type Check: `bun run check` (TypeScript validation)
- Lint: `bun run lint --fix` (ESLint code analysis and formatting)
- Test: `bun test` (Unit and integration tests)

## AI Context

**llms.txt** is automatically built from [layers/llms-template.txt](llms-template.txt) on `bun run build:release`. It serves as a comprehensive system prompt containing all engine documentation, component references, and usage patterns. The template pulls in reference material from context.md files throughout the codebase.

## Layout

```
vibegame/
├── CLAUDE.md  # Global context (Tier 0)
├── create-vibegame/  # Project scaffolding CLI
│   ├── index.js  # CLI script
│   ├── package.json
│   └── template/  # Project template files
├── src/
│   ├── core/  # Engine foundation
│   │   ├── context.md  # Core module context
│   │   ├── ecs/  # ECS scheduler, state, ordering
│   │   ├── xml/  # XML parsing and entity creation
│   │   ├── math/  # Math utilities
│   │   ├── utils/  # Core utilities
│   │   └── index.ts  # Core exports
│   ├── plugins/  # Plugin modules
│   │   ├── animation/  # Animation system
│   │   ├── input/  # Input handling
│   │   ├── line/  # 2D line rendering
│   │   ├── orbit-camera/  # Orbital camera
│   │   ├── physics/  # Rapier 3D physics
│   │   ├── player/  # Player controller
│   │   ├── postprocessing/  # Post-processing effects
│   │   ├── recipes/  # XML recipe system
│   │   ├── rendering/  # Three.js rendering
│   │   ├── text/  # 3D text rendering
│   │   ├── respawn/  # Respawn system
│   │   ├── startup/  # Initialization
│   │   ├── transforms/  # Transform hierarchy
│   │   ├── tweening/  # Tween animations
│   │   └── defaults.ts  # Default plugin bundle
│   ├── vite/  # Vite plugins
│   │   ├── index.ts  # Plugin exports
│   │   ├── console-plugin.ts  # Console forwarding
│   │   └── context.md  # Module context
│   ├── builder.ts  # Builder pattern API
│   ├── runtime.ts  # Game runtime engine
│   └── index.ts  # Main exports
├── examples/  # Example applications
│   ├── hello-world/  # Basic example
│   │   ├── context.md
│   │   ├── src/main.ts
│   │   ├── index.html
│   │   ├── package.json
│   │   └── vite.config.ts
│   ├── lorenz/  # Lorenz attractor particle system
│   │   ├── context.md
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── plugin.ts
│   │   │   ├── components.ts
│   │   │   ├── systems.ts
│   │   │   └── utils.ts
│   │   ├── index.html
│   │   ├── package.json
│   │   └── vite.config.ts
│   ├── visualization/  # Minimal visualization with tree-shaking
│   │   ├── context.md
│   │   ├── src/main.ts
│   │   ├── index.html
│   │   ├── package.json
│   │   └── vite.config.ts
│   └── sequencer/  # Animation sequencing with video recording
│       ├── context.md
│       ├── src/
│       │   ├── plugin.ts   # Components, systems, event helpers
│       │   ├── main.ts     # Interactive mode
│       │   └── record.ts   # Playwright frame capture
│       ├── render.sh       # Record + encode to MP4
│       ├── index.html
│       └── package.json
├── layers/
│   ├── structure.md  # Project-level context (Tier 1)
│   ├── context-template.md  # Template for context files
|   └── llms-template.md # Template for llms.txt
├── dist/  # Built output
├── tests/
│   ├── unit/  # Unit tests
│   ├── integration/  # Integration tests
│   └── e2e/  # End-to-end tests
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .prettierrc  # Code formatting config
├── .prettierignore  # Prettier ignore patterns
├── eslint.config.js  # Linting configuration
└── README.md
```

## Plugin Architecture

### Standard Plugin Structure

Every plugin follows a predictable file structure for easy context loading:

- **index.ts** - Public API exports (front-facing interface)
- **plugin.ts** - Plugin definition bundling components, systems, recipes, and config
- **components.ts** - ECS component definitions (data structures)
- **systems.ts** - System definitions with logic factored out
- **recipes.ts** - Entity-component bundles for XML creation
- **utils.ts** - Business logic and helper functions

Optional files:

- **operations.ts** - Complex operations and algorithms
- **constants.ts** - Plugin-specific constants
- **parser.ts** - Custom tag parsing logic for XML elements
- **math.ts** - Mathematical utilities

### Plugin Registry

1. **animation** - Animation mixer and clip management (AnimationPlugin)
2. **input** - Mouse, keyboard, gamepad input handling (InputPlugin)
3. **line** - 2D billboard line rendering with arrowheads (LinePlugin)
4. **orbit-camera** - Standalone orbital camera with direct input handling (OrbitCameraPlugin)
5. **physics** - Rapier 3D WASM physics integration (PhysicsPlugin)
6. **player** - Player character controller (PlayerPlugin)
7. **postprocessing** - Post-processing effects (PostprocessingPlugin)
8. **rendering** - Three.js rendering pipeline (RenderingPlugin)
9. **text** - 3D text rendering with troika-three-text (TextPlugin)
10. **respawn** - Entity respawn system (RespawnPlugin)
11. **startup** - Initialization and setup systems (StartupPlugin)
12. **transforms** - Transform component hierarchy (TransformsPlugin)
13. **tweening** - Tween animations and presentation shakers (TweenPlugin)

**Note**: Recipe system is core functionality, not a plugin. Individual plugins define their own recipes.

## Architecture

Bevy-inspired ECS with explicit update phases:

- **SetupBatch**: Input gathering and frame setup
- **FixedBatch**: Physics simulation and gameplay logic
- **DrawBatch**: Rendering and interpolation

### Declarative Design

- Plugin definitions are self-documenting through structure
- Components define data without behavior
- Systems contain logic with dependencies declared
- Recipes enable XML-based entity creation like A-frame
- Config bundles all parsing-related settings (defaults, shorthands, enums, validations, parsers)

## Entry Points

- **Package entry**: src/index.ts (namespace API with builder pattern)
- **Core module**: src/core/index.ts (ECS foundation, types, utilities)
- **Plugin modules**: src/plugins/\*/index.ts (individual plugin exports)
- **Vite plugin**: src/vite/index.ts (WASM setup for Rapier physics)
- **Builder API**: src/builder.ts (fluent builder pattern)
- **Runtime**: src/runtime.ts (game runtime engine)
- **Example apps**: examples/\*/src/main.ts (demo applications)

## Naming Conventions

**All files and directories use kebab-case**

- Files: `components.ts`, `systems.ts`, `utils.ts`, `plugin.ts`
- Directories: `src/`, `core/`, `plugins/`, `orbit-camera/`, `input/`
- Components: PascalCase exports from `components.ts`
- Systems: PascalCase with `System` suffix from `systems.ts`
- Plugins: PascalCase with `Plugin` suffix from `plugin.ts`
- Recipes: camelCase exports from `recipes.ts`

## Configuration

- TypeScript: tsconfig.json (strict mode, ES2020 target, DOM types)
- Build: vite.config.ts (library mode, ESM output, DTS generation)
- Package: package.json (main package with plugin exports)
- Code Quality: eslint.config.js (TypeScript linting), .prettierrc (formatting)

## Where to Add Code

### Adding to Existing Plugin

1. Components → src/plugins/[plugin-name]/components.ts
2. Systems → src/plugins/[plugin-name]/systems.ts
3. Recipes → src/plugins/[plugin-name]/recipes.ts
4. Utils → src/plugins/[plugin-name]/utils.ts
5. Update exports → src/plugins/[plugin-name]/index.ts
6. Register in plugin → src/plugins/[plugin-name]/plugin.ts

### Creating New Plugin

1. Create directory → src/plugins/[plugin-name]/
2. Add standard files:
   - index.ts (exports)
   - plugin.ts (plugin definition)
   - components.ts (if needed)
   - systems.ts (if needed)
   - recipes.ts (if needed)
   - utils.ts (if needed)
   - context.md (folder documentation)
3. Add export to main package.json
4. Add to DefaultPlugins if standard (otherwise tree-shaken)

### Core Modifications

- ECS changes → src/core/ecs/
- XML parsing → src/core/xml/
- Math utilities → src/core/math/
- Core types → src/core/ecs/types.ts
