import type { System } from './types';

export interface SystemOrderingError extends Error {
  readonly type: 'validation' | 'circular-dependency' | 'group-mismatch';
}

function createOrderingError(
  type: SystemOrderingError['type'],
  message: string
): SystemOrderingError {
  const error = new Error(message) as SystemOrderingError;
  (error as { type: SystemOrderingError['type'] }).type = type;
  return error;
}

export function validateSystemConstraints(system: System): void {
  const constraints = [
    system.first && 'first',
    system.last && 'last',
    system.before?.length && 'before',
    system.after?.length && 'after',
  ].filter(Boolean);

  if (
    constraints.length > 1 &&
    (constraints.includes('first') || constraints.includes('last'))
  ) {
    throw createOrderingError(
      'validation',
      `System cannot combine ${constraints.join(' and ')} constraints`
    );
  }
}

export function validateGroupConstraints(
  system: System,
  allSystems: System[]
): void {
  const systemGroup = system.group ?? 'simulation';

  if (system.before) {
    for (const beforeSystem of system.before) {
      if (!allSystems.includes(beforeSystem)) continue;
      const beforeGroup = beforeSystem.group ?? 'simulation';
      if (beforeGroup !== systemGroup) {
        throw createOrderingError(
          'group-mismatch',
          `System with before constraint references system in different group (${systemGroup} vs ${beforeGroup})`
        );
      }
    }
  }

  if (system.after) {
    for (const afterSystem of system.after) {
      if (!allSystems.includes(afterSystem)) continue;
      const afterGroup = afterSystem.group ?? 'simulation';
      if (afterGroup !== systemGroup) {
        throw createOrderingError(
          'group-mismatch',
          `System with after constraint references system in different group (${systemGroup} vs ${afterGroup})`
        );
      }
    }
  }
}

function buildDependencyGraph(systems: System[]): Map<System, Set<System>> {
  const graph = new Map<System, Set<System>>();

  for (const system of systems) {
    if (!graph.has(system)) {
      graph.set(system, new Set());
    }

    if (system.before) {
      for (const beforeTarget of system.before) {
        if (!systems.includes(beforeTarget)) continue;
        if (!graph.has(beforeTarget)) {
          graph.set(beforeTarget, new Set());
        }
        graph.get(system)!.add(beforeTarget);
      }
    }

    if (system.after) {
      for (const afterTarget of system.after) {
        if (!systems.includes(afterTarget)) continue;
        if (!graph.has(afterTarget)) {
          graph.set(afterTarget, new Set());
        }
        graph.get(afterTarget)!.add(system);
      }
    }
  }

  return graph;
}

function detectCycles(graph: Map<System, Set<System>>): void {
  const visited = new Set<System>();
  const stack = new Set<System>();

  function hasCycle(system: System): boolean {
    if (stack.has(system)) return true;
    if (visited.has(system)) return false;

    visited.add(system);
    stack.add(system);

    const deps = graph.get(system);
    if (deps?.size && [...deps].some(hasCycle)) return true;

    stack.delete(system);
    return false;
  }

  for (const system of graph.keys()) {
    if (hasCycle(system)) {
      throw createOrderingError(
        'circular-dependency',
        'Circular dependency detected in system constraints'
      );
    }
  }
}

function topologicalSort(systems: System[]): System[] {
  if (systems.length === 0) return [];

  const graph = buildDependencyGraph(systems);
  detectCycles(graph);

  const inDegree = new Map<System, number>();
  for (const system of systems) {
    inDegree.set(system, 0);
  }

  for (const deps of graph.values()) {
    for (const dep of deps) {
      inDegree.set(dep, (inDegree.get(dep) || 0) + 1);
    }
  }

  const queue: System[] = [];
  const sorted: System[] = [];

  for (const system of systems) {
    if (inDegree.get(system) === 0) {
      queue.push(system);
    }
  }

  while (queue.length > 0) {
    const system = queue.shift()!;
    sorted.push(system);

    const deps = graph.get(system) || new Set();
    for (const dep of deps) {
      const newDegree = (inDegree.get(dep) || 0) - 1;
      inDegree.set(dep, newDegree);
      if (newDegree === 0) {
        queue.push(dep);
      }
    }
  }

  return sorted;
}

export function sortSystemsByConstraints(
  systems: System[],
  _group: string,
  allSystems?: System[]
): System[] {
  const validation = allSystems || systems;
  systems.forEach((s) => {
    validateSystemConstraints(s);
    validateGroupConstraints(s, validation);
  });

  const categorized = systems.reduce(
    (acc, system) => {
      const key = system.first ? 'first' : system.last ? 'last' : 'normal';
      acc[key].push(system);
      return acc;
    },
    { first: [] as System[], normal: [] as System[], last: [] as System[] }
  );

  return [
    ...topologicalSort(categorized.first),
    ...topologicalSort(categorized.normal),
    ...topologicalSort(categorized.last),
  ];
}
