import type { MountTarget, ThemeMode } from './types.js';
export declare function findGenericChatInput(root?: ParentNode): HTMLTextAreaElement | HTMLElement | null;
export declare function findGenericMountTarget(inputEl: HTMLTextAreaElement | HTMLElement): MountTarget | null;
export declare function readGenericThemeMode(): ThemeMode | null;
