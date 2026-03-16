import type { MountTarget, SiteAdapter } from './types.js';
import { insertIntoContentEditable, insertIntoTextarea } from './utils.js';
import { findGenericChatInput, findGenericMountTarget, readGenericThemeMode } from './common.js';

export const doubaoAdapter: SiteAdapter = {
  id: 'doubao',

  isActive(): boolean {
    return window.location.hostname === 'doubao.com' || window.location.hostname.endsWith('.doubao.com');
  },

  getInputElement(): HTMLTextAreaElement | HTMLElement | null {
    const byTestId = document.querySelector<HTMLTextAreaElement>('textarea[data-testid="chat_input_input"]');
    if (byTestId && (byTestId.offsetParent !== null || byTestId.getClientRects().length > 0)) {
      return byTestId;
    }

    const main = document.querySelector('[role="main"]') ?? document;
    return findGenericChatInput(main) ?? findGenericChatInput(document);
  },

  getMountTarget(inputEl: HTMLTextAreaElement | HTMLElement): MountTarget | null {
    const textareaWrapper = inputEl.closest<HTMLElement>('.semi-input-textarea-wrapper');
    if (textareaWrapper && inputEl instanceof HTMLElement) {
      return {
        container: textareaWrapper,
        append: false,
        insertBefore: inputEl,
      };
    }

    return findGenericMountTarget(inputEl);
  },

  insertText(inputEl: HTMLTextAreaElement | HTMLElement, text: string): void {
    const isTextarea = inputEl instanceof HTMLTextAreaElement;
    const currentText = isTextarea ? inputEl.value : inputEl.innerText ?? '';
    const append = currentText.trim().length > 0;

    if (isTextarea) {
      insertIntoTextarea(inputEl, text, append);
    } else {
      insertIntoContentEditable(inputEl as HTMLElement, text, append);
    }
  },

  getThemeMode(): 'light' | 'dark' | null {
    return readGenericThemeMode();
  },
};
