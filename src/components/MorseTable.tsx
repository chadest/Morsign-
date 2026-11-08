import React, { useState } from 'react';
import { Search, Volume2, BookOpen } from 'lucide-react';
import { MORSE_CODE_MAP } from '../utils/morse';
import { MorseAudioController } from '../utils/audioPlayer';
import { Translations } from '../utils/i18n';

interface MorseTableProps {
  audioController: MorseAudioController;
  wpm: number;
  frequency: number;
  t: Translations;
}

/**
 * International Morse Code Table & Interactive Reference Chart
 */
export const MorseTable: React.FC<MorseTableProps> = ({
  audioController,
  wpm,
  frequency,
  t,
}) => {
  const [search, setSearch] = useState('');
  const [playingChar, setPlayingChar] = useState<string | null>(null);

  // Categorize symbols
  const letters = Object.entries(MORSE_CODE_MAP).filter(([char]) => /^[A-Z]$/.test(char));
  const numbers = Object.entries(MORSE_CODE_MAP).filter(([char]) => /^[0-9]$/.test(char));
  const accents = Object.entries(MORSE_CODE_MAP).filter(([char]) => /^[ÉÀÈÇÑÖÜÄ]$/.test(char));
  const symbols = Object.entries(MORSE_CODE_MAP).filter(
    ([char]) => !/^[A-Z0-9ÉÀÈÇÑÖÜÄ]$/.test(char)
  );

  // Play a single character sound
  const handlePlayChar = (char: string, morse: string) => {
    setPlayingChar(char);
    audioController.play(morse, wpm, frequency, {
      onComplete: () => setPlayingChar(null),
      onError: () => setPlayingChar(null),
    });
  };

  const filterEntries = (entries: [string, string][]) => {
    if (!search.trim()) return entries;
    const q = search.trim().toUpperCase();
    return entries.filter(
      ([char, morse]) => char.includes(q) || morse.includes(search.trim())
    );
  };

  const renderGrid = (title: string, entries: [string, string][]) => {
    const filtered = filterEntries(entries);
    if (filtered.length === 0) return null;

    return (
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider dark:text-zinc-400 text-zinc-600">
          {title} ({filtered.length})
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {filtered.map(([char, morse]) => {
            const isPlaying = playingChar === char;
            return (
              <button
                key={char}
                onClick={() => handlePlayChar(char, morse)}
                className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-colors shadow-sm ${
                  isPlaying
                    ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold'
                    : 'dark:bg-zinc-950 bg-white hover:dark:bg-zinc-850 hover:bg-zinc-50 dark:text-zinc-200 text-zinc-800 dark:border-zinc-800 border-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-base font-bold font-mono">{char}</span>
                  <Volume2
                    className={`w-3.5 h-3.5 ${
                      isPlaying ? 'text-zinc-950' : 'dark:text-zinc-500 text-zinc-400'
                    }`}
                  />
                </div>
                <div
                  className={`text-xs font-mono tracking-widest mt-1.5 ${
                    isPlaying ? 'text-zinc-950' : 'text-amber-600 dark:text-amber-400 font-semibold'
                  }`}
                >
                  {morse}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="dark:bg-zinc-900 bg-white border dark:border-zinc-800 border-zinc-200 rounded-xl p-5 space-y-6 shadow-sm transition-colors">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b dark:border-zinc-800 border-zinc-200">
        <div>
          <h2 className="text-base font-bold dark:text-zinc-100 text-zinc-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-500" />
            {t.tableTitle}
          </h2>
          <p className="text-xs dark:text-zinc-400 text-zinc-600 mt-0.5">
            {t.tableSubtitle}
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none dark:text-zinc-500 text-zinc-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full dark:bg-zinc-950 bg-zinc-50 border dark:border-zinc-700 border-zinc-300 rounded-lg pl-9 pr-3 py-1.5 text-xs dark:text-zinc-100 text-zinc-900 dark:placeholder-zinc-500 placeholder-zinc-400 focus:outline-none focus:border-amber-500 font-mono"
          />
        </div>
      </div>

      {/* Grid Sections */}
      <div className="space-y-6">
        {renderGrid(t.catLetters, letters)}
        {renderGrid(t.catNumbers, numbers)}
        {renderGrid(t.catSymbols, symbols)}
        {renderGrid(t.catAccents, accents)}
      </div>
    </div>
  );
};
