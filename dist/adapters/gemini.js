import { insertIntoTextarea, insertIntoContentEditable } from './utils.js';
export const geminiAdapter = {
    id: 'gemini',
    isActive() {
        return window.location.hostname.includes('gemini.google.com');
    },
    getInputElement() {
        const byAria = document.querySelector('[aria-label="Enter a prompt for Gemini"], .ql-editor.textarea.new-input-ui[contenteditable="true"]');
        if (byAria)
            return byAria;
        const main = document.querySelector('[role="main"]') ?? document;
        const textareas = Array.from(main.querySelectorAll('textarea'));
        const visible = textareas.filter((ta) => !ta.disabled && ta.offsetParent !== null);
        if (visible.length > 0)
            return visible[visible.length - 1];
        if (textareas.length > 0)
            return textareas[textareas.length - 1];
        const byPlaceholder = document.querySelector('[data-placeholder="Ask Gemini 3"]');
        if (byPlaceholder)
            return byPlaceholder;
        const editable = document.querySelector('[contenteditable="true"]');
        if (editable?.closest('.text-input-field'))
            return editable;
        return null;
    },
    getMountTarget(inputEl) {
        const textInputField = inputEl.closest('.text-input-field');
        if (textInputField) {
            const footer = textInputField.querySelector('.trailing-actions-wrapper');
            if (footer) {
                return { container: textInputField, append: false, insertBefore: footer };
            }
            return { container: textInputField, append: true };
        }
        const main = document.querySelector('[role="main"]');
        if (main)
            return { container: main, append: true };
        let container = inputEl.closest('form');
        if (!container)
            container = inputEl.closest('[role="region"]');
        if (!container)
            container = inputEl.parentElement;
        if (!container)
            container = document.body;
        return { container, append: true };
    },
    insertText(inputEl, text) {
        const isTextarea = inputEl instanceof HTMLTextAreaElement;
        const currentText = isTextarea
            ? inputEl.value
            : inputEl.innerText ?? '';
        const append = currentText.trim().length > 0;
        if (isTextarea) {
            insertIntoTextarea(inputEl, text, append);
        }
        else {
            insertIntoContentEditable(inputEl, text, append);
        }
    },
    getThemeMode() {
        const values = [
            document.documentElement.getAttribute('data-theme'),
            document.documentElement.getAttribute('data-color-mode'),
            document.body?.getAttribute('data-theme') ?? null,
            document.body?.getAttribute('data-color-mode') ?? null,
        ];
        for (const value of values) {
            if (value === 'dark' || value === 'light')
                return value;
        }
        return null;
    },
};
