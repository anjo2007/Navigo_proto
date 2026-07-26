import React from 'react';
// FIX: The 'Theme' type is not exported from '../App'. It is defined here to fix the import error.
// import { Theme } from '../App';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';
import SystemIcon from './icons/SystemIcon';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeToggleProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, setTheme }) => {
  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };
  
  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <MoonIcon className="w-5 h-5" />;
      case 'dark':
        return <SunIcon className="w-5 h-5" />;
      case 'system':
        return <SystemIcon className="w-5 h-5" />;
      default:
        return null;
    }
  };
  
  const getLabel = () => {
    switch(theme) {
        case 'light': return 'Switch to dark mode';
        case 'dark': return 'Switch to system theme';
        case 'system': return 'Switch to light mode';
    }
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 focus:ring-purple-500 transition-colors"
      aria-label={getLabel()}
    >
      {getIcon()}
    </button>
  );
};

export default ThemeToggle;
