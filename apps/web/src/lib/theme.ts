import { THEMES, type Theme } from "@glowbook/shared";

const KEY = "glowbook-theme";

export { THEMES };
export type { Theme };

export function getStoredTheme(): Theme {
  try {
    const t = localStorage.getItem(KEY) as Theme | null;
    if (t && THEMES.includes(t)) return t;
  } catch {
    /* noop */
  }
  return "rose";
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* noop */
  }
}
