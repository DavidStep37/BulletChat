import { insertIntoContentEditable, insertIntoTextarea } from './utils.js';
import { findGenericChatInput, findGenericMountTarget, readGenericThemeMode } from './common.js';
function insertIntoKimiEditor(el, text, append) {
    const selection = window.getSelection();
    if (!selection)
        return false;
    const currentText = el.innerText ?? '';
    const toInsert = append && currentText.trim() ? `\n\n${text}` : text;
    const paragraphs = Array.from(el.querySelectorAll('p'));
    const target = append ? paragraphs[paragraphs.length - 1] ?? el : paragraphs[0] ?? el;
    const range = document.createRange();
    range.selectNodeContents(target);
    range.collapse(!append);
    selection.removeAllRanges();
    selection.addRange(range);
    el.focus();
    try {
        return document.execCommand('insertText', false, toInsert);
    }
    catch {
        return false;
    }
}
export const kimiAdapter = {
    id: 'kimi',
    isActive() {
        return window.location.hostname === 'kimi.com' || window.location.hostname.endsWith('.kimi.com');
    },
    getInputElement() {
        const byEditor = document.querySelector('.chat-input-editor[contenteditable="true"]');
        if (byEditor && (byEditor.offsetParent !== null || byEditor.getClientRects().length > 0)) {
            return byEditor;
        }
        const byPlaceholder = document.querySelector('textarea[placeholder*="Ask Anything"], [contenteditable="true"][aria-label*="Ask Anything"]');
        if (byPlaceholder && (byPlaceholder.offsetParent !== null || byPlaceholder.getClientRects().length > 0)) {
            return byPlaceholder;
        }
        const main = document.querySelector('[role="main"]') ?? document;
        return findGenericChatInput(main) ?? findGenericChatInput(document);
    },
    getMountTarget(inputEl) {
        const chatEditor = inputEl.closest('.chat-editor');
        if (chatEditor) {
            const actions = chatEditor.querySelector('.chat-editor-action');
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
    insertText(inputEl, text) {
        const isTextarea = inputEl instanceof HTMLTextAreaElement;
        const currentText = isTextarea ? inputEl.value : inputEl.innerText ?? '';
        const append = currentText.trim().length > 0;
        if (isTextarea) {
            insertIntoTextarea(inputEl, text, append);
        }
        else if (inputEl instanceof HTMLElement &&
            inputEl.matches('.chat-input-editor[contenteditable="true"]')) {
            if (!insertIntoKimiEditor(inputEl, text, append)) {
                insertIntoContentEditable(inputEl, text, append);
            }
        }
        else {
            insertIntoContentEditable(inputEl, text, append);
        }
    },
    getThemeMode() {
        return readGenericThemeMode();
    },
};
