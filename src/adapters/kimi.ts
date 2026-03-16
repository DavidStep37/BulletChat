import type { MountTarget, SiteAdapter } from './types.js';
import { insertIntoContentEditable, insertIntoTextarea } from './utils.js';
import { findGenericChatInput, findGenericMountTarget, readGenericThemeMode } from './common.js';

function insertIntoKimiEditor(el: HTMLElement, text: string, append: boolean): boolean {
  const selection = window.getSelection();
  if (!selection) return false;

  const currentText = el.innerText ?? '';
  const toInsert = append && currentText.trim() ? `\n\n${text}` : text;
  const paragraphs = Array.from(el.querySelectorAll<HTMLElement>('p'));
  const target = append ? paragraphs[paragraphs.length - 1] ?? el : paragraphs[0] ?? el;

  const range = document.createRange();
  range.selectNodeContents(target);
  range.collapse(!append);
  selection.removeAllRanges();
  selection.addRange(range);
  el.focus();

  try {
    return document.execCommand('insertText', false, toInsert);
  } catch {
    return false;
  }
}

export const kimiAdapter: SiteAdapter = {
  id: 'kimi',

  isActive(): boolean {
    return window.location.hostname === 'kimi.com' || window.location.hostname.endsWith('.kimi.com');
  },

  getInputElement(): HTMLTextAreaElement | HTMLElement | null {
    const byEditor = document.querySelector<HTMLElement>('.chat-input-editor[contenteditable="true"]');
    if (byEditor && (byEditor.offsetParent !== null || byEditor.getClientRects().length > 0)) {
      return byEditor;
    }

    const byPlaceholder = document.querySelector<HTMLElement>(
      'textarea[placeholder*="Ask Anything"], [contenteditable="true"][aria-label*="Ask Anything"]'
    );
    if (byPlaceholder && (byPlaceholder.offsetParent !== null || byPlaceholder.getClientRects().length > 0)) {
      return byPlaceholder;
    }

    const main = document.querySelector('[role="main"]') ?? document;
    return findGenericChatInput(main) ?? findGenericChatInput(document);
  },

  getMountTarget(inputEl: HTMLTextAreaElement | HTMLElement): MountTarget | null {
    const chatEditor = inputEl.closest<HTMLElement>('.chat-editor');
    if (chatEditor) {
      const actions = chatEditor.querySelector<HTMLElement>('.chat-editor-action');
      if (actions) {
        return {
          container: chatEditor,
          append: false,
          insertBefore: actions,
        };
      }

      return { container: chatEditor, append: true };
    }

    return findGenericMountTarget(inputEl);
  },

  insertText(inputEl: HTMLTextAreaElement | HTMLElement, text: string): void {
    const isTextarea = inputEl instanceof HTMLTextAreaElement;
    const currentText = isTextarea ? inputEl.value : inputEl.innerText ?? '';
    const append = currentText.trim().length > 0;

    if (isTextarea) {
      insertIntoTextarea(inputEl, text, append);
    } else if (
      inputEl instanceof HTMLElement &&
      inputEl.matches('.chat-input-editor[contenteditable="true"]')
    ) {
      if (!insertIntoKimiEditor(inputEl, text, append)) {
        insertIntoContentEditable(inputEl, text, append);
      }
    } else {
      insertIntoContentEditable(inputEl as HTMLElement, text, append);
    }
  },

  getThemeMode(): 'light' | 'dark' | null {
    return readGenericThemeMode();
  },
};
