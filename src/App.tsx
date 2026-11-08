/**
 * Morse Code Studio - International Morse Code Translator & Signal Transmitter
 * Conforms to ITU-R standards with Audio Synthesis, Optical Screen Beacon,
 * Hardware Camera Flash (Torch), and AES-256-GCM / Radio Ciphers.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Header } from './components/Header';
import { SecurityPanel } from './components/SecurityPanel';
import { Translator } from './components/Translator';
import { SignalController } from './components/SignalController';
import { VisualBeacon } from './components/VisualBeacon';
import { SignalDecoder } from './components/SignalDecoder';
import { ManualKeyer } from './components/ManualKeyer';
import { MorseTable } from './components/MorseTable';
import {
  textToMorse,
  morseToText,
  MorseSignalUnit,
} from './utils/morse';
import {
  CipherType,
  encryptPayload,
  decryptPayload,
} from './utils/crypto';
import { MorseAudioController } from './utils/audioPlayer';
import { TorchController } from './utils/torchController';

export default function App() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'translator' | 'decoder' | 'keyer' | 'reference'>('translator');

  // Translation State
  const [direction, setDirection] = useState<'text-to-morse' | 'morse-to-text'>('text-to-morse');
  const [plainText, setPlainText] = useState('SOS MAYDAY');
  const [morseText, setMorseText] = useState('... --- ... / -- .- -.-- -.. .- -.--');
  const [cipherPayload, setCipherPayload] = useState('');
  const [cipherError, setCipherError] = useState<string | null>(null);

  // Security / Cipher configuration
  const [cipherType, setCipherType] = useState<CipherType>('none');
  const [passphrase, setPassphrase] = useState('');

  // Audio & Signal parameters
  const [wpm, setWpm] = useState(20);
  const [frequency, setFrequency] = useState(650);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lightEnabled, setLightEnabled] = useState(true);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [torchSupported, setTorchSupported] = useState<boolean | null>(null);
  const [torchError, setTorchError] = useState<string | null>(null);

  // Real-time Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSignalActive, setIsSignalActive] = useState(false);
  const [currentSymbol, setCurrentSymbol] = useState<'.' | '-' | undefined>(undefined);
  const [currentUnit, setCurrentUnit] = useState<MorseSignalUnit | null>(null);

  // Controller instances (persistent across re-renders)
  const audioController = useMemo(() => new MorseAudioController(), []);
  const torchController = useMemo(() => new TorchController(), []);

  // Update translation when in text-to-morse direction
  useEffect(() => {
    if (direction !== 'text-to-morse') return;

    let isMounted = true;
    const processEncryptionAndMorse = async () => {
      setCipherError(null);
      if (!plainText.trim()) {
        setMorseText('');
        setCipherPayload('');
        return;
      }

      try {
        let textToEncode = plainText;
        if (cipherType !== 'none') {
          textToEncode = await encryptPayload(plainText, cipherType, passphrase);
          if (isMounted) setCipherPayload(textToEncode);
        } else {
          if (isMounted) setCipherPayload('');
        }

        const generatedMorse = textToMorse(textToEncode);
        if (isMounted) setMorseText(generatedMorse);
      } catch (err: unknown) {
        if (isMounted) {
          setCipherError(err instanceof Error ? err.message : 'Erreur de chiffrement');
        }
      }
    };

    processEncryptionAndMorse();
    return () => {
      isMounted = false;
    };
  }, [plainText, cipherType, passphrase, direction]);

  // Update translation when in morse-to-text direction
  useEffect(() => {
    if (direction !== 'morse-to-text') return;

    let isMounted = true;
    const processDecryption = async () => {
      setCipherError(null);
      if (!morseText.trim()) {
        setPlainText('');
        setCipherPayload('');
        return;
      }

      try {
        const decodedIntermediate = morseToText(morseText);
        if (cipherType !== 'none') {
          if (isMounted) setCipherPayload(decodedIntermediate);
          const decrypted = await decryptPayload(decodedIntermediate, cipherType, passphrase);
          if (isMounted) setPlainText(decrypted);
        } else {
          if (isMounted) {
            setCipherPayload('');
            setPlainText(decodedIntermediate);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setCipherError(err instanceof Error ? err.message : 'Erreur de déchiffrement');
        }
      }
    };

    processDecryption();
    return () => {
      isMounted = false;
    };
  }, [morseText, cipherType, passphrase, direction]);

  // Handle hardware torch toggle
  const handleToggleTorch = async () => {
    setTorchError(null);
    if (torchEnabled) {
      setTorchEnabled(false);
      torchController.release();
      return;
    }

    try {
      const supported = await torchController.initTorch();
      setTorchSupported(supported);
      if (supported) {
        setTorchEnabled(true);
      } else {
        setTorchError("Le flash LED matériel n'est pas disponible ou l'accès caméra a été refusé. La balise écran optique reste 100% active.");
        setTorchEnabled(false);
      }
    } catch {
      setTorchError("Impossible d'activer le flash caméra sur ce périphérique.");
      setTorchSupported(false);
      setTorchEnabled(false);
    }
  };

  // Play Morse Transmission (Audio + Optical + Hardware Torch)
  const handlePlay = () => {
    if (!morseText.trim()) return;
    setIsPlaying(true);

    const freqToUse = soundEnabled ? frequency : 0;

    audioController.play(morseText, wpm, freqToUse, {
      onUnitStart: (unit) => {
        setCurrentUnit(unit);
      },
      onActiveSignalChange: (active, symbol) => {
        if (lightEnabled) {
          setIsSignalActive(active);
          setCurrentSymbol(symbol);
        }
        if (torchEnabled && torchSupported) {
          torchController.setTorch(active).catch(() => {});
        }
      },
      onComplete: () => {
        setIsPlaying(false);
        setIsSignalActive(false);
        setCurrentSymbol(undefined);
        setCurrentUnit(null);
        if (torchEnabled) {
          torchController.turnOff().catch(() => {});
        }
      },
      onError: (err) => {
        console.error('Playback error:', err);
        setIsPlaying(false);
        setIsSignalActive(false);
      },
    });
  };

  // Stop Morse Transmission
  const handleStop = () => {
    audioController.stop();
    setIsPlaying(false);
    setIsSignalActive(false);
    setCurrentSymbol(undefined);
    setCurrentUnit(null);
    if (torchEnabled) {
      torchController.turnOff().catch(() => {});
    }
  };

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      audioController.stop();
      torchController.release();
    };
  }, [audioController, torchController]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500 selection:text-zinc-950">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cipherType={cipherType}
        audioActive={soundEnabled}
        lightActive={lightEnabled}
        torchActive={torchEnabled}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {activeTab === 'translator' && (
          <div className="space-y-6">
            {/* Security and Encryption Panel */}
            <SecurityPanel
              cipherType={cipherType}
              setCipherType={setCipherType}
              passphrase={passphrase}
              setPassphrase={setPassphrase}
              error={cipherError}
            />

            {/* Core Translation Fields */}
            <Translator
              plainText={plainText}
              setPlainText={setPlainText}
              morseText={morseText}
              setMorseText={setMorseText}
              cipherPayload={cipherPayload}
              cipherType={cipherType}
              wpm={wpm}
              direction={direction}
              setDirection={setDirection}
            />

            {/* Transmission and Signal Controls Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Playback Settings (Sliders, channels, export) */}
              <div className="lg:col-span-2">
                <SignalController
                  isPlaying={isPlaying}
                  morseText={morseText}
                  onPlay={handlePlay}
                  onStop={handleStop}
                  wpm={wpm}
                  setWpm={setWpm}
                  frequency={frequency}
                  setFrequency={setFrequency}
                  soundEnabled={soundEnabled}
                  setSoundEnabled={setSoundEnabled}
                  lightEnabled={lightEnabled}
                  setLightEnabled={setLightEnabled}
                  torchEnabled={torchEnabled}
                  onToggleTorch={handleToggleTorch}
                  torchSupported={torchSupported}
                  torchError={torchError}
                />
              </div>

              {/* High-visibility Optical Beacon */}
              <div className="lg:col-span-1">
                <VisualBeacon
                  isSignalActive={isSignalActive}
                  currentSymbol={currentSymbol}
                  currentUnit={currentUnit}
                  wpm={wpm}
                  isTransmitting={isPlaying}
                  onStop={handleStop}
                />
              </div>
            </div>
          </div>
        )}

        {/* Real-time Decoder Tab (Microphone & Camera) */}
        {activeTab === 'decoder' && (
          <div className="space-y-6">
            <SecurityPanel
              cipherType={cipherType}
              setCipherType={setCipherType}
              passphrase={passphrase}
              setPassphrase={setPassphrase}
              error={cipherError}
            />
            <SignalDecoder
              cipherType={cipherType}
              passphrase={passphrase}
              wpm={wpm}
              frequency={frequency}
            />
          </div>
        )}

        {/* Manual Telegraph Keyer Tab */}
        {activeTab === 'keyer' && (
          <ManualKeyer
            audioController={audioController}
            torchController={torchController}
            torchEnabled={torchEnabled}
            frequency={frequency}
            wpm={wpm}
          />
        )}

        {/* Morse International Reference Table Tab */}
        {activeTab === 'reference' && (
          <MorseTable
            audioController={audioController}
            wpm={wpm}
            frequency={frequency}
          />
        )}
      </main>

      {/* Minimal Tactical Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-3 px-4 text-center text-xs text-zinc-500 font-mono">
        Code Morse International (ITU-R M.1677-1) • Standard PARIS 50 unités • Cryptage AES-256-GCM / Web Crypto API
      </footer>
    </div>
  );
}
