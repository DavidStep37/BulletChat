import type { SiteAdapter, MountTarget } from './types.js';
import { insertIntoTextarea, insertIntoContentEditable } from './utils.js';

export const geminiAdapter: SiteAdapter = {
  id: 'gemini',

  isActive(): boolean {
    return window.location.hostname.includes('gemini.google.com');
  },

  getInputElement(): HTMLTextAreaElement | HTMLElement | null {
    const byAria = document.querySelector<HTMLElement>(
      '[aria-label="Enter a prompt for Gemini"], .ql-editor.textarea.new-input-ui[contenteditable="true"]'
    );
    if (byAria) return byAria;

    const main = document.querySelector('[role="main"]') ?? document;
    const textareas = Array.from(main.querySelectorAll<HTMLTextAreaElement>('textarea'));
    const visible = textareas.filter((ta) => !ta.disabled && ta.offsetParent !== null);
    if (visible.length > 0) return visible[visible.length - 1];
    if (textareas.length > 0) return textareas[textareas.length - 1];

    const byPlaceholder = document.querySelector<HTMLElement>('[data-placeholder="Ask Gemini 3"]');
    if (byPlaceholder) return byPlaceholder;

    const editable = document.querySelector<HTMLElement>('[contenteditable="true"]');
    if (editable?.closest('.text-input-field')) return editable;

    return null;
  },

  getMountTarget(inputEl: HTMLTextAreaElement | HTMLElement): MountTarget | null {
    const textInputField = inputEl.closest<HTMLElement>('.text-input-field');
    if (textInputField) {
      const footer = textInputField.querySelector<HTMLElement>('.trailing-actions-wrapper');
      if (footer) {
        return { container: textInputField, append: false, insertBefore: footer };
      }
      return { container: textInputField, append: true };
    }

    const main = document.querySelector<HTMLElement>('[role="main"]');
    if (main) return { container: main, append: true };

    let container: HTMLElement | null = inputEl.closest('form');
    if (!container) container = inputEl.closest('[role="region"]');
    if (!container) container = inputEl.parentElement;
    if (!container) container = document.body;
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
    const values = [
      document.documentElement.getAttribute('data-theme'),
      document.documentElement.getAttribute('data-color-mode'),
      document.body?.getAttribute('data-theme') ?? null,
      document.body?.getAttribute('data-color-mode') ?? null,
    ];

    for (const value of values) {
      if (value === 'dark' || value === 'light') return value;
    }

    return null;
  },
};
