import React, { useState, useEffect, useRef } from 'react';
import { Radio, Volume2, RotateCcw, Copy, Check, Info } from 'lucide-react';
import { MorseAudioController } from '../utils/audioPlayer';
import { morseToText, getDotDurationMs } from '../utils/morse';
import { TorchController } from '../utils/torchController';

interface ManualKeyerProps {
  audioController: MorseAudioController;
  torchController: TorchController;
  torchEnabled: boolean;
  frequency: number;
  wpm: number;
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
}) => {
  const [isKeyDown, setIsKeyDown] = useState(false);
  const [recordedMorse, setRecordedMorse] = useState('');
  const [currentLetterSymbols, setCurrentLetterSymbols] = useState('');
  const [decodedText, setDecodedText] = useState('');
  const [copied, setCopied] = useState(false);

  const keyDownTimeRef = useRef<number | null>(null);
  const keyUpTimeRef = useRef<number | null>(null);
  const letterTimerRef = useRef<number | null>(null);
  const wordTimerRef = useRef<number | null>(null);

  const dotDurationMs = getDotDurationMs(wpm);
  // Threshold to distinguish dot from dash: 1.8 * dot duration
  const dashThresholdMs = dotDurationMs * 1.8;
  const interLetterPauseMs = dotDurationMs * 3;
  const interWordPauseMs = dotDurationMs * 7;

  // Handle key press (start tone and optical signal)
  const handlePressStart = () => {
    if (isKeyDown) return;
    setIsKeyDown(true);
    keyDownTimeRef.current = Date.now();

    // Clear pending letter / word commit timers
    if (letterTimerRef.current) clearTimeout(letterTimerRef.current);
    if (wordTimerRef.current) clearTimeout(wordTimerRef.current);

    // Audio tone
    audioController.startManualTone(frequency);

    // Flash torch if enabled
    if (torchEnabled) {
      torchController.turnOn().catch(() => {});
    }
  };

  // Handle key release (evaluate dot/dash and schedule letter completion)
  const handlePressEnd = () => {
    if (!isKeyDown) return;
    setIsKeyDown(false);

    // Stop audio & flash
    audioController.stopManualTone();
    if (torchEnabled) {
      torchController.turnOff().catch(() => {});
    }

    const pressDuration = keyDownTimeRef.current ? Date.now() - keyDownTimeRef.current : 0;
    const symbol = pressDuration >= dashThresholdMs ? '-' : '.';

    const newLetter = currentLetterSymbols + symbol;
    setCurrentLetterSymbols(newLetter);
    keyUpTimeRef.current = Date.now();

    // Schedule letter commit after inter-character pause
    letterTimerRef.current = window.setTimeout(() => {
      // Commit letter to morse stream
      setRecordedMorse((prev) => {
        const updated = prev ? `${prev} ${newLetter}` : newLetter;
        setDecodedText(morseToText(updated));
        return updated;
      });
      setCurrentLetterSymbols('');

      // Schedule word break after inter-word pause
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
      if (e.code === 'Space' && !e.repeat && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
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
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-6">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <Radio className="w-5 h-5 text-amber-500" />
            Manipulateur Télégraphique Manuel
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Pressez la barre d'espace ou le bouton pour émettre en direct. L'algorithme décode automatiquement votre rythme.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Réinitialiser</span>
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
              : 'bg-zinc-950 border-zinc-800'
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
              : 'bg-zinc-800 text-zinc-200 border-zinc-700 hover:bg-zinc-750 hover:border-zinc-600'
          }`}
        >
          <span className="text-xl">
            {isKeyDown ? 'CONTACT ÉTABLI' : 'CLIQUEZ OU ESPACE'}
          </span>
          <span className="text-xs font-normal opacity-75">
            Court = Point (•) | Long = Trait (—)
          </span>
        </button>

        {/* Active Letter Ticker */}
        <div className="flex items-center gap-2 font-mono text-sm">
          <span className="text-zinc-500">Symbole en cours :</span>
          <span className="px-3 py-1 rounded bg-zinc-950 border border-zinc-800 text-amber-400 font-bold min-w-[60px] text-center text-lg">
            {currentLetterSymbols || '—'}
          </span>
        </div>
      </div>

      {/* Real-time Decoded Output */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Morse Stream */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
            Flux Morse Détecté
          </div>
          <div className="font-mono text-sm text-amber-400 tracking-widest min-h-[60px] break-words">
            {recordedMorse || <span className="text-zinc-700">Aucun signal reçu...</span>}
          </div>
        </div>

        {/* Decoded Plain Text */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Texte Décodé
              </span>
              <button
                onClick={handleCopy}
                disabled={!decodedText}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 disabled:opacity-40"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>Copier</span>
              </button>
            </div>
            <div className="font-sans text-sm text-zinc-100 min-h-[60px] break-words font-medium">
              {decodedText || <span className="text-zinc-700">Le texte apparaîtra en direct...</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Reference calibration note */}
      <div className="p-3 bg-zinc-950/60 rounded-lg border border-zinc-800/80 text-xs text-zinc-400 flex items-center justify-between font-mono">
        <span>Rythme de référence : {wpm} WPM</span>
        <span>Point: ~{dotDurationMs}ms | Trait: ~{Math.round(dashThresholdMs)}ms</span>
      </div>
    </div>
  );
};
