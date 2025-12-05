import type { Strategy } from './components';

export interface Position {
  x: number;
  y: number;
  z: number;
}

export type StrategyFn = (
  memberCount: number,
  gap: number,
  index: number
) => Position;

export const strategyRegistry = new Map<Strategy, StrategyFn>();

export function horizontalStrategy(
  memberCount: number,
  gap: number,
  index: number
): Position {
  const totalWidth = (memberCount - 1) * gap;
  const startX = -totalWidth / 2;
  return {
    x: startX + index * gap,
    y: 0,
    z: 0,
  };
}

export const StrategyNames: Record<string, Strategy> = {
  horizontal: 0,
};

strategyRegistry.set(0, horizontalStrategy);
