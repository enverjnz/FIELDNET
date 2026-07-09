export type ThemeMode = 'light' | 'dark';

export type ThemeColors = {
  mode: ThemeMode;
  background: string;
  surface: string;
  card: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  accent: string;
  navInactive: string;
  burgerBg: string;
  drawerItemBorder: string;
  signOutBg: string;
  chipBg: string;
  chipSelectedBg: string;
  chipText: string;
  chipTextSelected: string;
  statusBarStyle: 'light-content' | 'dark-content';
};

export const lightColors: ThemeColors = {
  mode: 'light',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  card: '#F0F4FF',
  border: '#D1D8F0',
  text: '#1A2F6E',
  textMuted: '#6B7280',
  primary: '#1A2F6E',
  accent: '#C01830',
  navInactive: '#A0AFCF',
  burgerBg: '#F0F4FF',
  drawerItemBorder: '#F0F4FF',
  signOutBg: '#FFF0F2',
  chipBg: '#F0F4FF',
  chipSelectedBg: '#1A2F6E',
  chipText: '#1A2F6E',
  chipTextSelected: '#FFFFFF',
  statusBarStyle: 'dark-content',
};

export const darkColors: ThemeColors = {
  mode: 'dark',
  background: '#0B1220',
  surface: '#111827',
  card: '#1A2336',
  border: '#2A3654',
  text: '#E8EDF8',
  textMuted: '#94A3B8',
  primary: '#E8EDF8',
  accent: '#E0455A',
  navInactive: '#64748B',
  burgerBg: '#1A2336',
  drawerItemBorder: '#1A2336',
  signOutBg: '#2A1520',
  chipBg: '#1A2336',
  chipSelectedBg: '#E0455A',
  chipText: '#E8EDF8',
  chipTextSelected: '#FFFFFF',
  statusBarStyle: 'light-content',
};

export function getThemeColors(mode: ThemeMode): ThemeColors {
  return mode === 'dark' ? darkColors : lightColors;
}
