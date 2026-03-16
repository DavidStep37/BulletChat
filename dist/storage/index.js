const STORAGE_KEY = 'suggestion_prompts';
/** 内置默认模板 */
export const DEFAULT_SUGGESTIONS = [
    { id: 'summarize', label: '总结', prompt: '请总结以下内容，并输出 3 个关键结论：' },
    { id: 'rewrite', label: '改写', prompt: '请在不改变原意的前提下，重写以下内容，使其更清晰专业：' },
    { id: 'outline', label: '提炼要点', prompt: '请提炼以下内容的核心要点，并按条列形式输出：' },
    { id: 'table', label: '输出表格', prompt: '请将以下信息整理成表格，列出关键字段：' },
    { id: 'critique', label: '批判性分析', prompt: '请从不同角度批判性分析以下观点，包括优点、局限与风险：' },
    { id: 'followup', label: '继续追问', prompt: '请基于当前上下文，提出 5 个值得继续深入追问的问题：' },
];
export async function getSuggestions() {
    const raw = await chrome.storage.local.get(STORAGE_KEY);
    const data = raw[STORAGE_KEY];
    if (data?.items?.length)
        return data.items;
    return DEFAULT_SUGGESTIONS;
}
export async function setSuggestions(items) {
    await chrome.storage.local.set({
        [STORAGE_KEY]: { items, version: 1 },
    });
}
