# Respawn Plugin

<!-- LLM:OVERVIEW -->
Automatic respawn when entities fall below Y=-100.
<!-- /LLM:OVERVIEW -->

<!-- LLM:REFERENCE -->
### Components

**Respawn**
- posX/Y/Z: f32 - Spawn position
- eulerX/Y/Z: f32 - Spawn rotation (degrees)
<!-- /LLM:REFERENCE -->

<!-- LLM:EXAMPLES -->
```xml
<!-- Player recipe includes respawn automatically -->
<player pos="0 5 0"></player>

<!-- Manual respawn component -->
<entity transform body collider respawn="pos: 0 10 -5"></entity>
```
<!-- /LLM:EXAMPLES -->
