# UI Plugin

<!-- LLM:OVERVIEW -->
Web-native HTML/CSS UI overlays with GSAP animations and ECS state sync.
<!-- /LLM:OVERVIEW -->

<!-- LLM:REFERENCE -->
### Functions
- `createUIOverlay(canvas)` - Positioned UI container
- `bindUIToState(uiManager, state)` - Connect UI to ECS

### Patterns
```html
<div id="game-ui" style="position: fixed; pointer-events: none; z-index: 1000;">
  <div class="hud" style="pointer-events: auto;">
    <span id="score">0</span>
  </div>
</div>
```

```typescript
const UISystem = {
  update: (state) => {
    document.getElementById('score').textContent = GameState.score[entity];
  }
};

// GSAP animations
gsap.to("#score", { scale: 1.2, duration: 0.2, yoyo: true, repeat: 1 });
```
<!-- /LLM:REFERENCE -->

<!-- LLM:EXAMPLES -->
```typescript
// Update UI from ECS state
const GameState = GAME.defineComponent({ score: GAME.Types.ui32 });
const UISystem = {
  update: (state) => {
    const query = GAME.defineQuery([GameState]);
    for (const entity of query(state.world)) {
      document.getElementById('score').textContent = GameState.score[entity];
    }
  }
};
```
<!-- /LLM:EXAMPLES -->
