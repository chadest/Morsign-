import React, { useState, useEffect } from 'react';
import {
  ArrowRightLeft,
  Copy,
  Check,
  Trash2,
  Lock,
  Clock,
  Play,
  Square,
} from 'lucide-react';
import { CipherType } from '../utils/crypto';
import { getDotDurationMs } from '../utils/morse';
import { Language, Translations } from '../utils/i18n';

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
  language: Language;
  t: Translations;
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
  language,
  t,
}) => {
  const [copiedMorse, setCopiedMorse] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Play spoken speech audio for the plain text
  const handlePlaySpeech = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!text.trim()) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : 'en-US';
    utterance.rate = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Quick preset messages
  const presets = [
    { label: 'SOS', text: 'SOS' },
    { label: 'MAYDAY', text: 'MAYDAY MAYDAY' },
    { label: 'CQ (Radio)', text: 'CQ CQ CQ DE HB9' },
    { label: '73 (Regards)', text: '73 BEST REGARDS' },
    { label: 'TEST', text: 'TEST RADIO 1 2 3' },
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
  const estimatedSeconds = Math.round(
    ((dotCount * 1 + dashCount * 3 + (dotCount + dashCount) * 1) * dotDurationMs) / 1000
  );

  return (
    <div className="space-y-4">
      {/* Quick presets & Swap header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs dark:text-zinc-500 text-zinc-500 font-medium">
            {t.presetsLabel}
          </span>
          {presets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                setDirection('text-to-morse');
                setPlainText(preset.text);
              }}
              className="px-2.5 py-1 rounded dark:bg-zinc-900 bg-white hover:dark:bg-zinc-800 hover:bg-zinc-100 dark:text-zinc-300 text-zinc-700 text-xs font-mono border dark:border-zinc-800 border-zinc-300 shadow-sm transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSwap}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md dark:bg-zinc-800 bg-zinc-100 hover:dark:bg-zinc-700 hover:bg-zinc-200 dark:text-zinc-200 text-zinc-700 text-xs font-medium border dark:border-zinc-700 border-zinc-300 transition-colors"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-amber-500" />
            <span>{t.swapDirection}</span>
          </button>
          {(plainText || morseText) && (
            <button
              onClick={handleClear}
              className="p-1.5 rounded-md dark:bg-zinc-800 bg-zinc-100 hover:dark:bg-zinc-700 hover:bg-zinc-200 dark:text-zinc-400 text-zinc-600 transition-colors border dark:border-zinc-700 border-zinc-300"
              title={t.clearAll}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Two Pane Editor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Input / Text Pane */}
        <div className="dark:bg-zinc-900 bg-white border dark:border-zinc-800 border-zinc-200 rounded-xl p-4 flex flex-col justify-between shadow-sm transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider dark:text-zinc-300 text-zinc-700 flex items-center gap-1.5">
                <span>
                  {direction === 'text-to-morse' ? t.sourceTextLabel : t.sourceMorseLabel}
                </span>
                {direction === 'text-to-morse' && cipherType !== 'none' && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono lowercase">
                    {t.willBeEncrypted}
                  </span>
                )}
              </label>
              <div className="flex items-center gap-2">
                {direction === 'text-to-morse' && (
                  <button
                    type="button"
                    onClick={() => handlePlaySpeech(plainText)}
                    disabled={!plainText.trim()}
                    title={isSpeaking ? t.stopSpeechBtn : t.playSpeechBtn}
                    className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-500 disabled:opacity-40 font-medium transition-colors"
                  >
                    {isSpeaking ? (
                      <>
                        <Square className="w-3.5 h-3.5 fill-current text-rose-500" />
                        <span className="text-rose-500">{t.stopSpeechBtn}</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{t.playSpeechBtn}</span>
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={() =>
                    handleCopy(direction === 'text-to-morse' ? plainText : morseText, false)
                  }
                  disabled={!(direction === 'text-to-morse' ? plainText : morseText)}
                  className="flex items-center gap-1 text-xs dark:text-zinc-400 text-zinc-600 hover:dark:text-zinc-200 hover:text-zinc-900 disabled:opacity-40"
                >
                  {copiedText ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500">{t.copiedBtn}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{t.copyBtn}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {direction === 'text-to-morse' ? (
              <textarea
                value={plainText}
                onChange={(e) => setPlainText(e.target.value)}
                placeholder={t.placeholderText}
                rows={5}
                className="w-full dark:bg-zinc-950 bg-zinc-50 border dark:border-zinc-800 border-zinc-300 rounded-lg p-3 text-sm dark:text-zinc-100 text-zinc-900 dark:placeholder-zinc-600 placeholder-zinc-400 focus:outline-none focus:border-amber-500 font-sans resize-none"
              />
            ) : (
              <textarea
                value={morseText}
                onChange={(e) => setMorseText(e.target.value)}
                placeholder={t.placeholderMorse}
                rows={5}
                className="w-full dark:bg-zinc-950 bg-zinc-50 border dark:border-zinc-800 border-zinc-300 rounded-lg p-3 text-sm text-amber-600 dark:text-amber-300 dark:placeholder-zinc-600 placeholder-zinc-400 focus:outline-none focus:border-amber-500 font-mono tracking-widest resize-none"
              />
            )}
          </div>

          <div className="flex items-center justify-between pt-2 text-[11px] dark:text-zinc-500 text-zinc-500 font-mono">
            <span>
              {direction === 'text-to-morse'
                ? `${plainText.length} ${t.charsLabel} • ${wordCount} ${t.wordsLabel}`
                : `${morseText.length} ${t.symbolsLabel}`}
            </span>
            <span>
              {direction === 'text-to-morse' ? 'International ITU' : 'Auto'}
            </span>
          </div>
        </div>

        {/* Output / Morse Pane */}
        <div className="dark:bg-zinc-900 bg-white border dark:border-zinc-800 border-zinc-200 rounded-xl p-4 flex flex-col justify-between shadow-sm transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider dark:text-zinc-300 text-zinc-700 flex items-center gap-1.5">
                <span>
                  {direction === 'text-to-morse' ? t.outputMorseLabel : t.outputTextLabel}
                </span>
                {cipherType !== 'none' && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono lowercase">
                    {direction === 'text-to-morse' ? `(${cipherType})` : '(decrypt)'}
                  </span>
                )}
              </label>
              <div className="flex items-center gap-2">
                {direction === 'morse-to-text' && (
                  <button
                    type="button"
                    onClick={() => handlePlaySpeech(plainText)}
                    disabled={!plainText.trim()}
                    title={isSpeaking ? t.stopSpeechBtn : t.playSpeechBtn}
                    className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-500 disabled:opacity-40 font-medium transition-colors"
                  >
                    {isSpeaking ? (
                      <>
                        <Square className="w-3.5 h-3.5 fill-current text-rose-500" />
                        <span className="text-rose-500">{t.stopSpeechBtn}</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{t.playSpeechBtn}</span>
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={() =>
                    handleCopy(direction === 'text-to-morse' ? morseText : plainText, true)
                  }
                  disabled={!(direction === 'text-to-morse' ? morseText : plainText)}
                  className="flex items-center gap-1 text-xs dark:text-zinc-400 text-zinc-600 hover:dark:text-zinc-200 hover:text-zinc-900 disabled:opacity-40"
                >
                  {copiedMorse ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500">{t.copiedBtn}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{t.copyBtn}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {direction === 'text-to-morse' ? (
              <div className="w-full dark:bg-zinc-950 bg-zinc-50 border dark:border-zinc-800 border-zinc-300 rounded-lg p-3 min-h-[120px] max-h-[140px] overflow-y-auto text-sm text-amber-600 dark:text-amber-400 font-mono tracking-widest break-words select-all">
                {morseText || (
                  <span className="dark:text-zinc-600 text-zinc-400 font-sans tracking-normal select-none">
                    {t.morseAppearsHere}
                  </span>
                )}
              </div>
            ) : (
              <div className="w-full dark:bg-zinc-950 bg-zinc-50 border dark:border-zinc-800 border-zinc-300 rounded-lg p-3 min-h-[120px] max-h-[140px] overflow-y-auto text-sm dark:text-zinc-100 text-zinc-900 font-sans break-words select-all">
                {plainText || (
                  <span className="dark:text-zinc-600 text-zinc-400 select-none">
                    {t.textAppearsHere}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Cipher intermediary note if enabled */}
          {cipherType !== 'none' && cipherPayload && (
            <div className="mt-2 p-2 rounded dark:bg-zinc-950 bg-zinc-50 border dark:border-zinc-800/80 border-zinc-200 text-[11px] font-mono dark:text-zinc-400 text-zinc-600 flex items-center justify-between">
              <span className="truncate max-w-[280px]">
                {t.cryptogramLabel} {cipherPayload}
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 shrink-0 flex items-center gap-1 font-semibold">
                <Lock className="w-3 h-3" />
                {t.encryptedIndicator}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 text-[11px] dark:text-zinc-500 text-zinc-500 font-mono">
            <span>
              {dotCount} {t.pointsLabel} (•) • {dashCount} {t.dashesLabel} (—)
            </span>
            {morseText && (
              <span className="flex items-center gap-1 dark:text-zinc-400 text-zinc-600">
                <Clock className="w-3 h-3" />
                ~{estimatedSeconds}s @ {wpm} WPM
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
