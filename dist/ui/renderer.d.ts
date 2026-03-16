import type { SuggestionItem } from '../types/index.js';
export declare function findExistingBar(container: HTMLElement): HTMLElement | null;
export declare function mountSuggestionBar(container: HTMLElement, append: boolean, items: SuggestionItem[], insertBefore?: HTMLElement): void;
export declare function tryMount(items: SuggestionItem[]): void;
