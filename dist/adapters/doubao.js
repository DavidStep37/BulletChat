import { insertIntoContentEditable, insertIntoTextarea } from './utils.js';
import { findGenericChatInput, findGenericMountTarget, readGenericThemeMode } from './common.js';
export const doubaoAdapter = {
    id: 'doubao',
    isActive() {
        return window.location.hostname === 'doubao.com' || window.location.hostname.endsWith('.doubao.com');
    },
    getInputElement() {
        const byTestId = document.querySelector('textarea[data-testid="chat_input_input"]');
        if (byTestId && (byTestId.offsetParent !== null || byTestId.getClientRects().length > 0)) {
            return byTestId;
        }
        const main = document.querySelector('[role="main"]') ?? document;
        return findGenericChatInput(main) ?? findGenericChatInput(document);
    },
    getMountTarget(inputEl) {
        const textareaWrapper = inputEl.closest('.semi-input-textarea-wrapper');
        if (textareaWrapper && inputEl instanceof HTMLElement) {
            return {
                container: textareaWrapper,
                append: false,
                insertBefore: inputEl,
            };
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
        else {
            insertIntoContentEditable(inputEl, text, append);
        }
    },
    getThemeMode() {
        return readGenericThemeMode();
    },
};
