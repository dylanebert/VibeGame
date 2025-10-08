export function makeCompositeKey(sessionId: string, entityId: number): string {
  return sessionId + ':' + entityId;
}

export function parseCompositeKey(
  key: string
): { sessionId: string; entityId: number } | null {
  const colonIndex = key.indexOf(':');
  if (colonIndex === -1) return null;
  const sessionId = key.slice(0, colonIndex);
  const entityId = parseInt(key.slice(colonIndex + 1), 10);
  if (isNaN(entityId)) return null;
  return { sessionId, entityId };
}
