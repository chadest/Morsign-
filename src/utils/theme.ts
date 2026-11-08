/**
 * Theme Management Utility
 * Supports 'system' (browser default auto-detection), 'dark', and 'light'.
 */

export type ThemeMode = 'system' | 'dark' | 'light';

export function getSystemTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(mode: ThemeMode): 'dark' | 'light' {
  const resolved = mode === 'system' ? getSystemTheme() : mode;
  const root = document.documentElement;

  if (resolved === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  return resolved;
}
