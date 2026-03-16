import type { SiteAdapter, MountTarget } from './types.js';
import { insertIntoTextarea, insertIntoContentEditable } from './utils.js';

export const chatgptAdapter: SiteAdapter = {
  id: 'chatgpt',

  isActive(): boolean {
    const host = window.location.hostname;
    return host.includes('chat.openai.com') || host.includes('chatgpt.com');
  },

  getInputElement(): HTMLTextAreaElement | HTMLElement | null {
    const byId = document.querySelector<HTMLTextAreaElement>('#prompt-textarea');
    if (byId) return byId;

    const byAria = document.querySelector<HTMLTextAreaElement>(
      'textarea[aria-label*="Message"], textarea[aria-label*="消息"], textarea[aria-label]'
    );
    if (byAria) return byAria;

    const byPlaceholder = document.querySelector<HTMLTextAreaElement>('textarea[placeholder]');
    if (byPlaceholder) return byPlaceholder;

    const form = document.querySelector('form');
    const textareas = form ? Array.from(form.querySelectorAll<HTMLTextAreaElement>('textarea')) : [];
    for (const ta of textareas) {
      if (ta.offsetParent !== null && !ta.disabled) return ta;
    }

    const editable = document.querySelector<HTMLElement>(
      '[contenteditable="true"][data-placeholder], [contenteditable="true"][data-id="root"]'
    );
    if (editable) return editable;

    return null;
  },

  getMountTarget(inputEl: HTMLTextAreaElement | HTMLElement): MountTarget | null {
    let container: HTMLElement | null = inputEl.parentElement;
    if (!container) container = inputEl.closest('form');
    if (!container) container = inputEl.closest('[role="region"]');
    if (!container) return null;
    return { container, append: true };
  },

  insertText(inputEl: HTMLTextAreaElement | HTMLElement, text: string): void {
    const isTextarea = inputEl instanceof HTMLTextAreaElement;
    const currentText = isTextarea
      ? (inputEl as HTMLTextAreaElement).value
      : (inputEl as HTMLElement).innerText ?? '';
    const append = currentText.trim().length > 0;

    if (isTextarea) {
      insertIntoTextarea(inputEl as HTMLTextAreaElement, text, append);
    } else {
      insertIntoContentEditable(inputEl as HTMLElement, text, append);
    }
  },

  getThemeMode(): 'light' | 'dark' | null {
    const root = document.documentElement;
    if (root.classList.contains('dark')) return 'dark';
    if (root.classList.contains('light')) return 'light';

    const themeAttr = root.getAttribute('data-theme') ?? document.body?.getAttribute('data-theme');
    if (themeAttr === 'dark' || themeAttr === 'light') return themeAttr;

    return null;
  },
};
