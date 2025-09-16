# UI Integration

Web-standard HTML/CSS/JS UI system with ECS integration patterns.

<!-- LLM:OVERVIEW -->
Web-native UI system using HTML/CSS overlays positioned over the 3D canvas. Includes GSAP for animations, ECS state synchronization, and external library support. This provides capabilities superior to most game engines' built-in UI systems.
<!-- /LLM:OVERVIEW -->

<!-- LLM:REFERENCE -->
### Components

#### UIManager
- element: HTMLElement - Root UI container
- state: State - ECS state reference for updates
- visible: ui8 (1) - UI visibility toggle

### Systems

#### UIUpdateSystem
- Group: simulation
- Updates UI elements from ECS component state

#### UIEventSystem
- Group: setup
- Handles UI event binding and canvas focus management

### Functions

#### createUIOverlay(canvas: HTMLCanvasElement): HTMLElement
Creates positioned UI overlay container

#### bindUIToState(uiManager: UIManager, state: State): void
Connects UI updates to ECS state changes

#### showFloatingText(x: number, y: number, text: string): void
Creates animated floating text at screen coordinates

### Patterns

#### Basic UI Setup
```html
<div id="game-ui">
  <div class="hud">
    <span id="score">0</span>
    <span id="health">100</span>
  </div>
</div>
```

#### ECS Integration
```typescript
const UISystem = {
  update: (state) => {
    // Update UI from game state components
    const scoreEl = document.getElementById('score');
    if (scoreEl) scoreEl.textContent = getScore(state);
  }
};
```

#### GSAP Animations
```typescript
gsap.to("#currency", {
  scale: 1.2,
  duration: 0.2,
  yoyo: true,
  repeat: 1
});
```
<!-- /LLM:REFERENCE -->

<!-- LLM:EXAMPLES -->
## Examples

### Basic Game HUD

```html
<!doctype html>
<html>
<head>
  <style>
    body { margin: 0; font-family: Arial; }
    #game-ui {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 1000;
    }
    .hud {
      position: absolute;
      top: 20px;
      left: 20px;
      background: rgba(0,0,0,0.7);
      padding: 15px;
      border-radius: 8px;
      color: white;
      pointer-events: auto;
    }
  </style>
</head>
<body>
  <world canvas="#game-canvas">
    <static-part pos="0 -0.5 0" shape="box" size="20 1 20" color="#90ee90"></static-part>
  </world>

  <canvas id="game-canvas"></canvas>

  <div id="game-ui">
    <div class="hud">
      <div>Score: <span id="score">0</span></div>
      <div>Coins: <span id="coins">0</span></div>
    </div>
  </div>

  <script type="module">
    import * as GAME from 'vibegame';

    const GameState = GAME.defineComponent({
      score: GAME.Types.ui32,
      coins: GAME.Types.ui32
    });

    const UISystem = {
      update: (state) => {
        const query = GAME.defineQuery([GameState]);
        const entities = query(state.world);

        if (entities.length > 0) {
          const entity = entities[0];
          document.getElementById('score').textContent = GameState.score[entity];
          document.getElementById('coins').textContent = GameState.coins[entity];
        }
      }
    };

    GAME.withPlugin({
      components: { GameState },
      systems: [UISystem]
    }).run();
  </script>
</body>
</html>
```

### Animated Currency with GSAP

```javascript
import gsap from 'gsap';

class AnimatedCounter {
  constructor(elementId) {
    this.element = document.getElementById(elementId);
    this.currentValue = 0;
    this.displayValue = 0;
  }

  setValue(newValue) {
    this.currentValue = newValue;

    gsap.to(this, {
      displayValue: newValue,
      duration: 0.8,
      ease: "power2.out",
      onUpdate: () => {
        this.element.textContent = Math.floor(this.displayValue);
      }
    });
  }
}

// Usage in ECS system
const coinCounter = new AnimatedCounter('coins');

const UISystem = {
  update: (state) => {
    const coins = getCoinsFromState(state);
    coinCounter.setValue(coins);
  }
};
```

### Floating Damage Text

```javascript
function showDamageText(worldX, worldY, worldZ, damage) {
  // Convert 3D world position to screen coordinates
  const camera = getMainCamera(state);
  const screenPos = worldToScreen(worldX, worldY, worldZ, camera);

  const element = document.createElement('div');
  element.textContent = `-${damage}`;
  element.style.cssText = `
    position: fixed;
    left: ${screenPos.x}px;
    top: ${screenPos.y}px;
    color: #ff4444;
    font-weight: bold;
    font-size: 24px;
    pointer-events: none;
    z-index: 10000;
  `;

  document.body.appendChild(element);

  gsap.timeline()
    .to(element, {
      y: screenPos.y - 100,
      opacity: 0,
      duration: 1.5,
      ease: "power2.out"
    })
    .call(() => element.remove());
}

// Usage in collision system
const DamageSystem = {
  update: (state) => {
    // When player takes damage
    const playerPos = getPlayerPosition(state);
    showDamageText(playerPos.x, playerPos.y + 2, playerPos.z, 25);
  }
};
```

### Menu System with State

```javascript
class GameMenu {
  constructor() {
    this.isOpen = false;
    this.element = document.getElementById('main-menu');
  }

  toggle() {
    this.isOpen = !this.isOpen;

    if (this.isOpen) {
      this.show();
    } else {
      this.hide();
    }
  }

  show() {
    this.element.style.display = 'block';
    gsap.fromTo(this.element,
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(1.7)" }
    );
  }

  hide() {
    gsap.to(this.element, {
      opacity: 0,
      scale: 0.8,
      duration: 0.2,
      onComplete: () => {
        this.element.style.display = 'none';
      }
    });
  }
}

// Integration with input system
const menu = new GameMenu();

const MenuSystem = {
  update: (state) => {
    // Check for escape key press
    if (GAME.consumeInput(state, 'escape')) {
      menu.toggle();
    }
  }
};
```
<!-- /LLM:EXAMPLES -->