import React from 'react';
import {
  Radio,
  Flashlight,
  Sun,
  Moon,
  Monitor,
  Globe,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import { CipherType } from '../utils/crypto';
import { Language, Translations } from '../utils/i18n';
import { ThemeMode } from '../utils/theme';

interface HeaderProps {
  activeTab: 'translator' | 'decoder' | 'keyer' | 'reference';
  setActiveTab: (tab: 'translator' | 'decoder' | 'keyer' | 'reference') => void;
  cipherType: CipherType;
  torchActive: boolean;
  language: Language;
  setLanguage: (lang: Language) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  t: Translations;
}

/**
 * Main application header with tab navigation, language dropdown selector, and theme switcher
 */
export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  cipherType,
  torchActive,
  language,
  setLanguage,
  themeMode,
  setThemeMode,
  t,
}) => {
  // Cycle theme: system -> dark -> light -> system
  const handleCycleTheme = () => {
    if (themeMode === 'system') setThemeMode('dark');
    else if (themeMode === 'dark') setThemeMode('light');
    else setThemeMode('system');
  };

  return (
    <header className="border-b dark:border-zinc-800 border-zinc-200 dark:bg-zinc-950 bg-white px-4 py-3 sticky top-0 z-30 transition-colors">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Title and Branding */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center text-zinc-950 shadow-sm shrink-0">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight dark:text-zinc-100 text-zinc-900 flex items-center gap-2">
                Morsign
              </h1>
              <p className="text-xs dark:text-zinc-400 text-zinc-600 line-clamp-1">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Quick theme button on mobile */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={handleCycleTheme}
              title={`Thème: ${themeMode}`}
              className="p-1.5 rounded-md dark:bg-zinc-900 bg-zinc-100 border dark:border-zinc-800 border-zinc-300 dark:text-zinc-300 text-zinc-700"
            >
              {themeMode === 'system' && <Monitor className="w-4 h-4" />}
              {themeMode === 'dark' && <Moon className="w-4 h-4 text-amber-400" />}
              {themeMode === 'light' && <Sun className="w-4 h-4 text-amber-500" />}
            </button>
          </div>
        </div>

        {/* Global Active Indicators & Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap justify-center w-full md:w-auto">
          {cipherType !== 'none' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium dark:bg-emerald-950/80 bg-emerald-50 dark:text-emerald-400 text-emerald-700 border dark:border-emerald-800 border-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              {cipherType === 'aes-256' ? 'AES-256' : cipherType.toUpperCase()}
            </span>
          )}

          {torchActive && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-amber-500 text-zinc-950 border border-amber-400">
              <Flashlight className="w-3 h-3" />
              {t.torchActiveBadge}
            </span>
          )}

          {/* Language Dropdown Selector */}
          <div className="relative flex items-center">
            <Globe className="w-3.5 h-3.5 absolute left-2.5 pointer-events-none text-zinc-500 dark:text-zinc-400" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="appearance-none pl-8 pr-7 py-1.5 rounded-lg text-xs font-medium dark:bg-zinc-900 bg-zinc-100 border dark:border-zinc-800 border-zinc-300 dark:text-zinc-200 text-zinc-800 focus:outline-none focus:border-amber-500 cursor-pointer shadow-sm transition-colors"
            >
              <option value="fr">Français (FR)</option>
              <option value="en">English (EN)</option>
              <option value="es">Español (ES)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2 pointer-events-none text-zinc-400" />
          </div>

          {/* Desktop Theme Switcher (System / Dark / Light) */}
          <div className="hidden md:flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs">
            <button
              onClick={() => setThemeMode('system')}
              title={t.themeSystem}
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                themeMode === 'system'
                  ? 'bg-amber-500 text-zinc-950 font-bold'
                  : 'dark:text-zinc-400 text-zinc-600 hover:dark:text-zinc-200 hover:text-zinc-900'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="text-[11px]">{t.themeSystem}</span>
            </button>
            <button
              onClick={() => setThemeMode('dark')}
              title={t.themeDark}
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                themeMode === 'dark'
                  ? 'bg-amber-500 text-zinc-950 font-bold'
                  : 'dark:text-zinc-400 text-zinc-600 hover:dark:text-zinc-200 hover:text-zinc-900'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span className="text-[11px]">{t.themeDark}</span>
            </button>
            <button
              onClick={() => setThemeMode('light')}
              title={t.themeLight}
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                themeMode === 'light'
                  ? 'bg-amber-500 text-zinc-950 font-bold'
                  : 'dark:text-zinc-400 text-zinc-600 hover:dark:text-zinc-200 hover:text-zinc-900'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span className="text-[11px]">{t.themeLight}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 w-full md:w-auto justify-center overflow-x-auto">
          <button
            onClick={() => setActiveTab('translator')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'translator'
                ? 'bg-amber-500 text-zinc-950 font-bold'
                : 'dark:text-zinc-400 text-zinc-600 hover:dark:text-zinc-200 hover:text-zinc-900'
            }`}
          >
            {t.tabTranslator}
          </button>
          <button
            onClick={() => setActiveTab('decoder')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'decoder'
                ? 'bg-amber-500 text-zinc-950 font-bold'
                : 'dark:text-zinc-400 text-zinc-600 hover:dark:text-zinc-200 hover:text-zinc-900'
            }`}
          >
            {t.tabDecoder}
          </button>
          <button
            onClick={() => setActiveTab('keyer')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'keyer'
                ? 'bg-amber-500 text-zinc-950 font-bold'
                : 'dark:text-zinc-400 text-zinc-600 hover:dark:text-zinc-200 hover:text-zinc-900'
            }`}
          >
            {t.tabKeyer}
          </button>
          <button
            onClick={() => setActiveTab('reference')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'reference'
                ? 'bg-amber-500 text-zinc-950 font-bold'
                : 'dark:text-zinc-400 text-zinc-600 hover:dark:text-zinc-200 hover:text-zinc-900'
            }`}
          >
            {t.tabReference}
          </button>
        </nav>
      </div>
    </header>
  );
};
