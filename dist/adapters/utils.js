export function insertIntoTextarea(el, text, append) {
    const start = append ? el.value.length : 0;
    const end = append ? el.value.length : 0;
    const newValue = append
        ? (el.value ? el.value + '\n\n' + text : text)
        : text;
    el.focus();
    el.setSelectionRange(start, end);
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
    if (nativeInputValueSetter) {
        nativeInputValueSetter.call(el, newValue);
    }
    else {
        el.value = newValue;
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.setSelectionRange(newValue.length, newValue.length);
}
function getContentEditableInsertText(text, append, currentText) {
    return append && currentText.trim() ? `\n\n${text}` : text;
}
function findTextNode(root, fromEnd) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let found = null;
    while (walker.nextNode()) {
        found = walker.currentNode;
        if (!fromEnd) {
            return found;
        }
    }
    return found;
}
function setContentEditableSelection(el, append) {
    const selection = window.getSelection();
    if (!selection)
        return null;
    const range = document.createRange();
    if (!append) {
        range.selectNodeContents(el);
    }
    else {
        const lastTextNode = findTextNode(el, true);
        const lastNode = lastTextNode ?? el.lastChild;
        if (lastNode?.nodeType === Node.TEXT_NODE) {
            const textNode = lastNode;
            range.setStart(textNode, textNode.data.length);
            range.setEnd(textNode, textNode.data.length);
        }
        else if (lastNode) {
            range.setStartBefore(lastNode);
            range.setEndBefore(lastNode);
        }
        else {
            range.selectNodeContents(el);
            range.collapse(false);
        }
    }
    selection.removeAllRanges();
    selection.addRange(range);
    return selection;
}
export function insertIntoContentEditable(el, text, append) {
    el.focus();
    const currentText = el.innerText ?? '';
    const toInsert = getContentEditableInsertText(text, append, currentText);
    const selection = setContentEditableSelection(el, append);
    if (!selection)
        return;
    let inserted = false;
    try {
        inserted = document.execCommand('insertText', false, toInsert);
    }
    catch {
        inserted = false;
    }
    if (inserted) {
        return;
    }
    const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : document.createRange();
    range.deleteContents();
    const textNode = document.createTextNode(toInsert);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    el.dispatchEvent(new InputEvent('input', {
        bubbles: true,
        inputType: 'insertText',
        data: toInsert,
    }));
}
export function dispatchPasteIntoContentEditable(el, text, append) {
    el.focus();
    const beforeText = el.innerText ?? '';
    const currentText = beforeText;
    const toInsert = getContentEditableInsertText(text, append, currentText);
    const selection = setContentEditableSelection(el, append);
    if (!selection)
        return false;
    const clipboardData = typeof DataTransfer !== 'undefined' ? new DataTransfer() : null;
    clipboardData?.setData('text/plain', toInsert);
    const pasteEvent = new Event('paste', {
        bubbles: true,
        cancelable: true,
    });
    Object.defineProperty(pasteEvent, 'clipboardData', {
        configurable: true,
        enumerable: true,
        value: clipboardData ?? {
            getData(type) {
                return type === 'text/plain' ? toInsert : '';
            },
            types: ['text/plain'],
        },
    });
    const dispatchResult = el.dispatchEvent(pasteEvent);
    const afterText = el.innerText ?? '';
    return dispatchResult === false || pasteEvent.defaultPrevented || afterText !== beforeText;
}
export function dispatchBeforeInputInsertText(el, text, append) {
    el.focus();
    const currentText = el.innerText ?? '';
    const toInsert = getContentEditableInsertText(text, append, currentText);
    const selection = setContentEditableSelection(el, append);
    if (!selection)
        return false;
    const beforeInputEvent = new InputEvent('beforeinput', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertFromPaste',
        data: toInsert,
    });
    const dispatchResult = el.dispatchEvent(beforeInputEvent);
    return dispatchResult === false || beforeInputEvent.defaultPrevented;
}
