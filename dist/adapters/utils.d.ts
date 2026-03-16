export declare function insertIntoTextarea(el: HTMLTextAreaElement, text: string, append: boolean): void;
export declare function insertIntoContentEditable(el: HTMLElement, text: string, append: boolean): void;
export declare function dispatchPasteIntoContentEditable(el: HTMLElement, text: string, append: boolean): boolean;
export declare function dispatchBeforeInputInsertText(el: HTMLElement, text: string, append: boolean): boolean;
