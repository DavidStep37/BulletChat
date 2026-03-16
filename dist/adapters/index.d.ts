import type { SiteAdapter } from './types.js';
import { chatgptAdapter } from './chatgpt.js';
import { doubaoAdapter } from './doubao.js';
import { geminiAdapter } from './gemini.js';
import { kimiAdapter } from './kimi.js';
import { qianwenAdapter } from './qianwen.js';
export declare function getActiveAdapter(): SiteAdapter | null;
export { chatgptAdapter, geminiAdapter, doubaoAdapter, qianwenAdapter, kimiAdapter };
export type { SiteAdapter, MountTarget, SiteId } from './types.js';
