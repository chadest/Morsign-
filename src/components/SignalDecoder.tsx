import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Camera,
  Play,
  Square,
  RotateCcw,
  Copy,
  Check,
  ShieldCheck,
  Lock,
  Sliders,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { AudioDecoder } from '../utils/audioDecoder';
import { CameraDecoder } from '../utils/cameraDecoder';
import { CipherType, decryptPayload } from '../utils/crypto';

interface SignalDecoderProps {
  cipherType: CipherType;
  passphrase: string;
  wpm: number;
  frequency: number;
}

/**
 * SignalDecoder Component
 * Live Morse code audio decoding from microphone and optical decoding from camera.
 */
export const SignalDecoder: React.FC<SignalDecoderProps> = ({
  cipherType,
  passphrase,
  wpm,
  frequency,
}) => {
  const [decoderMode, setDecoderMode] = useState<'mic' | 'camera'>('mic');
  const [isDecoding, setIsDecoding] = useState(false);
  const [isSignalDetected, setIsSignalDetected] = useState(false);

  // Meter levels
  const [currentLevel, setCurrentLevel] = useState(0);
  const [micThreshold, setMicThreshold] = useState(0.22);
  const [opticalLuminance, setOpticalLuminance] = useState(0);
  const [cameraThreshold, setCameraThreshold] = useState(0.60);

  // Decoded streams
  const [detectedMorse, setDetectedMorse] = useState('');
  const [decodedRawText, setDecodedRawText] = useState('');
  const [decryptedText, setDecryptedText] = useState('');
  const [decryptError, setDecryptError] = useState<string | null>(null);

  // UI state
  const [copiedMorse, setCopiedMorse] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Video element ref for camera stream
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Decoders instances
  const audioDecoderRef = useRef<AudioDecoder | null>(null);
  const cameraDecoderRef = useRef<CameraDecoder | null>(null);

  if (!audioDecoderRef.current) {
    audioDecoderRef.current = new AudioDecoder();
  }
  if (!cameraDecoderRef.current) {
    cameraDecoderRef.current = new CameraDecoder();
  }

  // Sync settings to active decoder
  useEffect(() => {
    if (audioDecoderRef.current) {
      audioDecoderRef.current.setWpm(wpm);
      audioDecoderRef.current.setTargetFrequency(frequency);
      audioDecoderRef.current.setThreshold(micThreshold);
    }
  }, [wpm, frequency, micThreshold]);

  useEffect(() => {
    if (cameraDecoderRef.current) {
      cameraDecoderRef.current.setWpm(wpm);
      cameraDecoderRef.current.setThreshold(cameraThreshold);
    }
  }, [wpm, cameraThreshold]);

  // Attempt automatic decryption if cipher is configured
  useEffect(() => {
    if (!decodedRawText.trim() || cipherType === 'none') {
      setDecryptedText('');
      setDecryptError(null);
      return;
    }

    let isMounted = true;
    decryptPayload(decodedRawText, cipherType, passphrase)
      .then((decrypted) => {
        if (isMounted) {
          setDecryptedText(decrypted);
          setDecryptError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setDecryptedText('');
          setDecryptError(err instanceof Error ? err.message : 'Déchiffrement impossible');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [decodedRawText, cipherType, passphrase]);

  // Start decoding
  const handleStart = async () => {
    setErrorMessage(null);

    if (decoderMode === 'mic') {
      const ok = await audioDecoderRef.current!.start(
        {
          onLevelUpdate: (level) => setCurrentLevel(level),
          onSignalState: (active) => setIsSignalDetected(active),
          onMorseUpdate: (morse) => setDetectedMorse(morse),
          onTextUpdate: (text) => setDecodedRawText(text),
          onError: (err) => {
            setErrorMessage(`Microphone : ${err.message}`);
            setIsDecoding(false);
          },
        },
        { threshold: micThreshold, targetFreq: frequency, wpm }
      );
      if (ok) setIsDecoding(true);
    } else {
      if (!videoRef.current) return;
      const ok = await cameraDecoderRef.current!.start(
        videoRef.current,
        {
          onLuminanceUpdate: (lum) => setOpticalLuminance(lum),
          onSignalState: (active) => setIsSignalDetected(active),
          onMorseUpdate: (morse) => setDetectedMorse(morse),
          onTextUpdate: (text) => setDecodedRawText(text),
          onError: (err) => {
            setErrorMessage(`Caméra : ${err.message}`);
            setIsDecoding(false);
          },
        },
        { threshold: cameraThreshold, wpm }
      );
      if (ok) setIsDecoding(true);
    }
  };

  // Stop decoding
  const handleStop = () => {
    if (audioDecoderRef.current) audioDecoderRef.current.stop();
    if (cameraDecoderRef.current) cameraDecoderRef.current.stop();
    setIsDecoding(false);
    setIsSignalDetected(false);
  };

  // Reset accumulated text
  const handleReset = () => {
    if (audioDecoderRef.current) audioDecoderRef.current.resetDecoded();
    if (cameraDecoderRef.current) cameraDecoderRef.current.resetDecoded();
    setDetectedMorse('');
    setDecodedRawText('');
    setDecryptedText('');
  };

  // Stop on unmount or mode switch
  useEffect(() => {
    return () => {
      if (audioDecoderRef.current) audioDecoderRef.current.stop();
      if (cameraDecoderRef.current) cameraDecoderRef.current.stop();
    };
  }, []);

  const handleModeChange = (mode: 'mic' | 'camera') => {
    if (isDecoding) handleStop();
    setDecoderMode(mode);
    setErrorMessage(null);
  };

  const handleCopy = (text: string, isMorse: boolean) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (isMorse) {
      setCopiedMorse(true);
      setTimeout(() => setCopiedMorse(false), 1500);
    } else {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 1500);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-6">
      {/* Top Header and Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <Eye className="w-5 h-5 text-amber-500" />
            Récepteur & Décodeur en Direct
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Écoute acoustique par microphone ou analyse optique des impulsions lumineuses par caméra.
          </p>
        </div>

        {/* Source Switcher */}
        <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
          <button
            onClick={() => handleModeChange('mic')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              decoderMode === 'mic'
                ? 'bg-amber-500 text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Microphone (Sonore)</span>
          </button>
          <button
            onClick={() => handleModeChange('camera')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              decoderMode === 'camera'
                ? 'bg-amber-500 text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Caméra (Optique)</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Primary Action & Sensitivity Tuning Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-zinc-950 p-4 rounded-xl border border-zinc-800/80">
        {/* Play/Stop and Status */}
        <div className="flex items-center gap-3">
          {isDecoding ? (
            <button
              onClick={handleStop}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm transition-colors shadow-sm"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>Arrêter la capture</span>
            </button>
          ) : (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs sm:text-sm transition-colors shadow-sm"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Activer la capture</span>
            </button>
          )}

          <button
            onClick={handleReset}
            title="Effacer les données décodées"
            className="p-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Live Signal Indicator Pill */}
        <div className="flex items-center justify-center">
          <div
            className={`px-4 py-2 rounded-lg border font-mono text-xs font-bold flex items-center gap-2 transition-all ${
              isSignalDetected
                ? 'bg-amber-400 border-amber-300 text-zinc-950 shadow-[0_0_20px_rgba(251,191,36,0.6)]'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500'
            }`}
          >
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                isSignalDetected ? 'bg-zinc-950 animate-pulse' : 'bg-zinc-700'
              }`}
            />
            <span>{isSignalDetected ? 'SIGNAL DÉTECTÉ' : 'SILENCE / VEILLE'}</span>
          </div>
        </div>

        {/* Sensitivity & Threshold Meter */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              {decoderMode === 'mic' ? 'Seuil Audio' : 'Seuil Luminance'}
            </span>
            <span className="font-mono text-amber-400 font-semibold">
              {decoderMode === 'mic'
                ? Math.round(micThreshold * 100)
                : Math.round(cameraThreshold * 100)}
              %
            </span>
          </div>

          {/* Graphical VU / Luminance Meter Bar */}
          <div className="relative w-full h-3 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
            {/* Live Meter Level */}
            <div
              className={`h-full transition-all duration-75 ${
                (decoderMode === 'mic' ? currentLevel : opticalLuminance) >=
                (decoderMode === 'mic' ? micThreshold : cameraThreshold)
                  ? 'bg-amber-400'
                  : 'bg-zinc-600'
              }`}
              style={{
                width: `${Math.min(
                  100,
                  (decoderMode === 'mic' ? currentLevel : opticalLuminance) * 100
                )}%`,
              }}
            />
            {/* Threshold Marker Needle */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10"
              style={{
                left: `${
                  (decoderMode === 'mic' ? micThreshold : cameraThreshold) * 100
                }%`,
              }}
            />
          </div>

          {/* Slider input */}
          <input
            type="range"
            min={0.05}
            max={0.95}
            step={0.02}
            value={decoderMode === 'mic' ? micThreshold : cameraThreshold}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (decoderMode === 'mic') setMicThreshold(val);
              else setCameraThreshold(val);
            }}
            className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>
      </div>

      {/* Camera Live Viewfinder (Only shown in camera mode) */}
      {decoderMode === 'camera' && (
        <div className="relative rounded-xl overflow-hidden bg-black border border-zinc-800 max-w-lg mx-auto flex flex-col items-center justify-center">
          <video
            ref={videoRef}
            className="w-full aspect-video object-cover"
            playsInline
            muted
          />

          {/* Viewfinder Reticle / Target Box */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-24 h-24 border-2 border-amber-400/80 rounded-lg flex items-center justify-center relative">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <div className="absolute -top-5 text-[10px] font-mono text-amber-300 font-semibold bg-zinc-950/80 px-2 py-0.5 rounded">
                ZONE DE MESURE ROI
              </div>
            </div>
          </div>

          {!isDecoding && (
            <div className="absolute inset-0 bg-zinc-950/80 flex flex-col items-center justify-center text-center p-4">
              <Camera className="w-8 h-8 text-zinc-500 mb-2" />
              <span className="text-sm font-semibold text-zinc-300">
                Caméra en veille
              </span>
              <span className="text-xs text-zinc-500 mt-1">
                Cliquez sur "Activer la capture" pour viser la source lumineuse (lampe, écran ou torche)
              </span>
            </div>
          )}
        </div>
      )}

      {/* Output Streams (Detected Morse + Decoded Text) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Detected Morse Stream */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Code Morse Reçu
              </span>
              <button
                onClick={() => handleCopy(detectedMorse, true)}
                disabled={!detectedMorse}
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
            <div className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 min-h-[90px] max-h-[120px] overflow-y-auto text-sm text-amber-400 font-mono tracking-widest break-words select-all">
              {detectedMorse || (
                <span className="text-zinc-600 font-sans tracking-normal select-none text-xs">
                  {isDecoding
                    ? 'En attente de signaux (points • et traits —)...'
                    : 'Activez la capture pour commencer à recevoir'}
                </span>
              )}
            </div>
          </div>

          <div className="pt-2 text-[11px] text-zinc-500 font-mono flex items-center justify-between">
            <span>Points: {(detectedMorse.match(/\./g) || []).length} • Traits: {(detectedMorse.match(/-/g) || []).length}</span>
            <span>Rythme: {wpm} WPM</span>
          </div>
        </div>

        {/* Decoded Plain / Decrypted Text */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <span>Texte Décodé</span>
                {cipherType !== 'none' && (
                  <span className="text-[10px] text-emerald-400 font-mono">
                    (avec clé {cipherType.toUpperCase()})
                  </span>
                )}
              </span>
              <button
                onClick={() =>
                  handleCopy(cipherType !== 'none' && decryptedText ? decryptedText : decodedRawText, false)
                }
                disabled={!decodedRawText}
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

            {/* If encrypted mode */}
            {cipherType !== 'none' ? (
              <div className="space-y-2">
                <div className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 min-h-[50px] text-xs font-mono text-zinc-400 break-words">
                  <span className="text-[10px] text-zinc-500 block">Données brutes reçues :</span>
                  {decodedRawText || '—'}
                </div>
                <div className="w-full bg-zinc-900 border border-emerald-900/60 rounded-lg p-3 min-h-[50px] text-sm text-emerald-300 font-sans font-semibold break-words">
                  <span className="text-[10px] text-emerald-500 block uppercase">
                    Message déchiffré ({cipherType}) :
                  </span>
                  {decryptedText || (
                    <span className="text-zinc-600 font-normal text-xs">
                      {decryptError || 'En attente du message complet...'}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 min-h-[90px] max-h-[120px] overflow-y-auto text-sm text-zinc-100 font-sans font-medium break-words select-all">
                {decodedRawText || (
                  <span className="text-zinc-600 text-xs select-none">
                    Le texte clair décodé apparaîtra ici...
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="pt-2 text-[11px] text-zinc-500 font-mono flex items-center justify-between">
            <span>Longueur: {decodedRawText.length} caractères</span>
            {cipherType !== 'none' && (
              <span className="text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Déchiffrement actif
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
