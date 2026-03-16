import { getSuggestions, setSuggestions } from '../storage/index.js';
const GET_SITE_CONTEXT_MESSAGE = 'bulletchat:get-site-context';
const SITE_THEME_CHANGED_MESSAGE = 'bulletchat:site-theme-changed';
const TEXTAREA_MIN_HEIGHT = 56;
const listEl = document.getElementById('list');
const listWrapEl = document.getElementById('listWrap');
const emptyStateEl = document.getElementById('emptyState');
const addBtn = document.getElementById('addBtn');
const saveBtn = document.getElementById('saveBtn');
const hintEl = document.getElementById('hint');
let items = [];
let activeTabId = null;
function applyPopupTheme(theme) {
    if (!theme)
        return;
    document.documentElement.setAttribute('data-popup-theme', theme);
}
function showHint(text) {
    hintEl.textContent = text;
    if (text) {
        window.setTimeout(() => {
            hintEl.textContent = '';
        }, 2000);
    }
}
function updateListEdgeFade() {
    const maxScrollTop = Math.max(0, listEl.scrollHeight - listEl.clientHeight);
    const scrollTop = listEl.scrollTop;
    const hasOverflow = maxScrollTop > 1;
    const fadeThreshold = 6;
    listWrapEl.classList.toggle('has-top-fade', hasOverflow && scrollTop > fadeThreshold);
    listWrapEl.classList.toggle('has-bottom-fade', hasOverflow && scrollTop < maxScrollTop - fadeThreshold);
}
function updateEmptyState() {
    const isEmpty = items.length === 0;
    emptyStateEl.hidden = !isEmpty;
    listEl.hidden = isEmpty;
    listWrapEl.classList.toggle('is-empty', isEmpty);
}
function resizePromptTextarea(el) {
    el.style.height = '0px';
    const nextHeight = Math.max(el.scrollHeight, TEXTAREA_MIN_HEIGHT);
    el.style.height = `${nextHeight}px`;
    el.style.overflowY = 'hidden';
}
function wirePromptTextarea(el) {
    resizePromptTextarea(el);
    el.addEventListener('input', () => {
        resizePromptTextarea(el);
        requestAnimationFrame(updateListEdgeFade);
    });
}
function collectFromDom() {
    const rows = listEl.querySelectorAll('[data-item-id]');
    const result = [];
    rows.forEach((row) => {
        const id = row.getAttribute('data-item-id');
        if (!id)
            return;
        const labelInp = row.querySelector('.label-inp');
        const promptInp = row.querySelector('.prompt-inp');
        if (!labelInp || !promptInp)
            return;
        result.push({
            id,
            label: labelInp.value.trim() || '未命名',
            prompt: promptInp.value.trim(),
        });
    });
    return result;
}
function syncDraftItemsFromDom() {
    if (!listEl.children.length)
        return;
    items = collectFromDom();
}
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
function createItemElement(item) {
    const itemEl = document.createElement('div');
    itemEl.className = 'popup-item';
    itemEl.setAttribute('data-item-id', item.id);
    itemEl.innerHTML = `
    <div class="popup-item-row">
      <input type="text" class="label-inp" placeholder="按钮名" value="${escapeHtml(item.label)}" maxlength="8">
      <textarea class="prompt-inp" placeholder="点击后插入的文案">${escapeHtml(item.prompt)}</textarea>
      <button type="button" class="del-btn" aria-label="删除">×</button>
    </div>
  `;
    const promptInp = itemEl.querySelector('.prompt-inp');
    if (promptInp)
        wirePromptTextarea(promptInp);
    const delBtn = itemEl.querySelector('.del-btn');
    delBtn?.addEventListener('click', () => {
        syncDraftItemsFromDom();
        items = items.filter((candidate) => candidate.id !== item.id);
        itemEl.remove();
        updateEmptyState();
        requestAnimationFrame(updateListEdgeFade);
    });
    return itemEl;
}
function render() {
    listEl.innerHTML = '';
    const fragment = document.createDocumentFragment();
    items.forEach((item) => {
        fragment.appendChild(createItemElement(item));
    });
    listEl.appendChild(fragment);
    updateEmptyState();
    requestAnimationFrame(updateListEdgeFade);
}
function addItem() {
    syncDraftItemsFromDom();
    const newItem = {
        id: crypto.randomUUID(),
        label: '',
        prompt: '',
    };
    items.push(newItem);
    const itemEl = createItemElement(newItem);
    listEl.appendChild(itemEl);
    updateEmptyState();
    requestAnimationFrame(() => {
        updateListEdgeFade();
        itemEl.querySelector('.prompt-inp')?.focus();
    });
}
async function save() {
    items = collectFromDom();
    await setSuggestions(items);
    showHint('已保存');
}
function queryActiveTab() {
    return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            resolve(tabs[0]);
        });
    });
}
function sendMessageToTab(tabId, message) {
    return new Promise((resolve) => {
        chrome.tabs.sendMessage(tabId, message, (response) => {
            if (chrome.runtime.lastError) {
                resolve(undefined);
                return;
            }
            resolve(response);
        });
    });
}
async function syncPopupThemeFromActiveTab() {
    const tab = await queryActiveTab();
    activeTabId = tab?.id ?? null;
    if (!activeTabId)
        return;
    const response = await sendMessageToTab(activeTabId, {
        type: GET_SITE_CONTEXT_MESSAGE,
    });
    applyPopupTheme(response?.theme ?? null);
}
chrome.runtime.onMessage.addListener((message, sender) => {
    if (message?.type !== SITE_THEME_CHANGED_MESSAGE)
        return;
    if (activeTabId !== null && sender.tab?.id !== activeTabId)
        return;
    applyPopupTheme(message.theme);
});
addBtn.addEventListener('click', addItem);
saveBtn.addEventListener('click', () => void save());
listEl.addEventListener('scroll', updateListEdgeFade);
window.addEventListener('resize', updateListEdgeFade);
void syncPopupThemeFromActiveTab();
void getSuggestions().then((loaded) => {
    items = loaded;
    render();
});
