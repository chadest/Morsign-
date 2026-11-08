import React, { useState } from 'react';
import {
  ArrowRightLeft,
  Copy,
  Check,
  Trash2,
  Lock,
  Radio,
  Clock,
  Sparkles,
} from 'lucide-react';
import { CipherType } from '../utils/crypto';
import { getDotDurationMs } from '../utils/morse';

interface TranslatorProps {
  plainText: string;
  setPlainText: (text: string) => void;
  morseText: string;
  setMorseText: (morse: string) => void;
  cipherPayload: string;
  cipherType: CipherType;
  wpm: number;
  direction: 'text-to-morse' | 'morse-to-text';
  setDirection: (dir: 'text-to-morse' | 'morse-to-text') => void;
}

/**
 * Two-way Text and Morse Code translator interface
 */
export const Translator: React.FC<TranslatorProps> = ({
  plainText,
  setPlainText,
  morseText,
  setMorseText,
  cipherPayload,
  cipherType,
  wpm,
  direction,
  setDirection,
}) => {
  const [copiedMorse, setCopiedMorse] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Quick preset messages
  const presets = [
    { label: 'SOS', text: 'SOS' },
    { label: 'MAYDAY', text: 'MAYDAY MAYDAY' },
    { label: 'CQ (Appel)', text: 'CQ CQ CQ DE HB9' },
    { label: '73 (Amitiés)', text: '73 BEST REGARDS' },
    { label: 'Test Radio', text: 'TEST RADIO 1 2 3' },
  ];

  // Copy helper
  const handleCopy = (content: string, isMorse: boolean) => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    if (isMorse) {
      setCopiedMorse(true);
      setTimeout(() => setCopiedMorse(false), 1500);
    } else {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 1500);
    }
  };

  // Swap translation direction
  const handleSwap = () => {
    setDirection(direction === 'text-to-morse' ? 'morse-to-text' : 'text-to-morse');
  };

  // Clear inputs
  const handleClear = () => {
    setPlainText('');
    setMorseText('');
  };

  // Stats calculation
  const dotCount = (morseText.match(/\./g) || []).length;
  const dashCount = (morseText.match(/-/g) || []).length;
  const wordCount = plainText.trim() ? plainText.trim().split(/\s+/).length : 0;

  // Estimated transmission duration in seconds
  const dotDurationMs = getDotDurationMs(wpm);
  // Paris rule estimate: dots + 3*dashes + spacing
  const estimatedSeconds = Math.round(
    ((dotCount * 1 + dashCount * 3 + (dotCount + dashCount) * 1) * dotDurationMs) / 1000
  );

  return (
    <div className="space-y-4">
      {/* Quick presets & Swap header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-zinc-500 font-medium">Exemples :</span>
          {presets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                setDirection('text-to-morse');
                setPlainText(preset.text);
              }}
              className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-mono border border-zinc-800 transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSwap}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition-colors"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
            <span>Inverser le sens</span>
          </button>
          {(plainText || morseText) && (
            <button
              onClick={handleClear}
              className="p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Effacer tout"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Two Pane Editor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Input / Text Pane */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <span>
                  {direction === 'text-to-morse' ? 'Texte source (Clair)' : 'Code Morse d\'entrée'}
                </span>
                {direction === 'text-to-morse' && cipherType !== 'none' && (
                  <span className="text-[10px] text-emerald-400 font-mono lowercase">
                    (sera chiffré)
                  </span>
                )}
              </label>
              <button
                onClick={() =>
                  handleCopy(direction === 'text-to-morse' ? plainText : morseText, false)
                }
                disabled={!(direction === 'text-to-morse' ? plainText : morseText)}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 disabled:opacity-40"
              >
                {copiedText ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copié</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copier</span>
                  </>
                )}
              </button>
            </div>

            {direction === 'text-to-morse' ? (
              <textarea
                value={plainText}
                onChange={(e) => setPlainText(e.target.value)}
                placeholder="Tapez votre message ici (ex: SOS NAVIRE EN DÉTRESSE)..."
                rows={5}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-sans resize-none"
              />
            ) : (
              <textarea
                value={morseText}
                onChange={(e) => setMorseText(e.target.value)}
                placeholder="Entrez le code morse (ex: ... --- ... / -.-. --.-)..."
                rows={5}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-amber-300 placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-mono tracking-widest resize-none"
              />
            )}
          </div>

          <div className="flex items-center justify-between pt-2 text-[11px] text-zinc-500 font-mono">
            <span>
              {direction === 'text-to-morse'
                ? `${plainText.length} caractères • ${wordCount} mots`
                : `${morseText.length} symboles`}
            </span>
            <span>
              {direction === 'text-to-morse' ? 'International ITU' : 'Décodage auto'}
            </span>
          </div>
        </div>

        {/* Output / Morse Pane */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <span>
                  {direction === 'text-to-morse' ? 'Signal Code Morse' : 'Texte Décodé'}
                </span>
                {cipherType !== 'none' && (
                  <span className="text-[10px] text-emerald-400 font-mono lowercase">
                    {direction === 'text-to-morse' ? `(chiffré ${cipherType})` : '(déchiffré)'}
                  </span>
                )}
              </label>
              <button
                onClick={() =>
                  handleCopy(direction === 'text-to-morse' ? morseText : plainText, true)
                }
                disabled={!(direction === 'text-to-morse' ? morseText : plainText)}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 disabled:opacity-40"
              >
                {copiedMorse ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copié</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copier</span>
                  </>
                )}
              </button>
            </div>

            {direction === 'text-to-morse' ? (
              <div className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 min-h-[120px] max-h-[140px] overflow-y-auto text-sm text-amber-400 font-mono tracking-widest break-words select-all">
                {morseText || (
                  <span className="text-zinc-600 font-sans tracking-normal select-none">
                    Le code morse apparaîtra ici...
                  </span>
                )}
              </div>
            ) : (
              <div className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 min-h-[120px] max-h-[140px] overflow-y-auto text-sm text-zinc-100 font-sans break-words select-all">
                {plainText || (
                  <span className="text-zinc-600 select-none">
                    Le texte décodé apparaîtra ici...
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Cipher intermediary note if enabled */}
          {cipherType !== 'none' && cipherPayload && (
            <div className="mt-2 p-2 rounded bg-zinc-950 border border-zinc-800/80 text-[11px] font-mono text-zinc-400 flex items-center justify-between">
              <span className="truncate max-w-[280px]">
                Cryptogramme: {cipherPayload}
              </span>
              <span className="text-emerald-400 shrink-0 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Sécurisé
              </span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 text-[11px] text-zinc-500 font-mono">
            <span>
              {dotCount} points (•) • {dashCount} traits (—)
            </span>
            {morseText && (
              <span className="flex items-center gap-1 text-zinc-400">
                <Clock className="w-3 h-3" />
                ~{estimatedSeconds}s à {wpm} WPM
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
