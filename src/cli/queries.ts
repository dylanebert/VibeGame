import { defineQuery } from 'bitecs';
import type { State } from '../core';
import { Sequence, SequenceState } from '../plugins/tweening';

export interface SequenceInfo {
  name: string;
  eid: number;
  state: 'idle' | 'playing';
  currentIndex: number;
  itemCount: number;
  progress: number;
}

export function getEntityNames(state: State): string[] {
  return Array.from(state.getNamedEntities().keys()).sort();
}

export function getSequenceInfo(
  state: State,
  name: string
): SequenceInfo | null {
  const eid = state.getEntityByName(name);
  if (eid === null) return null;

  const sequenceComponent = state.getComponent('sequence');
  if (!sequenceComponent || !state.hasComponent(eid, sequenceComponent))
    return null;

  const itemCount = Sequence.itemCount[eid];
  return {
    name,
    eid,
    state: Sequence.state[eid] === SequenceState.Playing ? 'playing' : 'idle',
    currentIndex: Sequence.currentIndex[eid],
    itemCount,
    progress: itemCount > 0 ? Sequence.currentIndex[eid] / itemCount : 0,
  };
}

export function getAllSequences(state: State): SequenceInfo[] {
  const sequences: SequenceInfo[] = [];
  const sequenceComponent = state.getComponent('sequence');

  if (!sequenceComponent) return sequences;

  const query = defineQuery([sequenceComponent]);
  const entities = query(state.world);

  for (const eid of entities) {
    const name = state.getEntityName(eid);
    const itemCount = Sequence.itemCount[eid];

    sequences.push({
      name: name ?? `eid-${eid}`,
      eid,
      state: Sequence.state[eid] === SequenceState.Playing ? 'playing' : 'idle',
      currentIndex: Sequence.currentIndex[eid],
      itemCount,
      progress: itemCount > 0 ? Sequence.currentIndex[eid] / itemCount : 0,
    });
  }

  return sequences;
}

export function queryEntities(
  state: State,
  ...componentNames: string[]
): number[] {
  const components = componentNames
    .map((name) => state.getComponent(name))
    .filter((c): c is NonNullable<typeof c> => c !== null);

  if (components.length === 0) return [];

  const query = defineQuery(components);
  return Array.from(query(state.world));
}

export function hasComponentByName(
  state: State,
  eid: number,
  name: string
): boolean {
  const component = state.getComponent(name);
  return component ? state.hasComponent(eid, component) : false;
}

type TypedArray =
  | Float32Array
  | Float64Array
  | Int8Array
  | Int16Array
  | Int32Array
  | Uint8Array
  | Uint16Array
  | Uint32Array;

function isTypedArray(value: unknown): value is TypedArray {
  return (
    value instanceof Float32Array ||
    value instanceof Float64Array ||
    value instanceof Int8Array ||
    value instanceof Int16Array ||
    value instanceof Int32Array ||
    value instanceof Uint8Array ||
    value instanceof Uint16Array ||
    value instanceof Uint32Array
  );
}

export function getComponentData(
  state: State,
  eid: number,
  componentName: string
): Record<string, number> | null {
  const component = state.getComponent(componentName);
  if (!component || !state.hasComponent(eid, component)) return null;

  const fields: Record<string, number> = {};
  for (const key in component) {
    if (key.startsWith('_')) continue;
    const field = (component as Record<string, unknown>)[key];
    if (isTypedArray(field)) {
      fields[key] = field[eid];
    }
  }
  return fields;
}

export function getEntityData(
  state: State,
  eid: number
): Record<string, Record<string, number>> {
  const result: Record<string, Record<string, number>> = {};
  for (const name of state.getComponentNames()) {
    const data = getComponentData(state, eid, name);
    if (data) result[name] = data;
  }
  return result;
}

interface ScreenCoordinate {
  x: number;
  y: number;
  z: number;
  visible: boolean;
}

export function toJSON(snapshot: {
  elapsed: number;
  entities: Array<{
    eid: number;
    name?: string;
    components: Record<string, Record<string, number>>;
    screen?: ScreenCoordinate;
  }>;
  sequences?: SequenceInfo[];
}): string {
  const result: {
    elapsed: number;
    entities: Record<
      string,
      {
        eid: number;
        components: Record<string, Record<string, number>>;
        screen?: ScreenCoordinate;
      }
    >;
    sequences?: Record<
      string,
      { eid: number; state: string; progress: number; itemCount: number }
    >;
  } = {
    elapsed: snapshot.elapsed,
    entities: {},
  };

  for (const entity of snapshot.entities) {
    const key = entity.name ?? `eid-${entity.eid}`;
    result.entities[key] = {
      eid: entity.eid,
      components: entity.components,
      screen: entity.screen,
    };
  }

  if (snapshot.sequences) {
    result.sequences = {};
    for (const seq of snapshot.sequences) {
      result.sequences[seq.name] = {
        eid: seq.eid,
        state: seq.state,
        progress: seq.progress,
        itemCount: seq.itemCount,
      };
    }
  }

  return JSON.stringify(result, null, 2);
}
