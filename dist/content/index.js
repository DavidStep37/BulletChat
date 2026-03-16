"use strict";
(() => {
  // dist/storage/index.js
  var STORAGE_KEY = "suggestion_prompts";
  var DEFAULT_SUGGESTIONS = [
    { id: "summarize", label: "\u603B\u7ED3", prompt: "\u8BF7\u603B\u7ED3\u4EE5\u4E0B\u5185\u5BB9\uFF0C\u5E76\u8F93\u51FA 3 \u4E2A\u5173\u952E\u7ED3\u8BBA\uFF1A" },
    { id: "rewrite", label: "\u6539\u5199", prompt: "\u8BF7\u5728\u4E0D\u6539\u53D8\u539F\u610F\u7684\u524D\u63D0\u4E0B\uFF0C\u91CD\u5199\u4EE5\u4E0B\u5185\u5BB9\uFF0C\u4F7F\u5176\u66F4\u6E05\u6670\u4E13\u4E1A\uFF1A" },
    { id: "outline", label: "\u63D0\u70BC\u8981\u70B9", prompt: "\u8BF7\u63D0\u70BC\u4EE5\u4E0B\u5185\u5BB9\u7684\u6838\u5FC3\u8981\u70B9\uFF0C\u5E76\u6309\u6761\u5217\u5F62\u5F0F\u8F93\u51FA\uFF1A" },
    { id: "table", label: "\u8F93\u51FA\u8868\u683C", prompt: "\u8BF7\u5C06\u4EE5\u4E0B\u4FE1\u606F\u6574\u7406\u6210\u8868\u683C\uFF0C\u5217\u51FA\u5173\u952E\u5B57\u6BB5\uFF1A" },
    { id: "critique", label: "\u6279\u5224\u6027\u5206\u6790", prompt: "\u8BF7\u4ECE\u4E0D\u540C\u89D2\u5EA6\u6279\u5224\u6027\u5206\u6790\u4EE5\u4E0B\u89C2\u70B9\uFF0C\u5305\u62EC\u4F18\u70B9\u3001\u5C40\u9650\u4E0E\u98CE\u9669\uFF1A" },
    { id: "followup", label: "\u7EE7\u7EED\u8FFD\u95EE", prompt: "\u8BF7\u57FA\u4E8E\u5F53\u524D\u4E0A\u4E0B\u6587\uFF0C\u63D0\u51FA 5 \u4E2A\u503C\u5F97\u7EE7\u7EED\u6DF1\u5165\u8FFD\u95EE\u7684\u95EE\u9898\uFF1A" }
  ];
  async function getSuggestions() {
    var _a;
    const raw = await chrome.storage.local.get(STORAGE_KEY);
    const data = raw[STORAGE_KEY];
    if ((_a = data == null ? void 0 : data.items) == null ? void 0 : _a.length)
      return data.items;
    return DEFAULT_SUGGESTIONS;
  }

  // dist/adapters/utils.js
  function insertIntoTextarea(el, text, append) {
    var _a;
    const start = append ? el.value.length : 0;
    const end = append ? el.value.length : 0;
    const newValue = append ? el.value ? el.value + "\n\n" + text : text : text;
    el.focus();
    el.setSelectionRange(start, end);
    const nativeInputValueSetter = (_a = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")) == null ? void 0 : _a.set;
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(el, newValue);
    } else {
      el.value = newValue;
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.setSelectionRange(newValue.length, newValue.length);
  }
  function getContentEditableInsertText(text, append, currentText) {
    return append && currentText.trim() ? `

${text}` : text;
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
    } else {
      const lastTextNode = findTextNode(el, true);
      const lastNode = lastTextNode ?? el.lastChild;
      if ((lastNode == null ? void 0 : lastNode.nodeType) === Node.TEXT_NODE) {
        const textNode = lastNode;
        range.setStart(textNode, textNode.data.length);
        range.setEnd(textNode, textNode.data.length);
      } else if (lastNode) {
        range.setStartBefore(lastNode);
        range.setEndBefore(lastNode);
      } else {
        range.selectNodeContents(el);
        range.collapse(false);
      }
    }
    selection.removeAllRanges();
    selection.addRange(range);
    return selection;
  }
  function insertIntoContentEditable(el, text, append) {
    el.focus();
    const currentText = el.innerText ?? "";
    const toInsert = getContentEditableInsertText(text, append, currentText);
    const selection = setContentEditableSelection(el, append);
    if (!selection)
      return;
    let inserted = false;
    try {
      inserted = document.execCommand("insertText", false, toInsert);
    } catch {
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
    el.dispatchEvent(new InputEvent("input", {
      bubbles: true,
      inputType: "insertText",
      data: toInsert
    }));
  }
  function dispatchPasteIntoContentEditable(el, text, append) {
    el.focus();
    const beforeText = el.innerText ?? "";
    const currentText = beforeText;
    const toInsert = getContentEditableInsertText(text, append, currentText);
    const selection = setContentEditableSelection(el, append);
    if (!selection)
      return false;
    const clipboardData = typeof DataTransfer !== "undefined" ? new DataTransfer() : null;
    clipboardData == null ? void 0 : clipboardData.setData("text/plain", toInsert);
    const pasteEvent = new Event("paste", {
      bubbles: true,
      cancelable: true
    });
    Object.defineProperty(pasteEvent, "clipboardData", {
      configurable: true,
      enumerable: true,
      value: clipboardData ?? {
        getData(type) {
          return type === "text/plain" ? toInsert : "";
        },
        types: ["text/plain"]
      }
    });
    const dispatchResult = el.dispatchEvent(pasteEvent);
    const afterText = el.innerText ?? "";
    return dispatchResult === false || pasteEvent.defaultPrevented || afterText !== beforeText;
  }
  function dispatchBeforeInputInsertText(el, text, append) {
    el.focus();
    const currentText = el.innerText ?? "";
    const toInsert = getContentEditableInsertText(text, append, currentText);
    const selection = setContentEditableSelection(el, append);
    if (!selection)
      return false;
    const beforeInputEvent = new InputEvent("beforeinput", {
      bubbles: true,
      cancelable: true,
      inputType: "insertFromPaste",
      data: toInsert
    });
    const dispatchResult = el.dispatchEvent(beforeInputEvent);
    return dispatchResult === false || beforeInputEvent.defaultPrevented;
  }

  // dist/adapters/chatgpt.js
  var chatgptAdapter = {
    id: "chatgpt",
    isActive() {
      const host = window.location.hostname;
      return host.includes("chat.openai.com") || host.includes("chatgpt.com");
    },
    getInputElement() {
      const byId = document.querySelector("#prompt-textarea");
      if (byId)
        return byId;
      const byAria = document.querySelector('textarea[aria-label*="Message"], textarea[aria-label*="\u6D88\u606F"], textarea[aria-label]');
      if (byAria)
        return byAria;
      const byPlaceholder = document.querySelector("textarea[placeholder]");
      if (byPlaceholder)
        return byPlaceholder;
      const form = document.querySelector("form");
      const textareas = form ? Array.from(form.querySelectorAll("textarea")) : [];
      for (const ta of textareas) {
        if (ta.offsetParent !== null && !ta.disabled)
          return ta;
      }
      const editable = document.querySelector('[contenteditable="true"][data-placeholder], [contenteditable="true"][data-id="root"]');
      if (editable)
        return editable;
      return null;
    },
    getMountTarget(inputEl) {
      let container = inputEl.parentElement;
      if (!container)
        container = inputEl.closest("form");
      if (!container)
        container = inputEl.closest('[role="region"]');
      if (!container)
        return null;
      return { container, append: true };
    },
    insertText(inputEl, text) {
      const isTextarea = inputEl instanceof HTMLTextAreaElement;
      const currentText = isTextarea ? inputEl.value : inputEl.innerText ?? "";
      const append = currentText.trim().length > 0;
      if (isTextarea) {
        insertIntoTextarea(inputEl, text, append);
      } else {
        insertIntoContentEditable(inputEl, text, append);
      }
    },
    getThemeMode() {
      var _a;
      const root = document.documentElement;
      if (root.classList.contains("dark"))
        return "dark";
      if (root.classList.contains("light"))
        return "light";
      const themeAttr = root.getAttribute("data-theme") ?? ((_a = document.body) == null ? void 0 : _a.getAttribute("data-theme"));
      if (themeAttr === "dark" || themeAttr === "light")
        return themeAttr;
      return null;
    }
  };

  // dist/adapters/common.js
  var INPUT_SELECTORS = [
    "textarea[placeholder]",
    "textarea[aria-label]",
    "textarea",
    '[contenteditable="true"][data-placeholder]',
    '[contenteditable="true"][aria-label]',
    '[contenteditable="true"][placeholder]',
    '[role="textbox"][contenteditable="true"]',
    '[contenteditable="true"]'
  ].join(", ");
  var INPUT_HINTS = [
    "ask",
    "chat",
    "message",
    "prompt",
    "input",
    "send",
    "\u95EE",
    "\u8F93\u5165",
    "\u8C46\u5305",
    "\u5343\u95EE",
    "\u901A\u4E49",
    "kimi",
    "qwen"
  ];
  function isVisible(el) {
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden")
      return false;
    if (style.opacity === "0")
      return false;
    return el.offsetParent !== null || el.getClientRects().length > 0;
  }
  function getElementTextHint(el) {
    return [
      el.getAttribute("placeholder"),
      el.getAttribute("aria-label"),
      el.getAttribute("data-placeholder"),
      el.getAttribute("title"),
      el.className
    ].filter(Boolean).join(" ").toLowerCase();
  }
  function scoreInput(el) {
    let score = 0;
    const hint = getElementTextHint(el);
    if (el instanceof HTMLTextAreaElement)
      score += 8;
    if (el.getAttribute("contenteditable") === "true")
      score += 6;
    if (el.getAttribute("role") === "textbox")
      score += 4;
    if (!el.hasAttribute("readonly") && !el.disabled)
      score += 2;
    if (el.closest("form"))
      score += 3;
    if (el.closest('[role="main"]'))
      score += 3;
    if (el.closest('[class*="chat"], [class*="input"], [class*="editor"], [class*="composer"]')) {
      score += 3;
    }
    if (INPUT_HINTS.some((keyword) => hint.includes(keyword))) {
      score += 10;
    }
    score += Math.min(Math.round(el.getBoundingClientRect().width / 120), 6);
    return score;
  }
  function findGenericChatInput(root = document) {
    const candidates = Array.from(root.querySelectorAll(INPUT_SELECTORS)).filter(isVisible);
    if (candidates.length === 0)
      return null;
    candidates.sort((a, b) => scoreInput(b) - scoreInput(a));
    const best = candidates[0];
    return best instanceof HTMLTextAreaElement ? best : best;
  }
  function findGenericMountTarget(inputEl) {
    const selectors = [
      '[class*="chat-input"]',
      '[class*="composer"]',
      '[class*="input-area"]',
      '[class*="input"]',
      '[class*="editor"]',
      "form",
      '[role="group"]',
      '[role="region"]'
    ];
    for (const selector of selectors) {
      const container = inputEl.closest(selector);
      if (container)
        return { container, append: true };
    }
    if (inputEl.parentElement) {
      return { container: inputEl.parentElement, append: true };
    }
    return null;
  }
  function readGenericThemeMode() {
    const candidates = [document.documentElement, document.body];
    for (const el of candidates) {
      if (!el)
        continue;
      if (el.classList.contains("dark"))
        return "dark";
      if (el.classList.contains("light"))
        return "light";
      const attrs = [
        el.getAttribute("data-theme"),
        el.getAttribute("data-color-mode"),
        el.getAttribute("data-mode")
      ];
      for (const value of attrs) {
        if (value === "dark" || value === "light")
          return value;
      }
    }
    return null;
  }

  // dist/adapters/doubao.js
  var doubaoAdapter = {
    id: "doubao",
    isActive() {
      return window.location.hostname === "doubao.com" || window.location.hostname.endsWith(".doubao.com");
    },
    getInputElement() {
      const byTestId = document.querySelector('textarea[data-testid="chat_input_input"]');
      if (byTestId && (byTestId.offsetParent !== null || byTestId.getClientRects().length > 0)) {
        return byTestId;
      }
      const main = document.querySelector('[role="main"]') ?? document;
      return findGenericChatInput(main) ?? findGenericChatInput(document);
    },
    getMountTarget(inputEl) {
      const textareaWrapper = inputEl.closest(".semi-input-textarea-wrapper");
      if (textareaWrapper && inputEl instanceof HTMLElement) {
        return {
          container: textareaWrapper,
          append: false,
          insertBefore: inputEl
        };
      }
      return findGenericMountTarget(inputEl);
    },
    insertText(inputEl, text) {
      const isTextarea = inputEl instanceof HTMLTextAreaElement;
      const currentText = isTextarea ? inputEl.value : inputEl.innerText ?? "";
      const append = currentText.trim().length > 0;
      if (isTextarea) {
        insertIntoTextarea(inputEl, text, append);
      } else {
        insertIntoContentEditable(inputEl, text, append);
      }
    },
    getThemeMode() {
      return readGenericThemeMode();
    }
  };

  // dist/adapters/gemini.js
  var geminiAdapter = {
    id: "gemini",
    isActive() {
      return window.location.hostname.includes("gemini.google.com");
    },
    getInputElement() {
      const byAria = document.querySelector('[aria-label="Enter a prompt for Gemini"], .ql-editor.textarea.new-input-ui[contenteditable="true"]');
      if (byAria)
        return byAria;
      const main = document.querySelector('[role="main"]') ?? document;
      const textareas = Array.from(main.querySelectorAll("textarea"));
      const visible = textareas.filter((ta) => !ta.disabled && ta.offsetParent !== null);
      if (visible.length > 0)
        return visible[visible.length - 1];
      if (textareas.length > 0)
        return textareas[textareas.length - 1];
      const byPlaceholder = document.querySelector('[data-placeholder="Ask Gemini 3"]');
      if (byPlaceholder)
        return byPlaceholder;
      const editable = document.querySelector('[contenteditable="true"]');
      if (editable == null ? void 0 : editable.closest(".text-input-field"))
        return editable;
      return null;
    },
    getMountTarget(inputEl) {
      const textInputField = inputEl.closest(".text-input-field");
      if (textInputField) {
        const footer = textInputField.querySelector(".trailing-actions-wrapper");
        if (footer) {
          return { container: textInputField, append: false, insertBefore: footer };
        }
        return { container: textInputField, append: true };
      }
      const main = document.querySelector('[role="main"]');
      if (main)
        return { container: main, append: true };
      let container = inputEl.closest("form");
      if (!container)
        container = inputEl.closest('[role="region"]');
      if (!container)
        container = inputEl.parentElement;
      if (!container)
        container = document.body;
      return { container, append: true };
    },
    insertText(inputEl, text) {
      const isTextarea = inputEl instanceof HTMLTextAreaElement;
      const currentText = isTextarea ? inputEl.value : inputEl.innerText ?? "";
      const append = currentText.trim().length > 0;
      if (isTextarea) {
        insertIntoTextarea(inputEl, text, append);
      } else {
        insertIntoContentEditable(inputEl, text, append);
      }
    },
    getThemeMode() {
      var _a, _b;
      const values = [
        document.documentElement.getAttribute("data-theme"),
        document.documentElement.getAttribute("data-color-mode"),
        ((_a = document.body) == null ? void 0 : _a.getAttribute("data-theme")) ?? null,
        ((_b = document.body) == null ? void 0 : _b.getAttribute("data-color-mode")) ?? null
      ];
      for (const value of values) {
        if (value === "dark" || value === "light")
          return value;
      }
      return null;
    }
  };

  // dist/adapters/kimi.js
  function insertIntoKimiEditor(el, text, append) {
    const selection = window.getSelection();
    if (!selection)
      return false;
    const currentText = el.innerText ?? "";
    const toInsert = append && currentText.trim() ? `

${text}` : text;
    const paragraphs = Array.from(el.querySelectorAll("p"));
    const target = append ? paragraphs[paragraphs.length - 1] ?? el : paragraphs[0] ?? el;
    const range = document.createRange();
    range.selectNodeContents(target);
    range.collapse(!append);
    selection.removeAllRanges();
    selection.addRange(range);
    el.focus();
    try {
      return document.execCommand("insertText", false, toInsert);
    } catch {
      return false;
    }
  }
  var kimiAdapter = {
    id: "kimi",
    isActive() {
      return window.location.hostname === "kimi.com" || window.location.hostname.endsWith(".kimi.com");
    },
    getInputElement() {
      const byEditor = document.querySelector('.chat-input-editor[contenteditable="true"]');
      if (byEditor && (byEditor.offsetParent !== null || byEditor.getClientRects().length > 0)) {
        return byEditor;
      }
      const byPlaceholder = document.querySelector('textarea[placeholder*="Ask Anything"], [contenteditable="true"][aria-label*="Ask Anything"]');
      if (byPlaceholder && (byPlaceholder.offsetParent !== null || byPlaceholder.getClientRects().length > 0)) {
        return byPlaceholder;
      }
      const main = document.querySelector('[role="main"]') ?? document;
      return findGenericChatInput(main) ?? findGenericChatInput(document);
    },
    getMountTarget(inputEl) {
      const chatEditor = inputEl.closest(".chat-editor");
      if (chatEditor) {
        const actions = chatEditor.querySelector(".chat-editor-action");
        if (actions) {
          return {
            container: chatEditor,
            append: false,
            insertBefore: actions
          };
        }
        return { container: chatEditor, append: true };
      }
      return findGenericMountTarget(inputEl);
    },
    insertText(inputEl, text) {
      const isTextarea = inputEl instanceof HTMLTextAreaElement;
      const currentText = isTextarea ? inputEl.value : inputEl.innerText ?? "";
      const append = currentText.trim().length > 0;
      if (isTextarea) {
        insertIntoTextarea(inputEl, text, append);
      } else if (inputEl instanceof HTMLElement && inputEl.matches('.chat-input-editor[contenteditable="true"]')) {
        if (!insertIntoKimiEditor(inputEl, text, append)) {
          insertIntoContentEditable(inputEl, text, append);
        }
      } else {
        insertIntoContentEditable(inputEl, text, append);
      }
    },
    getThemeMode() {
      return readGenericThemeMode();
    }
  };

  // dist/adapters/qianwen.js
  function isVisible2(el) {
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden")
      return false;
    return el.offsetParent !== null || el.getClientRects().length > 0;
  }
  function getQianwenPlainText(el) {
    const raw = el.innerText ?? "";
    return raw.replace(/\u200b/g, "").trim();
  }
  function findSlateTextNode(root, fromEnd) {
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
  function getSlateTextTarget(el, append) {
    const markers = Array.from(el.querySelectorAll("[data-slate-string], [data-slate-zero-width]"));
    const targetMarker = append ? markers[markers.length - 1] ?? null : markers[0] ?? null;
    if (!targetMarker)
      return null;
    const textNode = findSlateTextNode(targetMarker, append);
    if (textNode) {
      const textValue = textNode.textContent ?? "";
      const offset = append && !targetMarker.hasAttribute("data-slate-zero-width") ? textValue.length : 0;
      return { node: textNode, offset };
    }
    return { node: targetMarker, offset: 0 };
  }
  function setQianwenSelection(el, append) {
    const selection = window.getSelection();
    if (!selection)
      return false;
    const range = document.createRange();
    const target = getSlateTextTarget(el, append);
    if (target) {
      if (target.node.nodeType === Node.TEXT_NODE) {
        range.setStart(target.node, target.offset);
        range.setEnd(target.node, target.offset);
      } else {
        range.selectNodeContents(target.node);
        range.collapse(!append);
      }
    } else {
      range.selectNodeContents(el);
      range.collapse(!append);
    }
    selection.removeAllRanges();
    selection.addRange(range);
    return true;
  }
  function insertIntoQianwenEditor(el, text, append) {
    const hasExistingText = getQianwenPlainText(el).length > 0;
    const shouldAppend = append && hasExistingText;
    if (!setQianwenSelection(el, shouldAppend)) {
      return false;
    }
    el.focus();
    if (dispatchPasteIntoContentEditable(el, text, shouldAppend)) {
      return true;
    }
    if (dispatchBeforeInputInsertText(el, text, shouldAppend)) {
      return true;
    }
    return false;
  }
  var qianwenAdapter = {
    id: "qianwen",
    isActive() {
      const host = window.location.hostname;
      return host === "qianwen.com" || host.endsWith(".qianwen.com") || host === "tongyi.com" || host.endsWith(".tongyi.com");
    },
    getInputElement() {
      const slateEditor = Array.from(document.querySelectorAll('[data-slate-editor="true"][contenteditable="true"], [data-slate-editor="true"] [contenteditable="true"]')).find(isVisible2);
      if (slateEditor)
        return slateEditor;
      const textbox = Array.from(document.querySelectorAll('[role="textbox"][contenteditable="true"], [contenteditable="true"][aria-label], textarea')).find(isVisible2);
      if (textbox)
        return textbox;
      const main = document.querySelector('[role="main"]') ?? document;
      return findGenericChatInput(main) ?? findGenericChatInput(document);
    },
    getMountTarget(inputEl) {
      const slateEditor = (inputEl.matches('[data-slate-editor="true"]') ? inputEl : null) ?? inputEl.closest('[data-slate-editor="true"]');
      if (slateEditor) {
        const outerWrapper = slateEditor.closest('form, [class*="composer"], [class*="chat"], [class*="input"], [class*="editor"]');
        if (outerWrapper == null ? void 0 : outerWrapper.parentElement) {
          return {
            container: outerWrapper.parentElement,
            append: false,
            insertBefore: outerWrapper
          };
        }
        const editorWrapper = slateEditor.parentElement;
        if (editorWrapper == null ? void 0 : editorWrapper.parentElement) {
          return {
            container: editorWrapper.parentElement,
            append: false,
            insertBefore: editorWrapper
          };
        }
      }
      const directParent = inputEl.parentElement;
      if (directParent == null ? void 0 : directParent.parentElement) {
        return {
          container: directParent.parentElement,
          append: false,
          insertBefore: directParent
        };
      }
      return findGenericMountTarget(inputEl);
    },
    insertText(inputEl, text) {
      const isTextarea = inputEl instanceof HTMLTextAreaElement;
      const currentText = isTextarea ? inputEl.value : getQianwenPlainText(inputEl);
      const append = currentText.length > 0;
      if (isTextarea) {
        insertIntoTextarea(inputEl, text, append);
      } else {
        insertIntoQianwenEditor(inputEl, text, append);
      }
    },
    getThemeMode() {
      return readGenericThemeMode();
    }
  };

  // dist/adapters/index.js
  var adapters = [
    chatgptAdapter,
    geminiAdapter,
    doubaoAdapter,
    qianwenAdapter,
    kimiAdapter
  ];
  function getActiveAdapter() {
    return adapters.find((a) => a.isActive()) ?? null;
  }

  // dist/ui/theme.js
  var DARK_SELECTOR = [
    "html.dark",
    "body.dark",
    '[data-theme="dark"]',
    '[data-color-mode="dark"]',
    '[data-mode="dark"]',
    '[color-scheme="dark"]'
  ].join(", ");
  var LIGHT_SELECTOR = [
    "html.light",
    "body.light",
    '[data-theme="light"]',
    '[data-color-mode="light"]',
    '[data-mode="light"]',
    '[color-scheme="light"]'
  ].join(", ");
  function parseCssColor(value) {
    const normalized = value.trim().toLowerCase();
    if (!normalized || normalized === "transparent")
      return null;
    const rgbMatch = normalized.match(/^rgba?\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})(?:[\s,\/]+([0-9.]+))?\s*\)$/);
    if (rgbMatch) {
      return {
        r: Number(rgbMatch[1]),
        g: Number(rgbMatch[2]),
        b: Number(rgbMatch[3]),
        a: rgbMatch[4] === void 0 ? 1 : Number(rgbMatch[4])
      };
    }
    const hexMatch = normalized.match(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
    if (!hexMatch)
      return null;
    const hex = hexMatch[1];
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
        a: 1
      };
    }
    if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: 1
      };
    }
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
      a: parseInt(hex.slice(6, 8), 16) / 255
    };
  }
  function normalizeChannel(channel) {
    const unit = channel / 255;
    return unit <= 0.03928 ? unit / 12.92 : Math.pow((unit + 0.055) / 1.055, 2.4);
  }
  function getRelativeLuminance(color) {
    const r = normalizeChannel(color.r);
    const g = normalizeChannel(color.g);
    const b = normalizeChannel(color.b);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  function inferThemeFromSurface(color) {
    return getRelativeLuminance(color) < 0.45 ? "dark" : "light";
  }
  function inferThemeFromText(color) {
    return getRelativeLuminance(color) < 0.4 ? "light" : "dark";
  }
  function getColorSchemeFromElement(el) {
    if (!(el instanceof HTMLElement))
      return null;
    const scheme = window.getComputedStyle(el).colorScheme.trim().toLowerCase();
    if (scheme.includes("dark"))
      return "dark";
    if (scheme.includes("light"))
      return "light";
    return null;
  }
  function findThemeFromDocumentHints() {
    if (document.querySelector(DARK_SELECTOR))
      return "dark";
    if (document.querySelector(LIGHT_SELECTOR))
      return "light";
    const roots = [document.documentElement, document.body];
    for (const el of roots) {
      const scheme = getColorSchemeFromElement(el);
      if (scheme)
        return scheme;
    }
    return null;
  }
  function findThemeFromComputedStyles(startEl) {
    let el = startEl;
    while (el) {
      const styles = window.getComputedStyle(el);
      const scheme = getColorSchemeFromElement(el);
      if (scheme)
        return scheme;
      const background = parseCssColor(styles.backgroundColor);
      if (background && background.a > 0.35) {
        return inferThemeFromSurface(background);
      }
      const text = parseCssColor(styles.color);
      if (text && text.a > 0.35) {
        return inferThemeFromText(text);
      }
      el = el.parentElement;
    }
    return null;
  }
  function detectSiteTheme(adapter, inputEl, mountContainer) {
    var _a;
    const adapterTheme = (_a = adapter.getThemeMode) == null ? void 0 : _a.call(adapter, inputEl ?? void 0);
    if (adapterTheme)
      return adapterTheme;
    const hintedTheme = findThemeFromDocumentHints();
    if (hintedTheme)
      return hintedTheme;
    const candidates = [
      mountContainer ?? null,
      inputEl instanceof HTMLElement ? inputEl : null,
      document.activeElement instanceof HTMLElement ? document.activeElement : null,
      document.body,
      document.documentElement
    ];
    for (const candidate of candidates) {
      const theme = findThemeFromComputedStyles(candidate);
      if (theme)
        return theme;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  // dist/ui/renderer.js
  var BAR_DATA_ATTR = "data-csp-suggestion-bar";
  function findExistingBar(container) {
    return container.querySelector(`[${BAR_DATA_ATTR}]`);
  }
  function applyBarTheme(root, inputEl, container) {
    const adapter = getActiveAdapter();
    if (!adapter)
      return;
    root.setAttribute("data-csp-site", adapter.id);
    root.setAttribute("data-csp-theme", detectSiteTheme(adapter, inputEl, container));
  }
  function mountSuggestionBar(container, append, items, insertBefore) {
    const adapter = getActiveAdapter();
    if (!adapter)
      return;
    const inputEl = adapter.getInputElement();
    if (!inputEl)
      return;
    const existingBar = findExistingBar(container);
    if (existingBar) {
      applyBarTheme(existingBar, inputEl, container);
      return;
    }
    const root = document.createElement("div");
    root.setAttribute(BAR_DATA_ATTR, "true");
    root.className = "csp-root";
    applyBarTheme(root, inputEl, container);
    for (const item of items) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "csp-btn";
      btn.textContent = item.label;
      btn.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
      btn.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const promptText = item.prompt;
        requestAnimationFrame(() => {
          const currentInput = adapter.getInputElement();
          if (currentInput) {
            adapter.insertText(currentInput, promptText);
          }
        });
      });
      root.appendChild(btn);
    }
    if ((insertBefore == null ? void 0 : insertBefore.parentNode) === container) {
      container.insertBefore(root, insertBefore);
    } else if (append) {
      container.appendChild(root);
    } else {
      container.insertBefore(root, container.firstChild);
    }
  }
  function tryMount(items) {
    const adapter = getActiveAdapter();
    if (!adapter)
      return;
    const inputEl = adapter.getInputElement();
    if (!inputEl)
      return;
    const mount = adapter.getMountTarget(inputEl);
    if (!mount)
      return;
    mountSuggestionBar(mount.container, mount.append, items, mount.insertBefore);
  }

  // dist/content/index.js
  var STORAGE_KEY2 = "suggestion_prompts";
  var BAR_ATTR = "data-csp-suggestion-bar";
  var GET_SITE_CONTEXT_MESSAGE = "bulletchat:get-site-context";
  var SITE_THEME_CHANGED_MESSAGE = "bulletchat:site-theme-changed";
  var mountScheduled = false;
  var lastSiteContextKey = "";
  function getSiteContext() {
    const adapter = getActiveAdapter();
    if (!adapter) {
      return { site: null, theme: null };
    }
    const inputEl = adapter.getInputElement();
    const mount = inputEl ? adapter.getMountTarget(inputEl) : null;
    return {
      site: adapter.id,
      theme: detectSiteTheme(adapter, inputEl ?? void 0, (mount == null ? void 0 : mount.container) ?? null)
    };
  }
  function broadcastSiteContext(force = false) {
    const context = getSiteContext();
    const contextKey = `${context.site ?? "none"}:${context.theme ?? "none"}`;
    if (!force && contextKey === lastSiteContextKey)
      return;
    lastSiteContextKey = contextKey;
    void chrome.runtime.sendMessage({
      type: SITE_THEME_CHANGED_MESSAGE,
      site: context.site,
      theme: context.theme
    });
  }
  function scheduleMount() {
    if (mountScheduled)
      return;
    mountScheduled = true;
    window.setTimeout(async () => {
      mountScheduled = false;
      const items = await getSuggestions();
      tryMount(items);
      broadcastSiteContext();
    }, 150);
  }
  function scheduleMountDelayed(ms) {
    window.setTimeout(async () => {
      const items = await getSuggestions();
      tryMount(items);
      broadcastSiteContext();
    }, ms);
  }
  function removedContainsBar(nodes) {
    var _a, _b;
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.nodeType !== Node.ELEMENT_NODE)
        continue;
      const el = node;
      if (((_a = el.hasAttribute) == null ? void 0 : _a.call(el, BAR_ATTR)) || ((_b = el.querySelector) == null ? void 0 : _b.call(el, `[${BAR_ATTR}]`))) {
        return true;
      }
    }
    return false;
  }
  function run() {
    var _a;
    scheduleMount();
    broadcastSiteContext(true);
    if (((_a = getActiveAdapter()) == null ? void 0 : _a.id) === "gemini") {
      startGeminiRetryLoop();
    }
  }
  var GEMINI_RETRY_INTERVAL_MS = 800;
  var GEMINI_RETRY_COUNT = 10;
  function startGeminiRetryLoop() {
    let count = 0;
    const timerId = window.setInterval(async () => {
      count++;
      if (count > GEMINI_RETRY_COUNT) {
        window.clearInterval(timerId);
        return;
      }
      if (document.querySelector(`[${BAR_ATTR}]`))
        return;
      const items = await getSuggestions();
      tryMount(items);
      broadcastSiteContext();
    }, GEMINI_RETRY_INTERVAL_MS);
  }
  run();
  var observer = new MutationObserver((mutations) => {
    var _a;
    let barWasRemoved = false;
    for (const mutation of mutations) {
      if (mutation.removedNodes.length && removedContainsBar(mutation.removedNodes)) {
        barWasRemoved = true;
        break;
      }
    }
    if (barWasRemoved && ((_a = getActiveAdapter()) == null ? void 0 : _a.id) === "gemini") {
      scheduleMountDelayed(400);
      scheduleMountDelayed(900);
    }
    scheduleMount();
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  }
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes[STORAGE_KEY2]) {
      const bar = document.querySelector("[data-csp-suggestion-bar]");
      if (bar)
        bar.remove();
      scheduleMount();
    }
  });
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if ((message == null ? void 0 : message.type) === GET_SITE_CONTEXT_MESSAGE) {
      sendResponse(getSiteContext());
    }
  });
})();
