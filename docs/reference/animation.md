# Animation Reference

### Components

#### AnimatedCharacter
- headEntity: eid
- torsoEntity: eid
- leftArmEntity: eid
- rightArmEntity: eid
- leftLegEntity: eid
- rightLegEntity: eid
- phase: f32 - Walk cycle phase (0-1)
- jumpTime: f32
- fallTime: f32
- animationState: ui8 - 0=IDLE, 1=WALKING, 2=JUMPING, 3=FALLING, 4=LANDING
- stateTransition: f32

#### HasAnimator
Tag component (no properties)

### Systems

#### AnimatedCharacterInitializationSystem
- Group: setup
- Creates body part entities for AnimatedCharacter components

#### AnimatedCharacterUpdateSystem
- Group: simulation
- Updates character animation based on movement and physics state