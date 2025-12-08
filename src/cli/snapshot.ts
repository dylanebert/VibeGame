import { Matrix4, Quaternion, Vector3 } from 'three';
import { defineQuery, type Component } from 'bitecs';
import type { State } from '../core';
import { MainCamera } from '../plugins/rendering/components';
import { CameraProjection } from '../plugins/rendering/utils';
import { WorldTransform } from '../plugins/transforms/components';

export interface SnapshotOptions {
  entities?: string[];
  components?: string[];
  sequences?: boolean;
  project?: boolean;
  detail?: 'brief' | 'standard' | 'full';
  precision?: number;
}

export interface SequenceSnapshot {
  name: string;
  eid: number;
  state: 'idle' | 'playing';
  currentIndex: number;
  itemCount: number;
  progress: number;
}

export interface ViewportCoordinate {
  x: number;
  y: number;
  z: number;
  visible: boolean;
}

export interface EntitySnapshot {
  eid: number;
  name?: string;
  components: Record<string, Record<string, number>>;
  viewport?: ViewportCoordinate;
  summary?: string;
}

export interface SnapshotHint {
  type: 'warning' | 'info' | 'sequence';
  entity?: string;
  message: string;
}

export interface WorldSnapshot {
  elapsed: number;
  entities: EntitySnapshot[];
  sequences?: SequenceSnapshot[];
  hints?: SnapshotHint[];
}

type ComponentField =
  | Float32Array
  | Int32Array
  | Uint8Array
  | Uint16Array
  | Uint32Array;

const NEAR = 0.1;
const FAR = 1000;
const DEFAULT_PRECISION = 2;

const INTERNAL_COMPONENTS = new Set([
  'world-transform',
  'parent',
  'children',
  'mesh-ref',
  'scene-ref',
]);

const TRANSFORM_COMPONENTS = new Set(['transform', 'world-transform']);

function truncate(value: number, precision: number): number {
  if (Number.isInteger(value)) return value;
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
}

function truncateFields(
  fields: Record<string, number>,
  precision: number
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(fields)) {
    result[key] = truncate(value, precision);
  }
  return result;
}

const cameraQuery = defineQuery([MainCamera, WorldTransform]);

const position = new Vector3();
const quaternion = new Quaternion();
const scale = new Vector3(1, 1, 1);
const worldMatrix = new Matrix4();
const viewMatrix = new Matrix4();
const projectionMatrix = new Matrix4();
const entityPos = new Vector3();

function getComponentFields(
  component: Component,
  eid: number
): Record<string, number> {
  const fields: Record<string, number> = {};
  for (const key in component) {
    if (key.startsWith('_')) continue;
    const field = component[key as keyof Component] as ComponentField | unknown;
    if (
      field instanceof Float32Array ||
      field instanceof Int32Array ||
      field instanceof Uint8Array ||
      field instanceof Uint16Array ||
      field instanceof Uint32Array
    ) {
      fields[key] = field[eid];
    }
  }
  return fields;
}

function projectToViewport(
  state: State,
  cameraEid: number,
  entityId: number
): ViewportCoordinate | null {
  const worldTransform = state.getComponent('world-transform');
  if (!worldTransform || !state.hasComponent(entityId, worldTransform)) {
    return null;
  }

  const aspect = 16 / 9;

  position.set(
    WorldTransform.posX[cameraEid],
    WorldTransform.posY[cameraEid],
    WorldTransform.posZ[cameraEid]
  );
  quaternion.set(
    WorldTransform.rotX[cameraEid],
    WorldTransform.rotY[cameraEid],
    WorldTransform.rotZ[cameraEid],
    WorldTransform.rotW[cameraEid]
  );
  worldMatrix.compose(position, quaternion, scale);
  viewMatrix.copy(worldMatrix).invert();

  const projType = MainCamera.projection[cameraEid];
  const fov = MainCamera.fov[cameraEid] || 75;
  const orthoSize = MainCamera.orthoSize[cameraEid] || 10;

  if (projType === CameraProjection.ORTHOGRAPHIC) {
    const halfHeight = orthoSize / 2;
    const halfWidth = halfHeight * aspect;
    projectionMatrix.makeOrthographic(
      -halfWidth,
      halfWidth,
      halfHeight,
      -halfHeight,
      NEAR,
      FAR
    );
  } else {
    const fovRad = (fov * Math.PI) / 180;
    projectionMatrix.makePerspective(
      -NEAR * Math.tan(fovRad / 2) * aspect,
      NEAR * Math.tan(fovRad / 2) * aspect,
      NEAR * Math.tan(fovRad / 2),
      -NEAR * Math.tan(fovRad / 2),
      NEAR,
      FAR
    );
  }

  entityPos.set(
    WorldTransform.posX[entityId],
    WorldTransform.posY[entityId],
    WorldTransform.posZ[entityId]
  );

  entityPos.applyMatrix4(viewMatrix);
  entityPos.applyMatrix4(projectionMatrix);

  return {
    x: (entityPos.x + 1) / 2,
    y: (1 - entityPos.y) / 2,
    z: entityPos.z,
    visible: entityPos.z >= -1 && entityPos.z <= 1,
  };
}

