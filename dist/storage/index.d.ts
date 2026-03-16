import type { SuggestionItem } from '../types/index.js';
/** 内置默认模板 */
export declare const DEFAULT_SUGGESTIONS: SuggestionItem[];
export declare function getSuggestions(): Promise<SuggestionItem[]>;
export declare function setSuggestions(items: SuggestionItem[]): Promise<void>;
