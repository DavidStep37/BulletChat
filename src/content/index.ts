import { getSuggestions } from '../storage/index.js';
import { getActiveAdapter } from '../adapters/index.js';
import { tryMount } from '../ui/renderer.js';
import { detectSiteTheme } from '../ui/theme.js';
import type { SiteId, ThemeMode } from '../types/index.js';

const STORAGE_KEY = 'suggestion_prompts';
const BAR_ATTR = 'data-csp-suggestion-bar';
const GET_SITE_CONTEXT_MESSAGE = 'bulletchat:get-site-context';
const SITE_THEME_CHANGED_MESSAGE = 'bulletchat:site-theme-changed';

interface SiteContext {
  site: SiteId | null;
  theme: ThemeMode | null;
}

let mountScheduled = false;
let lastSiteContextKey = '';

function getSiteContext(): SiteContext {
  const adapter = getActiveAdapter();
  if (!adapter) {
    return { site: null, theme: null };
  }

  const inputEl = adapter.getInputElement();
  const mount = inputEl ? adapter.getMountTarget(inputEl) : null;

  return {
    site: adapter.id,
    theme: detectSiteTheme(adapter, inputEl ?? undefined, mount?.container ?? null),
  };
}

function broadcastSiteContext(force = false): void {
  const context = getSiteContext();
  const contextKey = `${context.site ?? 'none'}:${context.theme ?? 'none'}`;

  if (!force && contextKey === lastSiteContextKey) return;
  lastSiteContextKey = contextKey;

  void chrome.runtime.sendMessage({
    type: SITE_THEME_CHANGED_MESSAGE,
    site: context.site,
    theme: context.theme,
  });
}

function scheduleMount(): void {
  if (mountScheduled) return;
  mountScheduled = true;

  window.setTimeout(async () => {
    mountScheduled = false;
    const items = await getSuggestions();
    tryMount(items);
    broadcastSiteContext();
  }, 150);
}

function scheduleMountDelayed(ms: number): void {
  window.setTimeout(async () => {
    const items = await getSuggestions();
    tryMount(items);
    broadcastSiteContext();
  }, ms);
}

function removedContainsBar(nodes: NodeList): boolean {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.nodeType !== Node.ELEMENT_NODE) continue;

    const el = node as Element;
    if (el.hasAttribute?.(BAR_ATTR) || el.querySelector?.(`[${BAR_ATTR}]`)) {
      return true;
    }
  }

  return false;
}

function run(): void {
  scheduleMount();
  broadcastSiteContext(true);

  if (getActiveAdapter()?.id === 'gemini') {
    startGeminiRetryLoop();
  }
}

const GEMINI_RETRY_INTERVAL_MS = 800;
const GEMINI_RETRY_COUNT = 10;

function startGeminiRetryLoop(): void {
  let count = 0;

  const timerId = window.setInterval(async () => {
    count++;
    if (count > GEMINI_RETRY_COUNT) {
      window.clearInterval(timerId);
      return;
    }

    if (document.querySelector(`[${BAR_ATTR}]`)) return;

    const items = await getSuggestions();
    tryMount(items);
    broadcastSiteContext();
  }, GEMINI_RETRY_INTERVAL_MS);
}

run();

const observer = new MutationObserver((mutations) => {
  let barWasRemoved = false;

  for (const mutation of mutations) {
    if (mutation.removedNodes.length && removedContainsBar(mutation.removedNodes)) {
      barWasRemoved = true;
      break;
    }
  }

  if (barWasRemoved && getActiveAdapter()?.id === 'gemini') {
    scheduleMountDelayed(400);
    scheduleMountDelayed(900);
  }

  scheduleMount();
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', run);
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes[STORAGE_KEY]) {
    const bar = document.querySelector<HTMLElement>('[data-csp-suggestion-bar]');
    if (bar) bar.remove();
    scheduleMount();
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === GET_SITE_CONTEXT_MESSAGE) {
    sendResponse(getSiteContext());
  }
});
