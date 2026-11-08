/**
 * Morsign - International Morse Code Studio
 * Real-time Audio & Optical Signal Transmission & Decoding,
 * Camera Torch, AES-256-GCM / Radio Ciphers, Light/Dark Modes & Multilingual.
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
import { Language, TRANSLATIONS } from './utils/i18n';
import { ThemeMode, applyTheme } from './utils/theme';

export default function App() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'translator' | 'decoder' | 'keyer' | 'reference'>('translator');

  // Internationalization (i18n)
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('morsign_lang');
    if (saved === 'fr' || saved === 'en' || saved === 'es') return saved;
    // Auto-detect browser language
    const browserLang = navigator.language.slice(0, 2);
    if (browserLang === 'es') return 'es';
    if (browserLang === 'en') return 'en';
    return 'fr';
  });

  const t = useMemo(() => TRANSLATIONS[language], [language]);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('morsign_lang', lang);
  };

  // Theme Management (system auto / dark / light)
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('morsign_theme_mode');
    if (saved === 'system' || saved === 'dark' || saved === 'light') return saved;
    return 'system';
  });

  const handleSetThemeMode = (mode: ThemeMode) => {
    setThemeMode(mode);
    localStorage.setItem('morsign_theme_mode', mode);
    applyTheme(mode);
  };

  // Sync theme with system preference and changes
  useEffect(() => {
    applyTheme(themeMode);

    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => {
        applyTheme('system');
      };
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [themeMode]);

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

  // Controller instances
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
          setCipherError(err instanceof Error ? err.message : t.errorKeyRequired);
        }
      }
    };

    processEncryptionAndMorse();
    return () => {
      isMounted = false;
    };
  }, [plainText, cipherType, passphrase, direction, t]);

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
          setCipherError(err instanceof Error ? err.message : t.errorAesDecrypt);
        }
      }
    };

    processDecryption();
    return () => {
      isMounted = false;
    };
  }, [morseText, cipherType, passphrase, direction, t]);

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
        setTorchError(t.torchUnavailable);
        setTorchEnabled(false);
      }
    } catch {
      setTorchError(t.torchUnavailable);
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
    <div className="min-h-screen dark:bg-zinc-950 bg-zinc-50 dark:text-zinc-100 text-zinc-900 flex flex-col font-sans selection:bg-amber-500 selection:text-zinc-950 transition-colors">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cipherType={cipherType}
        torchActive={torchEnabled}
        language={language}
        setLanguage={handleSetLanguage}
        themeMode={themeMode}
        setThemeMode={handleSetThemeMode}
        t={t}
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
              t={t}
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
              language={language}
              t={t}
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
                  t={t}
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
                  t={t}
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
              t={t}
            />
            <SignalDecoder
              cipherType={cipherType}
              passphrase={passphrase}
              wpm={wpm}
              frequency={frequency}
              t={t}
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
            t={t}
          />
        )}

        {/* Morse International Reference Table Tab */}
        {activeTab === 'reference' && (
          <MorseTable
            audioController={audioController}
            wpm={wpm}
            frequency={frequency}
            t={t}
          />
        )}
      </main>

      {/* Tactical Minimal Footer */}
      <footer className="border-t dark:border-zinc-900 border-zinc-200 dark:bg-zinc-950 bg-white py-3 px-4 text-center text-xs dark:text-zinc-500 text-zinc-500 font-mono transition-colors">
        {t.footerNotice}
      </footer>
    </div>
  );
}
