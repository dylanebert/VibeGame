# AI Context - Working Agreement

<project-description>
VibeGame - A vibe coding game engine using an ECS architecture with bitECS, featuring a Bevy-inspired plugin system and A-frame-style declarative XML recipes.
</project-description>

**Required**: Read [layers/structure.md](layers/structure.md) before proceeding with any task

## Context Management System

- **Tier 0 — global**: `CLAUDE.md` (root). Global standards and system overview
- **Tier 1 — project**: `layers/structure.md`. Project map (stack, commands, layout, entry points)
- **Tier 2 — folder context**: `context.md` in any folder; one per folder; explains purpose/structure of that folder
- **Tier 3 — implementation**: Code files (scripts)

## Rules

- **Priority**: Your number one priority is to manage your own context; always load appropriate context before doing anything else
- **No History**: CRITICAL - Code and context must NEVER reference their own history. Write everything as the current, final state. Never include comments like "changed from X to Y" or "previously was Z". This is a severe form of context rot
- **Simplicity**: Keep code simple, elegant, concise, and readable
- **Structure**: Keep files small and single-responsibility; separate concerns (MVC/ECS as appropriate)
- **Reuse**: Reuse before adding new code; avoid repetition
- **Comments**: Code should be self-explanatory without comments; use concise comments only when necessary
- **State**: Single source of truth; caches/derivations only
- **Data**: Favor data-driven/declarative design
- **Fail Fast**: Make bugs immediately visible rather than hiding them; favor simplicity over defensive patterns
- **Backwards Compatibility**: Unless stated otherwise, favor simplicity over backwards compatibility; the design rules above should make breaking changes easy to trace and fix

## Security

- **Inputs & secrets**: Validate inputs; secrets only in env; never log sensitive data
- **Auth**: Gateway auth; server-side token validation; sanitize inputs

## Vibe Development Workflow

The CLI module (`vibegame/cli`) enables AI-assisted development by providing headless world inspection.

### Inspect Before Acting
Use CLI snapshots to understand world state before making changes:
```typescript
import { createSnapshot, toJSON } from 'vibegame/cli';
console.log(toJSON(createSnapshot(state)));
```

### Iterate Small
Request minimal changes, test with snapshot after each step. Start with `detail: 'standard'`, drill down to `detail: 'full'` only when debugging.

### Use Hints
CLI snapshots include contextual hints (playing sequences, entities near screen edges, etc.) to guide attention to relevant state.

### Detail Levels
- **brief**: Entity names and summaries only
- **standard** (default): Key component values, no internal components
- **full**: All data including internal transforms and unnamed entities
