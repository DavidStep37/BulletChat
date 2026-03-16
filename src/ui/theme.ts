import type { SiteAdapter, ThemeMode } from '../types/index.js';

const DARK_SELECTOR = [
  'html.dark',
  'body.dark',
  '[data-theme="dark"]',
  '[data-color-mode="dark"]',
  '[data-mode="dark"]',
  '[color-scheme="dark"]',
].join(', ');

const LIGHT_SELECTOR = [
  'html.light',
  'body.light',
  '[data-theme="light"]',
  '[data-color-mode="light"]',
  '[data-mode="light"]',
  '[color-scheme="light"]',
].join(', ');

interface RgbaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

function parseCssColor(value: string): RgbaColor | null {
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized === 'transparent') return null;

  const rgbMatch = normalized.match(
    /^rgba?\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})(?:[\s,\/]+([0-9.]+))?\s*\)$/
  );
  if (rgbMatch) {
    return {
      r: Number(rgbMatch[1]),
      g: Number(rgbMatch[2]),
      b: Number(rgbMatch[3]),
      a: rgbMatch[4] === undefined ? 1 : Number(rgbMatch[4]),
    };
  }

  const hexMatch = normalized.match(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (!hexMatch) return null;

  const hex = hexMatch[1];
  if (hex.length === 3) {
    return {
      r: parseInt(hex[0] + hex[0], 16),
      g: parseInt(hex[1] + hex[1], 16),
      b: parseInt(hex[2] + hex[2], 16),
      a: 1,
    };
  }

  if (hex.length === 6) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
      a: 1,
    };
  }

  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
    a: parseInt(hex.slice(6, 8), 16) / 255,
  };
}

function normalizeChannel(channel: number): number {
  const unit = channel / 255;
  return unit <= 0.03928 ? unit / 12.92 : Math.pow((unit + 0.055) / 1.055, 2.4);
}

function getRelativeLuminance(color: RgbaColor): number {
  const r = normalizeChannel(color.r);
  const g = normalizeChannel(color.g);
  const b = normalizeChannel(color.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function inferThemeFromSurface(color: RgbaColor): ThemeMode {
  return getRelativeLuminance(color) < 0.45 ? 'dark' : 'light';
}

function inferThemeFromText(color: RgbaColor): ThemeMode {
  return getRelativeLuminance(color) < 0.4 ? 'light' : 'dark';
}

function getColorSchemeFromElement(el: Element | null): ThemeMode | null {
  if (!(el instanceof HTMLElement)) return null;

  const scheme = window.getComputedStyle(el).colorScheme.trim().toLowerCase();
  if (scheme.includes('dark')) return 'dark';
  if (scheme.includes('light')) return 'light';
  return null;
}

function findThemeFromDocumentHints(): ThemeMode | null {
  if (document.querySelector(DARK_SELECTOR)) return 'dark';
  if (document.querySelector(LIGHT_SELECTOR)) return 'light';

  const roots = [document.documentElement, document.body];
  for (const el of roots) {
    const scheme = getColorSchemeFromElement(el);
    if (scheme) return scheme;
  }

  return null;
}

function findThemeFromComputedStyles(startEl: HTMLElement | null): ThemeMode | null {
  let el: HTMLElement | null = startEl;

  while (el) {
    const styles = window.getComputedStyle(el);

    const scheme = getColorSchemeFromElement(el);
    if (scheme) return scheme;

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

export function detectSiteTheme(
  adapter: SiteAdapter,
  inputEl?: HTMLTextAreaElement | HTMLElement | null,
  mountContainer?: HTMLElement | null
): ThemeMode {
  const adapterTheme = adapter.getThemeMode?.(inputEl ?? undefined);
  if (adapterTheme) return adapterTheme;

  const hintedTheme = findThemeFromDocumentHints();
  if (hintedTheme) return hintedTheme;

  const candidates = [
    mountContainer ?? null,
    inputEl instanceof HTMLElement ? inputEl : null,
    document.activeElement instanceof HTMLElement ? document.activeElement : null,
    document.body,
    document.documentElement,
  ];

  for (const candidate of candidates) {
    const theme = findThemeFromComputedStyles(candidate);
    if (theme) return theme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
