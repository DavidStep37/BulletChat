const INPUT_SELECTORS = [
    'textarea[placeholder]',
    'textarea[aria-label]',
    'textarea',
    '[contenteditable="true"][data-placeholder]',
    '[contenteditable="true"][aria-label]',
    '[contenteditable="true"][placeholder]',
    '[role="textbox"][contenteditable="true"]',
    '[contenteditable="true"]',
].join(', ');
const INPUT_HINTS = [
    'ask',
    'chat',
    'message',
    'prompt',
    'input',
    'send',
    '问',
    '输入',
    '豆包',
    '千问',
    '通义',
    'kimi',
    'qwen',
];
function isVisible(el) {
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden')
        return false;
    if (style.opacity === '0')
        return false;
    return el.offsetParent !== null || el.getClientRects().length > 0;
}
function getElementTextHint(el) {
    return [
        el.getAttribute('placeholder'),
        el.getAttribute('aria-label'),
        el.getAttribute('data-placeholder'),
        el.getAttribute('title'),
        el.className,
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
}
function scoreInput(el) {
    let score = 0;
    const hint = getElementTextHint(el);
    if (el instanceof HTMLTextAreaElement)
        score += 8;
    if (el.getAttribute('contenteditable') === 'true')
        score += 6;
    if (el.getAttribute('role') === 'textbox')
        score += 4;
    if (!el.hasAttribute('readonly') && !el.disabled)
        score += 2;
    if (el.closest('form'))
        score += 3;
    if (el.closest('[role="main"]'))
        score += 3;
    if (el.closest('[class*="chat"], [class*="input"], [class*="editor"], [class*="composer"]')) {
        score += 3;
    }
    if (INPUT_HINTS.some((keyword) => hint.includes(keyword))) {
        score += 10;
    }
    score += Math.min(Math.round(el.getBoundingClientRect().width / 120), 6);
    return score;
}
export function findGenericChatInput(root = document) {
    const candidates = Array.from(root.querySelectorAll(INPUT_SELECTORS)).filter(isVisible);
    if (candidates.length === 0)
        return null;
    candidates.sort((a, b) => scoreInput(b) - scoreInput(a));
    const best = candidates[0];
    return best instanceof HTMLTextAreaElement ? best : best;
}
export function findGenericMountTarget(inputEl) {
    const selectors = [
        '[class*="chat-input"]',
        '[class*="composer"]',
        '[class*="input-area"]',
        '[class*="input"]',
        '[class*="editor"]',
        'form',
        '[role="group"]',
        '[role="region"]',
    ];
    for (const selector of selectors) {
        const container = inputEl.closest(selector);
        if (container)
            return { container, append: true };
    }
    if (inputEl.parentElement) {
        return { container: inputEl.parentElement, append: true };
    }
    return null;
}
export function readGenericThemeMode() {
    const candidates = [document.documentElement, document.body];
    for (const el of candidates) {
        if (!el)
            continue;
        if (el.classList.contains('dark'))
            return 'dark';
        if (el.classList.contains('light'))
            return 'light';
        const attrs = [
            el.getAttribute('data-theme'),
            el.getAttribute('data-color-mode'),
            el.getAttribute('data-mode'),
        ];
        for (const value of attrs) {
            if (value === 'dark' || value === 'light')
                return value;
        }
    }
    return null;
}