function generateHints(
  entities: EntitySnapshot[],
  sequences?: SequenceSnapshot[]
): SnapshotHint[] {
  const hints: SnapshotHint[] = [];

  for (const entity of entities) {
    if (!entity.name || !entity.viewport) continue;

    const { x, y, visible } = entity.viewport;

    if (!visible) {
      hints.push({
        type: 'warning',
        entity: entity.name,
        message: `'${entity.name}' behind camera`,
      });
    } else if (x < 0.05 || x > 0.95 || y < 0.05 || y > 0.95) {
      const edge =
        x < 0.05 ? 'left' : x > 0.95 ? 'right' : y < 0.05 ? 'top' : 'bottom';
      hints.push({
        type: 'warning',
        entity: entity.name,
        message: `'${entity.name}' near ${edge} edge`,
      });
    }
  }

  if (sequences) {
    for (const seq of sequences) {
      if (seq.state === 'playing') {
        const pct = Math.round(seq.progress * 100);
        hints.push({
          type: 'sequence',
          entity: seq.name,
          message: `'${seq.name}' playing (${pct}%)`,
        });
      } else if (seq.progress > 0.9 && seq.progress < 1) {
        hints.push({
          type: 'info',
          entity: seq.name,
          message: `'${seq.name}' nearly complete`,
        });
      }
    }
  }

  return hints;
}

function shouldIncludeComponent(
  componentName: string,
  detail: 'brief' | 'standard' | 'full'
): boolean {
  if (detail === 'full') return true;
  if (INTERNAL_COMPONENTS.has(componentName)) return false;
  if (detail === 'brief') {
    return TRANSFORM_COMPONENTS.has(componentName);
  }
  return true;
}

