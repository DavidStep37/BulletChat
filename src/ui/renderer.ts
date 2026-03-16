import type { SuggestionItem } from '../types/index.js';
import { getActiveAdapter } from '../adapters/index.js';
import { detectSiteTheme } from './theme.js';

const BAR_DATA_ATTR = 'data-csp-suggestion-bar';

export function findExistingBar(container: HTMLElement): HTMLElement | null {
  return container.querySelector<HTMLElement>(`[${BAR_DATA_ATTR}]`);
}

function applyBarTheme(
  root: HTMLElement,
  inputEl: HTMLTextAreaElement | HTMLElement,
  container: HTMLElement
): void {
  const adapter = getActiveAdapter();
  if (!adapter) return;

  root.setAttribute('data-csp-site', adapter.id);
  root.setAttribute('data-csp-theme', detectSiteTheme(adapter, inputEl, container));
}

export function mountSuggestionBar(
  container: HTMLElement,
  append: boolean,
  items: SuggestionItem[],
  insertBefore?: HTMLElement
): void {
  const adapter = getActiveAdapter();
  if (!adapter) return;

  const inputEl = adapter.getInputElement();
  if (!inputEl) return;

  const existingBar = findExistingBar(container);
  if (existingBar) {
    applyBarTheme(existingBar, inputEl, container);
    return;
  }

  const root = document.createElement('div');
  root.setAttribute(BAR_DATA_ATTR, 'true');
  root.className = 'csp-root';
  applyBarTheme(root, inputEl, container);

  for (const item of items) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'csp-btn';
    btn.textContent = item.label;
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const promptText = item.prompt;
      requestAnimationFrame(() => {
        const currentInput = adapter.getInputElement();
        if (currentInput) {
          adapter.insertText(currentInput, promptText);
        }
      });
    });
    root.appendChild(btn);
  }

  if (insertBefore?.parentNode === container) {
    container.insertBefore(root, insertBefore);
  } else if (append) {
    container.appendChild(root);
  } else {
    container.insertBefore(root, container.firstChild);
  }
}

export function tryMount(items: SuggestionItem[]): void {
  const adapter = getActiveAdapter();
  if (!adapter) return;

  const inputEl = adapter.getInputElement();
  if (!inputEl) return;

  const mount = adapter.getMountTarget(inputEl);
  if (!mount) return;

  mountSuggestionBar(mount.container, mount.append, items, mount.insertBefore);
}
