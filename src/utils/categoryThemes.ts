export interface CategoryTheme {
  topBorderClass: string;
  headerBgClass: string;
  titleTextClass: string;
  iconBgClass: string;
  iconTextClass: string;
  selectedRowClass: string;
  checkboxAccentClass: string;
  hexPrimary: string;
  hexBg: string;
  hexBorder: string;
}

const THEME_MAP: Record<string, CategoryTheme> = {
  'cat-fruits-vegetables': {
    topBorderClass: 'border-t-emerald-500',
    headerBgClass: 'bg-emerald-50/75',
    titleTextClass: 'text-emerald-950',
    iconBgClass: 'bg-emerald-100',
    iconTextClass: 'text-emerald-700',
    selectedRowClass: 'bg-emerald-50/70',
    checkboxAccentClass: 'accent-emerald-600',
    hexPrimary: '#059669',
    hexBg: '#ecfdf5',
    hexBorder: '#a7f3d0',
  },
  'cat-bread-cereal-rice': {
    topBorderClass: 'border-t-amber-500',
    headerBgClass: 'bg-amber-50/75',
    titleTextClass: 'text-amber-950',
    iconBgClass: 'bg-amber-100',
    iconTextClass: 'text-amber-700',
    selectedRowClass: 'bg-amber-50/70',
    checkboxAccentClass: 'accent-amber-600',
    hexPrimary: '#d97706',
    hexBg: '#fffbeb',
    hexBorder: '#fde68a',
  },
  'cat-dairy': {
    topBorderClass: 'border-t-sky-500',
    headerBgClass: 'bg-sky-50/75',
    titleTextClass: 'text-sky-950',
    iconBgClass: 'bg-sky-100',
    iconTextClass: 'text-sky-700',
    selectedRowClass: 'bg-sky-50/70',
    checkboxAccentClass: 'accent-sky-600',
    hexPrimary: '#0284c7',
    hexBg: '#f0f9ff',
    hexBorder: '#bae6fd',
  },
  'cat-drinks': {
    topBorderClass: 'border-t-teal-500',
    headerBgClass: 'bg-teal-50/75',
    titleTextClass: 'text-teal-950',
    iconBgClass: 'bg-teal-100',
    iconTextClass: 'text-teal-700',
    selectedRowClass: 'bg-teal-50/70',
    checkboxAccentClass: 'accent-teal-600',
    hexPrimary: '#0d9488',
    hexBg: '#f0fdfa',
    hexBorder: '#99f6e4',
  },
  'cat-household': {
    topBorderClass: 'border-t-indigo-500',
    headerBgClass: 'bg-indigo-50/75',
    titleTextClass: 'text-indigo-950',
    iconBgClass: 'bg-indigo-100',
    iconTextClass: 'text-indigo-700',
    selectedRowClass: 'bg-indigo-50/70',
    checkboxAccentClass: 'accent-indigo-600',
    hexPrimary: '#4f46e5',
    hexBg: '#eef2ff',
    hexBorder: '#c7d2fe',
  },
  'cat-cooking-ingredients': {
    topBorderClass: 'border-t-orange-500',
    headerBgClass: 'bg-orange-50/75',
    titleTextClass: 'text-orange-950',
    iconBgClass: 'bg-orange-100',
    iconTextClass: 'text-orange-700',
    selectedRowClass: 'bg-orange-50/70',
    checkboxAccentClass: 'accent-orange-600',
    hexPrimary: '#ea580c',
    hexBg: '#fff7ed',
    hexBorder: '#fed7aa',
  },
  'cat-meat': {
    topBorderClass: 'border-t-rose-500',
    headerBgClass: 'bg-rose-50/75',
    titleTextClass: 'text-rose-950',
    iconBgClass: 'bg-rose-100',
    iconTextClass: 'text-rose-700',
    selectedRowClass: 'bg-rose-50/70',
    checkboxAccentClass: 'accent-rose-600',
    hexPrimary: '#e11d48',
    hexBg: '#fff1f2',
    hexBorder: '#fecdd3',
  },
  'cat-snacks': {
    topBorderClass: 'border-t-violet-500',
    headerBgClass: 'bg-violet-50/75',
    titleTextClass: 'text-violet-950',
    iconBgClass: 'bg-violet-100',
    iconTextClass: 'text-violet-700',
    selectedRowClass: 'bg-violet-50/70',
    checkboxAccentClass: 'accent-violet-600',
    hexPrimary: '#7c3aed',
    hexBg: '#f5f3ff',
    hexBorder: '#ddd6fe',
  },
  'cat-dannis-personal': {
    topBorderClass: 'border-t-pink-500',
    headerBgClass: 'bg-pink-50/75',
    titleTextClass: 'text-pink-950',
    iconBgClass: 'bg-pink-100',
    iconTextClass: 'text-pink-700',
    selectedRowClass: 'bg-pink-50/70',
    checkboxAccentClass: 'accent-pink-600',
    hexPrimary: '#db2777',
    hexBg: '#fdf2f8',
    hexBorder: '#fbcfe8',
  },
  'cat-chinese-supermarket': {
    topBorderClass: 'border-t-red-500',
    headerBgClass: 'bg-red-50/75',
    titleTextClass: 'text-red-950',
    iconBgClass: 'bg-red-100',
    iconTextClass: 'text-red-700',
    selectedRowClass: 'bg-red-50/70',
    checkboxAccentClass: 'accent-red-600',
    hexPrimary: '#dc2626',
    hexBg: '#fef2f2',
    hexBorder: '#fecaca',
  },
  'cat-two-dollar-shopping': {
    topBorderClass: 'border-t-yellow-500',
    headerBgClass: 'bg-yellow-50/80',
    titleTextClass: 'text-yellow-950',
    iconBgClass: 'bg-yellow-100',
    iconTextClass: 'text-yellow-800',
    selectedRowClass: 'bg-yellow-50/70',
    checkboxAccentClass: 'accent-yellow-600',
    hexPrimary: '#ca8a04',
    hexBg: '#fefce8',
    hexBorder: '#fef08a',
  },
  'cat-frozen': {
    topBorderClass: 'border-t-cyan-500',
    headerBgClass: 'bg-cyan-50/75',
    titleTextClass: 'text-cyan-950',
    iconBgClass: 'bg-cyan-100',
    iconTextClass: 'text-cyan-700',
    selectedRowClass: 'bg-cyan-50/70',
    checkboxAccentClass: 'accent-cyan-600',
    hexPrimary: '#0891b2',
    hexBg: '#ecfeff',
    hexBorder: '#a5f3fc',
  },
};

const FALLBACK_THEMES = Object.values(THEME_MAP);

export function getCategoryTheme(categoryId: string, index = 0): CategoryTheme {
  if (THEME_MAP[categoryId]) {
    return THEME_MAP[categoryId];
  }
  let hash = index;
  for (let i = 0; i < categoryId.length; i++) {
    hash = (hash * 31 + categoryId.charCodeAt(i)) >>> 0;
  }
  return FALLBACK_THEMES[hash % FALLBACK_THEMES.length];
}
