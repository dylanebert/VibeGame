# Sequencer Plugin

Transform sequencing system with zero-allocation modifier aggregation.

## Data Flow

1. Animation/sequencing systems update SequencedTransform values
2. Modifier entities target SequencedTransform entities via entity ID
3. ApplySequencedTransformsSystem aggregates modifiers (additive)
4. Final values written to Transform component
5. Transform hierarchy and rendering systems consume Transform

## Performance Design

- ModifierAggregator instance reused across frames
- ModifierOffsets objects pooled and reset (not recreated)
- Zero heap allocations in steady state
- Only allocates when new entities gain modifiers

## File Structure

- **components.ts**: bitECS component definitions
- **systems.ts**: ApplySequencedTransformsSystem with aggregator
- **utils.ts**: ModifierAggregator class (pooling logic)
- **plugin.ts**: Plugin bundle
- **index.ts**: Public exports
