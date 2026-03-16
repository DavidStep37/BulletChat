import type { MountTarget, SiteAdapter } from './types.js';
import {
  dispatchBeforeInputInsertText,
  dispatchPasteIntoContentEditable,
  insertIntoTextarea,
} from './utils.js';
import { findGenericChatInput, findGenericMountTarget, readGenericThemeMode } from './common.js';

function isVisible(el: HTMLElement): boolean {
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  return el.offsetParent !== null || el.getClientRects().length > 0;
}

function getQianwenPlainText(el: HTMLElement): string {
  const raw = el.innerText ?? '';
  return raw.replace(/\u200b/g, '').trim();
}

function findSlateTextNode(root: Node, fromEnd: boolean): Text | null {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let found: Text | null = null;

  while (walker.nextNode()) {
    found = walker.currentNode as Text;
    if (!fromEnd) {
      return found;
    }
  }

  return found;
}

function getSlateTextTarget(el: HTMLElement, append: boolean): { node: Node; offset: number } | null {
  const markers = Array.from(
    el.querySelectorAll<HTMLElement>('[data-slate-string], [data-slate-zero-width]')
  );

  const targetMarker = append ? markers[markers.length - 1] ?? null : markers[0] ?? null;
  if (!targetMarker) return null;

  const textNode = findSlateTextNode(targetMarker, append);

  if (textNode) {
    const textValue = textNode.textContent ?? '';
    const offset = append && !targetMarker.hasAttribute('data-slate-zero-width')
      ? textValue.length
      : 0;

    return { node: textNode, offset };
  }

  return { node: targetMarker, offset: 0 };
}

function setQianwenSelection(el: HTMLElement, append: boolean): boolean {
  const selection = window.getSelection();
  if (!selection) return false;

  const range = document.createRange();
  const target = getSlateTextTarget(el, append);

  if (target) {
    if (target.node.nodeType === Node.TEXT_NODE) {
      range.setStart(target.node, target.offset);
      range.setEnd(target.node, target.offset);
    } else {
      range.selectNodeContents(target.node);
      range.collapse(!append);
    }
  } else {
    range.selectNodeContents(el);
    range.collapse(!append);
  }

  selection.removeAllRanges();
  selection.addRange(range);
  return true;
}

function insertIntoQianwenEditor(el: HTMLElement, text: string, append: boolean): boolean {
  const hasExistingText = getQianwenPlainText(el).length > 0;
  const shouldAppend = append && hasExistingText;

  if (!setQianwenSelection(el, shouldAppend)) {
    return false;
  }

  el.focus();

  if (dispatchPasteIntoContentEditable(el, text, shouldAppend)) {
    return true;
  }

  if (dispatchBeforeInputInsertText(el, text, shouldAppend)) {
    return true;
  }

  return false;
}

export const qianwenAdapter: SiteAdapter = {
  id: 'qianwen',

  isActive(): boolean {
    const host = window.location.hostname;
    return host === 'qianwen.com' || host.endsWith('.qianwen.com') || host === 'tongyi.com' || host.endsWith('.tongyi.com');
  },

  getInputElement(): HTMLTextAreaElement | HTMLElement | null {
    const slateEditor = Array.from(
      document.querySelectorAll<HTMLElement>(
        '[data-slate-editor="true"][contenteditable="true"], [data-slate-editor="true"] [contenteditable="true"]'
      )
    ).find(isVisible);
    if (slateEditor) return slateEditor;

    const textbox = Array.from(
      document.querySelectorAll<HTMLElement>(
        '[role="textbox"][contenteditable="true"], [contenteditable="true"][aria-label], textarea'
      )
    ).find(isVisible);
    if (textbox) return textbox;

    const main = document.querySelector('[role="main"]') ?? document;
    return findGenericChatInput(main) ?? findGenericChatInput(document);
  },

  getMountTarget(inputEl: HTMLTextAreaElement | HTMLElement): MountTarget | null {
    const slateEditor =
      (inputEl.matches('[data-slate-editor="true"]') ? inputEl : null) ??
      inputEl.closest<HTMLElement>('[data-slate-editor="true"]');

    if (slateEditor) {
      const outerWrapper = slateEditor.closest<HTMLElement>(
        'form, [class*="composer"], [class*="chat"], [class*="input"], [class*="editor"]'
      );

      if (outerWrapper?.parentElement) {
        return {
          container: outerWrapper.parentElement,
          append: false,
          insertBefore: outerWrapper,
        };
      }

      const editorWrapper = slateEditor.parentElement;
      if (editorWrapper?.parentElement) {
        return {
          container: editorWrapper.parentElement,
          append: false,
          insertBefore: editorWrapper,
        };
      }
    }

    const directParent = inputEl.parentElement;
    if (directParent?.parentElement) {
      return {
        container: directParent.parentElement,
        append: false,
        insertBefore: directParent,
      };
    }

    return findGenericMountTarget(inputEl);
  },

  insertText(inputEl: HTMLTextAreaElement | HTMLElement, text: string): void {
    const isTextarea = inputEl instanceof HTMLTextAreaElement;
    const currentText = isTextarea ? inputEl.value : getQianwenPlainText(inputEl as HTMLElement);
    const append = currentText.length > 0;

    if (isTextarea) {
      insertIntoTextarea(inputEl, text, append);
    } else {
      insertIntoQianwenEditor(inputEl as HTMLElement, text, append);
    }
  },

  getThemeMode(): 'light' | 'dark' | null {
    return readGenericThemeMode();
  },
};
