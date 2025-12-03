import step01 from './step-0-1.xml?raw';
import step12 from './step-1-2.xml?raw';
import step23 from './step-2-3.xml?raw';

export const STEP_SEQUENCES: Record<string, string> = {
  '0-1': 'step-0-1',
  '1-0': 'step-1-0',
  '1-2': 'step-1-2',
  '2-1': 'step-2-1',
  '2-3': 'step-2-3',
  '3-2': 'step-3-2',
};

export function injectSequences(worldElement: Element): void {
  const fragments = [step01, step12, step23];

  for (const fragment of fragments) {
    const temp = document.createElement('div');
    temp.innerHTML = fragment.trim();
    for (const child of Array.from(temp.children)) {
      worldElement.appendChild(child);
    }
  }
}
