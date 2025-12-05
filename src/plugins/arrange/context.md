# Arrange Plugin

<!-- LLM:OVERVIEW -->
Arranges entities in horizontal layouts with automatic positioning. Members reference a group entity and are positioned according to the group's gap and alignment settings. Blend controls whether arrangement is active (0 = frozen, >0 = active). Count is computed dynamically from member indices.
<!-- /LLM:OVERVIEW -->

## Layout

```
arrange/
├── context.md  # This file
├── index.ts  # Public exports
├── plugin.ts  # Plugin definition
├── components.ts  # HorizontalGroup, HorizontalMember, Align
├── systems.ts  # HorizontalArrangeSystem
└── utils.ts  # Position calculation helpers
```

## Scope

- **In-scope**: Horizontal entity arrangement, group membership, alignment modes, blend-based activation
- **Out-of-scope**: Vertical/grid/circular layouts, animations, constraints

## Entry Points

- **plugin.ts**: ArrangePlugin definition for registration
- **systems.ts**: HorizontalArrangeSystem (simulation)

## Dependencies

- **Internal**: Core ECS, transforms (Transform)
- **External**: None

<!-- LLM:REFERENCE -->
### Components

**HorizontalGroup** - Layout controller for a set of members
- gap: f32 (1) - Spacing between members
- align: ui8 (1) - Alignment mode (0=left, 1=center, 2=right)
- blend: f32 (1) - Activation (0=frozen, >0=active)

**HorizontalMember** - Links entity to a group
- group: eid - Reference to HorizontalGroup entity
- index: ui32 - Order within group (0, 1, 2...)

### Alignment Modes

| Mode | Value | Behavior |
|------|-------|----------|
| left | 0 | First item at x=0, extends positive |
| center | 1 | Items centered around x=0 |
| right | 2 | Last item at x=0, extends negative |

**Position Calculation:**
```
totalWidth = (memberCount - 1) * gap

left:   startX = 0
center: startX = -totalWidth / 2
right:  startX = -totalWidth

position[index] = { x: startX + index * gap, y: 0, z: 0 }
```

### System Behavior

HorizontalArrangeSystem runs in the simulation batch:
1. Computes member count per group from highest index + 1
2. Queries all entities with HorizontalMember component
3. Skips members without Transform
4. Skips members whose group has blend <= 0
5. Calculates position based on gap and alignment
6. Sets Transform.posX/posY/posZ directly
<!-- /LLM:REFERENCE -->

<!-- LLM:EXAMPLES -->
## XML (Declarative) Patterns

### Basic Horizontal Arrangement (Centered)

```xml
<entity name="cube-row" horizontal-group="gap: 3"></entity>
<entity name="cube-left" transform renderer="shape: box" horizontal-member="group: cube-row; index: 0"></entity>
<entity name="cube-center" transform renderer="shape: box" horizontal-member="group: cube-row; index: 1"></entity>
<entity name="cube-right" transform renderer="shape: box" horizontal-member="group: cube-row; index: 2"></entity>
```

After step: positions at x=-3, x=0, x=3

### Left-Aligned Arrangement

```xml
<entity name="left-row" horizontal-group="gap: 2; align: left"></entity>
<entity transform renderer="shape: sphere" horizontal-member="group: left-row; index: 0"></entity>
<entity transform renderer="shape: sphere" horizontal-member="group: left-row; index: 1"></entity>
<entity transform renderer="shape: sphere" horizontal-member="group: left-row; index: 2"></entity>
```

After step: positions at x=0, x=2, x=4

### Right-Aligned Arrangement

```xml
<entity name="right-row" horizontal-group="gap: 2; align: right"></entity>
<entity transform renderer="shape: sphere" horizontal-member="group: right-row; index: 0"></entity>
<entity transform renderer="shape: sphere" horizontal-member="group: right-row; index: 1"></entity>
<entity transform renderer="shape: sphere" horizontal-member="group: right-row; index: 2"></entity>
```

After step: positions at x=-4, x=-2, x=0

### Frozen Arrangement (blend=0)

```xml
<entity name="frozen-row" horizontal-group="gap: 5; blend: 0"></entity>
<entity transform="pos: 10 0 0" renderer="shape: sphere" horizontal-member="group: frozen-row; index: 0"></entity>
<entity transform="pos: 20 0 0" renderer="shape: sphere" horizontal-member="group: frozen-row; index: 1"></entity>
```

Members keep their initial positions until blend becomes > 0.

### Dynamic Gap with Tweening

```xml
<entity name="expandable" horizontal-group="gap: 2"></entity>
<entity transform renderer="shape: box" horizontal-member="group: expandable; index: 0"></entity>
<entity transform renderer="shape: box" horizontal-member="group: expandable; index: 1"></entity>

<tween target="expandable" attr="horizontal-group.gap" to="10" duration="1"></tween>
```

## TypeScript (Imperative) Patterns

### Manual Group Creation

```typescript
import { HorizontalGroup, HorizontalMember, Align } from 'vibegame/arrange';
import { Transform } from 'vibegame/transforms';

const groupEntity = state.createEntity();
state.addComponent(groupEntity, HorizontalGroup);
HorizontalGroup.gap[groupEntity] = 4;
HorizontalGroup.align[groupEntity] = Align.Center;
HorizontalGroup.blend[groupEntity] = 1;

const member0 = state.createEntity();
state.addComponent(member0, Transform);
state.addComponent(member0, HorizontalMember);
HorizontalMember.group[member0] = groupEntity;
HorizontalMember.index[member0] = 0;

const member1 = state.createEntity();
state.addComponent(member1, Transform);
state.addComponent(member1, HorizontalMember);
HorizontalMember.group[member1] = groupEntity;
HorizontalMember.index[member1] = 1;

state.step(1/60);
// member0 at x=-2, member1 at x=2
```

### Freeze/Unfreeze Pattern

```typescript
HorizontalGroup.blend[groupEntity] = 0;  // Freeze
HorizontalGroup.blend[groupEntity] = 1;  // Unfreeze
```

### Change Alignment at Runtime

```typescript
HorizontalGroup.align[groupEntity] = Align.Left;  // Left-align
HorizontalGroup.align[groupEntity] = Align.Right; // Right-align
```
<!-- /LLM:EXAMPLES -->
