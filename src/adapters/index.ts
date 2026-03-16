import type { SiteAdapter } from './types.js';
import { chatgptAdapter } from './chatgpt.js';
import { doubaoAdapter } from './doubao.js';
import { geminiAdapter } from './gemini.js';
import { kimiAdapter } from './kimi.js';
import { qianwenAdapter } from './qianwen.js';

const adapters: SiteAdapter[] = [
  chatgptAdapter,
  geminiAdapter,
  doubaoAdapter,
  qianwenAdapter,
  kimiAdapter,
];

export function getActiveAdapter(): SiteAdapter | null {
  return adapters.find((a) => a.isActive()) ?? null;
}

export { chatgptAdapter, geminiAdapter, doubaoAdapter, qianwenAdapter, kimiAdapter };
export type { SiteAdapter, MountTarget, SiteId } from './types.js';
