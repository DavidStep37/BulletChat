import type { SuggestionItem, ThemeMode } from '../types/index.js';
import { getSuggestions, setSuggestions } from '../storage/index.js';

const GET_SITE_CONTEXT_MESSAGE = 'bulletchat:get-site-context';
const SITE_THEME_CHANGED_MESSAGE = 'bulletchat:site-theme-changed';
const TEXTAREA_MIN_HEIGHT = 56;

interface SiteContextResponse {
  theme?: ThemeMode | null;
}

const listEl = document.getElementById('list') as HTMLDivElement;
const listWrapEl = document.getElementById('listWrap') as HTMLDivElement;
const emptyStateEl = document.getElementById('emptyState') as HTMLDivElement;
const addBtn = document.getElementById('addBtn') as HTMLButtonElement;
const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
const hintEl = document.getElementById('hint') as HTMLParagraphElement;

let items: SuggestionItem[] = [];
let activeTabId: number | null = null;

function applyPopupTheme(theme: ThemeMode | null | undefined): void {
  if (!theme) return;
  document.documentElement.setAttribute('data-popup-theme', theme);
}

function showHint(text: string): void {
  hintEl.textContent = text;
  if (text) {
    window.setTimeout(() => {
      hintEl.textContent = '';
    }, 2000);
  }
}

function updateListEdgeFade(): void {
  const maxScrollTop = Math.max(0, listEl.scrollHeight - listEl.clientHeight);
  const scrollTop = listEl.scrollTop;
  const hasOverflow = maxScrollTop > 1;
  const fadeThreshold = 6;

  listWrapEl.classList.toggle('has-top-fade', hasOverflow && scrollTop > fadeThreshold);
  listWrapEl.classList.toggle('has-bottom-fade', hasOverflow && scrollTop < maxScrollTop - fadeThreshold);
}

function updateEmptyState(): void {
  const isEmpty = items.length === 0;
  emptyStateEl.hidden = !isEmpty;
  listEl.hidden = isEmpty;
  listWrapEl.classList.toggle('is-empty', isEmpty);
}

function resizePromptTextarea(el: HTMLTextAreaElement): void {
  el.style.height = '0px';
  const nextHeight = Math.max(el.scrollHeight, TEXTAREA_MIN_HEIGHT);
  el.style.height = `${nextHeight}px`;
  el.style.overflowY = 'hidden';
}

function wirePromptTextarea(el: HTMLTextAreaElement): void {
  resizePromptTextarea(el);
  el.addEventListener('input', () => {
    resizePromptTextarea(el);
    requestAnimationFrame(updateListEdgeFade);
  });
}

function collectFromDom(): SuggestionItem[] {
  const rows = listEl.querySelectorAll('[data-item-id]');
  const result: SuggestionItem[] = [];

  rows.forEach((row) => {
    const id = row.getAttribute('data-item-id');
    if (!id) return;

    const labelInp = row.querySelector<HTMLInputElement>('.label-inp');
    const promptInp = row.querySelector<HTMLTextAreaElement>('.prompt-inp');
    if (!labelInp || !promptInp) return;

    result.push({
      id,
      label: labelInp.value.trim() || '未命名',
      prompt: promptInp.value.trim(),
    });
  });

  return result;
}

function syncDraftItemsFromDom(): void {
  if (!listEl.children.length) return;
  items = collectFromDom();
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function createItemElement(item: SuggestionItem): HTMLDivElement {
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

  const promptInp = itemEl.querySelector<HTMLTextAreaElement>('.prompt-inp');
  if (promptInp) wirePromptTextarea(promptInp);

  const delBtn = itemEl.querySelector<HTMLButtonElement>('.del-btn');
  delBtn?.addEventListener('click', () => {
    syncDraftItemsFromDom();
    items = items.filter((candidate) => candidate.id !== item.id);
    itemEl.remove();
    updateEmptyState();
    requestAnimationFrame(updateListEdgeFade);
  });

  return itemEl;
}

function render(): void {
  listEl.innerHTML = '';

  const fragment = document.createDocumentFragment();
  items.forEach((item) => {
    fragment.appendChild(createItemElement(item));
  });

  listEl.appendChild(fragment);
  updateEmptyState();
  requestAnimationFrame(updateListEdgeFade);
}

function addItem(): void {
  syncDraftItemsFromDom();

  const newItem: SuggestionItem = {
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
    itemEl.querySelector<HTMLTextAreaElement>('.prompt-inp')?.focus();
  });
}

async function save(): Promise<void> {
  items = collectFromDom();
  await setSuggestions(items);
  showHint('已保存');
}

function queryActiveTab(): Promise<chrome.tabs.Tab | undefined> {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs[0]);
    });
  });
}

function sendMessageToTab<T>(tabId: number, message: unknown): Promise<T | undefined> {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        resolve(undefined);
        return;
      }

      resolve(response as T | undefined);
    });
  });
}

async function syncPopupThemeFromActiveTab(): Promise<void> {
  const tab = await queryActiveTab();
  activeTabId = tab?.id ?? null;

  if (!activeTabId) return;

  const response = await sendMessageToTab<SiteContextResponse>(activeTabId, {
    type: GET_SITE_CONTEXT_MESSAGE,
  });

  applyPopupTheme(response?.theme ?? null);
}

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message?.type !== SITE_THEME_CHANGED_MESSAGE) return;
  if (activeTabId !== null && sender.tab?.id !== activeTabId) return;
  applyPopupTheme(message.theme as ThemeMode | null | undefined);
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
