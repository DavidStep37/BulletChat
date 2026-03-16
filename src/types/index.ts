export interface SuggestionItem {
  id: string;
  label: string;
  prompt: string;
}

export interface StoredSuggestions {
  items: SuggestionItem[];
  version?: number;
}

export type SiteId = 'chatgpt' | 'gemini' | 'doubao' | 'qianwen' | 'kimi';

export type ThemeMode = 'light' | 'dark';

export interface MountTarget {
  container: HTMLElement;
  append: boolean;
  insertBefore?: HTMLElement;
}

export interface SiteAdapter {
  id: SiteId;
  isActive(): boolean;
  getInputElement(): HTMLTextAreaElement | HTMLElement | null;
  getMountTarget(inputEl: HTMLTextAreaElement | HTMLElement): MountTarget | null;
  insertText(inputEl: HTMLTextAreaElement | HTMLElement, text: string): void;
  getThemeMode?(inputEl?: HTMLTextAreaElement | HTMLElement): ThemeMode | null;
}
