# Startup Plugin

<!-- LLM:OVERVIEW -->
Auto-creates player, camera, and lighting at startup if missing.
<!-- /LLM:OVERVIEW -->

<!-- LLM:REFERENCE -->
### Systems (all group: setup)
- **LightingStartupSystem** - Creates default lighting if none exists
- **CameraStartupSystem** - Creates orbit camera with InputState if none exists
- **PlayerStartupSystem** - Creates player entity if none exists
<!-- /LLM:REFERENCE -->

<!-- LLM:EXAMPLES -->
```xml
<!-- Creating your own prevents auto-creation -->
<player pos="10 2 -5"></player>
<entity ambient-light directional-light></entity>
```
<!-- /LLM:EXAMPLES -->
