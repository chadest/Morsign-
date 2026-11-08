import React, { useState, useEffect, useRef } from 'react';
import { Radio, RotateCcw, Copy, Check } from 'lucide-react';
import { MorseAudioController } from '../utils/audioPlayer';
import { morseToText, getDotDurationMs } from '../utils/morse';
import { TorchController } from '../utils/torchController';
import { Translations } from '../utils/i18n';

interface ManualKeyerProps {
  audioController: MorseAudioController;
  torchController: TorchController;
  torchEnabled: boolean;
  frequency: number;
  wpm: number;
  t: Translations;
}

/**
 * Interactive straight telegraph key (manipulateur morse)
 * Allows manual Morse tapping via keyboard (Spacebar) or touch/mouse,
 * with real-time audio synthesizer, optical blink, and auto-decoder.
 */
export const ManualKeyer: React.FC<ManualKeyerProps> = ({
  audioController,
  torchController,
  torchEnabled,
  frequency,
  wpm,
  t,
}) => {
  const [isKeyDown, setIsKeyDown] = useState(false);
  const [recordedMorse, setRecordedMorse] = useState('');
  const [currentLetterSymbols, setCurrentLetterSymbols] = useState('');
  const [decodedText, setDecodedText] = useState('');
  const [copied, setCopied] = useState(false);

  const keyDownTimeRef = useRef<number | null>(null);
  const letterTimerRef = useRef<number | null>(null);
  const wordTimerRef = useRef<number | null>(null);

  const dotDurationMs = getDotDurationMs(wpm);
  const dashThresholdMs = dotDurationMs * 1.8;
  const interLetterPauseMs = dotDurationMs * 3;
  const interWordPauseMs = dotDurationMs * 7;

  // Handle key press
  const handlePressStart = () => {
    if (isKeyDown) return;
    setIsKeyDown(true);
    keyDownTimeRef.current = Date.now();

    if (letterTimerRef.current) clearTimeout(letterTimerRef.current);
    if (wordTimerRef.current) clearTimeout(wordTimerRef.current);

    audioController.startManualTone(frequency);

    if (torchEnabled) {
      torchController.turnOn().catch(() => {});
    }
  };

  // Handle key release
  const handlePressEnd = () => {
    if (!isKeyDown) return;
    setIsKeyDown(false);

    audioController.stopManualTone();
    if (torchEnabled) {
      torchController.turnOff().catch(() => {});
    }

    const pressDuration = keyDownTimeRef.current ? Date.now() - keyDownTimeRef.current : 0;
    const symbol = pressDuration >= dashThresholdMs ? '-' : '.';

    const newLetter = currentLetterSymbols + symbol;
    setCurrentLetterSymbols(newLetter);

    letterTimerRef.current = window.setTimeout(() => {
      setRecordedMorse((prev) => {
        const updated = prev ? `${prev} ${newLetter}` : newLetter;
        setDecodedText(morseToText(updated));
        return updated;
      });
      setCurrentLetterSymbols('');

      wordTimerRef.current = window.setTimeout(() => {
        setRecordedMorse((prev) => {
          if (!prev.endsWith(' / ')) {
            const updated = `${prev} / `;
            setDecodedText(morseToText(updated));
            return updated;
          }
          return prev;
        });
      }, interWordPauseMs - interLetterPauseMs);
    }, interLetterPauseMs);
  };

  // Keyboard spacebar listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === 'Space' &&
        !e.repeat &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        handlePressStart();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handlePressEnd();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (letterTimerRef.current) clearTimeout(letterTimerRef.current);
      if (wordTimerRef.current) clearTimeout(wordTimerRef.current);
    };
  }, [currentLetterSymbols, isKeyDown, wpm, frequency, torchEnabled]);

  const handleReset = () => {
    setRecordedMorse('');
    setCurrentLetterSymbols('');
    setDecodedText('');
  };

  const handleCopy = () => {
    if (!decodedText) return;
    navigator.clipboard.writeText(decodedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="dark:bg-zinc-900 bg-white border dark:border-zinc-800 border-zinc-200 rounded-xl p-5 space-y-6 shadow-sm transition-colors">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b dark:border-zinc-800 border-zinc-200">
        <div>
          <h2 className="text-base font-bold dark:text-zinc-100 text-zinc-900 flex items-center gap-2">
            <Radio className="w-5 h-5 text-amber-500" />
            {t.keyerTitle}
          </h2>
          <p className="text-xs dark:text-zinc-400 text-zinc-600 mt-0.5">
            {t.keyerSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg dark:bg-zinc-800 bg-zinc-100 hover:dark:bg-zinc-700 hover:bg-zinc-200 dark:text-zinc-300 text-zinc-700 text-xs font-medium border dark:border-zinc-700 border-zinc-300 transition-colors shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.resetCapture}</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Keyer Knob & Beacon */}
      <div className="flex flex-col items-center justify-center py-6 gap-6">
        {/* Optical lamp indicator */}
        <div
          className={`w-20 h-20 rounded-full border-4 transition-all duration-75 flex items-center justify-center ${
            isKeyDown
              ? 'bg-amber-400 border-amber-300 shadow-[0_0_40px_rgba(251,191,36,0.9)] scale-110'
              : 'dark:bg-zinc-950 bg-zinc-100 dark:border-zinc-800 border-zinc-300'
          }`}
        >
          <span className="font-mono font-bold text-lg text-zinc-950">
            {isKeyDown ? 'ON' : 'OFF'}
          </span>
        </div>

        {/* Straight Key Tapping Pad */}
        <button
          type="button"
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          onTouchStart={(e) => {
            e.preventDefault();
            handlePressStart();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            handlePressEnd();
          }}
          className={`w-full max-w-sm h-32 rounded-2xl border-4 font-mono font-bold text-lg select-none transition-all flex flex-col items-center justify-center gap-2 shadow-lg active:scale-95 ${
            isKeyDown
              ? 'bg-amber-500 text-zinc-950 border-amber-300 shadow-amber-500/20 translate-y-1'
              : 'dark:bg-zinc-800 bg-zinc-100 dark:text-zinc-200 text-zinc-800 dark:border-zinc-700 border-zinc-300 hover:dark:bg-zinc-750 hover:bg-zinc-200'
          }`}
        >
          <span className="text-xl">
            {isKeyDown ? t.keyerPadActive : t.keyerPadIdle}
          </span>
          <span className="text-xs font-normal opacity-75">
            {t.keyerHint}
          </span>
        </button>

        {/* Active Letter Ticker */}
        <div className="flex items-center gap-2 font-mono text-sm">
          <span className="dark:text-zinc-500 text-zinc-500">{t.currentSymbol}</span>
          <span className="px-3 py-1 rounded dark:bg-zinc-950 bg-zinc-100 border dark:border-zinc-800 border-zinc-300 text-amber-600 dark:text-amber-400 font-bold min-w-[60px] text-center text-lg shadow-inner">
            {currentLetterSymbols || '—'}
          </span>
        </div>
      </div>

      {/* Real-time Decoded Output */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Morse Stream */}
        <div className="dark:bg-zinc-950 bg-zinc-50 border dark:border-zinc-800 border-zinc-200 rounded-lg p-3 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider dark:text-zinc-400 text-zinc-600 mb-1">
            {t.detectedStream}
          </div>
          <div className="font-mono text-sm text-amber-600 dark:text-amber-400 tracking-widest min-h-[60px] break-words">
            {recordedMorse || <span className="dark:text-zinc-700 text-zinc-400 text-xs tracking-normal font-sans">{t.waitingForSignals}</span>}
          </div>
        </div>

        {/* Decoded Plain Text */}
        <div className="dark:bg-zinc-950 bg-zinc-50 border dark:border-zinc-800 border-zinc-200 rounded-lg p-3 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider dark:text-zinc-400 text-zinc-600">
                {t.keyerDecodedText}
              </span>
              <button
                onClick={handleCopy}
                disabled={!decodedText}
                className="flex items-center gap-1 text-xs dark:text-zinc-400 text-zinc-600 hover:dark:text-zinc-200 hover:text-zinc-900 disabled:opacity-40"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{t.copyBtn}</span>
              </button>
            </div>
            <div className="font-sans text-sm dark:text-zinc-100 text-zinc-900 min-h-[60px] break-words font-medium">
              {decodedText || <span className="dark:text-zinc-700 text-zinc-400 text-xs">{t.textAppearsHere}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Reference calibration note */}
      <div className="p-3 dark:bg-zinc-950/60 bg-zinc-50 rounded-lg border dark:border-zinc-800/80 border-zinc-200 text-xs dark:text-zinc-400 text-zinc-600 flex items-center justify-between font-mono">
        <span>{t.referenceRhythm} {wpm} WPM</span>
        <span>Point: ~{dotDurationMs}ms | Trait: ~{Math.round(dashThresholdMs)}ms</span>
      </div>
    </div>
  );
};
