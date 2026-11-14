export type AppThemeId = 'forest' | 'ocean' | 'sunset' | 'berry';

export interface AppThemeDefinition {
  id: AppThemeId;
  name: string;
  subtitle: string;
  swatchClasses: [string, string, string];
  cssVars: Record<string, string>;
}

export const THEME_STORAGE_KEY = 'smart_grocery_theme_v1';

export const APP_THEMES: AppThemeDefinition[] = [
  {
    id: 'forest',
    name: 'Forest',
    subtitle: 'Emerald & stone',
    swatchClasses: ['bg-emerald-600', 'bg-amber-500', 'bg-emerald-50'],
    cssVars: {
      '--theme-bg': '#f4f7f5',
      '--theme-surface': '#ffffff',
      '--theme-surface-muted': '#f7faf8',
      '--theme-border': '#dce5df',
      '--theme-text': '#0f172a',
      '--theme-text-muted': '#475569',
      '--theme-primary': '#059669',
      '--theme-primary-hover': '#047857',
      '--theme-primary-soft': '#ecfdf5',
      '--theme-primary-border': '#a7f3d0',
      '--theme-primary-text': '#065f46',
      '--theme-ribbon-from': '#10b981',
      '--theme-ribbon-via': '#f59e0b',
      '--theme-ribbon-to': '#0ea5e9',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    subtitle: 'Coastal blue & teal',
    swatchClasses: ['bg-sky-600', 'bg-teal-500', 'bg-sky-50'],
    cssVars: {
      '--theme-bg': '#eff6fb',
      '--theme-surface': '#ffffff',
      '--theme-surface-muted': '#f3f9fd',
      '--theme-border': '#cfe2f2',
      '--theme-text': '#0c1e33',
      '--theme-text-muted': '#465e78',
      '--theme-primary': '#0284c7',
      '--theme-primary-hover': '#0369a1',
      '--theme-primary-soft': '#e0f2fe',
      '--theme-primary-border': '#bae6fd',
      '--theme-primary-text': '#075985',
      '--theme-ribbon-from': '#0ea5e9',
      '--theme-ribbon-via': '#14b8a6',
      '--theme-ribbon-to': '#4f46e5',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    subtitle: 'Warm coral & amber',
    swatchClasses: ['bg-orange-600', 'bg-rose-500', 'bg-orange-50'],
    cssVars: {
      '--theme-bg': '#fdf5ef',
      '--theme-surface': '#ffffff',
      '--theme-surface-muted': '#fef9f5',
      '--theme-border': '#f0dcd0',
      '--theme-text': '#24140d',
      '--theme-text-muted': '#6c4f43',
      '--theme-primary': '#ea580c',
      '--theme-primary-hover': '#c2410c',
      '--theme-primary-soft': '#fff7ed',
      '--theme-primary-border': '#fed7aa',
      '--theme-primary-text': '#9a3412',
      '--theme-ribbon-from': '#f97316',
      '--theme-ribbon-via': '#f43f5e',
      '--theme-ribbon-to': '#f59e0b',
    },
  },
  {
    id: 'berry',
    name: 'Berry',
    subtitle: 'Plum & violet',
    swatchClasses: ['bg-purple-600', 'bg-pink-500', 'bg-purple-50'],
    cssVars: {
      '--theme-bg': '#f7f3fb',
      '--theme-surface': '#ffffff',
      '--theme-surface-muted': '#faf7fd',
      '--theme-border': '#e5d8f1',
      '--theme-text': '#1c102b',
      '--theme-text-muted': '#5c4b70',
      '--theme-primary': '#9333ea',
      '--theme-primary-hover': '#7e22ce',
      '--theme-primary-soft': '#faf5ff',
      '--theme-primary-border': '#e9d5ff',
      '--theme-primary-text': '#6b21a8',
      '--theme-ribbon-from': '#9333ea',
      '--theme-ribbon-via': '#ec4899',
      '--theme-ribbon-to': '#6366f1',
    },
  },
];

export function isValidAppThemeId(value: string | null): value is AppThemeId {
  return APP_THEMES.some((theme) => theme.id === value);
}

export function loadSavedAppTheme(): AppThemeId {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (isValidAppThemeId(stored)) {
      return stored;
    }
  } catch {
    // Ignore storage read errors
  }
  return 'forest';
}

export function applyAppTheme(themeId: AppThemeId): void {
  const theme = APP_THEMES.find((t) => t.id === themeId) ?? APP_THEMES[0];
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    Object.entries(theme.cssVars).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
    root.dataset.theme = theme.id;
  }
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme.id);
  } catch {
    // Ignore storage write errors
  }
}
