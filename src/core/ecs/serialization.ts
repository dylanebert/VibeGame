import type { Component } from 'bitecs';

type TypedArray =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array;

function isTypedArray(value: unknown): value is TypedArray {
  return ArrayBuffer.isView(value);
}

export function serializeComponent(
  component: Component,
  eid: number
): Record<string, number> {
  const data: Record<string, number> = {};

  for (const field in component) {
    if (!Object.prototype.hasOwnProperty.call(component, field)) continue;
    if (field.startsWith('_')) continue;

    const value = (component as Record<string, unknown>)[field];
    if (isTypedArray(value)) {
      data[field] = value[eid];
    }
  }

  return data;
}

export function deserializeComponent(
  component: Component,
  eid: number,
  data: Record<string, number>
): void {
  for (const field in data) {
    if (!Object.prototype.hasOwnProperty.call(data, field)) continue;

    const array = (component as Record<string, unknown>)[field];
    if (isTypedArray(array)) {
      array[eid] = data[field];
    }
  }
}
