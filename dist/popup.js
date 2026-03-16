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
  async function setSuggestions(items2) {
    await chrome.storage.local.set({
      [STORAGE_KEY]: { items: items2, version: 1 }
    });
  }

  // dist/popup/index.js
  var GET_SITE_CONTEXT_MESSAGE = "bulletchat:get-site-context";
  var SITE_THEME_CHANGED_MESSAGE = "bulletchat:site-theme-changed";
  var TEXTAREA_MIN_HEIGHT = 56;
  var listEl = document.getElementById("list");
  var listWrapEl = document.getElementById("listWrap");
  var emptyStateEl = document.getElementById("emptyState");
  var addBtn = document.getElementById("addBtn");
  var saveBtn = document.getElementById("saveBtn");
  var hintEl = document.getElementById("hint");
  var items = [];
  var activeTabId = null;
  function applyPopupTheme(theme) {
    if (!theme)
      return;
    document.documentElement.setAttribute("data-popup-theme", theme);
  }
  function showHint(text) {
    hintEl.textContent = text;
    if (text) {
      window.setTimeout(() => {
        hintEl.textContent = "";
      }, 2e3);
    }
  }
  function updateListEdgeFade() {
    const maxScrollTop = Math.max(0, listEl.scrollHeight - listEl.clientHeight);
    const scrollTop = listEl.scrollTop;
    const hasOverflow = maxScrollTop > 1;
    const fadeThreshold = 6;
    listWrapEl.classList.toggle("has-top-fade", hasOverflow && scrollTop > fadeThreshold);
    listWrapEl.classList.toggle("has-bottom-fade", hasOverflow && scrollTop < maxScrollTop - fadeThreshold);
  }
  function updateEmptyState() {
    const isEmpty = items.length === 0;
    emptyStateEl.hidden = !isEmpty;
    listEl.hidden = isEmpty;
    listWrapEl.classList.toggle("is-empty", isEmpty);
  }
  function resizePromptTextarea(el) {
    el.style.height = "0px";
    const nextHeight = Math.max(el.scrollHeight, TEXTAREA_MIN_HEIGHT);
    el.style.height = `${nextHeight}px`;
    el.style.overflowY = "hidden";
  }
  function wirePromptTextarea(el) {
    resizePromptTextarea(el);
    el.addEventListener("input", () => {
      resizePromptTextarea(el);
      requestAnimationFrame(updateListEdgeFade);
    });
  }
  function collectFromDom() {
    const rows = listEl.querySelectorAll("[data-item-id]");
    const result = [];
    rows.forEach((row) => {
      const id = row.getAttribute("data-item-id");
      if (!id)
        return;
      const labelInp = row.querySelector(".label-inp");
      const promptInp = row.querySelector(".prompt-inp");
      if (!labelInp || !promptInp)
        return;
      result.push({
        id,
        label: labelInp.value.trim() || "\u672A\u547D\u540D",
        prompt: promptInp.value.trim()
      });
    });
    return result;
  }
  function syncDraftItemsFromDom() {
    if (!listEl.children.length)
      return;
    items = collectFromDom();
  }
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
  function createItemElement(item) {
    const itemEl = document.createElement("div");
    itemEl.className = "popup-item";
    itemEl.setAttribute("data-item-id", item.id);
    itemEl.innerHTML = `
    <div class="popup-item-row">
      <input type="text" class="label-inp" placeholder="\u6309\u94AE\u540D" value="${escapeHtml(item.label)}" maxlength="8">
      <textarea class="prompt-inp" placeholder="\u70B9\u51FB\u540E\u63D2\u5165\u7684\u6587\u6848">${escapeHtml(item.prompt)}</textarea>
      <button type="button" class="del-btn" aria-label="\u5220\u9664">\xD7</button>
    </div>
  `;
    const promptInp = itemEl.querySelector(".prompt-inp");
    if (promptInp)
      wirePromptTextarea(promptInp);
    const delBtn = itemEl.querySelector(".del-btn");
    delBtn == null ? void 0 : delBtn.addEventListener("click", () => {
      syncDraftItemsFromDom();
      items = items.filter((candidate) => candidate.id !== item.id);
      itemEl.remove();
      updateEmptyState();
      requestAnimationFrame(updateListEdgeFade);
    });
    return itemEl;
  }
  function render() {
    listEl.innerHTML = "";
    const fragment = document.createDocumentFragment();
    items.forEach((item) => {
      fragment.appendChild(createItemElement(item));
    });
    listEl.appendChild(fragment);
    updateEmptyState();
    requestAnimationFrame(updateListEdgeFade);
  }
  function addItem() {
    syncDraftItemsFromDom();
    const newItem = {
      id: crypto.randomUUID(),
      label: "",
      prompt: ""
    };
    items.push(newItem);
    const itemEl = createItemElement(newItem);
    listEl.appendChild(itemEl);
    updateEmptyState();
    requestAnimationFrame(() => {
      var _a;
      updateListEdgeFade();
      (_a = itemEl.querySelector(".prompt-inp")) == null ? void 0 : _a.focus();
    });
  }
  async function save() {
    items = collectFromDom();
    await setSuggestions(items);
    showHint("\u5DF2\u4FDD\u5B58");
  }
  function queryActiveTab() {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        resolve(tabs[0]);
      });
    });
  }
  function sendMessageToTab(tabId, message) {
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          resolve(void 0);
          return;
        }
        resolve(response);
      });
    });
  }
  async function syncPopupThemeFromActiveTab() {
    const tab = await queryActiveTab();
    activeTabId = (tab == null ? void 0 : tab.id) ?? null;
    if (!activeTabId)
      return;
    const response = await sendMessageToTab(activeTabId, {
      type: GET_SITE_CONTEXT_MESSAGE
    });
    applyPopupTheme((response == null ? void 0 : response.theme) ?? null);
  }
  chrome.runtime.onMessage.addListener((message, sender) => {
    var _a;
    if ((message == null ? void 0 : message.type) !== SITE_THEME_CHANGED_MESSAGE)
      return;
    if (activeTabId !== null && ((_a = sender.tab) == null ? void 0 : _a.id) !== activeTabId)
      return;
    applyPopupTheme(message.theme);
  });
  addBtn.addEventListener("click", addItem);
  saveBtn.addEventListener("click", () => void save());
  listEl.addEventListener("scroll", updateListEdgeFade);
  window.addEventListener("resize", updateListEdgeFade);
  void syncPopupThemeFromActiveTab();
  void getSuggestions().then((loaded) => {
    items = loaded;
    render();
  });
})();