export function createSnapshot(
  state: State,
  options?: SnapshotOptions
): WorldSnapshot {
  const detail = options?.detail ?? 'standard';
  const precision = options?.precision ?? DEFAULT_PRECISION;
  const entityMap = new Map<number, EntitySnapshot>();
  const nameFilter = options?.entities ? new Set(options.entities) : null;
  const componentFilter = options?.components
    ? new Set(options.components)
    : null;

  const entityNames = state.getNamedEntities();
  const nameByEid = new Map<number, string>();
  for (const [name, eid] of entityNames) {
    nameByEid.set(eid, name);
  }

  const componentSummaries = new Map<number, string[]>();

  for (const componentName of state.getComponentNames()) {
    if (componentFilter && !componentFilter.has(componentName)) continue;

    const component = state.getComponent(componentName);
    if (!component) continue;

    const query = defineQuery([component]);
    const entities = query(state.world);

    for (const eid of entities) {
      const entityName = nameByEid.get(eid);

      if (detail !== 'full' && !entityName) continue;
      if (nameFilter && (!entityName || !nameFilter.has(entityName))) continue;

      if (!entityMap.has(eid)) {
        entityMap.set(eid, {
          eid,
          name: entityName,
          components: {},
        });
        componentSummaries.set(eid, []);
      }

      componentSummaries.get(eid)!.push(componentName);

      if (shouldIncludeComponent(componentName, detail)) {
        const snapshot = entityMap.get(eid)!;
        const fields = getComponentFields(component, eid);
        snapshot.components[componentName] = truncateFields(fields, precision);
      }
    }
  }

  for (const [eid, names] of componentSummaries) {
    const entity = entityMap.get(eid);
    if (entity && detail === 'brief') {
      entity.summary = names
        .filter((n) => !INTERNAL_COMPONENTS.has(n))
        .join(', ');
    }
  }

  const entities = Array.from(entityMap.values()).sort((a, b) => {
    if (a.name && b.name) return a.name.localeCompare(b.name);
    if (a.name) return -1;
    if (b.name) return 1;
    return a.eid - b.eid;
  });

  const shouldProject = options?.project ?? true;
  if (shouldProject) {
    const cameras = cameraQuery(state.world);
    if (cameras.length > 0) {
      const cameraEid = cameras[0];
      for (const entity of entities) {
        if (entity.eid === cameraEid) continue;
        const coord = projectToViewport(state, cameraEid, entity.eid);
        if (
          coord &&
          isFinite(coord.x) &&
          isFinite(coord.y) &&
          isFinite(coord.z)
        ) {
          entity.viewport = {
            x: truncate(coord.x, precision),
            y: truncate(coord.y, precision),
            z: truncate(coord.z, precision),
            visible: coord.visible,
          };
        }
      }
    }
  }

  const result: WorldSnapshot = {
    elapsed: truncate(state.time.elapsed, precision),
    entities,
  };

  if (options?.sequences !== false) {
    const sequenceComponent = state.getComponent('sequence');
    if (sequenceComponent) {
      const query = defineQuery([sequenceComponent]);
      const seqEntities = query(state.world);
      const sequences: SequenceSnapshot[] = [];

      for (const eid of seqEntities) {
        const fields = getComponentFields(sequenceComponent, eid);
        const itemCount = fields.itemCount ?? 0;
        const progress =
          itemCount > 0 ? (fields.currentIndex ?? 0) / itemCount : 0;
        sequences.push({
          name: nameByEid.get(eid) ?? `eid-${eid}`,
          eid,
          state: fields.state === 1 ? 'playing' : 'idle',
          currentIndex: fields.currentIndex ?? 0,
          itemCount,
          progress: truncate(progress, precision),
        });
      }

      result.sequences = sequences.sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  result.hints = generateHints(entities, result.sequences);

  return result;
}

function formatComponentValue(
  componentName: string,
  fields: Record<string, number>
): string {
  const keys = Object.keys(fields);
  if (keys.length === 0) return `${componentName}: (empty)`;

  if (
    componentName === 'transform' &&
    'posX' in fields &&
    'rotX' in fields &&
    'scaleX' in fields
  ) {
    const pos = `pos(${fields.posX.toFixed(2)}, ${fields.posY.toFixed(2)}, ${fields.posZ.toFixed(2)})`;
    const rot = `rot(${fields.eulerX.toFixed(2)}, ${fields.eulerY.toFixed(2)}, ${fields.eulerZ.toFixed(2)})`;
    const scale = `scale(${fields.scaleX.toFixed(2)}, ${fields.scaleY.toFixed(2)}, ${fields.scaleZ.toFixed(2)})`;
    return `${componentName}: ${pos} ${rot} ${scale}`;
  }

  const pairs = keys.map((k) => {
    const v = fields[k];
    return `${k}=${typeof v === 'number' && !Number.isInteger(v) ? v.toFixed(2) : v}`;
  });
  return `${componentName}: ${pairs.join(' ')}`;
}

export function formatSnapshot(snapshot: WorldSnapshot): string {
  const lines: string[] = [];
  lines.push(`=== elapsed: ${snapshot.elapsed.toFixed(2)}s ===`);
  lines.push('');

  for (const entity of snapshot.entities) {
    const label = entity.name ? `[${entity.name}]` : `[eid=${entity.eid}]`;
    lines.push(`${label} eid=${entity.eid}`);

    for (const [componentName, fields] of Object.entries(entity.components)) {
      lines.push(`  ${formatComponentValue(componentName, fields)}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
