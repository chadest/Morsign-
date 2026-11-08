import React, { useState } from 'react';
import { Search, Volume2, BookOpen } from 'lucide-react';
import { MORSE_CODE_MAP } from '../utils/morse';
import { MorseAudioController } from '../utils/audioPlayer';

interface MorseTableProps {
  audioController: MorseAudioController;
  wpm: number;
  frequency: number;
}

/**
 * International Morse Code Table & Interactive Reference Chart
 */
export const MorseTable: React.FC<MorseTableProps> = ({
  audioController,
  wpm,
  frequency,
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
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          {title} ({filtered.length})
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {filtered.map(([char, morse]) => {
            const isPlaying = playingChar === char;
            return (
              <button
                key={char}
                onClick={() => handlePlayChar(char, morse)}
                className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-colors ${
                  isPlaying
                    ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold'
                    : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-200 border-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-base font-bold font-mono">{char}</span>
                  <Volume2
                    className={`w-3.5 h-3.5 ${
                      isPlaying ? 'text-zinc-950' : 'text-zinc-500'
                    }`}
                  />
                </div>
                <div
                  className={`text-xs font-mono tracking-widest mt-1.5 ${
                    isPlaying ? 'text-zinc-950' : 'text-amber-400'
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
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-6">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-500" />
            Table Officielle du Code Morse International (ITU-R)
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Cliquez sur n'importe quel caractère pour écouter son signal sonore à {wpm} WPM.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher (lettre ou morse)..."
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-mono"
          />
        </div>
      </div>

      {/* Grid Sections */}
      <div className="space-y-6">
        {renderGrid('Lettres de l\'Alphabet (A — Z)', letters)}
        {renderGrid('Chiffres (0 — 9)', numbers)}
        {renderGrid('Ponctuation & Symboles Radio', symbols)}
        {renderGrid('Caractères Accentués (Norme ITU)', accents)}
      </div>
    </div>
  );
};
