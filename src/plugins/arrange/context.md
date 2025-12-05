# Arrange Plugin

<!-- LLM:OVERVIEW -->
Groups entities into layout arrangements with automatic positioning. Members of a group are positioned according to the group's strategy (horizontal). Weight controls whether arrangement is active (0 = frozen, >0 = active).
<!-- /LLM:OVERVIEW -->

## Layout

```
arrange/
├── context.md  # This file
├── index.ts  # Public exports
├── plugin.ts  # Plugin definition
├── components.ts  # Group, Member
├── systems.ts  # ArrangeSystem
├── parser.ts  # <arrange> XML parser
└── utils.ts  # Strategy functions, registry
```

## Scope

- **In-scope**: Entity arrangement, group membership, horizontal layout, weight-based activation
- **Out-of-scope**: Vertical/grid/circular layouts, animations, constraints

## Entry Points

- **plugin.ts**: ArrangePlugin definition for registration
- **systems.ts**: ArrangeSystem (simulation)
- **parser.ts**: Parses `<arrange>` wrapper elements

## Dependencies

- **Internal**: Core ECS, transforms (Transform)
- **External**: None

<!-- LLM:REFERENCE -->
### Components

**Group** - Layout controller for a set of members
- strategy: ui8 (0) - Layout algorithm (0=horizontal)
- gap: f32 (1) - Spacing between members
- weight: f32 (1) - Activation weight (0=frozen)
- count: ui32 - Number of members

**Member** - Links entity to a group
- group: eid - Reference to Group entity
- index: ui32 - Order within group (0, 1, 2...)

### Strategies

| Strategy | Index | Behavior |
|----------|-------|----------|
| horizontal | 0 | Centers group, spaces members along X-axis |

**Horizontal Strategy:**
```
totalWidth = (memberCount - 1) * gap
startX = -totalWidth / 2
position[index] = { x: startX + index * gap, y: 0, z: 0 }
```

### System Behavior

ArrangeSystem runs in the simulation batch:
1. Queries all entities with Member component
2. Skips members without Transform
3. Skips members whose group has weight <= 0
4. Applies strategy to calculate position
5. Sets Transform.posX/posY/posZ directly
<!-- /LLM:REFERENCE -->

<!-- LLM:EXAMPLES -->
## XML (Declarative) Patterns

### Basic Horizontal Arrangement

```xml
<arrange name="cube-row" strategy="horizontal" gap="3" weight="1">
  <entity name="cube-left" renderer="shape: box"></entity>
  <entity name="cube-center" renderer="shape: box"></entity>
  <entity name="cube-right" renderer="shape: box"></entity>
</arrange>
```

Creates:
- Group entity (named "cube-row") with gap=3, weight=1, count=3
- 3 child entities each with Member pointing to group
- After step: positions at x=-3, x=0, x=3

### Frozen Arrangement (weight=0)

```xml
<arrange name="frozen-row" gap="5" weight="0">
  <entity transform="pos: 10 0 0" renderer="shape: sphere"></entity>
  <entity transform="pos: 20 0 0" renderer="shape: sphere"></entity>
</arrange>
```

Members keep their initial positions until weight becomes > 0.

### Dynamic Gap with Tweening

```xml
<arrange name="expandable" gap="2" weight="1">
  <entity renderer="shape: box"></entity>
  <entity renderer="shape: box"></entity>
</arrange>

<tween target="expandable" attr="group.gap" to="10" duration="1"></tween>
```

### Activation Animation

```xml
<arrange name="reveal-row" gap="5" weight="0">
  <entity renderer="shape: box"></entity>
  <entity renderer="shape: box"></entity>
  <entity renderer="shape: box"></entity>
</arrange>

<!-- Tween weight to activate arrangement -->
<tween target="reveal-row" attr="group.weight" to="1" duration="0.5"></tween>
```

## TypeScript (Imperative) Patterns

### Manual Group Creation

```typescript
import { Group, Member } from 'vibegame/arrange';
import { Transform } from 'vibegame/transforms';

const groupEntity = state.createEntity();
state.addComponent(groupEntity, Group);
Group.gap[groupEntity] = 4;
Group.weight[groupEntity] = 1;
Group.count[groupEntity] = 2;

const member0 = state.createEntity();
state.addComponent(member0, Transform);
state.addComponent(member0, Member);
Member.group[member0] = groupEntity;
Member.index[member0] = 0;

const member1 = state.createEntity();
state.addComponent(member1, Transform);
state.addComponent(member1, Member);
Member.group[member1] = groupEntity;
Member.index[member1] = 1;

state.step(1/60);
// member0 at x=-2, member1 at x=2
```

### Freeze/Unfreeze Pattern

```typescript
// Freeze arrangement
Group.weight[groupEntity] = 0;

// Unfreeze arrangement
Group.weight[groupEntity] = 1;
```
<!-- /LLM:EXAMPLES -->
