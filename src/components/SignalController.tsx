import React, { useState } from 'react';
import {
  Play,
  Square,
  Volume2,
  VolumeX,
  Sun,
  Flashlight,
  Download,
  Sliders,
  Check,
  AlertCircle,
} from 'lucide-react';
import { generateMorseWavBlob } from '../utils/audioPlayer';
import { getDotDurationMs } from '../utils/morse';

interface SignalControllerProps {
  isPlaying: boolean;
  morseText: string;
  onPlay: () => void;
  onStop: () => void;
  wpm: number;
  setWpm: (wpm: number) => void;
  frequency: number;
  setFrequency: (freq: number) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  lightEnabled: boolean;
  setLightEnabled: (enabled: boolean) => void;
  torchEnabled: boolean;
  onToggleTorch: () => void;
  torchSupported: boolean | null;
  torchError?: string | null;
}

/**
 * Playback, transmission speed and hardware flash signal controller
 */
export const SignalController: React.FC<SignalControllerProps> = ({
  isPlaying,
  morseText,
  onPlay,
  onStop,
  wpm,
  setWpm,
  frequency,
  setFrequency,
  soundEnabled,
  setSoundEnabled,
  lightEnabled,
  setLightEnabled,
  torchEnabled,
  onToggleTorch,
  torchSupported,
  torchError,
}) => {
  const [downloading, setDownloading] = useState(false);
  const dotDuration = getDotDurationMs(wpm);

  // Handle WAV download
  const handleExportWav = () => {
    if (!morseText.trim()) return;
    setDownloading(true);
    try {
      const blob = generateMorseWavBlob(morseText, wpm, frequency);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `morse-signal-${wpm}wpm.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('WAV export error:', err);
    } finally {
      setTimeout(() => setDownloading(false), 800);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      {/* Primary Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          {isPlaying ? (
            <button
              onClick={onStop}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm transition-colors shadow-sm"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>Arrêter l'émission</span>
            </button>
          ) : (
            <button
              onClick={onPlay}
              disabled={!morseText.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:hover:bg-amber-500 text-zinc-950 font-bold text-sm transition-colors shadow-sm"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Émettre le signal</span>
            </button>
          )}

          <button
            onClick={handleExportWav}
            disabled={!morseText.trim() || downloading}
            title="Télécharger fichier audio WAV 44.1kHz"
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-200 text-xs font-medium border border-zinc-700 transition-colors"
          >
            <Download className="w-4 h-4 text-zinc-300" />
            <span className="hidden sm:inline">Exporter WAV</span>
          </button>
        </div>

        {/* Output Channel Toggles */}
        <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              soundEnabled
                ? 'bg-zinc-800 text-amber-400 font-semibold'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>Son</span>
          </button>

          {/* Screen Light Toggle */}
          <button
            onClick={() => setLightEnabled(!lightEnabled)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              lightEnabled
                ? 'bg-zinc-800 text-amber-400 font-semibold'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Écran</span>
          </button>

          {/* Device Camera Flash / Torch Toggle */}
          <button
            onClick={onToggleTorch}
            title={
              torchSupported === false
                ? 'Flash LED non détecté sur cet appareil'
                : 'Activer le flash LED physique'
            }
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              torchEnabled
                ? 'bg-amber-500 text-zinc-950 font-bold'
                : torchSupported === false
                ? 'text-zinc-600 line-through'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Flashlight className="w-3.5 h-3.5" />
            <span>Flash LED</span>
          </button>
        </div>
      </div>

      {/* Hardware flash notice / permission warning */}
      {torchError && (
        <div className="mt-2 text-xs text-amber-400/90 flex items-center gap-1.5 bg-amber-950/40 p-2 rounded-md border border-amber-900/60">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{torchError}</span>
        </div>
      )}

      {/* Adjustments: WPM & Pitch Frequency */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
        {/* Speed / WPM Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-300 font-medium flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              Vitesse de transmission (WPM)
            </span>
            <span className="font-mono text-amber-400 font-semibold">
              {wpm} WPM ({dotDuration} ms/ti)
            </span>
          </div>
          <input
            type="range"
            min={5}
            max={40}
            step={1}
            value={wpm}
            onChange={(e) => setWpm(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
            <span>5 (Apprentissage)</span>
            <span>20 (Standard ITU)</span>
            <span>40 (Rapide)</span>
          </div>
        </div>

        {/* Audio Frequency / Pitch Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-300 font-medium">Fréquence sonore (Tonalité CW)</span>
            <span className="font-mono text-amber-400 font-semibold">{frequency} Hz</span>
          </div>
          <input
            type="range"
            min={400}
            max={900}
            step={25}
            value={frequency}
            onChange={(e) => setFrequency(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
            <span>400 Hz (Grave)</span>
            <span>650 Hz (Standard Radio)</span>
            <span>900 Hz (Aigu)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
