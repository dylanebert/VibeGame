import intro from './intro.xml?raw';

export const STEP_SEQUENCES: Record<string, string> = {
  '0-1': 'intro',
  '1-0': 'reset',
};

export function injectSequences(worldElement: Element): void {
  const fragments = [intro];

  for (const fragment of fragments) {
    const temp = document.createElement('div');
    temp.innerHTML = fragment.trim();
    for (const child of Array.from(temp.children)) {
      worldElement.appendChild(child);
    }
  }
}
