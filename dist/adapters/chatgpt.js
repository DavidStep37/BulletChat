import { insertIntoTextarea, insertIntoContentEditable } from './utils.js';
export const chatgptAdapter = {
    id: 'chatgpt',
    isActive() {
        const host = window.location.hostname;
        return host.includes('chat.openai.com') || host.includes('chatgpt.com');
    },
    getInputElement() {
        const byId = document.querySelector('#prompt-textarea');
        if (byId)
            return byId;
        const byAria = document.querySelector('textarea[aria-label*="Message"], textarea[aria-label*="消息"], textarea[aria-label]');
        if (byAria)
            return byAria;
        const byPlaceholder = document.querySelector('textarea[placeholder]');
        if (byPlaceholder)
            return byPlaceholder;
        const form = document.querySelector('form');
        const textareas = form ? Array.from(form.querySelectorAll('textarea')) : [];
        for (const ta of textareas) {
            if (ta.offsetParent !== null && !ta.disabled)
                return ta;
        }
        const editable = document.querySelector('[contenteditable="true"][data-placeholder], [contenteditable="true"][data-id="root"]');
        if (editable)
            return editable;
        return null;
    },
    getMountTarget(inputEl) {
        let container = inputEl.parentElement;
        if (!container)
            container = inputEl.closest('form');
        if (!container)
            container = inputEl.closest('[role="region"]');
        if (!container)
            return null;
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
        const root = document.documentElement;
        if (root.classList.contains('dark'))
            return 'dark';
        if (root.classList.contains('light'))
            return 'light';
        const themeAttr = root.getAttribute('data-theme') ?? document.body?.getAttribute('data-theme');
        if (themeAttr === 'dark' || themeAttr === 'light')
            return themeAttr;
        return null;
    },
};
