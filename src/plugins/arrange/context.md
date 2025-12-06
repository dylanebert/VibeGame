# Arrange Plugin

<!-- LLM:OVERVIEW -->
Arranges entities in horizontal, vertical, or grid layouts. Members reference a group entity and smoothly lerp to calculated positions. Blend controls influence (0=none, 1=full), speed controls lerp rate.
<!-- /LLM:OVERVIEW -->

## Layout

```
arrange/
├── context.md  # This file
├── index.ts  # Public exports
├── plugin.ts  # Plugin definition
├── components.ts  # Group/Member components, Align enum
├── systems.ts  # Arrange systems (simulation batch)
└── utils.ts  # Position calculation helpers
```

## Scope

- **In-scope**: Horizontal, vertical, grid arrangement; alignment modes; blend/speed control
- **Out-of-scope**: Circular layouts, constraints

## Entry Points

- **plugin.ts**: ArrangePlugin registration
- **systems.ts**: HorizontalArrangeSystem, VerticalArrangeSystem, GridArrangeSystem

## Dependencies

- **Internal**: Core ECS, transforms (Transform)

<!-- LLM:REFERENCE -->
### Components

**HorizontalGroup** - gap (f32), align (ui8), blend (f32), speed (f32)
**HorizontalMember** - group (eid), index (ui32)

**VerticalGroup** - gap (f32), align (ui8), blend (f32), speed (f32)
**VerticalMember** - group (eid), index (ui32)

**GridGroup** - gapX (f32), gapY (f32), columns (ui32), alignX (ui8), alignY (ui8), blend (f32), speed (f32)
**GridMember** - group (eid), index (ui32) - row-first ordering

### Parameters

- **blend**: 0-1, influence of arrangement (0=frozen, 1=full control)
- **speed**: lerp rate (0=instant, 30=default smooth, higher=faster)

### Align Enum

| Mode | Value | Usage |
|------|-------|-------|
| Left | 0 | Horizontal: start at x=0, extend positive |
| Center | 1 | Both: center around origin |
| Right | 2 | Horizontal: end at x=0, extend negative |
| Top | 3 | Vertical: start at y=0, extend negative |
| Bottom | 4 | Vertical: end at y=0, extend positive |
<!-- /LLM:REFERENCE -->

<!-- LLM:EXAMPLES -->
## XML Patterns

```xml
<!-- Horizontal row with smooth lerping -->
<entity name="row" horizontal-group="gap: 3"></entity>
<entity horizontal-member="group: row; index: 0" transform renderer="shape: box"></entity>
<entity horizontal-member="group: row; index: 1" transform renderer="shape: box"></entity>

<!-- Vertical stack -->
<entity name="stack" vertical-group="gap: 2; align: top"></entity>
<entity vertical-member="group: stack; index: 0" transform renderer="shape: box"></entity>

<!-- Grid (row-first) -->
<entity name="grid" grid-group="gapX: 2; gapY: 2; columns: 3"></entity>
<entity grid-member="group: grid; index: 0" transform renderer="shape: box"></entity>

<!-- Multi-group membership (entity in both layouts, blend controls which is active) -->
<entity name="row" horizontal-group="gap: 3; blend: 1"></entity>
<entity name="stack" vertical-group="gap: 3; blend: 0"></entity>
<entity horizontal-member="group: row; index: 0" vertical-member="group: stack; index: 0" transform></entity>

<!-- Tween between layouts -->
<tween target="row" attr="horizontal-group.blend" to="0" duration="1"></tween>
<tween target="stack" attr="vertical-group.blend" to="1" duration="1"></tween>

<!-- Instant snap (speed: 0) -->
<entity name="instant-row" horizontal-group="gap: 2; speed: 0"></entity>

<!-- Slower animation -->
<entity name="slow-row" horizontal-group="gap: 2; speed: 5"></entity>
```
<!-- /LLM:EXAMPLES -->
