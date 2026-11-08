import React, { useState, useEffect } from 'react';
import { Sun, Maximize2, Minimize2, Radio } from 'lucide-react';
import { MorseSignalUnit } from '../utils/morse';

interface VisualBeaconProps {
  isSignalActive: boolean;
  currentSymbol?: '.' | '-';
  currentUnit?: MorseSignalUnit | null;
  wpm: number;
  isTransmitting: boolean;
  onStop: () => void;
}

/**
 * High-visibility optical Morse signal transmitter
 * Supports inline high-contrast beacon and full-screen optical strobe mode
 */
export const VisualBeacon: React.FC<VisualBeaconProps> = ({
  isSignalActive,
  currentSymbol,
  currentUnit,
  wpm,
  isTransmitting,
  onStop,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Close full screen on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  return (
    <>
      {/* Inline Optical Transmitter Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col items-center justify-between">
        <div className="w-full flex items-center justify-between mb-3 text-xs text-zinc-400">
          <div className="flex items-center gap-1.5 font-medium text-zinc-300">
            <Sun className="w-4 h-4 text-amber-400" />
            <span>Balise Optique / Signal Lumineux</span>
          </div>
          <button
            onClick={() => setIsFullscreen(true)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Plein écran</span>
          </button>
        </div>

        {/* The Optical Lens / Lantern */}
        <div className="py-4 flex flex-col items-center justify-center">
          <div
            className={`w-24 h-24 rounded-full border-4 transition-all duration-75 flex items-center justify-center ${
              isSignalActive
                ? 'bg-amber-400 border-amber-300 shadow-[0_0_50px_rgba(251,191,36,0.9)] scale-105'
                : 'bg-zinc-950 border-zinc-800 shadow-inner'
            }`}
          >
            {isSignalActive ? (
              <span className="text-zinc-950 font-black text-3xl font-mono select-none">
                {currentSymbol === '.' ? '•' : '—'}
              </span>
            ) : (
              <span className="text-zinc-700 text-xs font-mono font-semibold uppercase tracking-wider">
                {isTransmitting ? 'Attente' : 'Inactif'}
              </span>
            )}
          </div>

          {/* Current Element Indicator */}
          <div className="mt-3 text-center h-6">
            {isSignalActive && currentSymbol ? (
              <span className="inline-block px-3 py-0.5 rounded bg-zinc-800 text-amber-300 text-xs font-mono font-bold">
                {currentSymbol === '.' ? 'POINT (TI)' : 'TRAIT (TAAH)'}
              </span>
            ) : (
              <span className="text-xs text-zinc-600 font-mono">
                {isTransmitting ? 'Transmission en cours...' : 'Prêt à émettre'}
              </span>
            )}
          </div>
        </div>

        {/* Footer specs */}
        <div className="w-full pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
          <span>Vitesse: {wpm} WPM</span>
          <span className={isSignalActive ? 'text-amber-400 font-bold' : ''}>
            {isSignalActive ? 'SIGNAL ACTIF' : 'VEILLE'}
          </span>
        </div>
      </div>

      {/* Fullscreen High-Luminance Optical Transmitter Overlay */}
      {isFullscreen && (
        <div
          className={`fixed inset-0 z-50 flex flex-col items-center justify-between p-6 transition-colors duration-75 select-none ${
            isSignalActive ? 'bg-amber-400 text-zinc-950' : 'bg-black text-zinc-400'
          }`}
        >
          {/* Top Bar */}
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-sm font-semibold">
              <Radio className="w-5 h-5" />
              <span>TRANSMISSION OPTIQUE PLEIN ÉCRAN</span>
            </div>
            <button
              onClick={() => setIsFullscreen(false)}
              className={`p-2 rounded-lg border transition-colors ${
                isSignalActive
                  ? 'bg-zinc-950 text-amber-400 border-zinc-900'
                  : 'bg-zinc-900 text-zinc-200 border-zinc-800'
              }`}
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>

          {/* Center Symbol */}
          <div className="flex flex-col items-center justify-center">
            <span
              className={`font-mono font-black text-8xl md:text-9xl transition-transform ${
                isSignalActive ? 'scale-110' : 'opacity-20'
              }`}
            >
              {isSignalActive ? (currentSymbol === '.' ? '•' : '—') : '— —'}
            </span>
            <span
              className={`mt-4 text-xl md:text-2xl font-bold font-mono ${
                isSignalActive ? 'text-zinc-950' : 'text-zinc-600'
              }`}
            >
              {isSignalActive
                ? currentSymbol === '.'
                  ? 'POINT'
                  : 'TRAIT'
                : isTransmitting
                ? 'PAUSE'
                : 'PRÊT'}
            </span>
          </div>

          {/* Bottom Bar with controls */}
          <div className="flex items-center gap-4">
            {isTransmitting && (
              <button
                onClick={onStop}
                className="px-6 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md"
              >
                Arrêter l'émission
              </button>
            )}
            <span className="text-xs font-mono opacity-80">
              Appuyez sur Échap pour quitter
            </span>
          </div>
        </div>
      )}
    </>
  );
};
