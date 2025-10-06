import type { Component } from 'bitecs';

type ComponentField =
  | Float32Array
  | Int32Array
  | Uint8Array
  | Uint16Array
  | Uint32Array;

export function setComponentFields(
  component: Component,
  entity: number,
  values: Record<string, number>
): void {
  for (const [key, value] of Object.entries(values)) {
    const field = component[key as keyof Component] as
      | ComponentField
      | undefined;
    if (field) {
      field[entity] = value;
    }
  }
}
