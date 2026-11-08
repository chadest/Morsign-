import React from 'react';
import { Radio, Lock, ShieldCheck, Sun, Flashlight } from 'lucide-react';
import { CipherType } from '../utils/crypto';

interface HeaderProps {
  activeTab: 'translator' | 'decoder' | 'keyer' | 'reference';
  setActiveTab: (tab: 'translator' | 'decoder' | 'keyer' | 'reference') => void;
  cipherType: CipherType;
  audioActive: boolean;
  lightActive: boolean;
  torchActive: boolean;
}

/**
 * Main application header with tab navigation and status indicators
 */
export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  cipherType,
  audioActive,
  lightActive,
  torchActive,
}) => {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950 px-4 py-3 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Title and Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center text-zinc-950 shadow-sm">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-zinc-100 flex items-center gap-2">
              Morsign
              <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-amber-400 font-mono font-medium">
                ITU-R
              </span>
            </h1>
            <p className="text-xs text-zinc-400">
              Traducteur International • Signaux Audio & Optique • Chiffrement AES-256
            </p>
          </div>
        </div>

        {/* Global Active Indicators */}
        <div className="flex items-center gap-2">
          {cipherType !== 'none' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-emerald-950 text-emerald-400 border border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              {cipherType === 'aes-256' ? 'AES-256' : cipherType.toUpperCase()}
            </span>
          )}

          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium border ${
              audioActive
                ? 'bg-amber-950 text-amber-400 border-amber-800'
                : 'bg-zinc-900 text-zinc-500 border-zinc-800'
            }`}
          >
            Audio
          </span>

          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium border ${
              lightActive
                ? 'bg-amber-950 text-amber-400 border-amber-800'
                : 'bg-zinc-900 text-zinc-500 border-zinc-800'
            }`}
          >
            <Sun className="w-3 h-3" />
            Écran
          </span>

          {torchActive && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-amber-500 text-zinc-950 border border-amber-400">
              <Flashlight className="w-3 h-3" />
              Flash LED
            </span>
          )}
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800 w-full sm:w-auto justify-center overflow-x-auto">
          <button
            onClick={() => setActiveTab('translator')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'translator'
                ? 'bg-amber-500 text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Traducteur
          </button>
          <button
            onClick={() => setActiveTab('decoder')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'decoder'
                ? 'bg-amber-500 text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Décodeur (Micro/Caméra)
          </button>
          <button
            onClick={() => setActiveTab('keyer')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'keyer'
                ? 'bg-amber-500 text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Manipulateur
          </button>
          <button
            onClick={() => setActiveTab('reference')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'reference'
                ? 'bg-amber-500 text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Table Morse
          </button>
        </nav>
      </div>
    </header>
  );
};
