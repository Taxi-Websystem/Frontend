export type AppTheme = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'theme';

export function readStoredTheme(): AppTheme {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function applyTheme(theme: AppTheme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function storeTheme(theme: AppTheme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}

export function initTheme() {
  applyTheme(readStoredTheme());
}

export function getChartAxisLineColor(theme: AppTheme) {
  return theme === 'light' ? 'rgba(15, 23, 42, 0.12)' : 'rgba(255, 255, 255, 0.1)';
}

export function getChartActiveDotFill(theme: AppTheme) {
  return theme === 'light' ? '#ffffff' : '#0F172A';
}
