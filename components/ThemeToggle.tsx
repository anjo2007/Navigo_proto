import React, { useState, useEffect } from 'react';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';
import SystemIcon from './icons/SystemIcon';

export type ThemeMode = 'dark' | 'light' | 'system';

export const getStoredTheme = (): ThemeMode => {
  try {
    const t = localStorage.getItem('navigo_theme') as ThemeMode;
    if (t === 'light' || t === 'dark' || t === 'system') return t;
  } catch (e) {
    // Ignore
  }
  return 'dark';
};

export const applyThemeMode = (mode: ThemeMode) => {
  const root = document.documentElement;
  try {
    localStorage.setItem('navigo_theme', mode);
  } catch (e) {}

  if (mode === 'light') {
    root.classList.remove('dark');
    root.classList.add('light');
  } else if (mode === 'dark') {
    root.classList.remove('light');
    root.classList.add('dark');
  } else {
    // System preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.remove('light', 'dark');
    root.classList.add(prefersDark ? 'dark' : 'light');
  }
};

const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<ThemeMode>(getStoredTheme());

  useEffect(() => {
    applyThemeMode(theme);
  }, [theme]);

  const cycleTheme = () => {
    const next: ThemeMode = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark';
    setTheme(next);
  };

  return (
    <button
      onClick={cycleTheme}
      className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-mist text-xs font-bold transition-all border border-white/10"
      title={`Theme: ${theme.toUpperCase()} (Click to toggle)`}
    >
      {theme === 'dark' && <MoonIcon className="w-3.5 h-3.5 text-azure" />}
      {theme === 'light' && <SunIcon className="w-3.5 h-3.5 text-yellow-400" />}
      {theme === 'system' && <SystemIcon className="w-3.5 h-3.5 text-neon" />}
      <span className="capitalize text-[10px]">{theme}</span>
    </button>
  );
};

export default ThemeToggle;
