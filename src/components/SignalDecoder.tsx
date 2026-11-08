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
  Sliders,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { AudioDecoder } from '../utils/audioDecoder';
import { CameraDecoder } from '../utils/cameraDecoder';
import { CipherType, decryptPayload } from '../utils/crypto';
import { Translations } from '../utils/i18n';

interface SignalDecoderProps {
  cipherType: CipherType;
  passphrase: string;
  wpm: number;
  frequency: number;
  t: Translations;
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
  t,
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
          setDecryptError(err instanceof Error ? err.message : t.errorAesDecrypt);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [decodedRawText, cipherType, passphrase, t]);

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
            setErrorMessage(`Camera : ${err.message}`);
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

  // Stop on unmount
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
    <div className="dark:bg-zinc-900 bg-white border dark:border-zinc-800 border-zinc-200 rounded-xl p-5 space-y-6 shadow-sm transition-colors">
      {/* Top Header and Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b dark:border-zinc-800 border-zinc-200">
        <div>
          <h2 className="text-base font-bold dark:text-zinc-100 text-zinc-900 flex items-center gap-2">
            <Eye className="w-5 h-5 text-amber-500" />
            {t.decoderTitle}
          </h2>
          <p className="text-xs dark:text-zinc-400 text-zinc-600 mt-0.5">
            {t.decoderSubtitle}
          </p>
        </div>

        {/* Source Switcher */}
        <div className="flex items-center gap-1.5 dark:bg-zinc-950 bg-zinc-100 p-1 rounded-lg border dark:border-zinc-800 border-zinc-300">
          <button
            onClick={() => handleModeChange('mic')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              decoderMode === 'mic'
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                : 'dark:text-zinc-400 text-zinc-600 hover:dark:text-zinc-200 hover:text-zinc-900'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>{t.modeMic}</span>
          </button>
          <button
            onClick={() => handleModeChange('camera')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              decoderMode === 'camera'
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                : 'dark:text-zinc-400 text-zinc-600 hover:dark:text-zinc-200 hover:text-zinc-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{t.modeCamera}</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-3 rounded-lg dark:bg-rose-950/60 bg-rose-50 border dark:border-rose-800 border-rose-300 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Primary Action & Sensitivity Tuning Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center dark:bg-zinc-950 bg-zinc-50 p-4 rounded-xl border dark:border-zinc-800/80 border-zinc-200">
        {/* Play/Stop and Status */}
        <div className="flex items-center gap-3">
          {isDecoding ? (
            <button
              onClick={handleStop}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm transition-colors shadow-sm"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>{t.stopCapture}</span>
            </button>
          ) : (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs sm:text-sm transition-colors shadow-sm"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{t.startCapture}</span>
            </button>
          )}

          <button
            onClick={handleReset}
            title={t.resetCapture}
            className="p-2.5 rounded-lg dark:bg-zinc-900 bg-white hover:dark:bg-zinc-800 hover:bg-zinc-100 dark:text-zinc-400 text-zinc-600 border dark:border-zinc-800 border-zinc-300 shadow-sm transition-colors"
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
                : 'dark:bg-zinc-900 bg-white dark:border-zinc-800 border-zinc-300 dark:text-zinc-500 text-zinc-500'
            }`}
          >
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                isSignalDetected ? 'bg-zinc-950 animate-pulse' : 'bg-zinc-400 dark:bg-zinc-700'
              }`}
            />
            <span>{isSignalDetected ? t.signalDetected : t.silenceWaiting}</span>
          </div>
        </div>

        {/* Sensitivity & Threshold Meter */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="dark:text-zinc-400 text-zinc-600 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-500" />
              {decoderMode === 'mic' ? t.audioThreshold : t.luminanceThreshold}
            </span>
            <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold">
              {decoderMode === 'mic'
                ? Math.round(micThreshold * 100)
                : Math.round(cameraThreshold * 100)}
              %
            </span>
          </div>

          {/* Graphical VU / Luminance Meter Bar */}
          <div className="relative w-full h-3 dark:bg-zinc-900 bg-zinc-200 rounded-full overflow-hidden border dark:border-zinc-800 border-zinc-300">
            {/* Live Meter Level */}
            <div
              className={`h-full transition-all duration-75 ${
                (decoderMode === 'mic' ? currentLevel : opticalLuminance) >=
                (decoderMode === 'mic' ? micThreshold : cameraThreshold)
                  ? 'bg-amber-400'
                  : 'dark:bg-zinc-600 bg-zinc-400'
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
            className="w-full h-1 dark:bg-zinc-900 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>
      </div>

      {/* Camera Live Viewfinder (Only shown in camera mode) */}
      {decoderMode === 'camera' && (
        <div className="relative rounded-xl overflow-hidden bg-black border dark:border-zinc-800 border-zinc-300 max-w-lg mx-auto flex flex-col items-center justify-center">
          <video
            ref={videoRef}
            className="w-full aspect-video object-cover"
            playsInline
            muted
          />

          {/* Viewfinder Reticle / Target Box */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-24 h-24 border-2 border-amber-400/90 rounded-lg flex items-center justify-center relative">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <div className="absolute -top-5 text-[10px] font-mono text-amber-300 font-semibold bg-zinc-950/80 px-2 py-0.5 rounded">
                {t.roiLabel}
              </div>
            </div>
          </div>

          {!isDecoding && (
            <div className="absolute inset-0 bg-zinc-950/80 flex flex-col items-center justify-center text-center p-4">
              <Camera className="w-8 h-8 text-zinc-500 mb-2" />
              <span className="text-sm font-semibold text-zinc-300">
                {t.cameraStandby}
              </span>
              <span className="text-xs text-zinc-400 mt-1 max-w-xs">
                {t.cameraPrompt}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Output Streams (Detected Morse + Decoded Text) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Detected Morse Stream */}
        <div className="dark:bg-zinc-950 bg-zinc-50 border dark:border-zinc-800 border-zinc-200 rounded-xl p-4 flex flex-col justify-between shadow-sm transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider dark:text-zinc-300 text-zinc-700">
                {t.receivedMorse}
              </span>
              <button
                onClick={() => handleCopy(detectedMorse, true)}
                disabled={!detectedMorse}
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
            <div className="w-full dark:bg-zinc-900 bg-white border dark:border-zinc-800 border-zinc-300 rounded-lg p-3 min-h-[90px] max-h-[120px] overflow-y-auto text-sm text-amber-600 dark:text-amber-400 font-mono tracking-widest break-words select-all">
              {detectedMorse || (
                <span className="dark:text-zinc-600 text-zinc-400 font-sans tracking-normal select-none text-xs">
                  {isDecoding ? t.waitingForSignals : t.silenceWaiting}
                </span>
              )}
            </div>
          </div>

          <div className="pt-2 text-[11px] dark:text-zinc-500 text-zinc-500 font-mono flex items-center justify-between">
            <span>{t.pointsLabel}: {(detectedMorse.match(/\./g) || []).length} • {t.dashesLabel}: {(detectedMorse.match(/-/g) || []).length}</span>
            <span>{wpm} WPM</span>
          </div>
        </div>

        {/* Decoded Plain / Decrypted Text */}
        <div className="dark:bg-zinc-950 bg-zinc-50 border dark:border-zinc-800 border-zinc-200 rounded-xl p-4 flex flex-col justify-between shadow-sm transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider dark:text-zinc-300 text-zinc-700 flex items-center gap-1.5">
                <span>{t.decodedTextLabel}</span>
                {cipherType !== 'none' && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                    ({cipherType.toUpperCase()})
                  </span>
                )}
              </span>
              <button
                onClick={() =>
                  handleCopy(cipherType !== 'none' && decryptedText ? decryptedText : decodedRawText, false)
                }
                disabled={!decodedRawText}
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

            {/* If encrypted mode */}
            {cipherType !== 'none' ? (
              <div className="space-y-2">
                <div className="w-full dark:bg-zinc-900 bg-white border dark:border-zinc-800 border-zinc-300 rounded-lg p-3 min-h-[50px] text-xs font-mono dark:text-zinc-400 text-zinc-600 break-words">
                  <span className="text-[10px] dark:text-zinc-500 text-zinc-400 block">{t.rawReceivedLabel}</span>
                  {decodedRawText || '—'}
                </div>
                <div className="w-full dark:bg-zinc-900 bg-white border dark:border-emerald-900/60 border-emerald-300 rounded-lg p-3 min-h-[50px] text-sm text-emerald-600 dark:text-emerald-300 font-sans font-semibold break-words">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block uppercase">
                    {t.decryptedMessageLabel}
                  </span>
                  {decryptedText || (
                    <span className="dark:text-zinc-600 text-zinc-400 font-normal text-xs">
                      {decryptError || '...'}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="w-full dark:bg-zinc-900 bg-white border dark:border-zinc-800 border-zinc-300 rounded-lg p-3 min-h-[90px] max-h-[120px] overflow-y-auto text-sm dark:text-zinc-100 text-zinc-900 font-sans font-medium break-words select-all">
                {decodedRawText || (
                  <span className="dark:text-zinc-600 text-zinc-400 text-xs select-none">
                    {t.textAppearsHere}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="pt-2 text-[11px] dark:text-zinc-500 text-zinc-500 font-mono flex items-center justify-between">
            <span>{decodedRawText.length} {t.charsLabel}</span>
            {cipherType !== 'none' && (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                <ShieldCheck className="w-3 h-3" />
                {t.decryptingActive}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
